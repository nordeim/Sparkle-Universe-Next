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

// Job types
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

// Job options
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
  },
}

// Create queues
export const queues: Record<keyof typeof QUEUE_NAMES, Queue> = {} as any

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
    logger.info(`Job completed: ${name}:${jobId}`)
  })

  events.on('failed', ({ jobId, failedReason }) => {
    logger.error(`Job failed: ${name}:${jobId}`, { reason: failedReason })
  })

  events.on('stalled', ({ jobId }) => {
    logger.warn(`Job stalled: ${name}:${jobId}`)
  })

  queueEvents[name] = events
})

// Job processors
export function startJobProcessors() {
  // Email processor
  new Worker<JobData[typeof QUEUE_NAMES.EMAIL]>(
    QUEUE_NAMES.EMAIL,
    async (job) => {
      const { type, payload } = job.data

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
    },
    {
      connection: redis.duplicate(),
      concurrency: 5,
    }
  )

  // Notification processor
  new Worker<JobData[typeof QUEUE_NAMES.NOTIFICATION]>(
    QUEUE_NAMES.NOTIFICATION,
    async (job) => {
      const { type, payload } = job.data

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
    },
    {
      connection: redis.duplicate(),
      concurrency: 2,
    }
  )

  // Content moderation processor
  new Worker<JobData[typeof QUEUE_NAMES.CONTENT_MODERATION]>(
    QUEUE_NAMES.CONTENT_MODERATION,
    async (job) => {
      const { contentType, contentId } = job.data
      await moderateContent(contentType, contentId)
    },
    {
      connection: redis.duplicate(),
      concurrency: 5,
    }
  )

  logger.info('Job processors started')
}

// Helper functions for job processing
async function processPageView(payload: any) {
  await db.analyticsEvent.create({
    data: {
      eventName: 'pageview',
      eventType: 'pageview',
      properties: payload,
      context: payload.context,
      userId: payload.userId,
    },
  })
}

async function processAnalyticsEvent(payload: any) {
  await db.analyticsEvent.create({
    data: {
      eventName: payload.name,
      eventType: 'custom',
      properties: payload.properties,
      context: payload.context,
      userId: payload.userId,
    },
  })
}

async function aggregateAnalytics(payload: any) {
  // Aggregate analytics data
  const { period, type } = payload
  logger.info('Aggregating analytics', { period, type })
  // Implementation would aggregate data into summary tables
}

async function cleanupExpiredNotifications() {
  const deleted = await db.notification.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  })
  logger.info(`Cleaned up ${deleted.count} expired notifications`)
}

async function cleanupOldLogs() {
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

  logger.info('Cleaned up old logs', {
    auditLogs: auditLogs.count,
    loginHistory: loginHistory.count,
    analyticsEvents: analyticsEvents.count,
  })
}

async function cleanupTempFiles() {
  // Clean up temporary files older than 24 hours
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const tempFiles = await db.mediaFile.findMany({
    where: {
      metadata: { path: ['temp'], equals: true },
      createdAt: { lt: yesterday },
    },
  })

  for (const file of tempFiles) {
    // Delete from storage (implement storage deletion)
    await db.mediaFile.delete({ where: { id: file.id } })
  }

  logger.info(`Cleaned up ${tempFiles.length} temporary files`)
}

async function checkUserAchievements(userId: string) {
  // Check all achievement criteria for a user
  const achievements = await db.achievement.findMany({
    where: {
      userAchievements: {
        none: { userId },
      },
    },
  })

  for (const achievement of achievements) {
    // Check if user meets criteria (implement criteria checking)
    const meetsCriteria = await checkAchievementCriteria(userId, achievement)
    
    if (meetsCriteria) {
      await unlockAchievement(userId, achievement.id)
    }
  }
}

async function checkAchievementCriteria(userId: string, achievement: any): Promise<boolean> {
  // Implement achievement criteria checking based on achievement.criteria
  return false // Placeholder
}

async function unlockAchievement(userId: string, achievementId: string) {
  const achievement = await db.achievement.findUnique({
    where: { id: achievementId },
  })

  if (!achievement) return

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
}

async function updateLeaderboard(type: string) {
  // Update specific leaderboard
  logger.info(`Updating leaderboard: ${type}`)
  // Implementation would update leaderboard entries
}

async function calculateLeaderboard(type: string) {
  // Calculate leaderboard from scratch
  logger.info(`Calculating leaderboard: ${type}`)
  // Implementation would recalculate entire leaderboard
}

async function resetLeaderboard(type: string) {
  // Reset leaderboard for new period
  logger.info(`Resetting leaderboard: ${type}`)
  // Implementation would archive old leaderboard and start new
}

async function syncYouTubeVideos(channelId: string) {
  // Sync videos from YouTube channel
  logger.info(`Syncing YouTube videos for channel: ${channelId}`)
  // Implementation would use YouTube API to sync videos
}

async function syncYouTubeChannel(channelId: string) {
  // Sync channel info from YouTube
  logger.info(`Syncing YouTube channel: ${channelId}`)
  // Implementation would use YouTube API to sync channel data
}

async function syncYouTubeAnalytics(channelId: string) {
  // Sync analytics from YouTube
  logger.info(`Syncing YouTube analytics for channel: ${channelId}`)
  // Implementation would use YouTube Analytics API
}

async function moderateContent(contentType: string, contentId: string) {
  // Moderate content using AI
  logger.info(`Moderating ${contentType}: ${contentId}`)
  // Implementation would use AI service for content moderation
}

// Job scheduling
export function scheduleRecurringJobs() {
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

  logger.info('Recurring jobs scheduled')
}

// Queue monitoring
export async function getQueueStats() {
  const stats: Record<string, any> = {}

  for (const [name, queue] of Object.entries(queues)) {
    const counts = await queue.getJobCounts()
    const isPaused = await queue.isPaused()
    
    stats[name] = {
      ...counts,
      isPaused,
    }
  }

  return stats
}

// Graceful shutdown
export async function shutdownJobProcessors() {
  logger.info('Shutting down job processors...')

  // Close all workers
  for (const queue of Object.values(queues)) {
    await queue.close()
  }

  // Close all event listeners
  for (const events of Object.values(queueEvents)) {
    await events.close()
  }

  logger.info('Job processors shut down')
}

// Export job creation helpers
export const jobs = {
  email: {
    send: (payload: any) => queues.EMAIL.add('send', { type: 'send', payload }),
    bulk: (payload: any) => queues.EMAIL.add('bulk', { type: 'bulk', payload }),
    digest: (userId: string) => queues.EMAIL.add('digest', { type: 'digest', payload: { userId } }),
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
  },
  moderation: {
    check: (contentType: 'post' | 'comment' | 'message', contentId: string) =>
      queues.CONTENT_MODERATION.add('moderate', { contentType, contentId }),
  },
}
