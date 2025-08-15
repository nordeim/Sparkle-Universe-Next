awesome job! below is the `src/server/api/routers/gamification.ts` from the original phase 4 codebase which I did not share earlier. please meticulously comparing the original phase 4 `src/server/services/gamification.service.ts` with your generated version, then identify features in the original version but are missing in your version, then complete updated working replacement file that carefully merge the missing features, a complete production-ready version that combines the best of both implementations. please carefully and meticulously plan before proceeding cautiously to create the complete updated replacement version.

# Phase 4: src/server/api/routers/gamification.ts
```ts
// src/server/api/routers/gamification.ts (phase 4)
import { z } from 'zod'
import { 
  createTRPCRouter, 
  protectedProcedure,
  publicProcedure 
} from '@/server/api/trpc'
import { GamificationService } from '@/server/services/gamification.service'

export const gamificationRouter = createTRPCRouter({
  // Get user's XP and level
  getProgress: protectedProcedure
    .query(async ({ ctx }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          experience: true,
          level: true,
          sparklePoints: true,
          premiumPoints: true,
        },
      })

      const gamificationService = new GamificationService(ctx.db)
      const nextLevelXP = gamificationService.calculateXPForLevel((user?.level || 1) + 1)
      const currentLevelXP = gamificationService.calculateXPForLevel(user?.level || 1)

      return {
        experience: user?.experience || 0,
        level: user?.level || 1,
        sparklePoints: user?.sparklePoints || 0,
        premiumPoints: user?.premiumPoints || 0,
        nextLevelXP,
        currentLevelXP,
        progress: ((user?.experience || 0) - currentLevelXP) / (nextLevelXP - currentLevelXP),
      }
    }),

  // Get user's achievements
  getAchievements: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      cursor: z.string().optional(),
      filter: z.enum(['all', 'unlocked', 'locked', 'showcased']).default('all'),
    }))
    .query(async ({ ctx, input }) => {
      const whereClause: any = {
        userId: ctx.session.user.id,
      }

      if (input.filter === 'unlocked') {
        whereClause.unlockedAt = { not: null }
      } else if (input.filter === 'locked') {
        whereClause.unlockedAt = null
      } else if (input.filter === 'showcased') {
        whereClause.showcased = true
      }

      const achievements = await ctx.db.userAchievement.findMany({
        where: whereClause,
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        include: {
          achievement: true,
        },
        orderBy: [
          { showcased: 'desc' },
          { unlockedAt: 'desc' },
        ],
      })

      let nextCursor: string | undefined = undefined
      if (achievements.length > input.limit) {
        const nextItem = achievements.pop()
        nextCursor = nextItem!.id
      }

      return {
        items: achievements,
        nextCursor,
      }
    }),

  // Get active quests
  getQuests: protectedProcedure
    .query(async ({ ctx }) => {
      const gamificationService = new GamificationService(ctx.db)
      return gamificationService.getActiveQuests(ctx.session.user.id)
    }),

  // Claim quest rewards
  claimQuestReward: protectedProcedure
    .input(z.object({
      questId: z.string().cuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const quest = await ctx.db.userQuest.findUnique({
        where: {
          userId_questId: {
            userId: ctx.session.user.id,
            questId: input.questId,
          },
        },
        include: {
          quest: true,
        },
      })

      if (!quest || quest.status !== 'COMPLETED') {
        throw new Error('Quest not completed or already claimed')
      }

      await ctx.db.userQuest.update({
        where: {
          userId_questId: {
            userId: ctx.session.user.id,
            questId: input.questId,
          },
        },
        data: {
          status: 'CLAIMED',
          claimedAt: new Date(),
        },
      })

      return { success: true }
    }),

  // Get leaderboard
  getLeaderboard: publicProcedure
    .input(z.object({
      type: z.enum(['xp', 'sparklePoints', 'achievements']).default('xp'),
      period: z.enum(['daily', 'weekly', 'monthly', 'alltime']).default('weekly'),
      limit: z.number().min(1).max(100).default(10),
    }))
    .query(async ({ ctx, input }) => {
      const gamificationService = new GamificationService(ctx.db)
      return gamificationService.getLeaderboard(
        input.type,
        input.period,
        input.limit
      )
    }),

  // Showcase achievement
  showcaseAchievement: protectedProcedure
    .input(z.object({
      achievementId: z.string().cuid(),
      showcased: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check ownership
      const userAchievement = await ctx.db.userAchievement.findUnique({
        where: {
          userId_achievementId: {
            userId: ctx.session.user.id,
            achievementId: input.achievementId,
          },
        },
      })

      if (!userAchievement || !userAchievement.unlockedAt) {
        throw new Error('Achievement not unlocked')
      }

      // Update showcase status
      await ctx.db.userAchievement.update({
        where: {
          userId_achievementId: {
            userId: ctx.session.user.id,
            achievementId: input.achievementId,
          },
        },
        data: {
          showcased: input.showcased,
          showcaseOrder: input.showcased ? 0 : null,
        },
      })

      return { success: true }
    }),
})
```
