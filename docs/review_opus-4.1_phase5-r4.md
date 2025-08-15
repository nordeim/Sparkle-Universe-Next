## 🔬 Phase 5 Implementation Analysis

After meticulous review of the Phase 5 codebase against the README and PRD documents, I've identified critical alignment issues and opportunities for improvement.

### 📊 Key Findings

#### 1. **Gamification Service Conflicts**
- **Phase 4**: Uses correct sqrt level formula from README, Int-based points
- **Phase 5**: Uses exponential formula (incorrect), loads achievements from config
- **Schema Alignment**: Both reference correct models but Phase 5 missing currency precision

#### 2. **Achievement System**
- ✅ **Phase 5 Strength**: Comprehensive achievement config with 40+ achievements
- ❌ **Issue**: Not syncing with database Achievement model
- ❌ **Missing**: Badge rarity alignment with schema's 8-tier system

#### 3. **Component Implementation**
- ✅ Good UI components with animations
- ❌ Missing integration with schema models
- ❌ No real-time WebSocket integration despite schema having WebsocketSession

### 🎯 Creating Enhanced Phase 5 Implementation

## 📄 Complete Enhanced Phase 5 Files

### 1. Merged & Enhanced `src/server/services/gamification.service.ts`

```typescript
// src/server/services/gamification.service.ts
import { 
  PrismaClient, 
  Prisma, 
  BadgeRarity, 
  QuestType, 
  QuestStatus,
  NotificationType,
  AuditAction
} from '@prisma/client'
import { Redis } from 'ioredis'
import { EventEmitter } from 'events'
import Decimal from 'decimal.js'
import { NotificationService } from './notification.service'
import { CacheService, CacheType } from './cache.service'
import { ActivityService } from './activity.service'
import { achievements, Achievement, AchievementRarity } from '@/config/achievements'

// XP Configuration - Merged from both phases
export const XP_REWARDS = {
  // Content creation
  POST_CREATE: 10,
  POST_FEATURED: 100,
  POST_VIRAL: 500,
  QUALITY_POST_BONUS: 50,
  
  // Comments
  COMMENT_CREATE: 5,
  COMMENT_LIKED: 5,
  HELPFUL_COMMENT: 20,
  
  // Reactions
  REACTION_GIVEN: 1,
  REACTION_RECEIVED: 2,
  
  // Social
  FOLLOW: 3,
  FOLLOWED: 5,
  
  // Daily activities
  DAILY_LOGIN: 10,
  FIRST_POST_OF_DAY: 15,
  STREAK_BONUS: 5, // Per day
  
  // Achievements
  ACHIEVEMENT_UNLOCK: 25,
  QUEST_COMPLETE: 30,
  LEVEL_UP: 100,
} as const

// Achievement progress tracking
interface AchievementProgress {
  achievementId: string
  currentValue: number
  targetValue: number
  percentage: number
  isCompleted: boolean
}

// Leaderboard entry
interface LeaderboardEntry {
  rank: number
  user: {
    id: string
    username: string
    image?: string | null
    level: number
    verified: boolean
  }
  score: number
}

export class GamificationService extends EventEmitter {
  private redis: Redis
  private notificationService: NotificationService
  private cacheService: CacheService
  private activityService: ActivityService
  private achievementCache: Map<string, Achievement> = new Map()

  constructor(private db: PrismaClient) {
    super()
    this.redis = new Redis(process.env.REDIS_URL!)
    this.notificationService = new NotificationService(db)
    this.cacheService = new CacheService()
    this.activityService = new ActivityService(db)
    this.loadAchievements()
  }

  private async loadAchievements() {
    // Load achievements from config and sync with database
    for (const achievement of achievements) {
      this.achievementCache.set(achievement.id, achievement)
      
      // Sync with database
      await this.syncAchievementToDatabase(achievement)
    }
  }

  private async syncAchievementToDatabase(achievement: Achievement) {
    // Map config rarity to schema BadgeRarity enum
    const rarityMap: Record<AchievementRarity, BadgeRarity> = {
      'common': BadgeRarity.COMMON,
      'uncommon': BadgeRarity.UNCOMMON,
      'rare': BadgeRarity.RARE,
      'epic': BadgeRarity.EPIC,
      'legendary': BadgeRarity.LEGENDARY,
      'mythic': BadgeRarity.MYTHIC,
    }

    await this.db.achievement.upsert({
      where: { code: achievement.code },
      create: {
        code: achievement.code,
        name: achievement.name,
        description: achievement.description || '',
        icon: achievement.icon,
        animatedIcon: achievement.animatedIcon,
        xpReward: achievement.xp,
        sparklePointsReward: achievement.sparklePoints || 0,
        premiumPointsReward: 0,
        rarity: rarityMap[achievement.rarity],
        category: achievement.category,
        criteria: achievement.criteria,
        progressSteps: achievement.criteria?.steps || 1,
        isSecret: achievement.hidden || false,
        seasonal: achievement.seasonal || false,
        expiresAt: achievement.expiresAt,
        prerequisiteIds: achievement.prerequisiteIds || [],
      },
      update: {
        name: achievement.name,
        description: achievement.description || '',
        icon: achievement.icon,
        xpReward: achievement.xp,
        sparklePointsReward: achievement.sparklePoints || 0,
      },
    })
  }

  // ===== XP Management =====

  async awardXP(
    userId: string,
    amount: number,
    source: keyof typeof XP_REWARDS | string,
    sourceId?: string,
    reason?: string
  ): Promise<{
    totalXP: number
    xpGained: number
    oldLevel: number
    newLevel: number
    leveledUp: boolean
    nextLevelXP: number
    progressToNextLevel: number
  }> {
    // Start transaction for atomic operations
    const result = await this.db.$transaction(async (tx) => {
      // Get current user
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { 
          id: true,
          experience: true, 
          level: true,
          username: true,
        },
      })

      if (!user) throw new Error('User not found')

      const oldLevel = user.level
      const newXP = user.experience + amount
      const newLevel = this.calculateLevel(newXP)
      const leveledUp = newLevel > oldLevel

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
          metadata: {},
        },
      })

      // Update user stats
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

      // Handle level up
      if (leveledUp) {
        await this.handleLevelUp(tx, userId, oldLevel, newLevel)
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: AuditAction.UPDATE,
          entityType: 'xp',
          entityId: userId,
          entityData: { oldXP: user.experience, newXP, amount },
          reason: `XP awarded: ${reason}`,
        },
      })

      return {
        user: updatedUser,
        oldLevel,
        newLevel,
        leveledUp,
      }
    })

    // Calculate next level requirements
    const nextLevelXP = this.calculateXPForLevel(result.newLevel + 1)
    const currentLevelXP = this.calculateXPForLevel(result.newLevel)
    const progressToNextLevel = 
      ((result.user.experience - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100

    // Update leaderboards
    await this.updateLeaderboards(userId, result.user.experience)

    // Emit events
    this.emit('xp:awarded', {
      userId,
      amount,
      reason,
      totalXP: result.user.experience,
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

    return {
      totalXP: result.user.experience,
      xpGained: amount,
      oldLevel: result.oldLevel,
      newLevel: result.newLevel,
      leveledUp: result.leveledUp,
      nextLevelXP,
      progressToNextLevel,
    }
  }

  // Use the README's level calculation formula
  calculateLevel(xp: number): number {
    // Progressive level calculation from README
    return Math.floor(Math.sqrt(xp / 100)) + 1
  }

  calculateXPForLevel(level: number): number {
    // Reverse calculation: how much XP needed for a specific level
    if (level <= 1) return 0
    return Math.pow(level - 1, 2) * 100
  }

  private async handleLevelUp(
    tx: Prisma.TransactionClient,
    userId: string,
    oldLevel: number,
    newLevel: number
  ) {
    // Get level configurations for all levels between old and new
    for (let level = oldLevel + 1; level <= newLevel; level++) {
      const levelConfig = await tx.levelConfig.findUnique({
        where: { level },
      })

      if (levelConfig) {
        // Award level rewards (using Int for points as per schema)
        if (levelConfig.sparkleReward > 0) {
          await this.awardSparklePointsTransaction(
            tx, 
            userId, 
            levelConfig.sparkleReward, 
            'level_up',
            level.toString()
          )
        }

        if (levelConfig.premiumReward > 0) {
          await this.awardPremiumPointsTransaction(
            tx, 
            userId, 
            levelConfig.premiumReward, 
            'level_up',
            level.toString()
          )
        }
      }
    }

    // Award bonus XP for leveling up
    await tx.xpLog.create({
      data: {
        userId,
        amount: XP_REWARDS.LEVEL_UP * (newLevel - oldLevel),
        source: 'level_up',
        reason: `Level up bonus (${oldLevel} → ${newLevel})`,
        bonusXp: XP_REWARDS.LEVEL_UP * (newLevel - oldLevel),
        totalXp: 0, // Will be recalculated
      },
    })

    // Create notification
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
      },
    })
  }

  // ===== Currency Management =====

  async awardSparklePoints(
    userId: string,
    amount: number, // Int type as per schema
    source: string,
    sourceId?: string
  ): Promise<number> {
    return this.db.$transaction(async (tx) => {
      return this.awardSparklePointsTransaction(tx, userId, amount, source, sourceId)
    })
  }

  private async awardSparklePointsTransaction(
    tx: Prisma.TransactionClient,
    userId: string,
    amount: number,
    source: string,
    sourceId?: string
  ): Promise<number> {
    // Ensure amount is integer
    const intAmount = Math.floor(amount)

    // Update user balance
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        sparklePoints: { increment: intAmount },
        version: { increment: 1 },
      },
      select: { sparklePoints: true },
    })

    // Update balance tracking
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

    // Update activity
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
    userId: string,
    amount: number,
    source: string,
    sourceId?: string
  ): Promise<number> {
    return this.db.$transaction(async (tx) => {
      return this.awardPremiumPointsTransaction(tx, userId, amount, source, sourceId)
    })
  }

  private async awardPremiumPointsTransaction(
    tx: Prisma.TransactionClient,
    userId: string,
    amount: number,
    source: string,
    sourceId?: string
  ): Promise<number> {
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

  async spendPoints(
    userId: string,
    amount: number,
    currencyType: 'sparkle' | 'premium',
    reason: string,
    targetId?: string
  ): Promise<boolean> {
    const intAmount = Math.floor(amount)

    return this.db.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { 
          sparklePoints: true, 
          premiumPoints: true 
        },
      })

      if (!user) return false

      const currentBalance = currencyType === 'sparkle' 
        ? user.sparklePoints 
        : user.premiumPoints

      if (currentBalance < intAmount) {
        return false // Insufficient balance
      }

      // Deduct points
      const updateData = currencyType === 'sparkle'
        ? { sparklePoints: { decrement: intAmount } }
        : { premiumPoints: { decrement: intAmount } }

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          ...updateData,
          version: { increment: 1 },
        },
        select: { sparklePoints: true, premiumPoints: true },
      })

      const newBalance = currencyType === 'sparkle'
        ? updatedUser.sparklePoints
        : updatedUser.premiumPoints

      // Update balance tracking
      const balanceUpdate = currencyType === 'sparkle'
        ? { sparklePoints: { decrement: intAmount } }
        : { premiumPoints: { decrement: intAmount } }

      await tx.userBalance.update({
        where: { userId },
        data: {
          ...balanceUpdate,
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
          currencyType,
          transactionType: 'spend',
          source: reason,
          sourceId: targetId,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
        },
      })

      return true
    })
  }

  // ===== Achievement System =====

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

    // Get user's current achievements from database
    const userAchievements = await this.db.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true, progress: true }
    })

    const unlockedMap = new Map(
      userAchievements.map(ua => [ua.achievementId, ua.progress])
    )

    // Get database achievements
    const dbAchievements = await this.db.achievement.findMany({
      where: { deleted: false }
    })

    // Check each achievement
    for (const dbAchievement of dbAchievements) {
      // Skip if already fully unlocked
      if (unlockedMap.get(dbAchievement.id) >= 1) continue

      // Get config achievement for trigger check
      const configAchievement = Array.from(this.achievementCache.values()).find(
        a => a.code === dbAchievement.code
      )

      if (configAchievement && configAchievement.trigger === trigger) {
        const progress = await this.checkAchievementProgress(
          userId,
          dbAchievement,
          configAchievement,
          context
        )

        progressUpdates.push(progress)

        if (progress.isCompleted && !unlockedMap.has(dbAchievement.id)) {
          await this.unlockAchievement(userId, dbAchievement.id)
          unlockedAchievements.push(dbAchievement.id)
        } else if (progress.percentage > 0) {
          // Update progress
          await this.db.userAchievement.upsert({
            where: {
              userId_achievementId: {
                userId,
                achievementId: dbAchievement.id,
              },
            },
            create: {
              userId,
              achievementId: dbAchievement.id,
              progress: progress.percentage / 100,
              progressData: {
                current: progress.currentValue,
                target: progress.targetValue,
              },
            },
            update: {
              progress: progress.percentage / 100,
              progressData: {
                current: progress.currentValue,
                target: progress.targetValue,
              },
            },
          })
        }
      }
    }

    return {
      unlocked: unlockedAchievements,
      progress: progressUpdates,
    }
  }

  private async checkAchievementProgress(
    userId: string,
    dbAchievement: any,
    configAchievement: Achievement,
    context?: any
  ): Promise<AchievementProgress> {
    let currentValue = 0
    let targetValue = 1
    let isCompleted = false

    // Use criteria from database or config
    const criteria = dbAchievement.criteria || configAchievement.criteria

    // Check based on achievement code
    switch (configAchievement.code) {
      case 'FIRST_POST':
        currentValue = await this.db.post.count({ 
          where: { 
            authorId: userId,
            deleted: false,
          } 
        })
        targetValue = 1
        isCompleted = currentValue >= targetValue
        break

      case 'PROLIFIC_WRITER':
        currentValue = await this.db.post.count({ 
          where: { 
            authorId: userId,
            deleted: false,
            published: true,
          } 
        })
        targetValue = criteria?.postCount || 10
        isCompleted = currentValue >= targetValue
        break

      case 'VIRAL_SENSATION':
        const viralPost = await this.db.post.findFirst({
          where: {
            authorId: userId,
            deleted: false,
            reactions: {
              _count: {
                gte: criteria?.reactions || 1000
              }
            }
          }
        })
        currentValue = viralPost ? 1 : 0
        targetValue = 1
        isCompleted = !!viralPost
        break

      case 'LEVEL_10':
      case 'LEVEL_25':
      case 'LEVEL_50':
      case 'LEVEL_100':
        currentValue = context?.level || 0
        targetValue = criteria?.level || parseInt(configAchievement.code.split('_')[1])
        isCompleted = currentValue >= targetValue
        break

      case 'STREAK_MASTER':
        currentValue = await this.getCurrentStreak(userId)
        targetValue = criteria?.streakDays || 30
        isCompleted = currentValue >= targetValue
        break

      default:
        // Generic progress check based on criteria
        if (criteria) {
          const result = await this.genericAchievementCheck(userId, criteria, context)
          currentValue = result.current
          targetValue = result.target
          isCompleted = result.completed
        }
    }

    const percentage = targetValue > 0 
      ? Math.min(100, (currentValue / targetValue) * 100) 
      : 0

    return {
      achievementId: dbAchievement.id,
      currentValue,
      targetValue,
      percentage,
      isCompleted,
    }
  }

  private async genericAchievementCheck(
    userId: string,
    criteria: any,
    context?: any
  ): Promise<{ current: number; target: number; completed: boolean }> {
    // Check various criteria types
    if (criteria.type === 'posts' && criteria.count) {
      const count = await this.db.post.count({
        where: { 
          authorId: userId,
          published: true,
          deleted: false,
        },
      })
      return { 
        current: count, 
        target: criteria.count, 
        completed: count >= criteria.count 
      }
    }

    if (criteria.type === 'followers' && criteria.count) {
      const count = await this.db.follow.count({
        where: { followingId: userId },
      })
      return { 
        current: count, 
        target: criteria.count, 
        completed: count >= criteria.count 
      }
    }

    return { current: 0, target: 1, completed: false }
  }

  private async unlockAchievement(userId: string, achievementId: string) {
    const achievement = await this.db.achievement.findUnique({
      where: { id: achievementId },
    })

    if (!achievement) return

    await this.db.$transaction(async (tx) => {
      // Create/update user achievement
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

      // Award rewards
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
            totalXp: 0,
          },
        })
      }

      if (achievement.sparklePointsReward > 0) {
        await this.awardSparklePointsTransaction(
          tx,
          userId,
          achievement.sparklePointsReward,
          'achievement',
          achievementId
        )
      }

      if (achievement.premiumPointsReward > 0) {
        await this.awardPremiumPointsTransaction(
          tx,
          userId,
          achievement.premiumPointsReward,
          'achievement',
          achievementId
        )
      }

      // Update stats
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

    // Emit event
    this.emit('achievement:unlocked', {
      userId,
      achievementId,
      achievement,
    })
  }

  // ===== Quest System =====

  async getActiveQuests(userId: string) {
    const now = new Date()

    const quests = await this.db.quest.findMany({
      where: {
        OR: [
          { availableFrom: null },
          { availableFrom: { lte: now } }
        ],
        OR: [
          { availableUntil: null },
          { availableUntil: { gte: now } }
        ],
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
    const quest = await this.db.quest.findUnique({
      where: { code: questCode },
    })

    if (!quest) return

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
        currentStep: { increment: progressIncrement },
      },
    })

    // Check if quest completed
    const requirements = quest.requirements as any
    const targetAmount = requirements?.target || requirements?.amount || 1

    if (userQuest.currentStep >= targetAmount && userQuest.status !== QuestStatus.COMPLETED) {
      await this.completeQuest(userId, quest.id)
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
          claimedAt: new Date(),
        },
      })

      // Award rewards
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

      if (quest.pointsReward > 0) {
        await this.awardSparklePointsTransaction(
          tx, 
          userId, 
          quest.pointsReward, 
          'quest', 
          questId
        )
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

    // Emit event
    this.emit('quest:completed', {
      userId,
      questId,
      quest,
    })
  }

  // ===== Leaderboard System =====

  async getLeaderboard(
    type: 'xp' | 'sparklePoints' | 'achievements' | 'posts' | 'followers',
    period: 'daily' | 'weekly' | 'monthly' | 'alltime' = 'alltime',
    limit: number = 100
  ): Promise<{
    entries: LeaderboardEntry[]
    userRank?: number
    totalEntries: number
  }> {
    const cacheKey = `leaderboard:${type}:${period}`
    
    // Try cache first (except for daily which updates frequently)
    if (period !== 'daily') {
      const cached = await this.redis.get(cacheKey)
      if (cached) {
        return JSON.parse(cached)
      }
    }

    const dateFilter = this.getDateFilter(period)
    let entries: LeaderboardEntry[] = []

    switch (type) {
      case 'xp':
        entries = await this.getXPLeaderboard(dateFilter, limit)
        break
      case 'sparklePoints':
        entries = await this.getSparklePointsLeaderboard(dateFilter, limit)
        break
      case 'achievements':
        entries = await this.getAchievementsLeaderboard(limit)
        break
      case 'posts':
        entries = await this.getPostsLeaderboard(dateFilter, limit)
        break
      case 'followers':
        entries = await this.getFollowersLeaderboard(dateFilter, limit)
        break
    }

    const result = {
      entries,
      totalEntries: entries.length,
    }

    // Cache for appropriate duration
    if (period !== 'daily') {
      const ttl = period === 'weekly' ? 3600 : period === 'monthly' ? 7200 : 86400
      await this.redis.setex(cacheKey, ttl, JSON.stringify(result))
    }

    // Store in database for persistence
    await this.storeLeaderboard(type, period, entries)

    return result
  }

  private async getXPLeaderboard(dateFilter: Date | null, limit: number): Promise<LeaderboardEntry[]> {
    let users: any[]

    if (dateFilter) {
      // Period-based XP from XpLog
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
          verified: true,
        },
      })

      const userDict = new Map(userMap.map(u => [u.id, u]))
      
      users = xpLogs.map((log, index) => ({
        rank: index + 1,
        user: userDict.get(log.userId),
        score: log._sum.amount || 0,
      })).filter(entry => entry.user)
    } else {
      // All-time XP
      const topUsers = await this.db.user.findMany({
        where: { deleted: false },
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

      users = topUsers.map((user, index) => ({
        rank: index + 1,
        user: {
          id: user.id,
          username: user.username,
          image: user.image,
          level: user.level,
          verified: user.verified,
        },
        score: user.experience,
      }))
    }

    return users
  }

  private async getSparklePointsLeaderboard(dateFilter: Date | null, limit: number): Promise<LeaderboardEntry[]> {
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

      const userDict = new Map(users.map(u => [u.id, u]))
      
      return transactions.map((t, index) => ({
        rank: index + 1,
        user: userDict.get(t.userId)!,
        score: t._sum.amount || 0,
      })).filter(entry => entry.user)
    } else {
      // All-time sparkle points
      const users = await this.db.user.findMany({
        where: { deleted: false },
        select: {
          id: true,
          username: true,
          image: true,
          level: true,
          sparklePoints: true,
          verified: true,
        },
        orderBy: { sparklePoints: 'desc' },
        take: limit,
      })

      return users.map((user, index) => ({
        rank: index + 1,
        user: {
          id: user.id,
          username: user.username,
          image: user.image,
          level: user.level,
          verified: user.verified,
        },
        score: user.sparklePoints,
      }))
    }
  }

  private async getAchievementsLeaderboard(limit: number): Promise<LeaderboardEntry[]> {
    const userAchievements = await this.db.userAchievement.groupBy({
      by: ['userId'],
      where: {
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

    const userDict = new Map(users.map(u => [u.id, u]))
    
    return userAchievements.map((ua, index) => ({
      rank: index + 1,
      user: userDict.get(ua.userId)!,
      score: ua._count.achievementId,
    })).filter(entry => entry.user)
  }

  private async getPostsLeaderboard(dateFilter: Date | null, limit: number): Promise<LeaderboardEntry[]> {
    const where = dateFilter 
      ? { createdAt: { gte: dateFilter }, deleted: false, published: true }
      : { deleted: false, published: true }

    const postCounts = await this.db.post.groupBy({
      by: ['authorId'],
      where,
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

    const userIds = postCounts.map(p => p.authorId).filter(Boolean) as string[]
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

    const userDict = new Map(users.map(u => [u.id, u]))
    
    return postCounts
      .filter(p => p.authorId)
      .map((p, index) => ({
        rank: index + 1,
        user: userDict.get(p.authorId!)!,
        score: p._count.id,
      }))
      .filter(entry => entry.user)
  }

  private async getFollowersLeaderboard(dateFilter: Date | null, limit: number): Promise<LeaderboardEntry[]> {
    if (dateFilter) {
      const followCounts = await this.db.follow.groupBy({
        by: ['followingId'],
        where: {
          createdAt: { gte: dateFilter },
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

      const userIds = followCounts.map(f => f.followingId)
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

      const userDict = new Map(users.map(u => [u.id, u]))
      
      return followCounts.map((f, index) => ({
        rank: index + 1,
        user: userDict.get(f.followingId)!,
        score: f._count.id,
      })).filter(entry => entry.user)
    } else {
      const users = await this.db.user.findMany({
        where: { deleted: false },
        select: {
          id: true,
          username: true,
          image: true,
          level: true,
          verified: true,
          _count: {
            select: { followers: true },
          },
        },
        orderBy: {
          followers: {
            _count: 'desc',
          },
        },
        take: limit,
      })

      return users.map((user, index) => ({
        rank: index + 1,
        user: {
          id: user.id,
          username: user.username,
          image: user.image,
          level: user.level,
          verified: user.verified,
        },
        score: user._count.followers,
      }))
    }
  }

  private async storeLeaderboard(
    type: string,
    period: string,
    entries: LeaderboardEntry[]
  ) {
    const now = new Date()
    const periodStart = this.getDateFilter(period as any) || new Date(0)
    const periodEnd = now

    await this.db.leaderboard.upsert({
      where: {
        type_scope_scopeId_periodStart_periodEnd: {
          type,
          scope: 'global',
          scopeId: null,
          periodStart,
          periodEnd,
        },
      },
      create: {
        type,
        scope: 'global',
        period,
        periodStart,
        periodEnd,
        data: entries,
        processed: true,
      },
      update: {
        data: entries,
        processed: true,
      },
    })

    // Store individual entries
    for (const entry of entries) {
      await this.db.leaderboardEntry.upsert({
        where: {
          userId_type_period: {
            userId: entry.user.id,
            type,
            period,
          },
        },
        create: {
          userId: entry.user.id,
          type,
          period,
          rank: entry.rank,
          score: BigInt(entry.score),
        },
        update: {
          rank: entry.rank,
          score: BigInt(entry.score),
          movement: 0, // Calculate from previous if needed
        },
      })
    }
  }

  // ===== User Stats =====

  async getUserStats(userId: string) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      include: {
        achievements: {
          include: {
            achievement: true,
          },
        },
        stats: true,
        _count: {
          select: {
            posts: true,
            comments: true,
            reactions: true,
            followers: true,
            following: true,
          },
        },
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Calculate level progress
    const nextLevelXP = this.calculateXPForLevel(user.level + 1)
    const currentLevelXP = this.calculateXPForLevel(user.level)
    const progressXP = user.experience - currentLevelXP
    const neededXP = nextLevelXP - currentLevelXP
    const percentage = neededXP > 0 ? (progressXP / neededXP) * 100 : 0

    // Get achievement stats
    const achievementStats = this.calculateAchievementStats(user.achievements)

    // Get ranks
    const ranks = await this.getUserRanks(userId)

    // Get streaks
    const streaks = await this.getUserStreaks(userId)

    // Get recent XP
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
      COMMON: 0,
      UNCOMMON: 0,
      RARE: 0,
      EPIC: 0,
      LEGENDARY: 0,
      MYTHIC: 0,
      LIMITED_EDITION: 0,
      SEASONAL: 0,
    }

    let points = 0

    userAchievements.forEach(ua => {
      if (ua.achievement) {
        byRarity[ua.achievement.rarity] = (byRarity[ua.achievement.rarity] || 0) + 1
        
        const rarityPoints: Record<string, number> = {
          COMMON: 10,
          UNCOMMON: 25,
          RARE: 50,
          EPIC: 100,
          LEGENDARY: 250,
          MYTHIC: 1000,
          LIMITED_EDITION: 500,
          SEASONAL: 200,
        }
        
        points += rarityPoints[ua.achievement.rarity] || 10
      }
    })

    return {
      total: userAchievements.length,
      unlocked: userAchievements.filter(ua => ua.progress >= 1).length,
      points,
      byRarity,
    }
  }

  private async getUserRanks(userId: string) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: { experience: true }
    })

    if (!user) return { global: 0, xp: 0, achievements: 0 }

    const [xpRank, achievementCount] = await Promise.all([
      this.db.user.count({
        where: {
          experience: { gt: user.experience },
          deleted: false,
        }
      }),
      this.db.userAchievement.count({
        where: {
          userId,
          progress: { gte: 1 },
        }
      })
    ])

    const achievementRank = await this.db.userAchievement.groupBy({
      by: ['userId'],
      where: {
        progress: { gte: 1 },
      },
      having: {
        userId: {
          _count: {
            gt: achievementCount,
          },
        },
      },
      _count: {
        userId: true,
      },
    })

    return {
      global: xpRank + 1,
      xp: xpRank + 1,
      achievements: achievementRank.length + 1,
    }
  }

  // ===== Daily Activities & Streaks =====

  async checkDailyLogin(userId: string) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Check if already logged in today
    const loginToday = await this.db.xpLog.findFirst({
      where: {
        userId,
        source: 'daily_login',
        createdAt: { gte: today }
      }
    })

    if (!loginToday) {
      // Award daily login XP
      await this.awardXP(userId, XP_REWARDS.DAILY_LOGIN, 'daily_login')
      
      // Update streak
      await this.updateLoginStreak(userId)
    }
  }

  private async updateLoginStreak(userId: string) {
    const stats = await this.db.userStats.findUnique({
      where: { userId },
      select: { 
        streakDays: true, 
        longestStreak: true,
        lastActivityAt: true,
      },
    })

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let newStreak = 1
    
    if (stats?.lastActivityAt) {
      const lastActivity = new Date(stats.lastActivityAt)
      lastActivity.setHours(0, 0, 0, 0)
      
      if (lastActivity.getTime() === yesterday.getTime()) {
        // Continue streak
        newStreak = (stats.streakDays || 0) + 1
      } else if (lastActivity.getTime() === today.getTime()) {
        // Already logged in today
        return
      }
    }

    const longestStreak = Math.max(newStreak, stats?.longestStreak || 0)

    await this.db.userStats.upsert({
      where: { userId },
      create: {
        userId,
        streakDays: newStreak,
        longestStreak: newStreak,
        lastActivityAt: new Date(),
      },
      update: {
        streakDays: newStreak,
        longestStreak,
        lastActivityAt: new Date(),
      },
    })

    // Award streak bonus
    if (newStreak > 1) {
      const streakBonus = Math.min(newStreak * XP_REWARDS.STREAK_BONUS, 100)
      await this.awardXP(userId, streakBonus, 'streak_bonus', undefined, `${newStreak} day streak!`)
    }

    // Check streak achievements
    await this.checkAchievements(userId, 'streak', { days: newStreak })
  }

  private async getCurrentStreak(userId: string): Promise<number> {
    const stats = await this.db.userStats.findUnique({
      where: { userId },
      select: { streakDays: true },
    })
    return stats?.streakDays || 0
  }

  private async getUserStreaks(userId: string) {
    const stats = await this.db.userStats.findUnique({
      where: { userId },
      select: { 
        streakDays: true,
        longestStreak: true,
      },
    })

    return {
      current: stats?.streakDays || 0,
      longest: stats?.longestStreak || 0,
    }
  }

  // ===== Helper Methods =====

  private getDateFilter(timeframe: string): Date | null {
    if (!timeframe || timeframe === 'alltime') return null

    const now = new Date()
    switch (timeframe) {
      case 'daily':
        now.setHours(0, 0, 0, 0)
        return now
      case 'weekly':
        now.setDate(now.getDate() - 7)
        return now
      case 'monthly':
        now.setMonth(now.getMonth() - 1)
        return now
      default:
        return null
    }
  }

  private async updateLeaderboards(userId: string, xp: number) {
    // Update Redis sorted sets for fast leaderboard queries
    await Promise.all([
      this.redis.zadd('leaderboard:xp:alltime', xp, userId),
      this.redis.zadd('leaderboard:xp:monthly', xp, userId),
      this.redis.zadd('leaderboard:xp:weekly', xp, userId),
      this.redis.zadd('leaderboard:xp:daily', xp, userId),
    ])
  }

  // ===== Public Event Methods =====

  onXPAwarded(handler: (data: any) => void) {
    this.on('xp:awarded', handler)
  }

  onLevelUp(handler: (data: any) => void) {
    this.on('user:levelUp', handler)
  }

  onAchievementUnlocked(handler: (data: any) => void) {
    this.on('achievement:unlocked', handler)
  }

  onQuestCompleted(handler: (data: any) => void) {
    this.on('quest:completed', handler)
  }
}
```

I'll continue with the additional files in the next message due to length constraints. The merged gamification service now:

1. **Uses correct level formula from README** (sqrt-based)
2. **Maintains Int type for points** as per schema
3. **Includes comprehensive currency management** from Phase 4
4. **Syncs achievements between config and database**
5. **Has proper TypeScript types** aligned with Prisma schema
6. **Includes EventEmitter pattern** for real-time updates
7. **Uses Redis for leaderboard caching**
8. **Tracks all activities in database models**
9. **Includes audit logging** for transparency
10. **Has complete quest system integration**
