// src/server/services/activity.service.ts
import { PrismaClient } from '@prisma/client'
import { cacheService } from './cache.service'

interface ActivityData {
  userId: string
  action: string
  entityType: string
  entityId: string
  entityData?: any
  metadata?: any
  visibility?: 'PUBLIC' | 'FOLLOWERS' | 'PRIVATE'
}

export class ActivityService {
  constructor(private db: PrismaClient) {}

  /**
   * Track user activity
   */
  async trackActivity(data: ActivityData) {
    try {
      // Create activity stream entry
      const activity = await this.db.activityStream.create({
        data: {
          userId: data.userId,
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          entityData: data.entityData,
          metadata: data.metadata,
          visibility: data.visibility || 'PUBLIC',
        },
      })

      // Update daily activity stats
      await this.updateDailyStats(data.userId, data.action)

      // Update user's last activity
      await this.db.user.update({
        where: { id: data.userId },
        data: { lastSeenAt: new Date() },
      })

      // Invalidate relevant caches
      await cacheService.delPattern(`activity:${data.userId}`)
      await cacheService.delPattern(`feed:${data.userId}`)

      return activity
    } catch (error) {
      console.error('Failed to track activity:', error)
      return null
    }
  }

  /**
   * Update daily activity statistics
   */
  private async updateDailyStats(userId: string, action: string) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const updateData: any = {}

    // Map actions to stat fields
    switch (action) {
      case 'post.created':
        updateData.postsCreated = { increment: 1 }
        break
      case 'post.viewed':
        updateData.postsViewed = { increment: 1 }
        break
      case 'comment.created':
        updateData.commentsCreated = { increment: 1 }
        break
      case 'reaction.added':
        updateData.reactionsGiven = { increment: 1 }
        break
      case 'message.sent':
        updateData.messagesSent = { increment: 1 }
        break
      case 'user.login':
        updateData.loginCount = { increment: 1 }
        break
    }

    // Always update pageViews and minutesActive
    updateData.pageViews = { increment: 1 }
    updateData.minutesActive = { increment: 1 }

    try {
      await this.db.userActivity.upsert({
        where: {
          userId_date: {
            userId,
            date: today,
          },
        },
        update: updateData,
        create: {
          userId,
          date: today,
          ...Object.keys(updateData).reduce((acc, key) => {
            acc[key] = updateData[key].increment || 0
            return acc
          }, {} as any),
        },
      })
    } catch (error) {
      console.error('Failed to update daily stats:', error)
    }
  }

  /**
   * Get user's activity feed
   */
  async getUserActivityFeed(params: {
    userId: string
    limit: number
    cursor?: string
    includeFollowing?: boolean
  }) {
    const cacheKey = `activity:feed:${params.userId}:${params.limit}:${params.cursor || 'first'}`
    
    // Try cache first
    if (!params.cursor) {
      const cached = await cacheService.get(cacheKey)
      if (cached) return cached
    }

    let userIds = [params.userId]

    // Include following users if requested
    if (params.includeFollowing) {
      const following = await this.db.follow.findMany({
        where: { followerId: params.userId },
        select: { followingId: true },
      })
      userIds = [...userIds, ...following.map(f => f.followingId)]
    }

    const activities = await this.db.activityStream.findMany({
      where: {
        OR: [
          { userId: { in: userIds } },
          { visibility: 'PUBLIC' },
        ],
      },
      take: params.limit + 1,
      cursor: params.cursor ? { id: params.cursor } : undefined,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            image: true,
            profile: {
              select: {
                displayName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    let nextCursor: string | undefined = undefined
    if (activities.length > params.limit) {
      const nextItem = activities.pop()
      nextCursor = nextItem!.id
    }

    const result = {
      items: activities,
      nextCursor,
    }

    // Cache first page
    if (!params.cursor) {
      await cacheService.set(cacheKey, result, 60) // 1 minute cache
    }

    return result
  }

  /**
   * Get activity statistics for a user
   */
  async getUserActivityStats(userId: string, days: number = 30) {
    const cacheKey = `activity:stats:${userId}:${days}`
    
    const cached = await cacheService.get(cacheKey)
    if (cached) return cached

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const stats = await this.db.userActivity.aggregate({
      where: {
        userId,
        date: { gte: startDate },
      },
      _sum: {
        loginCount: true,
        pageViews: true,
        postsCreated: true,
        postsViewed: true,
        commentsCreated: true,
        reactionsGiven: true,
        messagesSent: true,
        minutesActive: true,
        xpEarned: true,
        pointsEarned: true,
        achievementsUnlocked: true,
      },
      _avg: {
        minutesActive: true,
      },
      _count: {
        date: true,
      },
    })

    const result = {
      totalDays: stats._count.date,
      totals: stats._sum,
      averages: {
        minutesPerDay: stats._avg.minutesActive || 0,
        postsPerDay: (stats._sum.postsCreated || 0) / stats._count.date,
        commentsPerDay: (stats._sum.commentsCreated || 0) / stats._count.date,
      },
    }

    await cacheService.set(cacheKey, result, 300) // 5 minute cache
    return result
  }

  /**
   * Get trending activities
   */
  async getTrendingActivities(limit: number = 20) {
    const cacheKey = `activity:trending:${limit}`
    
    const cached = await cacheService.get(cacheKey)
    if (cached) return cached

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    const trending = await this.db.activityStream.groupBy({
      by: ['entityType', 'entityId'],
      where: {
        createdAt: { gte: oneHourAgo },
        visibility: 'PUBLIC',
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: limit,
    })

    // Enrich with entity data
    const enrichedTrending = await Promise.all(
      trending.map(async (item) => {
        let entity = null
        
        switch (item.entityType) {
          case 'post':
            entity = await this.db.post.findUnique({
              where: { id: item.entityId },
              select: {
                id: true,
                title: true,
                slug: true,
                author: {
                  select: {
                    username: true,
                    image: true,
                  },
                },
              },
            })
            break
          case 'user':
            entity = await this.db.user.findUnique({
              where: { id: item.entityId },
              select: {
                id: true,
                username: true,
                image: true,
                profile: {
                  select: {
                    displayName: true,
                  },
                },
              },
            })
            break
        }

        return {
          ...item,
          entity,
          activityCount: item._count.id,
        }
      })
    )

    await cacheService.set(cacheKey, enrichedTrending, 60) // 1 minute cache
    return enrichedTrending
  }

  /**
   * Clean up old activities
   */
  async cleanupOldActivities(daysToKeep: number = 90) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    const result = await this.db.activityStream.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    })

    return result.count
  }
}
