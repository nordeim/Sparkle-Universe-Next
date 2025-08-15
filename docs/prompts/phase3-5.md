awesome job! below is the `src/server/services/gamification.service.ts` from the original phase 3 codebase which I did not share earlier. please meticulously comparing the original phase 3 `src/server/services/gamification.service.ts` with your generated version, then identify features in the original version but are missing in your version, then complete updated working replacement file that carefully merge the missing features, a complete production-ready version that combines the best of both implementations. please carefully and meticulously plan before proceeding cautiously to create the complete updated replacement version.

# original Phase 3: src/server/services/gamification.service.ts
// src/server/services/gamification.service.ts
import { PrismaClient, Prisma, BadgeRarity, QuestType, QuestStatus } from '@prisma/client'
import { NotificationService } from './notification.service'
import { CacheService, CacheType } from './cache.service'
import { redisUtils } from '@/lib/redis'
import Decimal from 'decimal.js'

// Export XP configuration for use in other services
export const XP_REWARDS = {
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

      return updatedUser
    })

    // Update leaderboards
    await Promise.all([
      redisUtils.addToLeaderboard('xp:daily', userId, result.experience),
      redisUtils.addToLeaderboard('xp:weekly', userId, result.experience),
      redisUtils.addToLeaderboard('xp:monthly', userId, result.experience),
      redisUtils.addToLeaderboard('xp:alltime', userId, result.experience),
    ])

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

      if (levelConfig.premiumReward > 0) {
        await this.awardPremiumPoints(tx, userId, levelConfig.premiumReward, 'level_up')
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
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        sparklePoints: { increment: intAmount },
      },
      select: { sparklePoints: true },
    })

    // Update user balance tracking
    await tx.userBalance.upsert({
      where: { userId },
      create: {
        userId,
        sparklePoints: intAmount,
        premiumPoints: 0,
        lifetimeEarned: intAmount,
        lifetimeSpent: 0,
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
        balanceAfter: updatedUser.sparklePoints,
      },
    })

    return updatedUser.sparklePoints
  }

  async awardPremiumPoints(
    tx: Prisma.TransactionClient | PrismaClient,
    userId: string,
    amount: number, // Int type
    source: string,
    sourceId?: string
  ) {
    const intAmount = Math.floor(amount)

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        premiumPoints: { increment: intAmount },
      },
      select: { premiumPoints: true },
    })

    await tx.userBalance.upsert({
      where: { userId },
      create: {
        userId,
        sparklePoints: 0,
        premiumPoints: intAmount,
        lifetimeEarned: intAmount,
        lifetimeSpent: 0,
      },
      update: {
        premiumPoints: { increment: intAmount },
      },
    })

    await tx.pointTransaction.create({
      data: {
        userId,
        amount: intAmount,
        type: 'EARN',
        currency: 'PREMIUM',
        source,
        sourceId,
        balanceAfter: updatedUser.premiumPoints,
      },
    })

    return updatedUser.premiumPoints
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
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          sparklePoints: { decrement: intAmount },
        },
        select: { sparklePoints: true },
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
          balanceAfter: updatedUser.sparklePoints,
        },
      })

      return true
    })
  }

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
        // Note: awardXP needs to be called outside transaction or refactored
        await tx.xpLog.create({
          data: {
            userId,
            amount: achievement.xpReward,
            source: 'achievement',
            sourceId: achievementId,
            reason: `Unlocked achievement: ${achievement.name}`,
            totalXp: 0, // Will be recalculated
          },
        })

        await tx.user.update({
          where: { id: userId },
          data: {
            experience: { increment: achievement.xpReward },
          },
        })
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

      // Award XP
      if (quest.xpReward > 0) {
        await tx.user.update({
          where: { id: userId },
          data: {
            experience: { increment: quest.xpReward },
          },
        })

        await tx.xpLog.create({
          data: {
            userId,
            amount: quest.xpReward,
            source: 'quest',
            sourceId: questId,
            reason: `Completed quest: ${quest.title}`,
            totalXp: 0,
          },
        })
      }

      // Award points
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
        score: Math.floor(entry.score),
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
        const today = new Date(now)
        today.setHours(0, 0, 0, 0)
        dateFilter = today
        break
      case 'weekly':
        const weekAgo = new Date(now)
        weekAgo.setDate(weekAgo.getDate() - 7)
        dateFilter = weekAgo
        break
      case 'monthly':
        const monthAgo = new Date(now)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        dateFilter = monthAgo
        break
    }

    let users: any[] = []

    if (type === 'xp') {
      users = await this.db.user.findMany({
        where: dateFilter ? {
          createdAt: { gte: dateFilter },
        } : undefined,
        select: {
          id: true,
          username: true,
          image: true,
          level: true,
          experience: true,
        },
        orderBy: { experience: 'desc' },
        take: limit,
      })
    } else if (type === 'sparklePoints') {
      users = await this.db.user.findMany({
        where: dateFilter ? {
          createdAt: { gte: dateFilter },
        } : undefined,
        select: {
          id: true,
          username: true,
          image: true,
          level: true,
          sparklePoints: true,
        },
        orderBy: { sparklePoints: 'desc' },
        take: limit,
      })
    } else if (type === 'achievements') {
      // Get users with most achievements
      const userAchievements = await this.db.userAchievement.groupBy({
        by: ['userId'],
        where: dateFilter ? {
          unlockedAt: { gte: dateFilter },
        } : { unlockedAt: { not: null } },
        _count: {
          achievementId: true,
        },
        orderBy: {
          _count: {
            achievementId: 'desc',
          },
        },
        take: limit,
      })

      const userIds = userAchievements.map(ua => ua.userId)
      const userMap = await this.db.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          username: true,
          image: true,
          level: true,
        },
      })

      const userDict = new Map(userMap.map(u => [u.id, u]))
      
      users = userAchievements.map(ua => ({
        ...userDict.get(ua.userId),
        achievementCount: ua._count.achievementId,
      }))
    }

    // Cache the results
    const cacheKey = `${type}:${period}`
    for (const [index, user] of users.entries()) {
      let score = 0
      if (type === 'xp') score = user.experience
      else if (type === 'sparklePoints') score = user.sparklePoints
      else if (type === 'achievements') score = user.achievementCount
      
      await redisUtils.addToLeaderboard(cacheKey, user.id, score)
    }

    return users.map((user, index) => ({
      rank: index + 1,
      user: {
        id: user.id,
        username: user.username,
        image: user.image,
        level: user.level,
      },
      score: type === 'xp' ? user.experience : 
             type === 'sparklePoints' ? user.sparklePoints :
             user.achievementCount,
    }))
  }

  private async evaluateAchievementRequirements(
    userId: string,
    requirements: any
  ): Promise<boolean> {
    if (!requirements) return false

    // Post count requirement
    if (requirements.type === 'posts' && requirements.count) {
      const count = await this.db.post.count({
        where: { 
          authorId: userId,
          published: true,
        },
      })
      return count >= requirements.count
    }

    // Comment count requirement
    if (requirements.type === 'comments' && requirements.count) {
      const count = await this.db.comment.count({
        where: { 
          authorId: userId,
          deleted: false,
        },
      })
      return count >= requirements.count
    }

    // Follower count requirement
    if (requirements.type === 'followers' && requirements.count) {
      const count = await this.db.follow.count({
        where: { followingId: userId },
      })
      return count >= requirements.count
    }

    // Level requirement
    if (requirements.type === 'level' && requirements.level) {
      const user = await this.db.user.findUnique({
        where: { id: userId },
        select: { level: true },
      })
      return (user?.level || 0) >= requirements.level
    }

    // XP requirement
    if (requirements.type === 'xp' && requirements.amount) {
      const user = await this.db.user.findUnique({
        where: { id: userId },
        select: { experience: true },
      })
      return (user?.experience || 0) >= requirements.amount
    }

    return false
  }

  private async calculateAchievementProgress(
    userId: string,
    requirements: any
  ): Promise<number> {
    if (!requirements) return 0

    if (requirements.type === 'posts' && requirements.count) {
      const count = await this.db.post.count({
        where: { 
          authorId: userId,
          published: true,
        },
      })
      return Math.min(count / requirements.count, 1)
    }

    if (requirements.type === 'comments' && requirements.count) {
      const count = await this.db.comment.count({
        where: { 
          authorId: userId,
          deleted: false,
        },
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
          // Check if not already unlocked
          const existing = await tx.userAchievement.findUnique({
            where: {
              userId_achievementId: {
                userId,
                achievementId: dbAchievement.id,
              },
            },
          })

          if (!existing || !existing.unlockedAt) {
            await tx.userAchievement.upsert({
              where: {
                userId_achievementId: {
                  userId,
                  achievementId: dbAchievement.id,
                },
              },
              create: {
                userId,
                achievementId: dbAchievement.id,
                progress: 1,
                unlockedAt: new Date(),
              },
              update: {
                progress: 1,
                unlockedAt: new Date(),
              },
            })
          }
        }
      }
    }
  }
}
