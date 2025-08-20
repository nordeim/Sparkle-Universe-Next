// src/lib/jobs/job-processor.ts
import { Queue, Worker, Job, QueueEvents } from 'bullmq'
import { redis } from '@/lib/redis'
import { logger } from '@/lib/monitoring'
import { db } from '@/lib/db'
import { EmailService } from '@/services/email.service'
import { NotificationService } from '@/services/notification.service'
import { eventEmitter } from '@/lib/events/event-emitter'

// Job queue names
export const QUEUE_NAMES = {
  EMAIL: 'email',
  NOTIFICATION: 'notification',
  IMAGE_PROCESSING: 'image-processing',
  VIDEO_PROCESSING: 'video-processing',
  ANALYTICS: 'analytics',
  CLEANUP: 'cleanup',
  ACHIEVEMENT: 'achievement',
  LEADERBOARD: 'leaderboard',
  YOUTUBE_SYNC: 'youtube-sync',
  CONTENT_MODERATION: 'content-moderation',
} as const

// Job types with strict typing
export interface JobData {
  [QUEUE_NAMES.EMAIL]: {
    type: 'send' | 'bulk' | 'digest'
    payload: any
  }
  [QUEUE_NAMES.NOTIFICATION]: {
    type: 'create' | 'bulk' | 'cleanup'
    payload: any
  }
  [QUEUE_NAMES.IMAGE_PROCESSING]: {
    fileId: string
    operations: string[]
  }
  [QUEUE_NAMES.VIDEO_PROCESSING]: {
    fileId: string
    operations: string[]
  }
  [QUEUE_NAMES.ANALYTICS]: {
    type: 'pageview' | 'event' | 'aggregate'
    payload: any
  }
  [QUEUE_NAMES.CLEANUP]: {
    type: 'expired-notifications' | 'old-logs' | 'temp-files'
  }
  [QUEUE_NAMES.ACHIEVEMENT]: {
    userId: string
    type: 'check' | 'unlock'
    achievementId?: string
  }
  [QUEUE_NAMES.LEADERBOARD]: {
    type: 'update' | 'calculate' | 'reset'
    leaderboardType: string
  }
  [QUEUE_NAMES.YOUTUBE_SYNC]: {
    channelId: string
    type: 'videos' | 'channel' | 'analytics'
  }
  [QUEUE_NAMES.CONTENT_MODERATION]: {
    contentType: 'post' | 'comment' | 'message'
    contentId: string
  }
}

// Job options with better defaults
const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 2000,
  },
  removeOnComplete: {
    age: 3600, // 1 hour
    count: 100,
  },
  removeOnFail: {
    age: 24 * 3600, // 24 hours
    count: 500,
  },
}

// Create queues with proper typing
export const queues = {} as Record<keyof typeof QUEUE_NAMES, Queue>

Object.entries(QUEUE_NAMES).forEach(([key, name]) => {
  queues[key as keyof typeof QUEUE_NAMES] = new Queue(name, {
    connection: redis.duplicate(),
    defaultJobOptions,
  })
})

// Queue events for monitoring
const queueEvents: Record<string, QueueEvents> = {}

Object.values(QUEUE_NAMES).forEach((name) => {
  const events = new QueueEvents(name, {
    connection: redis.duplicate(),
  })

  events.on('completed', ({ jobId, returnvalue }) => {
    logger.info(`Job completed: ${name}:${jobId}`, { returnvalue })
  })

  events.on('failed', ({ jobId, failedReason }) => {
    logger.error(`Job failed: ${name}:${jobId}`, { reason: failedReason })
    eventEmitter.emit('system:error', {
      error: new Error(`Job failed: ${name}:${jobId}`),
      context: { jobId, failedReason, queue: name },
    })
  })

  events.on('stalled', ({ jobId }) => {
    logger.warn(`Job stalled: ${name}:${jobId}`)
    eventEmitter.emit('system:warning', {
      message: `Job stalled: ${name}:${jobId}`,
      context: { jobId, queue: name },
    })
  })

  queueEvents[name] = events
})

// Enhanced job processors with better error handling
export function startJobProcessors() {
  // Email processor
  new Worker<JobData[typeof QUEUE_NAMES.EMAIL]>(
    QUEUE_NAMES.EMAIL,
    async (job) => {
      const { type, payload } = job.data
      logger.info(`Processing email job: ${type}`, { jobId: job.id })

      try {
        switch (type) {
          case 'send':
            await EmailService.sendEmail(payload)
            break
          case 'bulk':
            await EmailService.sendBulkEmails(
              payload.recipients,
              payload.template,
              payload.data,
              payload.options
            )
            break
          case 'digest':
            await EmailService.sendWeeklyDigest(payload.userId)
            break
          default:
            throw new Error(`Unknown email job type: ${type}`)
        }
      } catch (error) {
        logger.error(`Email job failed: ${type}`, { error, jobId: job.id })
        throw error
      }
    },
    {
      connection: redis.duplicate(),
      concurrency: 5,
      limiter: {
        max: 100,
        duration: 60000, // 100 emails per minute
      },
    }
  )

  // Notification processor
  new Worker<JobData[typeof QUEUE_NAMES.NOTIFICATION]>(
    QUEUE_NAMES.NOTIFICATION,
    async (job) => {
      const { type, payload } = job.data
      logger.info(`Processing notification job: ${type}`, { jobId: job.id })

      try {
        switch (type) {
          case 'create':
            await NotificationService.createNotification(payload.input, payload.options)
            break
          case 'bulk':
            await NotificationService.createBulkNotifications(
              payload.userIds,
              payload.template,
              payload.options
            )
            break
          case 'cleanup':
            await NotificationService.cleanupExpiredNotifications()
            break
          default:
            throw new Error(`Unknown notification job type: ${type}`)
        }
      } catch (error) {
        logger.error(`Notification job failed: ${type}`, { error, jobId: job.id })
        throw error
      }
    },
    {
      connection: redis.duplicate(),
      concurrency: 10,
    }
  )

  // Analytics processor
  new Worker<JobData[typeof QUEUE_NAMES.ANALYTICS]>(
    QUEUE_NAMES.ANALYTICS,
    async (job) => {
      const { type, payload } = job.data

      try {
        switch (type) {
          case 'pageview':
            await processPageView(payload)
            break
          case 'event':
            await processAnalyticsEvent(payload)
            break
          case 'aggregate':
            await aggregateAnalytics(payload)
            break
          default:
            throw new Error(`Unknown analytics job type: ${type}`)
        }
      } catch (error) {
        logger.error(`Analytics job failed: ${type}`, { error, jobId: job.id })
        throw error
      }
    },
    {
      connection: redis.duplicate(),
      concurrency: 20,
    }
  )

  // Cleanup processor
  new Worker<JobData[typeof QUEUE_NAMES.CLEANUP]>(
    QUEUE_NAMES.CLEANUP,
    async (job) => {
      const { type } = job.data
      logger.info(`Processing cleanup job: ${type}`, { jobId: job.id })

      try {
        switch (type) {
          case 'expired-notifications':
            await cleanupExpiredNotifications()
            break
          case 'old-logs':
            await cleanupOldLogs()
            break
          case 'temp-files':
            await cleanupTempFiles()
            break
          default:
            throw new Error(`Unknown cleanup job type: ${type}`)
        }
      } catch (error) {
        logger.error(`Cleanup job failed: ${type}`, { error, jobId: job.id })
        throw error
      }
    },
    {
      connection: redis.duplicate(),
      concurrency: 1,
    }
  )

  // Achievement processor
  new Worker<JobData[typeof QUEUE_NAMES.ACHIEVEMENT]>(
    QUEUE_NAMES.ACHIEVEMENT,
    async (job) => {
      const { userId, type, achievementId } = job.data
      logger.info(`Processing achievement job: ${type}`, { userId, achievementId, jobId: job.id })

      try {
        switch (type) {
          case 'check':
            await checkUserAchievements(userId)
            break
          case 'unlock':
            if (achievementId) {
              await unlockAchievement(userId, achievementId)
            }
            break
          default:
            throw new Error(`Unknown achievement job type: ${type}`)
        }
      } catch (error) {
        logger.error(`Achievement job failed: ${type}`, { error, userId, jobId: job.id })
        throw error
      }
    },
    {
      connection: redis.duplicate(),
      concurrency: 5,
    }
  )

  // Leaderboard processor
  new Worker<JobData[typeof QUEUE_NAMES.LEADERBOARD]>(
    QUEUE_NAMES.LEADERBOARD,
    async (job) => {
      const { type, leaderboardType } = job.data
      logger.info(`Processing leaderboard job: ${type}`, { leaderboardType, jobId: job.id })

      try {
        switch (type) {
          case 'update':
            await updateLeaderboard(leaderboardType)
            break
          case 'calculate':
            await calculateLeaderboard(leaderboardType)
            break
          case 'reset':
            await resetLeaderboard(leaderboardType)
            break
          default:
            throw new Error(`Unknown leaderboard job type: ${type}`)
        }
      } catch (error) {
        logger.error(`Leaderboard job failed: ${type}`, { error, leaderboardType, jobId: job.id })
        throw error
      }
    },
    {
      connection: redis.duplicate(),
      concurrency: 3,
    }
  )

  // YouTube sync processor
  new Worker<JobData[typeof QUEUE_NAMES.YOUTUBE_SYNC]>(
    QUEUE_NAMES.YOUTUBE_SYNC,
    async (job) => {
      const { channelId, type } = job.data
      logger.info(`Processing YouTube sync job: ${type}`, { channelId, jobId: job.id })

      try {
        switch (type) {
          case 'videos':
            await syncYouTubeVideos(channelId)
            break
          case 'channel':
            await syncYouTubeChannel(channelId)
            break
          case 'analytics':
            await syncYouTubeAnalytics(channelId)
            break
          default:
            throw new Error(`Unknown YouTube sync job type: ${type}`)
        }
      } catch (error) {
        logger.error(`YouTube sync job failed: ${type}`, { error, channelId, jobId: job.id })
        throw error
      }
    },
    {
      connection: redis.duplicate(),
      concurrency: 2,
      limiter: {
        max: 10,
        duration: 60000, // 10 requests per minute (YouTube API limits)
      },
    }
  )

  // Content moderation processor
  new Worker<JobData[typeof QUEUE_NAMES.CONTENT_MODERATION]>(
    QUEUE_NAMES.CONTENT_MODERATION,
    async (job) => {
      const { contentType, contentId } = job.data
      logger.info(`Processing moderation job`, { contentType, contentId, jobId: job.id })

      try {
        await moderateContent(contentType, contentId)
      } catch (error) {
        logger.error(`Moderation job failed`, { error, contentType, contentId, jobId: job.id })
        throw error
      }
    },
    {
      connection: redis.duplicate(),
      concurrency: 5,
    }
  )

  logger.info('Job processors started successfully')
}

// Helper functions for job processing (enhanced with better error handling)
async function processPageView(payload: any) {
  try {
    await db.analyticsEvent.create({
      data: {
        eventName: 'pageview',
        eventType: 'pageview',
        properties: payload,
        context: payload.context,
        userId: payload.userId,
      },
    })
  } catch (error) {
    logger.error('Failed to process pageview', { error, payload })
    throw error
  }
}

async function processAnalyticsEvent(payload: any) {
  try {
    await db.analyticsEvent.create({
      data: {
        eventName: payload.name,
        eventType: 'custom',
        properties: payload.properties,
        context: payload.context,
        userId: payload.userId,
      },
    })
  } catch (error) {
    logger.error('Failed to process analytics event', { error, payload })
    throw error
  }
}

async function aggregateAnalytics(payload: any) {
  const { period, type } = payload
  logger.info('Aggregating analytics', { period, type })
  
  try {
    // Implementation would aggregate data into summary tables
    // This is a placeholder for the actual implementation
    const startDate = new Date()
    if (period === 'hourly') {
      startDate.setHours(startDate.getHours() - 1)
    } else if (period === 'daily') {
      startDate.setDate(startDate.getDate() - 1)
    } else if (period === 'weekly') {
      startDate.setDate(startDate.getDate() - 7)
    }
    
    // Aggregate metrics would go here
    logger.info('Analytics aggregated successfully', { period, type })
  } catch (error) {
    logger.error('Failed to aggregate analytics', { error, period, type })
    throw error
  }
}

async function cleanupExpiredNotifications() {
  try {
    const deleted = await db.notification.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    })
    logger.info(`Cleaned up ${deleted.count} expired notifications`)
    return deleted.count
  } catch (error) {
    logger.error('Failed to cleanup expired notifications', { error })
    throw error
  }
}

async function cleanupOldLogs() {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [auditLogs, loginHistory, analyticsEvents] = await Promise.all([
      db.auditLog.deleteMany({
        where: { createdAt: { lt: thirtyDaysAgo } },
      }),
      db.loginHistory.deleteMany({
        where: { createdAt: { lt: thirtyDaysAgo } },
      }),
      db.analyticsEvent.deleteMany({
        where: { timestamp: { lt: thirtyDaysAgo } },
      }),
    ])

    const total = auditLogs.count + loginHistory.count + analyticsEvents.count
    
    logger.info('Cleaned up old logs', {
      auditLogs: auditLogs.count,
      loginHistory: loginHistory.count,
      analyticsEvents: analyticsEvents.count,
      total,
    })
    
    return total
  } catch (error) {
    logger.error('Failed to cleanup old logs', { error })
    throw error
  }
}

async function cleanupTempFiles() {
  try {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const tempFiles = await db.mediaFile.findMany({
      where: {
        metadata: { path: ['temp'], equals: true },
        createdAt: { lt: yesterday },
      },
    })

    let deletedCount = 0
    for (const file of tempFiles) {
      try {
        await db.mediaFile.delete({ where: { id: file.id } })
        deletedCount++
      } catch (error) {
        logger.error('Failed to delete temp file', { error, fileId: file.id })
      }
    }

    logger.info(`Cleaned up ${deletedCount} temporary files`)
    return deletedCount
  } catch (error) {
    logger.error('Failed to cleanup temp files', { error })
    throw error
  }
}

async function checkUserAchievements(userId: string) {
  try {
    const achievements = await db.achievement.findMany({
      where: {
        userAchievements: {
          none: { userId },
        },
      },
    })

    let unlockedCount = 0
    for (const achievement of achievements) {
      const meetsCriteria = await checkAchievementCriteria(userId, achievement)
      
      if (meetsCriteria) {
        await unlockAchievement(userId, achievement.id)
        unlockedCount++
      }
    }
    
    logger.info(`Checked achievements for user ${userId}, unlocked ${unlockedCount}`)
    return unlockedCount
  } catch (error) {
    logger.error('Failed to check user achievements', { error, userId })
    throw error
  }
}

async function checkAchievementCriteria(userId: string, achievement: any): Promise<boolean> {
  try {
    // Implementation would check specific criteria based on achievement type
    // This is a placeholder that would be replaced with actual logic
    const userStats = await db.userStats.findUnique({
      where: { userId },
    })
    
    if (!userStats) return false
    
    // Example criteria checking
    if (achievement.code === 'first_post' && userStats.posts > 0) {
      return true
    }
    
    if (achievement.code === 'ten_comments' && userStats.comments >= 10) {
      return true
    }
    
    return false
  } catch (error) {
    logger.error('Failed to check achievement criteria', { error, userId, achievementId: achievement.id })
    return false
  }
}

async function unlockAchievement(userId: string, achievementId: string) {
  try {
    const achievement = await db.achievement.findUnique({
      where: { id: achievementId },
    })

    if (!achievement) {
      throw new Error(`Achievement not found: ${achievementId}`)
    }

    // Check if already unlocked
    const existing = await db.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId,
        },
      },
    })
    
    if (existing) {
      logger.info('Achievement already unlocked', { userId, achievementId })
      return
    }

    // Create user achievement
    await db.userAchievement.create({
      data: {
        userId,
        achievementId,
        progress: 1,
        showcased: false,
      },
    })

    // Award rewards
    await db.userBalance.update({
      where: { userId },
      data: {
        sparklePoints: { increment: achievement.sparklePointsReward },
      },
    })

    // Update user stats
    await db.userStats.update({
      where: { userId },
      data: {
        experience: { increment: achievement.xpReward },
      },
    })

    // Create notification
    await NotificationService.createNotification({
      type: 'ACHIEVEMENT_UNLOCKED',
      userId,
      title: `Achievement Unlocked: ${achievement.name}!`,
      message: achievement.description || '',
      data: {
        achievementId,
        achievementName: achievement.name,
        xpReward: achievement.xpReward,
        pointsReward: achievement.sparklePointsReward,
      },
    })

    eventEmitter.emit('achievement:unlocked', { userId, achievementId })
    
    logger.info('Achievement unlocked successfully', { userId, achievementId })
  } catch (error) {
    logger.error('Failed to unlock achievement', { error, userId, achievementId })
    throw error
  }
}

async function updateLeaderboard(type: string) {
  logger.info(`Updating leaderboard: ${type}`)
  try {
    // Implementation would update leaderboard entries
    // This is a placeholder for actual implementation
    logger.info(`Leaderboard updated: ${type}`)
  } catch (error) {
    logger.error('Failed to update leaderboard', { error, type })
    throw error
  }
}

async function calculateLeaderboard(type: string) {
  logger.info(`Calculating leaderboard: ${type}`)
  try {
    // Implementation would recalculate entire leaderboard
    // This is a placeholder for actual implementation
    logger.info(`Leaderboard calculated: ${type}`)
  } catch (error) {
    logger.error('Failed to calculate leaderboard', { error, type })
    throw error
  }
}

async function resetLeaderboard(type: string) {
  logger.info(`Resetting leaderboard: ${type}`)
  try {
    // Implementation would archive old leaderboard and start new
    // This is a placeholder for actual implementation
    logger.info(`Leaderboard reset: ${type}`)
  } catch (error) {
    logger.error('Failed to reset leaderboard', { error, type })
    throw error
  }
}

async function syncYouTubeVideos(channelId: string) {
  logger.info(`Syncing YouTube videos for channel: ${channelId}`)
  try {
    // Implementation would use YouTube API to sync videos
    // This is a placeholder for actual implementation
    logger.info(`YouTube videos synced for channel: ${channelId}`)
  } catch (error) {
    logger.error('Failed to sync YouTube videos', { error, channelId })
    throw error
  }
}

async function syncYouTubeChannel(channelId: string) {
  logger.info(`Syncing YouTube channel: ${channelId}`)
  try {
    // Implementation would use YouTube API to sync channel data
    // This is a placeholder for actual implementation
    logger.info(`YouTube channel synced: ${channelId}`)
  } catch (error) {
    logger.error('Failed to sync YouTube channel', { error, channelId })
    throw error
  }
}

async function syncYouTubeAnalytics(channelId: string) {
  logger.info(`Syncing YouTube analytics for channel: ${channelId}`)
  try {
    // Implementation would use YouTube Analytics API
    // This is a placeholder for actual implementation
    logger.info(`YouTube analytics synced for channel: ${channelId}`)
  } catch (error) {
    logger.error('Failed to sync YouTube analytics', { error, channelId })
    throw error
  }
}

async function moderateContent(contentType: string, contentId: string) {
  logger.info(`Moderating ${contentType}: ${contentId}`)
  try {
    // Implementation would use AI service for content moderation
    // This is a placeholder for actual implementation
    logger.info(`Content moderated: ${contentType}:${contentId}`)
  } catch (error) {
    logger.error('Failed to moderate content', { error, contentType, contentId })
    throw error
  }
}

// Job scheduling with better error handling
export function scheduleRecurringJobs() {
  try {
    // Schedule cleanup jobs
    queues.CLEANUP.add(
      'expired-notifications',
      { type: 'expired-notifications' },
      {
        repeat: {
          pattern: '0 2 * * *', // 2 AM daily
        },
      }
    )

    queues.CLEANUP.add(
      'old-logs',
      { type: 'old-logs' },
      {
        repeat: {
          pattern: '0 3 * * 0', // 3 AM Sunday
        },
      }
    )

    queues.CLEANUP.add(
      'temp-files',
      { type: 'temp-files' },
      {
        repeat: {
          pattern: '0 * * * *', // Every hour
        },
      }
    )

    // Schedule leaderboard updates
    queues.LEADERBOARD.add(
      'hourly-update',
      { type: 'update', leaderboardType: 'hourly' },
      {
        repeat: {
          pattern: '0 * * * *', // Every hour
        },
      }
    )

    queues.LEADERBOARD.add(
      'daily-reset',
      { type: 'reset', leaderboardType: 'daily' },
      {
        repeat: {
          pattern: '0 0 * * *', // Midnight
        },
      }
    )

    queues.LEADERBOARD.add(
      'weekly-reset',
      { type: 'reset', leaderboardType: 'weekly' },
      {
        repeat: {
          pattern: '0 0 * * 1', // Monday midnight
        },
      }
    )

    logger.info('Recurring jobs scheduled successfully')
  } catch (error) {
    logger.error('Failed to schedule recurring jobs', { error })
    throw error
  }
}

// Queue monitoring with enhanced metrics
export async function getQueueStats() {
  const stats: Record<string, any> = {}

  try {
    for (const [name, queue] of Object.entries(queues)) {
      const [counts, isPaused, workers] = await Promise.all([
        queue.getJobCounts(),
        queue.isPaused(),
        queue.getWorkers(),
      ])
      
      stats[name] = {
        ...counts,
        isPaused,
        workersCount: workers.length,
      }
    }
  } catch (error) {
    logger.error('Failed to get queue stats', { error })
  }

  return stats
}

// Graceful shutdown with timeout
export async function shutdownJobProcessors(timeoutMs = 30000) {
  logger.info('Shutting down job processors...')

  const shutdownPromises: Promise<void>[] = []

  // Close all workers
  for (const queue of Object.values(queues)) {
    shutdownPromises.push(queue.close())
  }

  // Close all event listeners
  for (const events of Object.values(queueEvents)) {
    shutdownPromises.push(events.close())
  }

  try {
    await Promise.race([
      Promise.all(shutdownPromises),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Shutdown timeout')), timeoutMs)
      ),
    ])
    logger.info('Job processors shut down successfully')
  } catch (error) {
    logger.error('Error during job processor shutdown', { error })
    throw error
  }
}

// Export job creation helpers with type safety
export const jobs = {
  email: {
    send: (payload: any) => 
      queues.EMAIL.add('send', { type: 'send', payload }),
    bulk: (payload: any) => 
      queues.EMAIL.add('bulk', { type: 'bulk', payload }),
    digest: (userId: string) => 
      queues.EMAIL.add('digest', { type: 'digest', payload: { userId } }),
  },
  notification: {
    create: (input: any, options?: any) => 
      queues.NOTIFICATION.add('create', { type: 'create', payload: { input, options } }),
    bulk: (userIds: string[], template: any, options?: any) =>
      queues.NOTIFICATION.add('bulk', { type: 'bulk', payload: { userIds, template, options } }),
  },
  achievement: {
    check: (userId: string) => 
      queues.ACHIEVEMENT.add('check', { userId, type: 'check' }),
    unlock: (userId: string, achievementId: string) =>
      queues.ACHIEVEMENT.add('unlock', { userId, type: 'unlock', achievementId }),
  },
  youtube: {
    syncVideos: (channelId: string) =>
      queues.YOUTUBE_SYNC.add('sync-videos', { channelId, type: 'videos' }),
    syncChannel: (channelId: string) =>
      queues.YOUTUBE_SYNC.add('sync-channel', { channelId, type: 'channel' }),
    syncAnalytics: (channelId: string) =>
      queues.YOUTUBE_SYNC.add('sync-analytics', { channelId, type: 'analytics' }),
  },
  moderation: {
    check: (contentType: 'post' | 'comment' | 'message', contentId: string) =>
      queues.CONTENT_MODERATION.add('moderate', { contentType, contentId }),
  },
  analytics: {
    pageview: (payload: any) =>
      queues.ANALYTICS.add('pageview', { type: 'pageview', payload }),
    event: (payload: any) =>
      queues.ANALYTICS.add('event', { type: 'event', payload }),
    aggregate: (payload: any) =>
      queues.ANALYTICS.add('aggregate', { type: 'aggregate', payload }),
  },
  cleanup: {
    notifications: () =>
      queues.CLEANUP.add('cleanup-notifications', { type: 'expired-notifications' }),
    logs: () =>
      queues.CLEANUP.add('cleanup-logs', { type: 'old-logs' }),
    tempFiles: () =>
      queues.CLEANUP.add('cleanup-temp', { type: 'temp-files' }),
  },
}
