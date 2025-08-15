// src/server/services/gamification.service.ts
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
