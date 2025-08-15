# Phase 4: src/server/services/gamification.service.ts
```ts
// src/server/services/gamification.service.ts (phase 4)
import { 
  PrismaClient, 
  Prisma, 
  BadgeRarity, 
  QuestType, 
  QuestStatus,
  NotificationType 
} from '@prisma/client'
import { NotificationService } from './notification.service'
import { CacheService, CacheType } from './cache.service'
import Decimal from 'decimal.js'

// Redis utilities for leaderboard management
const redisUtils = {
  async addToLeaderboard(key: string, member: string, score: number): Promise<void> {
    const cacheService = new CacheService()
    const leaderboard = await cacheService.get<Array<{member: string, score: number}>>(key) || []
    
    // Update or add member
    const existingIndex = leaderboard.findIndex(entry => entry.member === member)
    if (existingIndex >= 0) {
      leaderboard[existingIndex].score = score
    } else {
      leaderboard.push({ member, score })
    }
    
    // Sort by score descending
    leaderboard.sort((a, b) => b.score - a.score)
    
    // Keep top 100
    const trimmed = leaderboard.slice(0, 100)
    
    // Cache for appropriate duration based on period
    const ttl = key.includes('daily') ? 3600 : 
                key.includes('weekly') ? 86400 : 
                key.includes('monthly') ? 604800 : 2592000
    
    await cacheService.set(key, trimmed, ttl)
  },

  async getLeaderboard(key: string, limit: number): Promise<Array<{member: string, score: number}>> {
    const cacheService = new CacheService()
    const leaderboard = await cacheService.get<Array<{member: string, score: number}>>(key) || []
    return leaderboard.slice(0, limit)
  }
}

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
        select: { 
          experience: true, 
          level: true,
          username: true,
        },
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
          version: { increment: 1 },
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

      // Update or create user stats
      await tx.userStats.upsert({
        where: { userId },
        create: {
          userId,
          totalXpEarned: amount,
        },
        update: {
          totalXpEarned: { increment: amount },
        },
      })

      // Update daily activity
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      await tx.userActivity.upsert({
        where: {
          userId_date: {
            userId,
            date: today,
          },
        },
        create: {
          userId,
          date: today,
          xpEarned: amount,
        },
        update: {
          xpEarned: { increment: amount },
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
    await this.cacheService.invalidate(`stats:${userId}`)

    return result
  }

  calculateLevel(xp: number): number {
    // Progressive level calculation from README
    return Math.floor(Math.sqrt(xp / 100)) + 1
  }

  calculateXPForLevel(level: number): number {
    // Reverse calculation: how much XP needed for a specific level
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
          bonusXp: XP_REWARDS.LEVEL_UP,
          totalXp: 0, // Will be recalculated
        },
      })

      // Update user experience
      await tx.user.update({
        where: { id: userId },
        data: {
          experience: { increment: XP_REWARDS.LEVEL_UP },
        },
      })
    }

    // Send notification
    await this.notificationService.createNotification({
      type: NotificationType.LEVEL_UP,
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
        version: { increment: 1 },
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
        version: 0,
      },
      update: {
        sparklePoints: { increment: intAmount },
        lifetimeEarned: { increment: intAmount },
        lastTransactionAt: new Date(),
        version: { increment: 1 },
      },
    })

    // Log transaction
    await tx.currencyTransaction.create({
      data: {
        userId,
        amount: intAmount,
        currencyType: 'sparkle',
        transactionType: 'earn',
        source,
        sourceId,
        balanceBefore: updatedUser.sparklePoints - intAmount,
        balanceAfter: updatedUser.sparklePoints,
      },
    })

    // Update daily activity
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    await tx.userActivity.upsert({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
      create: {
        userId,
        date: today,
        pointsEarned: intAmount,
      },
      update: {
        pointsEarned: { increment: intAmount },
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
        version: { increment: 1 },
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
        version: 0,
      },
      update: {
        premiumPoints: { increment: intAmount },
        lifetimeEarned: { increment: intAmount },
        lastTransactionAt: new Date(),
        version: { increment: 1 },
      },
    })

    await tx.currencyTransaction.create({
      data: {
        userId,
        amount: intAmount,
        currencyType: 'premium',
        transactionType: 'earn',
        source,
        sourceId,
        balanceBefore: updatedUser.premiumPoints - intAmount,
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
          version: { increment: 1 },
        },
        select: { sparklePoints: true },
      })

      // Update balance tracking
      await tx.userBalance.update({
        where: { userId },
        data: {
          sparklePoints: { decrement: intAmount },
          lifetimeSpent: { increment: intAmount },
          lastTransactionAt: new Date(),
          version: { increment: 1 },
        },
      })

      // Log transaction
      await tx.currencyTransaction.create({
        data: {
          userId,
          amount: intAmount,
          currencyType: 'sparkle',
          transactionType: 'spend',
          source: reason,
          sourceId: targetId,
          balanceBefore: updatedUser.sparklePoints + intAmount,
          balanceAfter: updatedUser.sparklePoints,
        },
      })

      return true
    })
  }

  async checkAndUnlockAchievements(userId: string, context: string) {
    const achievements = await this.db.achievement.findMany({
      where: {
        deleted: false,
        // Check if context matches or if achievement is global
        OR: [
          { category: context },
          { category: null },
        ],
      },
    })

    const unlockedAchievements = []

    for (const achievement of achievements) {
      const unlocked = await this.checkAchievement(userId, achievement)
      if (unlocked) {
        unlockedAchievements.push(achievement)
      }
    }

    return unlockedAchievements
  }

  private async checkAchievement(userId: string, achievement: any): Promise<boolean> {
    // Check if already unlocked
    const existing = await this.db.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId: achievement.id,
        },
      },
    })

    if (existing && existing.progress >= 1) return false

    // Check requirements (stored in JSON)
    const meetsRequirements = await this.evaluateAchievementRequirements(
      userId,
      achievement.criteria || achievement.requirements
    )

    if (meetsRequirements) {
      await this.unlockAchievement(userId, achievement.id)
      return true
    } else if (achievement.progressSteps > 1) {
      // Update progress for multi-step achievements
      const progress = await this.calculateAchievementProgress(
        userId,
        achievement.criteria || achievement.requirements,
        achievement.progressSteps
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
          progressData: { 
            current: Math.floor(progress * achievement.progressSteps), 
            target: achievement.progressSteps 
          },
        },
        update: {
          progress,
          progressData: { 
            current: Math.floor(progress * achievement.progressSteps), 
            target: achievement.progressSteps 
          },
        },
      })

      // Check if just completed
      if (progress >= 1) {
        await this.unlockAchievement(userId, achievement.id)
        return true
      }
    }

    return false
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
          claimedRewards: true,
        },
        update: {
          progress: 1,
          unlockedAt: new Date(),
          claimedRewards: true,
        },
      })

      // Award rewards (using Int for points)
      if (achievement.xpReward > 0) {
        await tx.user.update({
          where: { id: userId },
          data: {
            experience: { increment: achievement.xpReward },
          },
        })

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

      if (achievement.premiumPointsReward > 0) {
        await this.awardPremiumPoints(
          tx,
          userId,
          achievement.premiumPointsReward,
          'achievement',
          achievementId
        )
      }

      // Update user stats
      await tx.userStats.upsert({
        where: { userId },
        create: {
          userId,
          totalAchievements: 1,
        },
        update: {
          totalAchievements: { increment: 1 },
        },
      })

      // Update daily activity
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      await tx.userActivity.upsert({
        where: {
          userId_date: {
            userId,
            date: today,
          },
        },
        create: {
          userId,
          date: today,
          achievementsUnlocked: 1,
        },
        update: {
          achievementsUnlocked: { increment: 1 },
        },
      })
    })

    // Send notification
    await this.notificationService.createNotification({
      type: NotificationType.ACHIEVEMENT_UNLOCKED,
      userId,
      entityId: achievementId,
      entityType: 'achievement',
      title: 'Achievement Unlocked!',
      message: `You've unlocked "${achievement.name}"!`,
      imageUrl: achievement.icon || achievement.animatedIcon,
      data: {
        achievementName: achievement.name,
        rarity: achievement.rarity,
        rewards: {
          xp: achievement.xpReward,
          sparklePoints: achievement.sparklePointsReward,
          premiumPoints: achievement.premiumPointsReward,
        },
      },
    })
  }

  async getActiveQuests(userId: string) {
    const now = new Date()

    // Get daily, weekly, and monthly quests
    const quests = await this.db.quest.findMany({
      where: {
        availableFrom: { lte: now },
        availableUntil: { gte: now },
      },
      include: {
        userQuests: {
          where: { userId },
        },
      },
    })

    return quests.map(quest => ({
      ...quest,
      userProgress: quest.userQuests[0] || null,
    }))
  }

  async updateQuestProgress(
    userId: string,
    questCode: string,
    progressIncrement: number = 1
  ) {
    const now = new Date()
    
    const activeQuests = await this.db.quest.findMany({
      where: {
        code: questCode,
        availableFrom: { lte: now },
        availableUntil: { gte: now },
      },
    })

    for (const quest of activeQuests) {
      const userQuest = await this.db.userQuest.upsert({
        where: {
          userId_questId: {
            userId,
            questId: quest.id,
          },
        },
        create: {
          userId,
          questId: quest.id,
          status: QuestStatus.IN_PROGRESS,
          progress: { current: progressIncrement },
          currentStep: progressIncrement,
          totalSteps: quest.requirements ? (quest.requirements as any).target || 1 : 1,
        },
        update: {
          progress: { 
            increment: { current: progressIncrement } 
          },
          currentStep: { increment: progressIncrement },
        },
      })

      // Check if quest completed
      const requirements = quest.requirements as any
      const targetAmount = requirements?.target || requirements?.amount || 1
      const currentProgress = (userQuest.progress as any)?.current || userQuest.currentStep

      if (currentProgress >= targetAmount && userQuest.status !== QuestStatus.COMPLETED) {
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
            reason: `Completed quest: ${quest.name}`,
            totalXp: 0,
          },
        })
      }

      // Award points
      if (quest.pointsReward > 0) {
        await this.awardSparklePoints(tx, userId, quest.pointsReward, 'quest', questId)
      }

      // Update stats
      await tx.userStats.upsert({
        where: { userId },
        create: {
          userId,
          questsCompleted: 1,
        },
        update: {
          questsCompleted: { increment: 1 },
        },
      })

      // Update daily activity
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      await tx.userActivity.upsert({
        where: {
          userId_date: {
            userId,
            date: today,
          },
        },
        create: {
          userId,
          date: today,
          questsCompleted: 1,
        },
        update: {
          questsCompleted: { increment: 1 },
        },
      })
    })

    // Send notification
    await this.notificationService.createNotification({
      type: NotificationType.QUEST_COMPLETE,
      userId,
      entityId: questId,
      entityType: 'quest',
      title: 'Quest Completed!',
      message: `You've completed "${quest.name}"!`,
      data: {
        questName: quest.name,
        questType: quest.type,
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
        where: { 
          id: { in: userIds },
          deleted: false,
        },
        select: {
          id: true,
          username: true,
          image: true,
          level: true,
          verified: true,
        },
      })

      const userMap = new Map(users.map(u => [u.id, u]))

      return cached.map((entry, index) => ({
        rank: index + 1,
        user: userMap.get(entry.member),
        score: Math.floor(entry.score),
      })).filter(entry => entry.user) // Filter out deleted users
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
      // For period-based XP, we need to look at XP logs
      if (dateFilter) {
        const xpLogs = await this.db.xpLog.groupBy({
          by: ['userId'],
          where: {
            createdAt: { gte: dateFilter },
          },
          _sum: {
            amount: true,
          },
          orderBy: {
            _sum: {
              amount: 'desc',
            },
          },
          take: limit,
        })

        const userIds = xpLogs.map(log => log.userId)
        const userMap = await this.db.user.findMany({
          where: { 
            id: { in: userIds },
            deleted: false,
          },
          select: {
            id: true,
            username: true,
            image: true,
            level: true,
            experience: true,
          },
        })

        const userDict = new Map(userMap.map(u => [u.id, u]))
        
        users = xpLogs.map(log => ({
          ...userDict.get(log.userId),
          periodXp: log._sum.amount || 0,
        }))
      } else {
        // All-time XP
        users = await this.db.user.findMany({
          where: { deleted: false },
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
      }
    } else if (type === 'sparklePoints') {
      if (dateFilter) {
        // Period-based sparkle points from transactions
        const transactions = await this.db.currencyTransaction.groupBy({
          by: ['userId'],
          where: {
            createdAt: { gte: dateFilter },
            currencyType: 'sparkle',
            transactionType: 'earn',
          },
          _sum: {
            amount: true,
          },
          orderBy: {
            _sum: {
              amount: 'desc',
            },
          },
          take: limit,
        })

        const userIds = transactions.map(t => t.userId)
        const userMap = await this.db.user.findMany({
          where: { 
            id: { in: userIds },
            deleted: false,
          },
          select: {
            id: true,
            username: true,
            image: true,
            level: true,
            sparklePoints: true,
          },
        })

        const userDict = new Map(userMap.map(u => [u.id, u]))
        
        users = transactions.map(t => ({
          ...userDict.get(t.userId),
          periodPoints: t._sum.amount || 0,
        }))
      } else {
        // All-time sparkle points
        users = await this.db.user.findMany({
          where: { deleted: false },
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
      }
    } else if (type === 'achievements') {
      // Get users with most achievements
      const userAchievements = await this.db.userAchievement.groupBy({
        by: ['userId'],
        where: dateFilter ? {
          unlockedAt: { gte: dateFilter },
          claimedRewards: true,
        } : { 
          progress: { gte: 1 },
        },
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
        where: { 
          id: { in: userIds },
          deleted: false,
        },
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

    // Filter out null users (deleted accounts)
    users = users.filter(u => u && u.id)

    // Cache the results
    const cacheKey = `${type}:${period}`
    for (const user of users) {
      let score = 0
      if (type === 'xp') {
        score = dateFilter ? user.periodXp : user.experience
      } else if (type === 'sparklePoints') {
        score = dateFilter ? user.periodPoints : user.sparklePoints
      } else if (type === 'achievements') {
        score = user.achievementCount
      }
      
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
      score: type === 'xp' ? (dateFilter ? user.periodXp : user.experience) : 
             type === 'sparklePoints' ? (dateFilter ? user.periodPoints : user.sparklePoints) :
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
          deleted: false,
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

    // Following count requirement
    if (requirements.type === 'following' && requirements.count) {
      const count = await this.db.follow.count({
        where: { followerId: userId },
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

    // Streak requirement
    if (requirements.type === 'streak' && requirements.days) {
      const stats = await this.db.userStats.findUnique({
        where: { userId },
        select: { streakDays: true },
      })
      return (stats?.streakDays || 0) >= requirements.days
    }

    // Quality content requirement (high engagement)
    if (requirements.type === 'quality_content') {
      const posts = await this.db.post.findMany({
        where: { 
          authorId: userId,
          published: true,
        },
        include: {
          stats: true,
        },
      })

      const qualityPosts = posts.filter(post => 
        post.stats && post.stats.engagementRate >= (requirements.minEngagement || 0.5)
      )

      return qualityPosts.length >= (requirements.count || 1)
    }

    return false
  }

  private async calculateAchievementProgress(
    userId: string,
    requirements: any,
    progressSteps: number
  ): Promise<number> {
    if (!requirements) return 0

    let current = 0
    let target = progressSteps

    if (requirements.type === 'posts' && requirements.count) {
      current = await this.db.post.count({
        where: { 
          authorId: userId,
          published: true,
          deleted: false,
        },
      })
      target = requirements.count
    } else if (requirements.type === 'comments' && requirements.count) {
      current = await this.db.comment.count({
        where: { 
          authorId: userId,
          deleted: false,
        },
      })
      target = requirements.count
    } else if (requirements.type === 'followers' && requirements.count) {
      current = await this.db.follow.count({
        where: { followingId: userId },
      })
      target = requirements.count
    } else if (requirements.type === 'xp' && requirements.amount) {
      const user = await this.db.user.findUnique({
        where: { id: userId },
        select: { experience: true },
      })
      current = user?.experience || 0
      target = requirements.amount
    }

    return Math.min(current / target, 1)
  }

  private async checkLevelAchievements(
    tx: Prisma.TransactionClient,
    userId: string,
    level: number
  ) {
    const levelAchievements = [
      { level: 5, code: 'LEVEL_5' },
      { level: 10, code: 'LEVEL_10' },
      { level: 25, code: 'LEVEL_25' },
      { level: 50, code: 'LEVEL_50' },
      { level: 75, code: 'LEVEL_75' },
      { level: 100, code: 'LEVEL_100' },
      { level: 150, code: 'LEVEL_150' },
      { level: 200, code: 'LEVEL_200' },
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

          if (!existing || existing.progress < 1) {
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
                claimedRewards: true,
              },
              update: {
                progress: 1,
                unlockedAt: new Date(),
                claimedRewards: true,
              },
            })

            // Update achievement count in stats
            await tx.userStats.upsert({
              where: { userId },
              create: {
                userId,
                totalAchievements: 1,
              },
              update: {
                totalAchievements: { increment: 1 },
              },
            })
          }
        }
      }
    }
  }
}
```

# Phase 5: src/server/services/gamification.service.ts
```ts
// src/server/services/gamification.service.ts (phase 5, to merge with the features and functions from phase 4)
import { PrismaClient, Prisma } from '@prisma/client'
import { Redis } from 'ioredis'
import { achievements } from '@/config/achievements'
import { EventEmitter } from 'events'
import { z } from 'zod'

// XP Configuration
const XP_CONFIG = {
  POST_CREATED: 50,
  POST_FEATURED: 100,
  POST_VIRAL: 500,
  COMMENT_CREATED: 10,
  COMMENT_LIKED: 5,
  REACTION_GIVEN: 2,
  REACTION_RECEIVED: 3,
  FOLLOW_RECEIVED: 20,
  DAILY_LOGIN: 10,
  STREAK_BONUS: 5, // Per day
  LEVEL_UP_BONUS: 100,
  ACHIEVEMENT_BONUS: 50, // Base, multiplied by rarity
} as const

// Level calculation constants
const LEVEL_CONFIG = {
  BASE_XP: 100,
  GROWTH_RATE: 1.5,
  MAX_LEVEL: 100,
} as const

// Achievement progress tracking
interface AchievementProgress {
  achievementId: string
  currentValue: number
  targetValue: number
  percentage: number
  isCompleted: boolean
}

export class GamificationService extends EventEmitter {
  private redis: Redis
  private achievementCache: Map<string, any> = new Map()

  constructor(private db: PrismaClient) {
    super()
    this.redis = new Redis(process.env.REDIS_URL!)
    this.loadAchievements()
  }

  private async loadAchievements() {
    // Cache achievements in memory
    achievements.forEach(achievement => {
      this.achievementCache.set(achievement.id, achievement)
    })
  }

  // XP Management
  async awardXP(
    userId: string, 
    amount: number, 
    reason: string,
    metadata?: Record<string, any>
  ): Promise<{
    totalXP: number
    xpGained: number
    oldLevel: number
    newLevel: number
    leveledUp: boolean
    nextLevelXP: number
    progressToNextLevel: number
  }> {
    // Start transaction
    const result = await this.db.$transaction(async (tx) => {
      // Get current user stats
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          experience: true,
          level: true,
          username: true,
        }
      })

      if (!user) {
        throw new Error('User not found')
      }

      const oldLevel = user.level
      const newExperience = user.experience + amount
      const newLevel = this.calculateLevel(newExperience)
      const leveledUp = newLevel > oldLevel

      // Update user experience
      await tx.user.update({
        where: { id: userId },
        data: {
          experience: newExperience,
          level: newLevel,
        }
      })

      // Log XP gain
      await tx.xpLog.create({
        data: {
          userId,
          amount,
          reason,
          metadata,
        }
      })

      // Handle level up
      if (leveledUp) {
        await this.handleLevelUp(tx, userId, oldLevel, newLevel)
      }

      return {
        totalXP: newExperience,
        xpGained: amount,
        oldLevel,
        newLevel,
        leveledUp,
      }
    })

    // Calculate next level requirements
    const nextLevelXP = this.getXPForLevel(result.newLevel + 1)
    const currentLevelXP = this.getXPForLevel(result.newLevel)
    const progressToNextLevel = 
      ((result.totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100

    // Emit events
    this.emit('xp:awarded', {
      userId,
      amount,
      reason,
      totalXP: result.totalXP,
    })

    if (result.leveledUp) {
      this.emit('user:levelUp', {
        userId,
        oldLevel: result.oldLevel,
        newLevel: result.newLevel,
      })

      // Check level-based achievements
      await this.checkAchievements(userId, 'level_up', { 
        level: result.newLevel 
      })
    }

    // Update leaderboard cache
    await this.updateLeaderboardCache(userId, result.totalXP)

    return {
      ...result,
      nextLevelXP,
      progressToNextLevel,
    }
  }

  private calculateLevel(xp: number): number {
    let level = 1
    let requiredXP = LEVEL_CONFIG.BASE_XP

    while (xp >= requiredXP && level < LEVEL_CONFIG.MAX_LEVEL) {
      level++
      requiredXP = this.getXPForLevel(level)
    }

    return level
  }

  private getXPForLevel(level: number): number {
    if (level <= 1) return 0
    return Math.floor(
      LEVEL_CONFIG.BASE_XP * Math.pow(LEVEL_CONFIG.GROWTH_RATE, level - 1)
    )
  }

  private async handleLevelUp(
    tx: Prisma.TransactionClient,
    userId: string,
    oldLevel: number,
    newLevel: number
  ) {
    // Award level up bonus XP
    const bonusXP = LEVEL_CONFIG.LEVEL_UP_BONUS * (newLevel - oldLevel)
    
    await tx.xpLog.create({
      data: {
        userId,
        amount: bonusXP,
        reason: `Level up bonus (${oldLevel} → ${newLevel})`,
      }
    })

    // Create notification
    await tx.notification.create({
      data: {
        type: 'LEVEL_UP',
        userId,
        message: `Congratulations! You've reached level ${newLevel}!`,
        data: {
          oldLevel,
          newLevel,
          bonusXP,
        }
      }
    })
  }

  // Achievement System
  async checkAchievements(
    userId: string,
    trigger: string,
    context?: Record<string, any>
  ): Promise<{
    unlocked: string[]
    progress: AchievementProgress[]
  }> {
    const unlockedAchievements: string[] = []
    const progressUpdates: AchievementProgress[] = []

    // Get user's current achievements
    const userAchievements = await this.db.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true }
    })

    const unlockedIds = new Set(userAchievements.map(ua => ua.achievementId))

    // Filter achievements by trigger
    const relevantAchievements = achievements.filter(a => 
      a.trigger === trigger && !unlockedIds.has(a.id)
    )

    // Check each achievement
    for (const achievement of relevantAchievements) {
      const progress = await this.checkAchievementProgress(
        userId, 
        achievement, 
        context
      )

      progressUpdates.push(progress)

      if (progress.isCompleted) {
        await this.unlockAchievement(userId, achievement)
        unlockedAchievements.push(achievement.id)
      }
    }

    return {
      unlocked: unlockedAchievements,
      progress: progressUpdates,
    }
  }

  private async checkAchievementProgress(
    userId: string,
    achievement: any,
    context?: any
  ): Promise<AchievementProgress> {
    let currentValue = 0
    let targetValue = 0
    let isCompleted = false

    switch (achievement.id) {
      case 'first_post':
        currentValue = await this.db.post.count({ 
          where: { authorId: userId } 
        })
        targetValue = 1
        isCompleted = currentValue >= targetValue
        break

      case 'prolific_writer':
        currentValue = await this.db.post.count({ 
          where: { authorId: userId } 
        })
        targetValue = 10
        isCompleted = currentValue >= targetValue
        break

      case 'viral_sensation':
        const viralPost = await this.db.post.findFirst({
          where: {
            authorId: userId,
            reactions: {
              _count: { gte: 1000 }
            }
          }
        })
        currentValue = viralPost ? 1000 : 0
        targetValue = 1000
        isCompleted = !!viralPost
        break

      case 'social_butterfly':
        currentValue = await this.db.follow.count({
          where: { followingId: userId }
        })
        targetValue = 50
        isCompleted = currentValue >= targetValue
        break

      case 'influencer':
        currentValue = await this.db.follow.count({
          where: { followingId: userId }
        })
        targetValue = 1000
        isCompleted = currentValue >= targetValue
        break

      case 'engagement_master':
        currentValue = await this.db.reaction.count({
          where: { userId }
        })
        targetValue = 100
        isCompleted = currentValue >= targetValue
        break

      case 'helpful_member':
        const likedComments = await this.db.comment.count({
          where: {
            authorId: userId,
            reactions: {
              some: { type: 'LIKE' }
            }
          }
        })
        currentValue = likedComments
        targetValue = 50
        isCompleted = currentValue >= targetValue
        break

      case 'night_owl':
        // Check if user has posted between 12 AM and 5 AM
        const nightPosts = await this.db.post.count({
          where: {
            authorId: userId,
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lt: new Date(new Date().setHours(5, 0, 0, 0))
            }
          }
        })
        currentValue = nightPosts
        targetValue = 10
        isCompleted = currentValue >= targetValue
        break

      case 'streak_master':
        const streak = await this.getCurrentStreak(userId)
        currentValue = streak
        targetValue = 30
        isCompleted = currentValue >= targetValue
        break

      case 'level_titan':
        currentValue = context?.level || 0
        targetValue = 50
        isCompleted = currentValue >= targetValue
        break

      case 'sparkle_fan':
        // Check completion of Sparkle-themed challenges
        const sparkleQuests = await this.db.userQuest.count({
          where: {
            userId,
            quest: {
              code: { startsWith: 'sparkle_' }
            },
            status: 'COMPLETED'
          }
        })
        currentValue = sparkleQuests
        targetValue = 10
        isCompleted = currentValue >= targetValue
        break

      default:
        // Custom achievement logic
        if (achievement.criteria?.customCheck) {
          const result = await this.customAchievementCheck(
            userId, 
            achievement.id, 
            context
          )
          currentValue = result.current
          targetValue = result.target
          isCompleted = result.completed
        }
    }

    const percentage = targetValue > 0 
      ? Math.min(100, (currentValue / targetValue) * 100) 
      : 0

    return {
      achievementId: achievement.id,
      currentValue,
      targetValue,
      percentage,
      isCompleted,
    }
  }

  private async unlockAchievement(userId: string, achievement: any) {
    // Create user achievement record
    await this.db.userAchievement.create({
      data: {
        userId,
        achievementId: achievement.id,
        progress: {
          unlockedAt: new Date(),
          finalStats: {},
        }
      }
    })

    // Calculate XP reward based on rarity
    const rarityMultipliers: Record<string, number> = {
      common: 1,
      uncommon: 1.5,
      rare: 2,
      epic: 3,
      legendary: 5,
      mythic: 10,
    }

    const xpReward = Math.floor(
      achievement.xp * (rarityMultipliers[achievement.rarity] || 1)
    )

    // Award XP
    await this.awardXP(
      userId, 
      xpReward, 
      `Achievement unlocked: ${achievement.name}`
    )

    // Award sparkle points for rare achievements
    if (['epic', 'legendary', 'mythic'].includes(achievement.rarity)) {
      const sparklePoints = achievement.rarity === 'mythic' ? 1000 
        : achievement.rarity === 'legendary' ? 500 
        : 250

      await this.db.user.update({
        where: { id: userId },
        data: {
          sparklePoints: { increment: sparklePoints }
        }
      })
    }

    // Create notification
    await this.db.notification.create({
      data: {
        type: 'ACHIEVEMENT_UNLOCKED',
        userId,
        message: `Achievement Unlocked: ${achievement.name}!`,
        data: {
          achievementId: achievement.id,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          rarity: achievement.rarity,
          xpReward,
        }
      }
    })

    // Emit event
    this.emit('achievement:unlocked', {
      userId,
      achievement,
      xpReward,
    })

    // Update achievement leaderboard
    await this.updateAchievementLeaderboard(userId)
  }

  // Leaderboard System
  async getLeaderboard(
    type: 'xp' | 'posts' | 'followers' | 'achievements',
    timeframe: 'day' | 'week' | 'month' | 'all' = 'all',
    limit: number = 100
  ): Promise<{
    entries: any[]
    userRank?: number
    totalEntries: number
  }> {
    const cacheKey = `leaderboard:${type}:${timeframe}`
    
    // Try cache first
    const cached = await this.redis.get(cacheKey)
    if (cached && timeframe !== 'day') {
      return JSON.parse(cached)
    }

    const dateFilter = this.getDateFilter(timeframe)
    let entries: any[] = []

    switch (type) {
      case 'xp':
        entries = await this.getXPLeaderboard(dateFilter, limit)
        break
      case 'posts':
        entries = await this.getPostsLeaderboard(dateFilter, limit)
        break
      case 'followers':
        entries = await this.getFollowersLeaderboard(dateFilter, limit)
        break
      case 'achievements':
        entries = await this.getAchievementsLeaderboard(limit)
        break
    }

    // Add ranks
    entries = entries.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }))

    const result = {
      entries,
      totalEntries: entries.length,
    }

    // Cache for appropriate duration
    const ttl = timeframe === 'day' ? 300 // 5 minutes
      : timeframe === 'week' ? 3600 // 1 hour
      : timeframe === 'month' ? 7200 // 2 hours
      : 86400 // 24 hours

    await this.redis.setex(cacheKey, ttl, JSON.stringify(result))

    return result
  }

  private async getXPLeaderboard(dateFilter: Date | null, limit: number) {
    if (dateFilter) {
      // Get XP gained in timeframe
      const result = await this.db.$queryRaw<any[]>`
        SELECT 
          u.id,
          u.username,
          u.image,
          u.level,
          u.verified,
          COALESCE(SUM(x.amount), 0)::int as xp_gained
        FROM users u
        LEFT JOIN xp_logs x ON x."userId" = u.id
        WHERE x."createdAt" >= ${dateFilter}
        GROUP BY u.id
        ORDER BY xp_gained DESC
        LIMIT ${limit}
      `
      return result
    } else {
      // All-time XP leaderboard
      return this.db.user.findMany({
        select: {
          id: true,
          username: true,
          image: true,
          level: true,
          experience: true,
          verified: true,
        },
        orderBy: { experience: 'desc' },
        take: limit,
      })
    }
  }

  private async getPostsLeaderboard(dateFilter: Date | null, limit: number) {
    const where = dateFilter ? {
      createdAt: { gte: dateFilter }
    } : {}

    const result = await this.db.user.findMany({
      select: {
        id: true,
        username: true,
        image: true,
        level: true,
        verified: true,
        _count: {
          select: {
            posts: {
              where
            }
          }
        }
      },
      orderBy: {
        posts: {
          _count: 'desc'
        }
      },
      take: limit,
    })

    return result.map(user => ({
      ...user,
      postCount: user._count.posts,
      _count: undefined,
    }))
  }

  private async getFollowersLeaderboard(dateFilter: Date | null, limit: number) {
    if (dateFilter) {
      const result = await this.db.$queryRaw<any[]>`
        SELECT 
          u.id,
          u.username,
          u.image,
          u.level,
          u.verified,
          COUNT(f.id)::int as new_followers
        FROM users u
        LEFT JOIN follows f ON f."followingId" = u.id
        WHERE f."createdAt" >= ${dateFilter}
        GROUP BY u.id
        ORDER BY new_followers DESC
        LIMIT ${limit}
      `
      return result
    } else {
      const result = await this.db.user.findMany({
        select: {
          id: true,
          username: true,
          image: true,
          level: true,
          verified: true,
          _count: {
            select: { followers: true }
          }
        },
        orderBy: {
          followers: {
            _count: 'desc'
          }
        },
        take: limit,
      })

      return result.map(user => ({
        ...user,
        followerCount: user._count.followers,
        _count: undefined,
      }))
    }
  }

  private async getAchievementsLeaderboard(limit: number) {
    const result = await this.db.user.findMany({
      select: {
        id: true,
        username: true,
        image: true,
        level: true,
        verified: true,
        achievements: {
          include: {
            achievement: true
          }
        }
      },
      take: limit * 2, // Get more to filter
    })

    // Calculate achievement scores
    const scored = result.map(user => {
      const score = user.achievements.reduce((total, ua) => {
        const achievement = this.achievementCache.get(ua.achievementId)
        if (!achievement) return total

        const rarityScores: Record<string, number> = {
          common: 10,
          uncommon: 25,
          rare: 50,
          epic: 100,
          legendary: 250,
          mythic: 1000,
        }

        return total + (rarityScores[achievement.rarity] || 10)
      }, 0)

      return {
        id: user.id,
        username: user.username,
        image: user.image,
        level: user.level,
        verified: user.verified,
        achievementCount: user.achievements.length,
        achievementScore: score,
        rareAchievements: user.achievements.filter(ua => {
          const achievement = this.achievementCache.get(ua.achievementId)
          return achievement && ['epic', 'legendary', 'mythic'].includes(achievement.rarity)
        }).length,
      }
    })

    // Sort by score and return top entries
    return scored
      .sort((a, b) => b.achievementScore - a.achievementScore)
      .slice(0, limit)
  }

  // User Stats
  async getUserStats(userId: string): Promise<{
    level: number
    experience: number
    nextLevelXP: number
    progress: {
      current: number
      needed: number
      percentage: number
    }
    achievements: {
      total: number
      unlocked: number
      points: number
      byRarity: Record<string, number>
    }
    stats: {
      posts: number
      comments: number
      reactions: number
      followers: number
      following: number
    }
    ranks: {
      global: number
      xp: number
      achievements: number
    }
    streaks: {
      current: number
      longest: number
    }
    recentXP: Array<{
      amount: number
      reason: string
      createdAt: Date
    }>
  }> {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      include: {
        achievements: {
          include: {
            achievement: true,
          }
        },
        _count: {
          select: {
            posts: true,
            comments: true,
            reactions: true,
            followers: true,
            following: true,
          }
        }
      }
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Calculate level progress
    const nextLevelXP = this.getXPForLevel(user.level + 1)
    const currentLevelXP = this.getXPForLevel(user.level)
    const progressXP = user.experience - currentLevelXP
    const neededXP = nextLevelXP - currentLevelXP
    const percentage = (progressXP / neededXP) * 100

    // Calculate achievement stats
    const achievementStats = this.calculateAchievementStats(user.achievements)

    // Get ranks
    const ranks = await this.getUserRanks(userId)

    // Get streaks
    const streaks = await this.getUserStreaks(userId)

    // Get recent XP gains
    const recentXP = await this.db.xpLog.findMany({
      where: { userId },
      select: {
        amount: true,
        reason: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    return {
      level: user.level,
      experience: user.experience,
      nextLevelXP,
      progress: {
        current: progressXP,
        needed: neededXP,
        percentage,
      },
      achievements: achievementStats,
      stats: user._count,
      ranks,
      streaks,
      recentXP,
    }
  }

  private calculateAchievementStats(userAchievements: any[]) {
    const byRarity: Record<string, number> = {
      common: 0,
      uncommon: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
      mythic: 0,
    }

    let points = 0

    userAchievements.forEach(ua => {
      const achievement = this.achievementCache.get(ua.achievementId)
      if (achievement) {
        byRarity[achievement.rarity] = (byRarity[achievement.rarity] || 0) + 1
        
        const rarityPoints: Record<string, number> = {
          common: 10,
          uncommon: 25,
          rare: 50,
          epic: 100,
          legendary: 250,
          mythic: 1000,
        }
        
        points += rarityPoints[achievement.rarity] || 10
      }
    })

    return {
      total: achievements.length,
      unlocked: userAchievements.length,
      points,
      byRarity,
    }
  }

  private async getUserRanks(userId: string): Promise<any> {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: { experience: true }
    })

    if (!user) return { global: 0, xp: 0, achievements: 0 }

    const [xpRank, achievementRank] = await Promise.all([
      this.db.user.count({
        where: {
          experience: { gt: user.experience }
        }
      }),
      this.db.user.count({
        where: {
          achievements: {
            some: {}
          }
        }
      })
    ])

    return {
      global: xpRank + 1,
      xp: xpRank + 1,
      achievements: achievementRank + 1,
    }
  }

  // Daily Quests & Streaks
  async checkDailyQuests(userId: string): Promise<{
    completed: string[]
    rewards: { xp: number; sparklePoints: number }
  }> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Check if user has logged in today
    const loginToday = await this.db.xpLog.findFirst({
      where: {
        userId,
        reason: 'Daily login',
        createdAt: { gte: today }
      }
    })

    if (!loginToday) {
      // Award daily login XP
      await this.awardXP(userId, XP_CONFIG.DAILY_LOGIN, 'Daily login')
      
      // Check and update streak
      await this.updateLoginStreak(userId)
    }

    // Check other daily quests
    const completed: string[] = []
    let totalXP = 0
    let totalSparklePoints = 0

    // Post creation quest
    const postsToday = await this.db.post.count({
      where: {
        authorId: userId,
        createdAt: { gte: today }
      }
    })

    if (postsToday >= 1 && !completed.includes('daily_post')) {
      completed.push('daily_post')
      totalXP += 25
    }

    // Engagement quest
    const reactionsToday = await this.db.reaction.count({
      where: {
        userId,
        createdAt: { gte: today }
      }
    })

    if (reactionsToday >= 5 && !completed.includes('daily_reactions')) {
      completed.push('daily_reactions')
      totalXP += 15
    }

    // Award quest completion XP
    if (totalXP > 0) {
      await this.awardXP(userId, totalXP, 'Daily quest completion')
    }

    return {
      completed,
      rewards: {
        xp: totalXP,
        sparklePoints: totalSparklePoints,
      }
    }
  }

  private async updateLoginStreak(userId: string) {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)

    const yesterdayLogin = await this.db.xpLog.findFirst({
      where: {
        userId,
        reason: 'Daily login',
        createdAt: {
          gte: yesterday,
          lt: new Date(yesterday.getTime() + 86400000)
        }
      }
    })

    const streakKey = `streak:${userId}`
    const currentStreak = parseInt(await this.redis.get(streakKey) || '0')

    if (yesterdayLogin) {
      // Continue streak
      const newStreak = currentStreak + 1
      await this.redis.set(streakKey, newStreak.toString())
      
      // Award streak bonus
      const streakBonus = Math.min(newStreak * XP_CONFIG.STREAK_BONUS, 100)
      await this.awardXP(userId, streakBonus, `Login streak: ${newStreak} days`)

      // Check streak achievements
      await this.checkAchievements(userId, 'streak', { days: newStreak })
    } else {
      // Reset streak
      await this.redis.set(streakKey, '1')
    }
  }

  private async getCurrentStreak(userId: string): Promise<number> {
    const streakKey = `streak:${userId}`
    return parseInt(await this.redis.get(streakKey) || '0')
  }

  private async getUserStreaks(userId: string) {
    const current = await this.getCurrentStreak(userId)
    const longestKey = `streak:longest:${userId}`
    const longest = parseInt(await this.redis.get(longestKey) || '0')

    // Update longest if current is higher
    if (current > longest) {
      await this.redis.set(longestKey, current.toString())
      return { current, longest: current }
    }

    return { current, longest }
  }

  // Helper methods
  private getDateFilter(timeframe?: string): Date | null {
    if (!timeframe || timeframe === 'all') return null

    const now = new Date()
    switch (timeframe) {
      case 'day':
        now.setHours(0, 0, 0, 0)
        return now
      case 'week':
        now.setDate(now.getDate() - 7)
        return now
      case 'month':
        now.setMonth(now.getMonth() - 1)
        return now
      default:
        return null
    }
  }

  private async updateLeaderboardCache(userId: string, xp: number) {
    // Update sorted set in Redis for fast leaderboard queries
    await this.redis.zadd('leaderboard:xp:all', xp, userId)
  }

  private async updateAchievementLeaderboard(userId: string) {
    const userAchievements = await this.db.userAchievement.count({
      where: { userId }
    })
    
    await this.redis.zadd('leaderboard:achievements', userAchievements, userId)
  }

  private async customAchievementCheck(
    userId: string,
    achievementId: string,
    context?: any
  ): Promise<{ current: number; target: number; completed: boolean }> {
    // Implement custom achievement checks here
    return { current: 0, target: 1, completed: false }
  }

  // Public event emitter methods
  onXPAwarded(handler: (data: any) => void) {
    this.on('xp:awarded', handler)
  }

  onLevelUp(handler: (data: any) => void) {
    this.on('user:levelUp', handler)
  }

  onAchievementUnlocked(handler: (data: any) => void) {
    this.on('achievement:unlocked', handler)
  }
}

```

# Phase 5: src/config/achievements.ts
```ts
// src/config/achievements.ts
import { z } from 'zod'

// Achievement rarity enum
export const AchievementRarity = z.enum([
  'common',
  'uncommon', 
  'rare',
  'epic',
  'legendary',
  'mythic'
])

export type AchievementRarity = z.infer<typeof AchievementRarity>

// Achievement category enum
export const AchievementCategory = z.enum([
  'content',
  'social',
  'engagement',
  'special',
  'seasonal',
  'hidden'
])

export type AchievementCategory = z.infer<typeof AchievementCategory>

// Achievement interface
export interface Achievement {
  id: string
  code: string
  name: string
  description: string
  icon: string
  animatedIcon?: string
  xp: number
  sparklePoints?: number
  rarity: AchievementRarity
  category: AchievementCategory
  trigger: string
  criteria: Record<string, any>
  hidden?: boolean
  seasonal?: boolean
  expiresAt?: Date
  prerequisiteIds?: string[]
}

// Achievement definitions
export const achievements: Achievement[] = [
  // ===== CONTENT CREATION ACHIEVEMENTS =====
  {
    id: 'ach_first_post',
    code: 'FIRST_POST',
    name: 'First Steps',
    description: 'Create your first post in Sparkle Universe',
    icon: '✍️',
    animatedIcon: '✨✍️✨',
    xp: 50,
    rarity: 'common',
    category: 'content',
    trigger: 'post_created',
    criteria: { postCount: 1 }
  },
  {
    id: 'ach_prolific_writer',
    code: 'PROLIFIC_WRITER',
    name: 'Prolific Writer',
    description: 'Create 10 posts',
    icon: '📚',
    xp: 200,
    rarity: 'uncommon',
    category: 'content',
    trigger: 'post_created',
    criteria: { postCount: 10 }
  },
  {
    id: 'ach_content_creator',
    code: 'CONTENT_CREATOR',
    name: 'Content Creator',
    description: 'Create 50 posts',
    icon: '🎨',
    xp: 500,
    rarity: 'rare',
    category: 'content',
    trigger: 'post_created',
    criteria: { postCount: 50 }
  },
  {
    id: 'ach_viral_sensation',
    code: 'VIRAL_SENSATION',
    name: 'Viral Sensation',
    description: 'Get 1000 reactions on a single post',
    icon: '🔥',
    xp: 1000,
    sparklePoints: 100,
    rarity: 'epic',
    category: 'content',
    trigger: 'post_liked',
    criteria: { reactions: 1000 }
  },
  {
    id: 'ach_trending_master',
    code: 'TRENDING_MASTER',
    name: 'Trending Master',
    description: 'Have 3 posts trending simultaneously',
    icon: '📈',
    xp: 750,
    rarity: 'rare',
    category: 'content',
    trigger: 'post_trending',
    criteria: { trendingPosts: 3 }
  },
  {
    id: 'ach_featured_creator',
    code: 'FEATURED_CREATOR',
    name: 'Featured Creator',
    description: 'Get your post featured by admins',
    icon: '⭐',
    xp: 300,
    rarity: 'uncommon',
    category: 'content',
    trigger: 'post_featured',
    criteria: { featured: true }
  },

  // ===== SOCIAL ACHIEVEMENTS =====
  {
    id: 'ach_first_follower',
    code: 'FIRST_FOLLOWER',
    name: 'Making Friends',
    description: 'Get your first follower',
    icon: '🤝',
    xp: 30,
    rarity: 'common',
    category: 'social',
    trigger: 'user_followed',
    criteria: { followers: 1 }
  },
  {
    id: 'ach_social_butterfly',
    code: 'SOCIAL_BUTTERFLY',
    name: 'Social Butterfly',
    description: 'Reach 50 followers',
    icon: '🦋',
    xp: 300,
    rarity: 'uncommon',
    category: 'social',
    trigger: 'user_followed',
    criteria: { followers: 50 }
  },
  {
    id: 'ach_community_leader',
    code: 'COMMUNITY_LEADER',
    name: 'Community Leader',
    description: 'Reach 500 followers',
    icon: '👑',
    xp: 750,
    sparklePoints: 50,
    rarity: 'rare',
    category: 'social',
    trigger: 'user_followed',
    criteria: { followers: 500 }
  },
  {
    id: 'ach_influencer',
    code: 'INFLUENCER',
    name: 'Influencer',
    description: 'Reach 1000 followers',
    icon: '💫',
    xp: 1500,
    sparklePoints: 200,
    rarity: 'epic',
    category: 'social',
    trigger: 'user_followed',
    criteria: { followers: 1000 }
  },
  {
    id: 'ach_sparkle_star',
    code: 'SPARKLE_STAR',
    name: 'Sparkle Star',
    description: 'Reach 10,000 followers',
    icon: '🌟',
    xp: 5000,
    sparklePoints: 1000,
    rarity: 'legendary',
    category: 'social',
    trigger: 'user_followed',
    criteria: { followers: 10000 }
  },
  {
    id: 'ach_networker',
    code: 'NETWORKER',
    name: 'Networker',
    description: 'Follow 100 users',
    icon: '🔗',
    xp: 150,
    rarity: 'common',
    category: 'social',
    trigger: 'user_follow',
    criteria: { following: 100 }
  },

  // ===== ENGAGEMENT ACHIEVEMENTS =====
  {
    id: 'ach_conversationalist',
    code: 'CONVERSATIONALIST',
    name: 'Conversationalist',
    description: 'Leave 100 comments',
    icon: '💬',
    xp: 150,
    rarity: 'common',
    category: 'engagement',
    trigger: 'comment_created',
    criteria: { comments: 100 }
  },
  {
    id: 'ach_discussion_leader',
    code: 'DISCUSSION_LEADER',
    name: 'Discussion Leader',
    description: 'Start 50 comment threads that get 10+ replies',
    icon: '🗣️',
    xp: 400,
    rarity: 'uncommon',
    category: 'engagement',
    trigger: 'comment_thread',
    criteria: { popularThreads: 50 }
  },
  {
    id: 'ach_helpful_member',
    code: 'HELPFUL_MEMBER',
    name: 'Helpful Member',
    description: 'Receive 50 likes on your comments',
    icon: '🤲',
    xp: 200,
    rarity: 'uncommon',
    category: 'engagement',
    trigger: 'comment_liked',
    criteria: { commentLikes: 50 }
  },
  {
    id: 'ach_reaction_giver',
    code: 'REACTION_GIVER',
    name: 'Reaction Enthusiast',
    description: 'Give 500 reactions',
    icon: '😊',
    xp: 100,
    rarity: 'common',
    category: 'engagement',
    trigger: 'reaction_given',
    criteria: { reactionsGiven: 500 }
  },
  {
    id: 'ach_sparkle_supporter',
    code: 'SPARKLE_SUPPORTER',
    name: 'Sparkle Supporter',
    description: 'Use the Sparkle reaction 100 times',
    icon: '✨',
    xp: 250,
    rarity: 'uncommon',
    category: 'engagement',
    trigger: 'sparkle_reaction',
    criteria: { sparkleReactions: 100 }
  },

  // ===== SPECIAL ACHIEVEMENTS =====
  {
    id: 'ach_early_adopter',
    code: 'EARLY_ADOPTER',
    name: 'Early Adopter',
    description: 'Join during the first month of launch',
    icon: '🌅',
    xp: 500,
    sparklePoints: 100,
    rarity: 'legendary',
    category: 'special',
    trigger: 'user_created',
    criteria: { joinDate: 'first_month' }
  },
  {
    id: 'ach_verified_creator',
    code: 'VERIFIED_CREATOR',
    name: 'Verified Creator',
    description: 'Get your account verified',
    icon: '✓',
    xp: 1000,
    rarity: 'epic',
    category: 'special',
    trigger: 'user_verified',
    criteria: { verified: true }
  },
  {
    id: 'ach_youtube_connected',
    code: 'YOUTUBE_CONNECTED',
    name: 'YouTube Connected',
    description: 'Connect your YouTube channel',
    icon: '📺',
    xp: 100,
    rarity: 'common',
    category: 'special',
    trigger: 'youtube_connected',
    criteria: { youtubeConnected: true }
  },
  {
    id: 'ach_watch_party_host',
    code: 'WATCH_PARTY_HOST',
    name: 'Party Host',
    description: 'Host 10 watch parties',
    icon: '🎉',
    xp: 400,
    rarity: 'uncommon',
    category: 'special',
    trigger: 'watchparty_hosted',
    criteria: { watchPartiesHosted: 10 }
  },
  {
    id: 'ach_streak_master',
    code: 'STREAK_MASTER',
    name: 'Streak Master',
    description: 'Maintain a 30-day login streak',
    icon: '🔥',
    xp: 750,
    sparklePoints: 50,
    rarity: 'rare',
    category: 'special',
    trigger: 'streak',
    criteria: { streakDays: 30 }
  },
  {
    id: 'ach_dedication',
    code: 'DEDICATION',
    name: 'Dedication',
    description: 'Maintain a 100-day login streak',
    icon: '💎',
    xp: 2000,
    sparklePoints: 500,
    rarity: 'legendary',
    category: 'special',
    trigger: 'streak',
    criteria: { streakDays: 100 }
  },
  {
    id: 'ach_night_owl',
    code: 'NIGHT_OWL',
    name: 'Night Owl',
    description: 'Create 10 posts between midnight and 5 AM',
    icon: '🦉',
    xp: 200,
    rarity: 'uncommon',
    category: 'special',
    trigger: 'post_created',
    criteria: { nightPosts: 10 }
  },
  {
    id: 'ach_level_10',
    code: 'LEVEL_10',
    name: 'Rising Star',
    description: 'Reach level 10',
    icon: '🌟',
    xp: 100,
    rarity: 'common',
    category: 'special',
    trigger: 'level_up',
    criteria: { level: 10 }
  },
  {
    id: 'ach_level_25',
    code: 'LEVEL_25',
    name: 'Veteran',
    description: 'Reach level 25',
    icon: '🎖️',
    xp: 500,
    rarity: 'uncommon',
    category: 'special',
    trigger: 'level_up',
    criteria: { level: 25 }
  },
  {
    id: 'ach_level_50',
    code: 'LEVEL_50',
    name: 'Elite',
    description: 'Reach level 50',
    icon: '👑',
    xp: 1000,
    sparklePoints: 250,
    rarity: 'rare',
    category: 'special',
    trigger: 'level_up',
    criteria: { level: 50 }
  },
  {
    id: 'ach_level_100',
    code: 'LEVEL_100',
    name: 'Legendary',
    description: 'Reach level 100',
    icon: '🏆',
    xp: 5000,
    sparklePoints: 2000,
    rarity: 'mythic',
    category: 'special',
    trigger: 'level_up',
    criteria: { level: 100 }
  },

  // ===== SEASONAL ACHIEVEMENTS =====
  {
    id: 'ach_sparkle_anniversary',
    code: 'SPARKLE_ANNIVERSARY',
    name: 'Anniversary Celebration',
    description: 'Participate in Sparkle Universe anniversary event',
    icon: '🎂',
    xp: 1000,
    sparklePoints: 200,
    rarity: 'epic',
    category: 'seasonal',
    seasonal: true,
    trigger: 'event_participation',
    criteria: { event: 'anniversary' }
  },
  {
    id: 'ach_summer_sparkle',
    code: 'SUMMER_SPARKLE',
    name: 'Summer Sparkle',
    description: 'Complete all summer challenges',
    icon: '☀️',
    xp: 750,
    rarity: 'rare',
    category: 'seasonal',
    seasonal: true,
    trigger: 'seasonal_complete',
    criteria: { season: 'summer' }
  },

  // ===== HIDDEN ACHIEVEMENTS =====
  {
    id: 'ach_bug_hunter',
    code: 'BUG_HUNTER',
    name: 'Bug Hunter',
    description: 'Report a bug that gets fixed',
    icon: '🐛',
    xp: 500,
    rarity: 'rare',
    category: 'hidden',
    hidden: true,
    trigger: 'bug_reported',
    criteria: { bugFixed: true }
  },
  {
    id: 'ach_sparkle_superfan',
    code: 'SPARKLE_SUPERFAN',
    name: 'True Sparkle Fan',
    description: 'Complete all Sparkle-themed challenges and collect all Sparkle badges',
    icon: '✨',
    xp: 10000,
    sparklePoints: 5000,
    rarity: 'mythic',
    category: 'hidden',
    hidden: true,
    trigger: 'sparkle_completion',
    criteria: { 
      sparkleAchievements: 'all',
      sparkleChallenges: 'all'
    }
  },
  {
    id: 'ach_moderator_appreciation',
    code: 'MOD_APPRECIATION',
    name: 'Moderator\'s Choice',
    description: 'Receive special recognition from a moderator',
    icon: '🛡️',
    xp: 1000,
    rarity: 'epic',
    category: 'hidden',
    hidden: true,
    trigger: 'mod_recognition',
    criteria: { recognized: true }
  }
]

// Helper functions for achievement management
export function getAchievementById(id: string): Achievement | undefined {
  return achievements.find(a => a.id === id)
}

export function getAchievementByCode(code: string): Achievement | undefined {
  return achievements.find(a => a.code === code)
}

export function getAchievementsByCategory(category: AchievementCategory): Achievement[] {
  return achievements.filter(a => a.category === category)
}

export function getAchievementsByRarity(rarity: AchievementRarity): Achievement[] {
  return achievements.filter(a => a.rarity === rarity)
}

export function getVisibleAchievements(): Achievement[] {
  return achievements.filter(a => !a.hidden)
}

export function getSeasonalAchievements(): Achievement[] {
  return achievements.filter(a => a.seasonal)
}

export function getAchievementPoints(achievement: Achievement): number {
  const rarityMultipliers: Record<AchievementRarity, number> = {
    common: 1,
    uncommon: 1.5,
    rare: 2,
    epic: 3,
    legendary: 5,
    mythic: 10,
  }
  
  return Math.floor(achievement.xp * rarityMultipliers[achievement.rarity])
}

// Achievement group definitions for UI
export const achievementGroups = {
  beginner: [
    'ach_first_post',
    'ach_first_follower',
    'ach_conversationalist',
    'ach_reaction_giver',
    'ach_level_10'
  ],
  content: [
    'ach_prolific_writer',
    'ach_content_creator',
    'ach_viral_sensation',
    'ach_trending_master',
    'ach_featured_creator'
  ],
  social: [
    'ach_social_butterfly',
    'ach_community_leader',
    'ach_influencer',
    'ach_sparkle_star',
    'ach_networker'
  ],
  dedication: [
    'ach_streak_master',
    'ach_dedication',
    'ach_level_50',
    'ach_level_100'
  ]
}

```

# Phase 5: src/components/features/gamification/level-progress.tsx
```tsx
// src/components/features/gamification/level-progress.tsx
'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Progress } from '@/components/ui/progress'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Trophy, 
  TrendingUp, 
  Zap, 
  Star,
  Sparkles,
  Crown,
  Target,
  Award
} from 'lucide-react'
import { api } from '@/lib/api'
import { formatNumber } from '@/lib/utils'
import { cn } from '@/lib/utils'
import confetti from 'canvas-confetti'

interface LevelProgressProps {
  userId: string
  showDetails?: boolean
  compact?: boolean
  showAnimations?: boolean
  className?: string
}

interface LevelUpAnimation {
  show: boolean
  oldLevel: number
  newLevel: number
}

export function LevelProgress({ 
  userId, 
  showDetails = true,
  compact = false,
  showAnimations = true,
  className
}: LevelProgressProps) {
  const [levelUpAnimation, setLevelUpAnimation] = useState<LevelUpAnimation>({
    show: false,
    oldLevel: 0,
    newLevel: 0,
  })

  const { data: stats, isLoading, refetch } = api.gamification.getUserStats.useQuery(
    { userId },
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  )

  // Subscribe to real-time level up events
  useEffect(() => {
    if (!showAnimations) return

    const handleLevelUp = (data: any) => {
      if (data.userId === userId) {
        setLevelUpAnimation({
          show: true,
          oldLevel: data.oldLevel,
          newLevel: data.newLevel,
        })

        // Trigger confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b'],
        })

        // Refetch stats
        refetch()

        // Hide animation after 3 seconds
        setTimeout(() => {
          setLevelUpAnimation(prev => ({ ...prev, show: false }))
        }, 3000)
      }
    }

    // Subscribe to WebSocket events
    // socket.on('user:levelUp', handleLevelUp)

    return () => {
      // socket.off('user:levelUp', handleLevelUp)
    }
  }, [userId, showAnimations, refetch])

  if (isLoading || !stats) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <div className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-1/3 mb-2" />
            <div className="h-8 bg-muted rounded mb-2" />
            <div className="h-2 bg-muted rounded" />
          </div>
        </div>
      </Card>
    )
  }

  const getLevelIcon = (level: number) => {
    if (level >= 100) return <Crown className="w-5 h-5" />
    if (level >= 50) return <Trophy className="w-5 h-5" />
    if (level >= 25) return <Star className="w-5 h-5" />
    if (level >= 10) return <Zap className="w-5 h-5" />
    return <Sparkles className="w-5 h-5" />
  }

  const getLevelColor = (level: number) => {
    if (level >= 100) return 'from-yellow-400 to-orange-500'
    if (level >= 50) return 'from-purple-400 to-pink-500'
    if (level >= 25) return 'from-blue-400 to-indigo-500'
    if (level >= 10) return 'from-green-400 to-emerald-500'
    return 'from-gray-400 to-gray-600'
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { text: '🥇 #1', color: 'bg-yellow-500' }
    if (rank === 2) return { text: '🥈 #2', color: 'bg-gray-400' }
    if (rank === 3) return { text: '🥉 #3', color: 'bg-orange-600' }
    if (rank <= 10) return { text: `Top 10`, color: 'bg-purple-500' }
    if (rank <= 100) return { text: `Top 100`, color: 'bg-blue-500' }
    return null
  }

  if (compact) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div className={cn(
          "relative w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold shadow-lg",
          getLevelColor(stats.level)
        )}>
          {stats.level}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Level {stats.level}</span>
            {stats.ranks.global <= 100 && (
              <Badge variant="secondary" className="text-xs">
                Rank #{stats.ranks.global}
              </Badge>
            )}
          </div>
          <Progress 
            value={stats.progress.percentage} 
            className="h-1.5 mt-1"
          />
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">
            {formatNumber(stats.experience)} XP
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Card className={cn("overflow-hidden", className)}>
        <div className="p-6 space-y-4">
          {/* Level and XP Display */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                className={cn(
                  "relative w-16 h-16 rounded-full bg-gradient-to-br flex items-center justify-center text-white shadow-xl",
                  getLevelColor(stats.level)
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse" />
                <span className="relative text-2xl font-bold">{stats.level}</span>
                <div className="absolute -bottom-1 -right-1 text-yellow-400">
                  {getLevelIcon(stats.level)}
                </div>
              </motion.div>
              
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  Level {stats.level}
                  {stats.level >= 50 && (
                    <Badge variant="outline" className="text-xs">
                      Elite
                    </Badge>
                  )}
                </h3>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>Rank #{stats.ranks.global}</span>
                  {getRankBadge(stats.ranks.global) && (
                    <Badge 
                      className={cn(
                        "text-xs text-white",
                        getRankBadge(stats.ranks.global)!.color
                      )}
                    >
                      {getRankBadge(stats.ranks.global)!.text}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {showDetails && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total XP</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-sparkle-500 to-sparkle-700 bg-clip-text text-transparent">
                  {formatNumber(stats.experience)}
                </p>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Progress to Level {stats.level + 1}
              </span>
              <span className="font-medium">
                {formatNumber(stats.progress.current)} / {formatNumber(stats.progress.needed)} XP
              </span>
            </div>
            <div className="relative">
              <Progress 
                value={stats.progress.percentage} 
                className="h-3"
              />
              {showAnimations && stats.progress.percentage > 0 && (
                <motion.div
                  className="absolute top-0 left-0 h-full bg-white/30 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.progress.percentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              )}
            </div>
            <p className="text-xs text-center text-muted-foreground">
              {stats.progress.percentage.toFixed(1)}% Complete
            </p>
          </div>

          {/* Stats Grid */}
          {showDetails && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <motion.div 
                  className="text-center p-3 bg-muted/50 rounded-lg"
                  whileHover={{ scale: 1.02 }}
                >
                  <Award className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
                  <p className="text-2xl font-bold">{stats.achievements.unlocked}</p>
                  <p className="text-xs text-muted-foreground">Achievements</p>
                </motion.div>
                <motion.div 
                  className="text-center p-3 bg-muted/50 rounded-lg"
                  whileHover={{ scale: 1.02 }}
                >
                  <Target className="w-5 h-5 mx-auto mb-1 text-green-500" />
                  <p className="text-2xl font-bold">{stats.streaks.current}</p>
                  <p className="text-xs text-muted-foreground">Day Streak</p>
                </motion.div>
              </div>

              {/* Recent XP Gains */}
              {stats.recentXP.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Recent Activity
                  </h4>
                  <div className="space-y-1">
                    {stats.recentXP.slice(0, 3).map((xp, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="text-muted-foreground truncate flex-1">
                          {xp.reason}
                        </span>
                        <span className="font-medium text-green-500">
                          +{xp.amount} XP
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Next Milestone */}
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Next Milestone</span>
                  <span className="font-medium">
                    Level {Math.ceil(stats.level / 10) * 10}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Level Up Animation */}
      <AnimatePresence>
        {levelUpAnimation.show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              className="bg-background/95 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border-2 border-yellow-500"
              animate={{
                boxShadow: [
                  "0 0 0 0 rgba(250, 204, 21, 0.4)",
                  "0 0 0 20px rgba(250, 204, 21, 0)",
                ],
              }}
              transition={{
                duration: 1,
                repeat: 3,
              }}
            >
              <div className="text-center space-y-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1 }}
                >
                  <Trophy className="w-20 h-20 mx-auto text-yellow-500" />
                </motion.div>
                <div>
                  <h2 className="text-3xl font-bold">Level Up!</h2>
                  <p className="text-xl text-muted-foreground mt-2">
                    Level {levelUpAnimation.oldLevel} → {levelUpAnimation.newLevel}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

```

# Phase 5: src/components/features/gamification/achievement-grid.tsx
```tsx
// src/components/features/gamification/achievement-grid.tsx
'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Lock, 
  Trophy, 
  Star,
  Search,
  Filter,
  Award,
  Zap,
  Sparkles,
  Eye,
  EyeOff,
  CheckCircle2
} from 'lucide-react'
import { api } from '@/lib/api'
import { achievements, getAchievementsByCategory, AchievementCategory } from '@/config/achievements'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/lib/utils'
import { AchievementDetailsModal } from './achievement-details-modal'

interface AchievementGridProps {
  userId: string
  showHidden?: boolean
  onAchievementClick?: (achievementId: string) => void
}

type SortOption = 'name' | 'rarity' | 'xp' | 'progress' | 'unlocked'
type FilterRarity = 'all' | 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic'

export function AchievementGrid({ 
  userId, 
  showHidden = false,
  onAchievementClick 
}: AchievementGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('rarity')
  const [filterRarity, setFilterRarity] = useState<FilterRarity>('all')
  const [showOnlyUnlocked, setShowOnlyUnlocked] = useState(false)
  const [selectedAchievement, setSelectedAchievement] = useState<string | null>(null)
  
  const { data: userAchievements = [], isLoading } = api.gamification.getUserAchievements.useQuery({ 
    userId,
    includeProgress: true,
  })
  
  const { data: achievementProgress = {} } = api.gamification.getAchievementProgress.useQuery({ 
    userId 
  })
  
  const unlockedIds = new Set(userAchievements.map(a => a.achievementId))
  
  // Filter and sort achievements
  const filteredAchievements = useMemo(() => {
    let filtered = achievements.filter(achievement => {
      // Category filter
      if (selectedCategory !== 'all' && achievement.category !== selectedCategory) {
        return false
      }
      
      // Hidden filter
      if (!showHidden && achievement.hidden) {
        return false
      }
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          achievement.name.toLowerCase().includes(query) ||
          achievement.description.toLowerCase().includes(query)
        )
      }
      
      // Rarity filter
      if (filterRarity !== 'all' && achievement.rarity !== filterRarity) {
        return false
      }
      
      // Unlocked filter
      if (showOnlyUnlocked && !unlockedIds.has(achievement.id)) {
        return false
      }
      
      return true
    })

    // Sort achievements
    filtered.sort((a, b) => {
      const aUnlocked = unlockedIds.has(a.id)
      const bUnlocked = unlockedIds.has(b.id)
      const aProgress = achievementProgress[a.id] || { percentage: 0 }
      const bProgress = achievementProgress[b.id] || { percentage: 0 }

      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'rarity':
          const rarityOrder = ['mythic', 'legendary', 'epic', 'rare', 'uncommon', 'common']
          return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity)
        case 'xp':
          return b.xp - a.xp
        case 'progress':
          return bProgress.percentage - aProgress.percentage
        case 'unlocked':
          if (aUnlocked === bUnlocked) return 0
          return aUnlocked ? -1 : 1
        default:
          return 0
      }
    })

    return filtered
  }, [selectedCategory, showHidden, searchQuery, filterRarity, showOnlyUnlocked, sortBy, unlockedIds, achievementProgress])

  const getRarityColor = (rarity: string) => {
    const colors = {
      common: 'from-gray-400 to-gray-600',
      uncommon: 'from-green-400 to-green-600',
      rare: 'from-blue-400 to-blue-600',
      epic: 'from-purple-400 to-purple-600',
      legendary: 'from-yellow-400 to-orange-500',
      mythic: 'from-pink-400 via-purple-400 to-indigo-400',
    }
    return colors[rarity as keyof typeof colors] || colors.common
  }

  const getRarityBadgeColor = (rarity: string) => {
    const colors = {
      common: 'bg-gray-500',
      uncommon: 'bg-green-500',
      rare: 'bg-blue-500',
      epic: 'bg-purple-500',
      legendary: 'bg-yellow-500',
      mythic: 'bg-gradient-to-r from-pink-500 to-purple-500',
    }
    return colors[rarity as keyof typeof colors] || colors.common
  }

  const categories: Array<{ value: AchievementCategory | 'all'; label: string; icon: any }> = [
    { value: 'all', label: 'All', icon: Trophy },
    { value: 'content', label: 'Content', icon: Award },
    { value: 'social', label: 'Social', icon: Star },
    { value: 'engagement', label: 'Engagement', icon: Zap },
    { value: 'special', label: 'Special', icon: Sparkles },
  ]

  // Calculate stats
  const stats = useMemo(() => {
    const total = filteredAchievements.length
    const unlocked = filteredAchievements.filter(a => unlockedIds.has(a.id)).length
    const totalXP = filteredAchievements.reduce((sum, a) => {
      return sum + (unlockedIds.has(a.id) ? a.xp : 0)
    }, 0)
    const totalPossibleXP = filteredAchievements.reduce((sum, a) => sum + a.xp, 0)

    return {
      total,
      unlocked,
      percentage: total > 0 ? (unlocked / total) * 100 : 0,
      totalXP,
      totalPossibleXP,
    }
  }, [filteredAchievements, unlockedIds])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Achievements
            </h2>
            <p className="text-muted-foreground">
              Unlock achievements and earn rewards
            </p>
          </div>
          <Card className="px-4 py-2">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.unlocked}</p>
                <p className="text-xs text-muted-foreground">Unlocked</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="text-2xl font-bold">{formatNumber(stats.totalXP)}</p>
                <p className="text-xs text-muted-foreground">XP Earned</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span className="font-medium">{stats.percentage.toFixed(1)}%</span>
          </div>
          <Progress value={stats.percentage} className="h-2" />
        </div>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search achievements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rarity">Rarity</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="xp">XP Value</SelectItem>
              <SelectItem value="progress">Progress</SelectItem>
              <SelectItem value="unlocked">Unlocked</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterRarity} onValueChange={(value) => setFilterRarity(value as FilterRarity)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter rarity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rarities</SelectItem>
              <SelectItem value="common">Common</SelectItem>
              <SelectItem value="uncommon">Uncommon</SelectItem>
              <SelectItem value="rare">Rare</SelectItem>
              <SelectItem value="epic">Epic</SelectItem>
              <SelectItem value="legendary">Legendary</SelectItem>
              <SelectItem value="mythic">Mythic</SelectItem>
            </SelectContent>
          </Select>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showOnlyUnlocked ? "default" : "outline"}
                  size="icon"
                  onClick={() => setShowOnlyUnlocked(!showOnlyUnlocked)}
                >
                  {showOnlyUnlocked ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {showOnlyUnlocked ? 'Show all' : 'Show only unlocked'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Category tabs */}
        <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as any)}>
          <TabsList className="grid grid-cols-5 w-full">
            {categories.map(category => (
              <TabsTrigger key={category.value} value={category.value} className="flex items-center gap-1">
                <category.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{category.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Achievement grid */}
      <AnimatePresence mode="popLayout">
        {filteredAchievements.length === 0 ? (
          <Card className="p-8 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No achievements found</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAchievements.map((achievement, index) => {
              const isUnlocked = unlockedIds.has(achievement.id)
              const userAchievement = userAchievements.find(
                ua => ua.achievementId === achievement.id
              )
              const progress = achievementProgress[achievement.id] || {
                currentValue: 0,
                targetValue: 1,
                percentage: 0,
              }

              return (
                <motion.div
                  key={achievement.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                  onClick={() => {
                    setSelectedAchievement(achievement.id)
                    onAchievementClick?.(achievement.id)
                  }}
                >
                  <Card
                    className={cn(
                      "relative overflow-hidden cursor-pointer transition-all",
                      isUnlocked
                        ? 'bg-gradient-to-br from-background via-background to-background border-2'
                        : 'opacity-75 hover:opacity-100',
                      isUnlocked && `border-gradient-to-r ${getRarityColor(achievement.rarity)}`
                    )}
                  >
                    {/* Unlocked shimmer effect */}
                    {isUnlocked && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
                    )}

                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Achievement icon */}
                        <motion.div
                          className={cn(
                            "relative w-14 h-14 rounded-full flex items-center justify-center text-2xl shrink-0",
                            isUnlocked
                              ? `bg-gradient-to-br ${getRarityColor(achievement.rarity)} text-white shadow-lg`
                              : 'bg-muted'
                          )}
                          animate={isUnlocked ? { rotate: [0, 5, -5, 0] } : {}}
                          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 5 }}
                        >
                          {isUnlocked ? (
                            <>
                              <span className="relative z-10">{achievement.icon}</span>
                              {achievement.rarity === 'mythic' && (
                                <div className="absolute inset-0 rounded-full animate-pulse bg-white/20" />
                              )}
                            </>
                          ) : (
                            <Lock className="w-6 h-6 text-muted-foreground" />
                          )}
                          
                          {/* Unlocked checkmark */}
                          {isUnlocked && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                              <CheckCircle2 className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </motion.div>
                        
                        {/* Achievement details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-semibold text-sm line-clamp-1">
                              {achievement.name}
                            </h3>
                            <Badge 
                              variant="secondary" 
                              className={cn(
                                'text-xs text-white shrink-0',
                                getRarityBadgeColor(achievement.rarity)
                              )}
                            >
                              {achievement.rarity}
                            </Badge>
                          </div>
                          
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {achievement.description}
                          </p>

                          {/* Progress bar for locked achievements */}
                          {!isUnlocked && progress.percentage > 0 && (
                            <div className="space-y-1 mb-2">
                              <Progress value={progress.percentage} className="h-1.5" />
                              <p className="text-xs text-muted-foreground text-center">
                                {progress.currentValue} / {progress.targetValue}
                              </p>
                            </div>
                          )}
                          
                          {/* Rewards and unlock date */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-500" />
                                {achievement.xp} XP
                              </span>
                              {achievement.sparklePoints && (
                                <span className="text-xs font-medium flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-purple-500" />
                                  {achievement.sparklePoints}
                                </span>
                              )}
                            </div>
                            
                            {isUnlocked && userAchievement && (
                              <span className="text-xs text-muted-foreground">
                                {new Date(userAchievement.unlockedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Achievement details modal */}
      {selectedAchievement && (
        <AchievementDetailsModal
          achievementId={selectedAchievement}
          isUnlocked={unlockedIds.has(selectedAchievement)}
          progress={achievementProgress[selectedAchievement]}
          onClose={() => setSelectedAchievement(null)}
        />
      )}
    </div>
  )
}

```

