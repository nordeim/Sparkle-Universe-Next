// src/server/services/gamification.service.ts
import { PrismaClient, BadgeRarity, QuestType, QuestStatus } from '@prisma/client'
import { NotificationService } from './notification.service'

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
  FOLLOW: 2,
  FOLLOWED: 3,
  REACTION_GIVEN: 1,
  REACTION_RECEIVED: 2,
} as const

export class GamificationService {
  private notificationService: NotificationService

  constructor(private db: PrismaClient) {
    this.notificationService = new NotificationService(db)
  }

  async awardXP(
    userId: string, 
    amount: number, 
    source: string, 
    sourceId?: string
  ) {
    // Get current user XP
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: { 
        experience: true, 
        level: true 
      },
    })

    if (!user) return null

    const oldLevel = user.level
    const newXP = user.experience + amount
    const newLevel = this.calculateLevel(newXP)

    // Update user XP and level
    await this.db.user.update({
      where: { id: userId },
      data: {
        experience: newXP,
        level: newLevel,
      },
    })

    // Log XP transaction
    await this.db.xpLog.create({
      data: {
        userId,
        amount,
        source,
        sourceId,
        totalXp: newXP,
      },
    })

    // Check for level up
    if (newLevel > oldLevel) {
      await this.handleLevelUp(userId, oldLevel, newLevel)
    }

    // Update daily activity
    await this.updateDailyActivity(userId, 'xpEarned', amount)

    return {
      xpAwarded: amount,
      totalXp: newXP,
      level: newLevel,
      leveledUp: newLevel > oldLevel,
    }
  }

  async checkAndUnlockAchievements(userId: string, context: string) {
    // Get user stats and progress
    const [user, stats, achievements] = await Promise.all([
      this.db.user.findUnique({
        where: { id: userId },
        select: {
          experience: true,
          level: true,
          _count: {
            select: {
              posts: true,
              comments: true,
              followers: true,
              following: true,
            },
          },
        },
      }),
      this.db.userStats.findUnique({
        where: { userId },
      }),
      this.db.userAchievement.findMany({
        where: { userId },
        select: { achievementId: true },
      }),
    ])

    if (!user || !stats) return []

    const unlockedAchievementIds = achievements.map(a => a.achievementId)

    // Get achievements to check based on context
    const achievementsToCheck = await this.db.achievement.findMany({
      where: {
        id: { notIn: unlockedAchievementIds },
        deleted: false,
      },
    })

    const newlyUnlocked = []

    for (const achievement of achievementsToCheck) {
      const isUnlocked = await this.checkAchievementCriteria(
        achievement,
        user,
        stats,
        context
      )

      if (isUnlocked) {
        // Unlock achievement
        await this.db.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
            progress: 1,
          },
        })

        // Award XP
        if (achievement.xpReward > 0) {
          await this.awardXP(
            userId,
            achievement.xpReward,
            'achievement',
            achievement.id
          )
        }

        // Award points
        if (achievement.sparklePointsReward > 0) {
          await this.awardPoints(
            userId,
            achievement.sparklePointsReward,
            'sparkle',
            'achievement',
            achievement.id
          )
        }

        if (achievement.premiumPointsReward > 0) {
          await this.awardPoints(
            userId,
            achievement.premiumPointsReward,
            'premium',
            'achievement',
            achievement.id
          )
        }

        // Send notification
        await this.notificationService.createNotification({
          type: 'ACHIEVEMENT_UNLOCKED',
          userId,
          entityId: achievement.id,
          entityType: 'achievement',
          title: 'Achievement Unlocked!',
          message: `You unlocked "${achievement.name}"`,
          data: {
            achievementId: achievement.id,
            achievementName: achievement.name,
            rarity: achievement.rarity,
          },
        })

        newlyUnlocked.push(achievement)
      }
    }

    return newlyUnlocked
  }

  async updateQuestProgress(userId: string, questCode: string, amount: number = 1) {
    // Find active quest for user
    const userQuest = await this.db.userQuest.findFirst({
      where: {
        userId,
        quest: { code: questCode },
        status: QuestStatus.IN_PROGRESS,
      },
      include: {
        quest: true,
      },
    })

    if (!userQuest) return null

    const progressData = userQuest.progress as any || {}
    const currentProgress = progressData.current || 0
    const newProgress = currentProgress + amount
    const totalRequired = userQuest.quest.requirements as any
    const requiredAmount = totalRequired?.amount || 1

    const updatedProgressData = {
      ...progressData,
      current: newProgress,
      required: requiredAmount,
    }

    // Update quest progress
    const updatedQuest = await this.db.userQuest.update({
      where: { id: userQuest.id },
      data: {
        progress: updatedProgressData,
        status: newProgress >= requiredAmount ? QuestStatus.COMPLETED : QuestStatus.IN_PROGRESS,
        completedAt: newProgress >= requiredAmount ? new Date() : null,
      },
    })

    // If quest completed, award rewards
    if (newProgress >= requiredAmount && userQuest.status !== QuestStatus.COMPLETED) {
      await this.completeQuest(userId, userQuest.questId)
    }

    return updatedQuest
  }

  private async completeQuest(userId: string, questId: string) {
    const quest = await this.db.quest.findUnique({
      where: { id: questId },
    })

    if (!quest) return

    // Award XP
    if (quest.xpReward > 0) {
      await this.awardXP(userId, quest.xpReward, 'quest', questId)
    }

    // Award points
    if (quest.pointsReward > 0) {
      await this.awardPoints(
        userId,
        quest.pointsReward,
        'sparkle',
        'quest',
        questId
      )
    }

    // Send notification
    await this.notificationService.createNotification({
      type: 'QUEST_COMPLETE',
      userId,
      entityId: questId,
      entityType: 'quest',
      title: 'Quest Completed!',
      message: `You completed "${quest.name}"`,
      data: {
        questId,
        questName: quest.name,
        rewards: {
          xp: quest.xpReward,
          points: quest.pointsReward,
        },
      },
    })

    // Update daily activity
    await this.updateDailyActivity(userId, 'questsCompleted', 1)
  }

  private async awardPoints(
    userId: string,
    amount: number,
    currency: 'sparkle' | 'premium',
    source: string,
    sourceId?: string
  ) {
    // Update user balance
    const field = currency === 'sparkle' ? 'sparklePoints' : 'premiumPoints'
    
    await this.db.user.update({
      where: { id: userId },
      data: {
        [field]: { increment: amount },
      },
    })

    // Update user balance record
    await this.db.userBalance.upsert({
      where: { userId },
      create: {
        userId,
        [field]: amount,
        lifetimeEarned: amount,
      },
      update: {
        [field]: { increment: amount },
        lifetimeEarned: { increment: amount },
        lastTransactionAt: new Date(),
      },
    })

    // Log transaction
    await this.db.currencyTransaction.create({
      data: {
        userId,
        amount,
        currencyType: currency,
        transactionType: 'earn',
        source,
        sourceId,
        balanceAfter: 0, // Will be calculated
        balanceBefore: 0, // Will be calculated
      },
    })

    // Update daily activity
    await this.updateDailyActivity(userId, 'pointsEarned', amount)
  }

  private calculateLevel(xp: number): number {
    // Progressive level calculation
    return Math.floor(Math.sqrt(xp / 100)) + 1
  }

  private async handleLevelUp(userId: string, oldLevel: number, newLevel: number) {
    // Award level up bonus XP
    await this.awardXP(userId, XP_REWARDS.LEVEL_UP, 'level_up')

    // Check for level rewards
    const levelConfig = await this.db.levelConfig.findUnique({
      where: { level: newLevel },
    })

    if (levelConfig) {
      // Award level rewards
      if (levelConfig.sparkleReward > 0) {
        await this.awardPoints(
          userId,
          levelConfig.sparkleReward,
          'sparkle',
          'level_up'
        )
      }

      if (levelConfig.premiumReward > 0) {
        await this.awardPoints(
          userId,
          levelConfig.premiumReward,
          'premium',
          'level_up'
        )
      }
    }

    // Send notification
    await this.notificationService.createNotification({
      type: 'LEVEL_UP',
      userId,
      entityType: 'level',
      title: 'Level Up!',
      message: `Congratulations! You reached level ${newLevel}`,
      data: {
        oldLevel,
        newLevel,
        rewards: levelConfig,
      },
    })

    // Update stats
    await this.db.userStats.update({
      where: { userId },
      data: {
        lastActivityAt: new Date(),
      },
    })
  }

  private async checkAchievementCriteria(
    achievement: any,
    user: any,
    stats: any,
    context: string
  ): Promise<boolean> {
    const criteria = achievement.criteria as any
    if (!criteria) return false

    // Check various achievement criteria
    switch (criteria.type) {
      case 'posts':
        return user._count.posts >= (criteria.count || 0)
      
      case 'comments':
        return user._count.comments >= (criteria.count || 0)
      
      case 'followers':
        return user._count.followers >= (criteria.count || 0)
      
      case 'following':
        return user._count.following >= (criteria.count || 0)
      
      case 'level':
        return user.level >= (criteria.level || 0)
      
      case 'xp':
        return user.experience >= (criteria.amount || 0)
      
      case 'streak':
        return stats.streakDays >= (criteria.days || 0)
      
      case 'engagement':
        return stats.engagementRate >= (criteria.rate || 0)
      
      default:
        return false
    }
  }

  private async updateDailyActivity(userId: string, field: string, amount: number) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    await this.db.userActivity.upsert({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
      create: {
        userId,
        date: today,
        [field]: amount,
      },
      update: {
        [field]: { increment: amount },
      },
    })
  }
}
