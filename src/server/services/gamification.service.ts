// src/server/services/gamification.service.ts
import { PrismaClient, Prisma, BadgeRarity, QuestType, QuestStatus } from '@prisma/client'
import { NotificationService } from './notification.service'
import { CacheService, CacheType } from './cache.service'
import { redisUtils } from '@/lib/redis'
import Decimal from 'decimal.js'

// XP configuration from README
const XP_REWARDS = {
  POST_CREATE: 10,
  COMMENT_CREATE: 5,
  QUALITY_POST_BONUS: 50,
  HELPFUL_COMMENT: 20,
  DAILY_LOGIN: 10,
  FIRST_POST_OF_DAY: 15,
  STREAK_BONUS: 5,
  ACHIEVEMENT_UNLOCK: 25,
  QUEST_COMPLETE: 30,
  LEVEL_UP: 100,
  REACTION_GIVEN: 1,
  REACTION_RECEIVED: 2,
  FOLLOW: 3,
  FOLLOWED: 5,
} as const

export class GamificationService {
  private notificationService: NotificationService
  private cacheService: CacheService

  constructor(private db: PrismaClient) {
    this.notificationService = new NotificationService(db)
    this.cacheService = new CacheService()
  }

  // ========== XP & Leveling ==========

  async awardXP(
    userId: string,
    amount: number,
    source: keyof typeof XP_REWARDS | string,
    sourceId?: string,
    reason?: string
  ) {
    // Start transaction for atomic operations
    const result = await this.db.$transaction(async (tx) => {
      // Get current user XP
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { experience: true, level: true },
      })

      if (!user) throw new Error('User not found')

      const oldLevel = user.level
      const newXP = user.experience + amount
      const newLevel = this.calculateLevel(newXP)

      // Update user XP and level
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          experience: newXP,
          level: newLevel,
        },
      })

      // Log XP transaction
      await tx.xpLog.create({
        data: {
          userId,
          amount,
          source: source.toString(),
          sourceId,
          reason: reason || `Earned ${amount} XP from ${source}`,
          totalXp: newXP,
        },
      })

      // Update user stats
      await tx.userStats.update({
        where: { userId },
        data: {
          totalXpEarned: { increment: amount },
        },
      })

      // Check for level up
      if (newLevel > oldLevel) {
        await this.handleLevelUp(tx, userId, oldLevel, newLevel)
      }

      // Update leaderboard
      await redisUtils.addToLeaderboard('xp:weekly', userId, newXP)
      await redisUtils.addToLeaderboard('xp:monthly', userId, newXP)
      await redisUtils.addToLeaderboard('xp:alltime', userId, newXP)

      return updatedUser
    })

    // Invalidate user cache
    await this.cacheService.invalidate(`user:${userId}`)

    return result
  }

  calculateLevel(xp: number): number {
    // Progressive level calculation from README
    return Math.floor(Math.sqrt(xp / 100)) + 1
  }

  calculateXPForLevel(level: number): number {
    return Math.pow(level - 1, 2) * 100
  }

  private async handleLevelUp(
    tx: Prisma.TransactionClient,
    userId: string,
    oldLevel: number,
    newLevel: number
  ) {
    // Get level configuration
    const levelConfig = await tx.levelConfig.findUnique({
      where: { level: newLevel },
    })

    if (levelConfig) {
      // Award level rewards (using Int for points as per README)
      if (levelConfig.sparkleReward > 0) {
        await this.awardSparklePoints(tx, userId, levelConfig.sparkleReward, 'level_up')
      }

      // Award bonus XP for leveling up
      await tx.xpLog.create({
        data: {
          userId,
          amount: XP_REWARDS.LEVEL_UP,
          source: 'level_up',
          reason: `Reached level ${newLevel}!`,
          totalXp: 0, // Will be recalculated
        },
      })
    }

    // Send notification
    await this.notificationService.createNotification({
      type: 'LEVEL_UP',
      userId,
      entityType: 'level',
      entityId: newLevel.toString(),
      title: 'Level Up!',
      message: `Congratulations! You've reached level ${newLevel}!`,
      data: {
        oldLevel,
        newLevel,
        rewards: levelConfig,
      },
    })

    // Check level-based achievements
    await this.checkLevelAchievements(tx, userId, newLevel)
  }

  // ========== Virtual Currency (Integer-based as per README) ==========

  async awardSparklePoints(
    tx: Prisma.TransactionClient | PrismaClient,
    userId: string,
    amount: number, // Int type as per README
    source: string,
    sourceId?: string
  ) {
    // Ensure amount is integer
    const intAmount = Math.floor(amount)

    // Update user balance (using Int fields)
    await tx.user.update({
      where: { id: userId },
      data: {
        sparklePoints: { increment: intAmount },
      },
    })

    // Update user balance tracking
    await tx.userBalance.upsert({
      where: { userId },
      create: {
        userId,
        sparklePoints: intAmount,
        premiumPoints: 0,
        lifetimeEarned: intAmount,
      },
      update: {
        sparklePoints: { increment: intAmount },
        lifetimeEarned: { increment: intAmount },
      },
    })

    // Log transaction
    await tx.pointTransaction.create({
      data: {
        userId,
        amount: intAmount,
        type: 'EARN',
        currency: 'SPARKLE',
        source,
        sourceId,
        balanceAfter: 0, // Will be calculated
      },
    })
  }

  async spendSparklePoints(
    userId: string,
    amount: number, // Int type
    reason: string,
    targetId?: string
  ): Promise<boolean> {
    const intAmount = Math.floor(amount)

    return this.db.$transaction(async (tx) => {
      // Check balance
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { sparklePoints: true },
      })

      if (!user || user.sparklePoints < intAmount) {
        return false // Insufficient balance
      }

      // Deduct points
      await tx.user.update({
        where: { id: userId },
        data: {
          sparklePoints: { decrement: intAmount },
        },
      })

      // Update balance tracking
      await tx.userBalance.update({
        where: { userId },
        data: {
          sparklePoints: { decrement: intAmount },
          lifetimeSpent: { increment: intAmount },
        },
      })

      // Log transaction
      await tx.pointTransaction.create({
        data: {
          userId,
          amount: -intAmount,
          type: 'SPEND',
          currency: 'SPARKLE',
          source: reason,
          sourceId: targetId,
          balanceAfter: user.sparklePoints - intAmount,
        },
      })

      return true
    })
  }

  // ========== Achievements ==========

  async checkAndUnlockAchievements(userId: string, context: string) {
    const achievements = await this.db.achievement.findMany({
      where: {
        isActive: true,
        context, // e.g., 'post', 'comment', 'follow'
      },
    })

    for (const achievement of achievements) {
      await this.checkAchievement(userId, achievement)
    }
  }

  private async checkAchievement(userId: string, achievement: any) {
    // Check if already unlocked
    const existing = await this.db.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId: achievement.id,
        },
      },
    })

    if (existing && existing.unlockedAt) return

    // Check requirements (stored in JSON)
    const meetsRequirements = await this.evaluateAchievementRequirements(
      userId,
      achievement.requirements
    )

    if (meetsRequirements) {
      await this.unlockAchievement(userId, achievement.id)
    } else if (achievement.progressSteps > 1) {
      // Update progress for multi-step achievements
      const progress = await this.calculateAchievementProgress(
        userId,
        achievement.requirements
      )

      await this.db.userAchievement.upsert({
        where: {
          userId_achievementId: {
            userId,
            achievementId: achievement.id,
          },
        },
        create: {
          userId,
          achievementId: achievement.id,
          progress,
          progressData: { current: progress, target: achievement.progressSteps },
        },
        update: {
          progress,
          progressData: { current: progress, target: achievement.progressSteps },
        },
      })
    }
  }

  private async unlockAchievement(userId: string, achievementId: string) {
    const achievement = await this.db.achievement.findUnique({
      where: { id: achievementId },
    })

    if (!achievement) return

    await this.db.$transaction(async (tx) => {
      // Unlock achievement
      await tx.userAchievement.upsert({
        where: {
          userId_achievementId: {
            userId,
            achievementId,
          },
        },
        create: {
          userId,
          achievementId,
          progress: 1,
          unlockedAt: new Date(),
        },
        update: {
          progress: 1,
          unlockedAt: new Date(),
        },
      })

      // Award rewards (using Int for points)
      if (achievement.xpReward > 0) {
        await this.awardXP(userId, achievement.xpReward, 'achievement', achievementId)
      }

      if (achievement.sparklePointsReward > 0) {
        await this.awardSparklePoints(
          tx,
          userId,
          achievement.sparklePointsReward,
          'achievement',
          achievementId
        )
      }

      // Update user stats
      await tx.userStats.update({
        where: { userId },
        data: {
          totalAchievements: { increment: 1 },
          [`${achievement.rarity.toLowerCase()}Achievements`]: { increment: 1 },
        },
      })
    })

    // Send notification
    await this.notificationService.createNotification({
      type: 'ACHIEVEMENT_UNLOCKED',
      userId,
      entityId: achievementId,
      entityType: 'achievement',
      title: 'Achievement Unlocked!',
      message: `You've unlocked "${achievement.name}"!`,
      imageUrl: achievement.iconUrl,
      data: {
        rarity: achievement.rarity,
        rewards: {
          xp: achievement.xpReward,
          sparklePoints: achievement.sparklePointsReward,
        },
      },
    })
  }

  // ========== Quests ==========

  async getActiveQuests(userId: string) {
    const now = new Date()

    // Get daily, weekly, and monthly quests
    const quests = await this.db.quest.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        userProgress: {
          where: { userId },
        },
      },
    })

    return quests.map(quest => ({
      ...quest,
      userProgress: quest.userProgress[0] || null,
    }))
  }

  async updateQuestProgress(
    userId: string,
    questType: string,
    progressIncrement: number = 1
  ) {
    const activeQuests = await this.db.quest.findMany({
      where: {
        type: questType as QuestType,
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
    })

    for (const quest of activeQuests) {
      const progress = await this.db.userQuest.upsert({
        where: {
          userId_questId: {
            userId,
            questId: quest.id,
          },
        },
        create: {
          userId,
          questId: quest.id,
          progress: progressIncrement,
          status: QuestStatus.IN_PROGRESS,
        },
        update: {
          progress: { increment: progressIncrement },
        },
      })

      // Check if quest completed
      const requirements = quest.requirements as any
      if (progress.progress >= (requirements.target || 1)) {
        await this.completeQuest(userId, quest.id)
      }
    }
  }

  private async completeQuest(userId: string, questId: string) {
    const quest = await this.db.quest.findUnique({
      where: { id: questId },
    })

    if (!quest) return

    await this.db.$transaction(async (tx) => {
      // Mark quest as completed
      await tx.userQuest.update({
        where: {
          userId_questId: {
            userId,
            questId,
          },
        },
        data: {
          status: QuestStatus.COMPLETED,
          completedAt: new Date(),
        },
      })

      // Award rewards
      if (quest.xpReward > 0) {
        await this.awardXP(userId, quest.xpReward, 'quest', questId)
      }

      if (quest.pointsReward > 0) {
        await this.awardSparklePoints(tx, userId, quest.pointsReward, 'quest', questId)
      }

      // Update stats
      await tx.userStats.update({
        where: { userId },
        data: {
          questsCompleted: { increment: 1 },
        },
      })
    })

    // Send notification
    await this.notificationService.createNotification({
      type: 'QUEST_COMPLETE',
      userId,
      entityId: questId,
      entityType: 'quest',
      title: 'Quest Completed!',
      message: `You've completed "${quest.title}"!`,
      data: {
        rewards: {
          xp: quest.xpReward,
          sparklePoints: quest.pointsReward,
        },
      },
    })
  }

  // ========== Leaderboards ==========

  async getLeaderboard(
    type: 'xp' | 'sparklePoints' | 'achievements',
    period: 'daily' | 'weekly' | 'monthly' | 'alltime',
    limit: number = 10
  ) {
    const key = `${type}:${period}`
    const cached = await redisUtils.getLeaderboard(key, limit)

    if (cached.length > 0) {
      // Enrich with user data
      const userIds = cached.map(entry => entry.member)
      const users = await this.db.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          username: true,
          image: true,
          level: true,
        },
      })

      const userMap = new Map(users.map(u => [u.id, u]))

      return cached.map((entry, index) => ({
        rank: index + 1,
        user: userMap.get(entry.member),
        score: entry.score,
      }))
    }

    // If no cache, compute from database
    return this.computeLeaderboard(type, period, limit)
  }

  private async computeLeaderboard(
    type: string,
    period: string,
    limit: number
  ) {
    let dateFilter: Date | undefined
    const now = new Date()

    switch (period) {
      case 'daily':
        dateFilter = new Date(now.setHours(0, 0, 0, 0))
        break
      case 'weekly':
        dateFilter = new Date(now.setDate(now.getDate() - 7))
        break
      case 'monthly':
        dateFilter = new Date(now.setMonth(now.getMonth() - 1))
        break
    }

    let orderBy: any
    let select: any = {
      id: true,
      username: true,
      image: true,
      level: true,
    }

    switch (type) {
      case 'xp':
        orderBy = { experience: 'desc' }
        select.experience = true
        break
      case 'sparklePoints':
        orderBy = { sparklePoints: 'desc' }
        select.sparklePoints = true
        break
      case 'achievements':
        // This would need a different query
        break
    }

    const users = await this.db.user.findMany({
      where: dateFilter ? {
        createdAt: { gte: dateFilter },
      } : undefined,
      select,
      orderBy,
      take: limit,
    })

    // Cache the results
    const cacheKey = `${type}:${period}`
    for (const [index, user] of users.entries()) {
      const score = type === 'xp' ? user.experience : user.sparklePoints
      await redisUtils.addToLeaderboard(cacheKey, user.id, score)
    }

    return users.map((user, index) => ({
      rank: index + 1,
      user,
      score: type === 'xp' ? user.experience : user.sparklePoints,
    }))
  }

  // ========== Helper Methods ==========

  private async evaluateAchievementRequirements(
    userId: string,
    requirements: any
  ): Promise<boolean> {
    // Implementation depends on requirement structure
    // Example: { type: 'posts', count: 10 }
    if (requirements.type === 'posts') {
      const count = await this.db.post.count({
        where: { authorId: userId },
      })
      return count >= requirements.count
    }

    // Add more requirement types as needed
    return false
  }

  private async calculateAchievementProgress(
    userId: string,
    requirements: any
  ): Promise<number> {
    if (requirements.type === 'posts') {
      const count = await this.db.post.count({
        where: { authorId: userId },
      })
      return Math.min(count / requirements.count, 1)
    }

    return 0
  }

  private async checkLevelAchievements(
    tx: Prisma.TransactionClient,
    userId: string,
    level: number
  ) {
    const levelAchievements = [
      { level: 10, code: 'LEVEL_10' },
      { level: 25, code: 'LEVEL_25' },
      { level: 50, code: 'LEVEL_50' },
      { level: 100, code: 'LEVEL_100' },
    ]

    for (const achievement of levelAchievements) {
      if (level >= achievement.level) {
        const dbAchievement = await tx.achievement.findUnique({
          where: { code: achievement.code },
        })

        if (dbAchievement) {
          await this.checkAchievement(userId, dbAchievement)
        }
      }
    }
  }
}
