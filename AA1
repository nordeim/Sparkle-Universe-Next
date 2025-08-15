// src/server/services/gamification.service.ts
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
