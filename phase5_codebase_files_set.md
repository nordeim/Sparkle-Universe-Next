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

# Phase 5: src/server/api/routers/gamification.ts
```ts
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

```

# Phase 5: src/server/services/gamification.service.ts
```ts
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

# Phase 5: src/components/features/gamification/achievement-details-modal.tsx
```tsx
// src/components/features/gamification/achievement-details-modal.tsx
'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Trophy,
  Star,
  Sparkles,
  Users,
  Clock,
  TrendingUp,
  Award,
  Lock,
  CheckCircle2,
  Calendar,
  Target,
  Zap,
  Share2,
  Twitter,
  Facebook,
  Link2,
} from 'lucide-react'
import { api } from '@/lib/api'
import { achievements, getAchievementById } from '@/config/achievements'
import { cn } from '@/lib/utils'
import { formatNumber, formatDate, formatRelativeTime } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import confetti from 'canvas-confetti'

interface AchievementDetailsModalProps {
  achievementId: string
  isUnlocked: boolean
  progress?: {
    currentValue: number
    targetValue: number
    percentage: number
  }
  onClose: () => void
}

interface LeaderboardEntry {
  rank: number
  user: {
    id: string
    username: string
    image?: string | null
    level: number
  }
  unlockedAt: Date
  timeToUnlock: number // in days
}

export function AchievementDetailsModal({
  achievementId,
  isUnlocked,
  progress,
  onClose,
}: AchievementDetailsModalProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [shareMenuOpen, setShareMenuOpen] = useState(false)
  
  // Get achievement details from config
  const achievement = getAchievementById(achievementId)
  
  // Get database achievement details with additional stats
  const { data: dbAchievement, isLoading: loadingDb } = api.gamification.getAchievementDetails.useQuery({
    achievementId,
  })
  
  // Get users who unlocked this achievement
  const { data: unlockers, isLoading: loadingUnlockers } = api.gamification.getAchievementUnlockers.useQuery({
    achievementId,
    limit: 10,
  })
  
  // Get user's specific achievement data
  const { data: userAchievement } = api.gamification.getUserAchievement.useQuery({
    achievementId,
  })
  
  // Get related achievements
  const { data: relatedAchievements } = api.gamification.getRelatedAchievements.useQuery({
    achievementId,
    limit: 5,
  })
  
  // Share achievement mutation
  const shareAchievement = api.gamification.shareAchievement.useMutation({
    onSuccess: () => {
      toast({
        title: 'Achievement Shared!',
        description: 'Your achievement has been shared with your followers.',
      })
      
      // Trigger confetti
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      })
    },
  })

  if (!achievement) {
    return null
  }

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

  const getCompletionDifficulty = (percentage: number) => {
    if (percentage < 1) return { label: 'Mythic', color: 'text-pink-500' }
    if (percentage < 5) return { label: 'Legendary', color: 'text-yellow-500' }
    if (percentage < 10) return { label: 'Epic', color: 'text-purple-500' }
    if (percentage < 25) return { label: 'Rare', color: 'text-blue-500' }
    if (percentage < 50) return { label: 'Uncommon', color: 'text-green-500' }
    return { label: 'Common', color: 'text-gray-500' }
  }

  const handleShare = (platform: 'twitter' | 'facebook' | 'link') => {
    const shareText = `I just unlocked the "${achievement.name}" achievement on Sparkle Universe! 🏆`
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/achievements/${achievementId}`

    switch (platform) {
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
          '_blank'
        )
        break
      case 'facebook':
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
          '_blank'
        )
        break
      case 'link':
        navigator.clipboard.writeText(shareUrl)
        toast({
          title: 'Link Copied!',
          description: 'Achievement link has been copied to your clipboard.',
        })
        break
    }

    // Track share in database
    if (isUnlocked) {
      shareAchievement.mutate({ achievementId, platform })
    }
  }

  const completionPercentage = dbAchievement?.stats?.completionRate || 0
  const difficulty = getCompletionDifficulty(completionPercentage)

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0">
        {/* Header with gradient background */}
        <div className={cn(
          "relative h-32 bg-gradient-to-br",
          getRarityColor(achievement.rarity)
        )}>
          {/* Achievement icon */}
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-5xl shadow-xl">
                {isUnlocked ? achievement.icon : <Lock className="w-10 h-10 text-gray-400" />}
              </div>
              {isUnlocked && (
                <motion.div
                  className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Animated sparkles for mythic achievements */}
          {achievement.rarity === 'mythic' && isUnlocked && (
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full"
                  initial={{
                    x: Math.random() * 100 + '%',
                    y: Math.random() * 100 + '%',
                    opacity: 0,
                  }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1.5, 0],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </div>
          )}

          {/* Share button */}
          {isUnlocked && (
            <div className="absolute top-4 right-4">
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/20 backdrop-blur hover:bg-white/30"
                onClick={() => setShareMenuOpen(!shareMenuOpen)}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              
              {shareMenuOpen && (
                <Card className="absolute right-0 mt-2 p-2 w-48 z-50">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleShare('twitter')}
                  >
                    <Twitter className="w-4 h-4 mr-2" />
                    Share on Twitter
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleShare('facebook')}
                  >
                    <Facebook className="w-4 h-4 mr-2" />
                    Share on Facebook
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleShare('link')}
                  >
                    <Link2 className="w-4 h-4 mr-2" />
                    Copy Link
                  </Button>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Title and badges */}
          <div className="text-center mb-6">
            <DialogTitle className="text-2xl font-bold mb-2">
              {achievement.name}
            </DialogTitle>
            <DialogDescription className="text-base mb-3">
              {achievement.description}
            </DialogDescription>
            
            <div className="flex items-center justify-center gap-2">
              <Badge 
                className={cn(
                  'text-white',
                  getRarityBadgeColor(achievement.rarity)
                )}
              >
                {achievement.rarity}
              </Badge>
              
              {dbAchievement?.stats && (
                <>
                  <Badge variant="outline">
                    {formatNumber(dbAchievement.stats.totalUnlocked)} players
                  </Badge>
                  <Badge variant="outline" className={difficulty.color}>
                    {difficulty.label} ({completionPercentage.toFixed(1)}%)
                  </Badge>
                </>
              )}
              
              {achievement.seasonal && (
                <Badge variant="outline" className="border-orange-500 text-orange-500">
                  <Calendar className="w-3 h-3 mr-1" />
                  Seasonal
                </Badge>
              )}
              
              {achievement.hidden && (
                <Badge variant="outline" className="border-purple-500 text-purple-500">
                  Hidden
                </Badge>
              )}
            </div>
          </div>

          {/* Progress bar for locked achievements */}
          {!isUnlocked && progress && progress.percentage > 0 && (
            <Card className="mb-6 p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Progress</span>
                  <span className="text-muted-foreground">
                    {progress.currentValue} / {progress.targetValue}
                  </span>
                </div>
                <Progress value={progress.percentage} className="h-2" />
                <p className="text-xs text-center text-muted-foreground">
                  {progress.percentage.toFixed(1)}% Complete
                </p>
              </div>
            </Card>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="requirements">Requirements</TabsTrigger>
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
              <TabsTrigger value="related">Related</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[300px] mt-4">
              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                {/* Rewards */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Trophy className="w-4 h-4" />
                      Rewards
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-500">
                          {formatNumber(achievement.xp)}
                        </div>
                        <p className="text-xs text-muted-foreground">XP</p>
                      </div>
                      {achievement.sparklePoints && (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-500">
                            {formatNumber(achievement.sparklePoints)}
                          </div>
                          <p className="text-xs text-muted-foreground">Sparkle Points</p>
                        </div>
                      )}
                      {dbAchievement?.badgeId && (
                        <div className="text-center">
                          <div className="text-2xl">🎖️</div>
                          <p className="text-xs text-muted-foreground">Special Badge</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Stats */}
                {dbAchievement?.stats && (
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Statistics
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">First Unlocked</span>
                          <span className="text-sm font-medium">
                            {dbAchievement.stats.firstUnlockedBy?.username || 'No one yet'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Average Time to Unlock</span>
                          <span className="text-sm font-medium">
                            {dbAchievement.stats.avgTimeToUnlock 
                              ? `${Math.round(dbAchievement.stats.avgTimeToUnlock)} days`
                              : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Unlock Rate</span>
                          <span className="text-sm font-medium">
                            {dbAchievement.stats.unlockRate?.toFixed(2) || '0'}% per day
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* User's unlock details */}
                {isUnlocked && userAchievement && (
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        Your Achievement
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Unlocked</span>
                          <span className="text-sm font-medium">
                            {formatDate(userAchievement.unlockedAt)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Time Taken</span>
                          <span className="text-sm font-medium">
                            {formatRelativeTime(userAchievement.timeToUnlock)}
                          </span>
                        </div>
                        {userAchievement.showcased && (
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Showcased</span>
                            <Badge variant="secondary" className="text-xs">
                              On Profile
                            </Badge>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Requirements Tab */}
              <TabsContent value="requirements" className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      How to Unlock
                    </h3>
                    
                    {/* Prerequisites */}
                    {achievement.prerequisiteIds && achievement.prerequisiteIds.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-2">Prerequisites:</p>
                        <div className="space-y-1">
                          {achievement.prerequisiteIds.map(preId => {
                            const preAchievement = getAchievementById(preId)
                            return preAchievement ? (
                              <div key={preId} className="flex items-center gap-2 text-sm">
                                <span>{preAchievement.icon}</span>
                                <span>{preAchievement.name}</span>
                              </div>
                            ) : null
                          })}
                        </div>
                      </div>
                    )}

                    {/* Criteria */}
                    <div className="space-y-2">
                      {achievement.criteria && Object.entries(achievement.criteria).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between py-2 border-b last:border-0">
                          <span className="text-sm capitalize">
                            {key.replace(/_/g, ' ')}
                          </span>
                          <span className="text-sm font-medium">
                            {typeof value === 'number' ? formatNumber(value) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Tips */}
                    {dbAchievement?.tips && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-1">💡 Tips</p>
                        <p className="text-sm text-muted-foreground">
                          {dbAchievement.tips}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Leaderboard Tab */}
              <TabsContent value="leaderboard" className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      First to Unlock
                    </h3>
                    
                    {loadingUnlockers ? (
                      <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                        ))}
                      </div>
                    ) : unlockers && unlockers.length > 0 ? (
                      <div className="space-y-2">
                        {unlockers.map((entry: LeaderboardEntry, index) => (
                          <motion.div
                            key={entry.user.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                                index === 0 ? "bg-yellow-500 text-white" :
                                index === 1 ? "bg-gray-400 text-white" :
                                index === 2 ? "bg-orange-600 text-white" :
                                "bg-muted"
                              )}>
                                {index + 1}
                              </div>
                              <div className="flex items-center gap-2">
                                {entry.user.image && (
                                  <img
                                    src={entry.user.image}
                                    alt={entry.user.username}
                                    className="w-6 h-6 rounded-full"
                                  />
                                )}
                                <div>
                                  <p className="text-sm font-medium">{entry.user.username}</p>
                                  <p className="text-xs text-muted-foreground">Level {entry.user.level}</p>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">
                                {formatRelativeTime(entry.unlockedAt)}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-4">
                        Be the first to unlock this achievement!
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Related Tab */}
              <TabsContent value="related" className="space-y-4">
                {relatedAchievements && relatedAchievements.length > 0 ? (
                  relatedAchievements.map((related: any) => (
                    <Card key={related.id} className="hover:bg-muted/50 transition-colors cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center text-xl",
                            related.unlocked 
                              ? `bg-gradient-to-br ${getRarityColor(related.rarity)} text-white`
                              : 'bg-muted'
                          )}>
                            {related.unlocked ? related.icon : <Lock className="w-5 h-5" />}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm">{related.name}</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {related.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {related.rarity}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {related.xp} XP
                              </span>
                              {related.unlocked && (
                                <Badge variant="secondary" className="text-xs">
                                  Unlocked
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No related achievements found</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
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

