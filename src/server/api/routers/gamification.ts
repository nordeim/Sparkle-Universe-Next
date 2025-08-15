// src/server/api/routers/gamification.ts
import { z } from 'zod'
import { 
  createTRPCRouter, 
  publicProcedure, 
  protectedProcedure 
} from '@/server/api/trpc'
import { GamificationService } from '@/server/services/gamification.service'
import { TRPCError } from '@trpc/server'
import { 
  BadgeRarity, 
  QuestType, 
  QuestStatus 
} from '@prisma/client'

export const gamificationRouter = createTRPCRouter({
  // ===== XP Operations =====
  
  awardXP: protectedProcedure
    .input(z.object({
      amount: z.number().positive(),
      reason: z.string(),
      sourceId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Only admins or system can directly award XP
      if (ctx.session.user.role !== 'ADMIN' && ctx.session.user.role !== 'SYSTEM') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can award XP directly',
        })
      }

      const gamificationService = new GamificationService(ctx.db)
      return gamificationService.awardXP(
        ctx.session.user.id,
        input.amount,
        input.reason,
        input.sourceId
      )
    }),

  getUserStats: publicProcedure
    .input(z.object({
      userId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const gamificationService = new GamificationService(ctx.db)
      return gamificationService.getUserStats(input.userId)
    }),

  // ===== Achievement Operations =====

  getUserAchievements: publicProcedure
    .input(z.object({
      userId: z.string(),
      includeProgress: z.boolean().optional(),
      category: z.string().optional(),
      rarity: z.nativeEnum(BadgeRarity).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: any = {
        userId: input.userId,
      }

      if (input.includeProgress !== false) {
        where.progress = { gte: 0 }
      } else {
        where.progress = { gte: 1 }
      }

      const userAchievements = await ctx.db.userAchievement.findMany({
        where,
        include: {
          achievement: true,
        },
        orderBy: {
          unlockedAt: 'desc',
        },
      })

      // Filter by category or rarity if specified
      let filtered = userAchievements

      if (input.category) {
        filtered = filtered.filter(ua => ua.achievement.category === input.category)
      }

      if (input.rarity) {
        filtered = filtered.filter(ua => ua.achievement.rarity === input.rarity)
      }

      return filtered
    }),

  getAchievementProgress: publicProcedure
    .input(z.object({
      userId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const gamificationService = new GamificationService(ctx.db)
      const userAchievements = await ctx.db.userAchievement.findMany({
        where: { userId: input.userId },
        include: { achievement: true },
      })

      const progressMap: Record<string, any> = {}

      for (const ua of userAchievements) {
        progressMap[ua.achievementId] = {
          percentage: ua.progress * 100,
          currentValue: (ua.progressData as any)?.current || 0,
          targetValue: (ua.progressData as any)?.target || 1,
        }
      }

      return progressMap
    }),

  getAchievementDetails: publicProcedure
    .input(z.object({
      achievementId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const achievement = await ctx.db.achievement.findUnique({
        where: { id: input.achievementId },
        include: {
          _count: {
            select: { userAchievements: true },
          },
        },
      })

      if (!achievement) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Achievement not found',
        })
      }

      // Calculate stats
      const totalUsers = await ctx.db.user.count({ where: { deleted: false } })
      const unlockedCount = await ctx.db.userAchievement.count({
        where: {
          achievementId: input.achievementId,
          progress: { gte: 1 },
        },
      })

      // Get first unlocker
      const firstUnlocker = await ctx.db.userAchievement.findFirst({
        where: {
          achievementId: input.achievementId,
          progress: { gte: 1 },
        },
        orderBy: { unlockedAt: 'asc' },
        include: {
          user: {
            select: { id: true, username: true },
          },
        },
      })

      // Calculate average time to unlock
      const avgTimeResult = await ctx.db.$queryRaw<any[]>`
        SELECT AVG(EXTRACT(EPOCH FROM (ua."unlockedAt" - u."createdAt")) / 86400)::float as avg_days
        FROM user_achievements ua
        JOIN users u ON ua."userId" = u.id
        WHERE ua."achievementId" = ${input.achievementId}
        AND ua.progress >= 1
      `

      const stats = {
        totalUnlocked: unlockedCount,
        completionRate: totalUsers > 0 ? (unlockedCount / totalUsers) * 100 : 0,
        firstUnlockedBy: firstUnlocker?.user,
        avgTimeToUnlock: avgTimeResult[0]?.avg_days || null,
        unlockRate: 0, // Calculate based on time period
      }

      return {
        ...achievement,
        stats,
      }
    }),

  getAchievementUnlockers: publicProcedure
    .input(z.object({
      achievementId: z.string(),
      limit: z.number().min(1).max(100).default(10),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const unlockers = await ctx.db.userAchievement.findMany({
        where: {
          achievementId: input.achievementId,
          progress: { gte: 1 },
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              image: true,
              level: true,
            },
          },
        },
        orderBy: { unlockedAt: 'asc' },
        take: input.limit,
        cursor: input.cursor ? { id: input.cursor } : undefined,
      })

      return unlockers.map((ua, index) => ({
        rank: index + 1,
        user: ua.user,
        unlockedAt: ua.unlockedAt!,
        timeToUnlock: 0, // Calculate from user creation date
      }))
    }),

  getUserAchievement: protectedProcedure
    .input(z.object({
      achievementId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const userAchievement = await ctx.db.userAchievement.findUnique({
        where: {
          userId_achievementId: {
            userId: ctx.session.user.id,
            achievementId: input.achievementId,
          },
        },
      })

      if (!userAchievement) return null

      // Calculate time to unlock
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { createdAt: true },
      })

      const timeToUnlock = userAchievement.unlockedAt && user
        ? Math.floor((userAchievement.unlockedAt.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        : 0

      return {
        ...userAchievement,
        timeToUnlock,
      }
    }),

  getRelatedAchievements: publicProcedure
    .input(z.object({
      achievementId: z.string(),
      limit: z.number().min(1).max(10).default(5),
    }))
    .query(async ({ ctx, input }) => {
      const achievement = await ctx.db.achievement.findUnique({
        where: { id: input.achievementId },
      })

      if (!achievement) return []

      // Find related achievements by category or similar criteria
      const related = await ctx.db.achievement.findMany({
        where: {
          id: { not: input.achievementId },
          OR: [
            { category: achievement.category },
            { rarity: achievement.rarity },
          ],
        },
        take: input.limit,
      })

      return related
    }),

  shareAchievement: protectedProcedure
    .input(z.object({
      achievementId: z.string(),
      platform: z.enum(['twitter', 'facebook', 'link']),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify user has the achievement
      const userAchievement = await ctx.db.userAchievement.findUnique({
        where: {
          userId_achievementId: {
            userId: ctx.session.user.id,
            achievementId: input.achievementId,
          },
        },
      })

      if (!userAchievement || userAchievement.progress < 1) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You have not unlocked this achievement',
        })
      }

      // Track share in activity
      await ctx.db.activityStream.create({
        data: {
          userId: ctx.session.user.id,
          action: 'achievement.shared',
          entityType: 'achievement',
          entityId: input.achievementId,
          metadata: { platform: input.platform },
          visibility: 'PUBLIC',
        },
      })

      return { success: true }
    }),

  // ===== Quest Operations =====

  getActiveQuests: protectedProcedure
    .query(async ({ ctx }) => {
      const gamificationService = new GamificationService(ctx.db)
      return gamificationService.getActiveQuests(ctx.session.user.id)
    }),

  getUserQuests: protectedProcedure
    .input(z.object({
      type: z.nativeEnum(QuestType).optional(),
      status: z.nativeEnum(QuestStatus).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: any = {
        userId: ctx.session.user.id,
      }

      if (input.type) {
        where.quest = { type: input.type }
      }

      if (input.status) {
        where.status = input.status
      }

      return ctx.db.userQuest.findMany({
        where,
        include: { quest: true },
        orderBy: { startedAt: 'desc' },
      })
    }),

  claimQuestReward: protectedProcedure
    .input(z.object({
      questId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userQuest = await ctx.db.userQuest.findUnique({
        where: {
          userId_questId: {
            userId: ctx.session.user.id,
            questId: input.questId,
          },
        },
        include: { quest: true },
      })

      if (!userQuest) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Quest not found',
        })
      }

      if (userQuest.status !== QuestStatus.COMPLETED) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Quest is not completed',
        })
      }

      if (userQuest.claimedAt) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Rewards already claimed',
        })
      }

      // Mark as claimed
      await ctx.db.userQuest.update({
        where: {
          userId_questId: {
            userId: ctx.session.user.id,
            questId: input.questId,
          },
        },
        data: {
          status: QuestStatus.CLAIMED,
          claimedAt: new Date(),
        },
      })

      return { success: true }
    }),

  // ===== Leaderboard Operations =====

  getLeaderboard: publicProcedure
    .input(z.object({
      type: z.enum(['xp', 'sparklePoints', 'achievements', 'posts', 'followers']),
      period: z.enum(['daily', 'weekly', 'monthly', 'alltime']).default('alltime'),
      limit: z.number().min(1).max(100).default(10),
    }))
    .query(async ({ ctx, input }) => {
      const gamificationService = new GamificationService(ctx.db)
      return gamificationService.getLeaderboard(input.type, input.period, input.limit)
    }),

  getUserRank: protectedProcedure
    .input(z.object({
      type: z.enum(['xp', 'sparklePoints', 'achievements']),
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      let rank = 0

      switch (input.type) {
        case 'xp':
          const user = await ctx.db.user.findUnique({
            where: { id: userId },
            select: { experience: true },
          })
          
          if (user) {
            rank = await ctx.db.user.count({
              where: {
                experience: { gt: user.experience },
                deleted: false,
              },
            }) + 1
          }
          break

        case 'sparklePoints':
          const userPoints = await ctx.db.user.findUnique({
            where: { id: userId },
            select: { sparklePoints: true },
          })
          
          if (userPoints) {
            rank = await ctx.db.user.count({
              where: {
                sparklePoints: { gt: userPoints.sparklePoints },
                deleted: false,
              },
            }) + 1
          }
          break

        case 'achievements':
          const userAchievementCount = await ctx.db.userAchievement.count({
            where: {
              userId,
              progress: { gte: 1 },
            },
          })

          const higherCounts = await ctx.db.userAchievement.groupBy({
            by: ['userId'],
            where: {
              progress: { gte: 1 },
            },
            having: {
              userId: {
                _count: {
                  gt: userAchievementCount,
                },
              },
            },
          })

          rank = higherCounts.length + 1
          break
      }

      return { rank, type: input.type }
    }),

  // ===== Currency Operations =====

  getUserBalance: protectedProcedure
    .query(async ({ ctx }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          sparklePoints: true,
          premiumPoints: true,
        },
      })

      const balance = await ctx.db.userBalance.findUnique({
        where: { userId: ctx.session.user.id },
      })

      return {
        sparklePoints: user?.sparklePoints || 0,
        premiumPoints: user?.premiumPoints || 0,
        frozenPoints: balance?.frozenPoints || 0,
        lifetimeEarned: balance?.lifetimeEarned || 0,
        lifetimeSpent: balance?.lifetimeSpent || 0,
      }
    }),

  getTransactionHistory: protectedProcedure
    .input(z.object({
      currencyType: z.enum(['sparkle', 'premium']).optional(),
      limit: z.number().min(1).max(100).default(50),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: any = {
        userId: ctx.session.user.id,
      }

      if (input.currencyType) {
        where.currencyType = input.currencyType
      }

      const transactions = await ctx.db.currencyTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: input.limit,
        cursor: input.cursor ? { id: input.cursor } : undefined,
      })

      return {
        items: transactions,
        nextCursor: transactions.length === input.limit
          ? transactions[transactions.length - 1].id
          : null,
      }
    }),

  // ===== Daily Activities =====

  checkDailyLogin: protectedProcedure
    .mutation(async ({ ctx }) => {
      const gamificationService = new GamificationService(ctx.db)
      await gamificationService.checkDailyLogin(ctx.session.user.id)
      return { success: true }
    }),

  getStreakInfo: protectedProcedure
    .query(async ({ ctx }) => {
      const stats = await ctx.db.userStats.findUnique({
        where: { userId: ctx.session.user.id },
        select: {
          streakDays: true,
          longestStreak: true,
          lastActivityAt: true,
        },
      })

      return {
        currentStreak: stats?.streakDays || 0,
        longestStreak: stats?.longestStreak || 0,
        lastActivity: stats?.lastActivityAt,
      }
    }),
})
