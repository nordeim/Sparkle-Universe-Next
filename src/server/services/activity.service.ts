// src/server/services/activity.service.ts
import { PrismaClient } from '@prisma/client'

export class ActivityService {
  constructor(private db: PrismaClient) {}

  async trackActivity(params: {
    userId: string
    action: string
    entityType: string
    entityId: string
    entityData?: any
    metadata?: any
  }) {
    try {
      await this.db.activityStream.create({
        data: {
          userId: params.userId,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          entityData: params.entityData,
          metadata: params.metadata,
        },
      })

      // Update daily activity stats
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      await this.db.userActivity.upsert({
        where: {
          userId_date: {
            userId: params.userId,
            date: today,
          },
        },
        update: {
          pageViews: { increment: 1 },
        },
        create: {
          userId: params.userId,
          date: today,
          pageViews: 1,
        },
      })
    } catch (error) {
      console.error('Failed to track activity:', error)
    }
  }

  async getRecentActivity(userId: string, limit: number = 20) {
    return this.db.activityStream.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  async getActivityFeed(userId: string, limit: number = 50) {
    // Get users that the current user follows
    const following = await this.db.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    })
    
    const followingIds = following.map(f => f.followingId)
    followingIds.push(userId) // Include own activities

    return this.db.activityStream.findMany({
      where: {
        userId: { in: followingIds },
        visibility: 'PUBLIC',
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }
}
