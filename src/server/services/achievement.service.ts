// src/server/services/achievement.service.ts
import { PrismaClient } from '@prisma/client'
import { NotificationService } from './notification.service'

export class AchievementService {
  private notificationService: NotificationService

  constructor(private db: PrismaClient) {
    this.notificationService = new NotificationService(db)
  }

  async checkPostAchievements(userId: string) {
    const stats = await this.db.userStats.findUnique({
      where: { userId },
    })

    if (!stats) return

    const achievements = [
      { count: 1, code: 'FIRST_POST' },
      { count: 10, code: 'POSTS_10' },
      { count: 50, code: 'POSTS_50' },
      { count: 100, code: 'POSTS_100' },
    ]

    for (const achievement of achievements) {
      if (stats.totalPosts >= achievement.count) {
        await this.unlockAchievement(userId, achievement.code)
      }
    }
  }

  async unlockAchievement(userId: string, achievementCode: string) {
    try {
      // Check if achievement exists
      const achievement = await this.db.achievement.findUnique({
        where: { code: achievementCode },
      })

      if (!achievement) return

      // Check if already unlocked
      const existing = await this.db.userAchievement.findUnique({
        where: {
          userId_achievementId: {
            userId,
            achievementId: achievement.id,
          },
        },
      })

      if (existing) return

      // Unlock achievement
      await this.db.userAchievement.create({
        data: {
          userId,
          achievementId: achievement.id,
          progress: 1,
        },
      })

      // Grant rewards
      if (achievement.xpReward > 0 || achievement.sparklePointsReward > 0) {
        await this.db.$transaction([
          this.db.user.update({
            where: { id: userId },
            data: {
              experience: { increment: achievement.xpReward },
              sparklePoints: { increment: achievement.sparklePointsReward },
            },
          }),
          this.db.xpLog.create({
            data: {
              userId,
              amount: achievement.xpReward,
              source: 'achievement',
              sourceId: achievement.id,
              reason: `Unlocked achievement: ${achievement.name}`,
              totalXp: 0, // Will be calculated
            },
          }),
        ])
      }

      // Send notification
      await this.notificationService.createNotification({
        type: 'ACHIEVEMENT_UNLOCKED',
        userId,
        entityId: achievement.id,
        entityType: 'achievement',
        title: 'Achievement Unlocked!',
        message: `You've unlocked "${achievement.name}"`,
        data: {
          achievementCode: achievement.code,
          rewards: {
            xp: achievement.xpReward,
            sparklePoints: achievement.sparklePointsReward,
          },
        },
      })
    } catch (error) {
      console.error('Failed to unlock achievement:', error)
    }
  }
}
