// src/server/api/routers/user.ts
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { 
  createTRPCRouter, 
  publicProcedure, 
  protectedProcedure 
} from '@/server/api/trpc'
import { UserService } from '@/server/services/user.service'
import { CacheService } from '@/server/services/cache.service'
import { EventService } from '@/server/services/event.service'
import { ActivityService } from '@/server/services/activity.service'
import { UserRole } from '@prisma/client'

const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  website: z.string().url().optional().or(z.literal('')),
  twitterUsername: z.string().max(15).optional(),
  instagramUsername: z.string().max(30).optional(),
  tiktokUsername: z.string().max(24).optional(),
  discordUsername: z.string().max(32).optional(),
  youtubeChannelId: z.string().optional(),
  interests: z.array(z.string()).max(10).optional(),
  skills: z.array(z.string()).max(10).optional(),
  pronouns: z.string().max(20).optional(),
  themePreference: z.any().optional(),
  notificationSettings: z.any().optional(),
  privacySettings: z.any().optional(),
})

const userPreferencesSchema = z.object({
  preferredLanguage: z.string().default('en'),
  timezone: z.string().default('UTC'),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
})

export const userRouter = createTRPCRouter({
  // Get user profile by username
  getProfile: publicProcedure
    .input(z.object({
      username: z.string().min(1).max(50),
    }))
    .query(async ({ ctx, input }) => {
      const userService = new UserService(ctx.db)
      const cacheService = new CacheService()
      
      // Try cache first
      const cacheKey = `user:profile:${input.username}`
      const cached = await cacheService.get(cacheKey)
      if (cached) return cached

      const profile = await userService.getProfileByUsername(input.username)
      
      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        })
      }

      // Cache for 5 minutes
      await cacheService.set(cacheKey, profile, 300)
      
      return profile
    }),

  // Get current user's profile
  me: protectedProcedure
    .query(async ({ ctx }) => {
      const userService = new UserService(ctx.db)
      return userService.getProfileById(ctx.session.user.id)
    }),

  // Update user profile
  updateProfile: protectedProcedure
    .input(updateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const userService = new UserService(ctx.db)
      const eventService = new EventService()
      const cacheService = new CacheService()
      
      const updatedProfile = await userService.updateProfile(
        ctx.session.user.id, 
        input
      )

      // Emit profile update event
      await eventService.emit('user.profile.updated', {
        userId: ctx.session.user.id,
        changes: input,
      })

      // Invalidate cache
      await cacheService.delPattern(`user:profile:${updatedProfile.username}`)
      await cacheService.delPattern(`user:stats:${ctx.session.user.id}`)
      
      return updatedProfile
    }),

  // Update user preferences
  updatePreferences: protectedProcedure
    .input(userPreferencesSchema)
    .mutation(async ({ ctx, input }) => {
      const userService = new UserService(ctx.db)
      return userService.updatePreferences(ctx.session.user.id, input)
    }),

  // Follow a user
  follow: protectedProcedure
    .input(z.object({
      userId: z.string().cuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.id === input.userId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You cannot follow yourself',
        })
      }

      const userService = new UserService(ctx.db)
      const eventService = new EventService()
      const activityService = new ActivityService(ctx.db)
      
      const result = await userService.followUser(
        ctx.session.user.id, 
        input.userId
      )

      // Track activity
      await activityService.trackActivity({
        userId: ctx.session.user.id,
        action: 'user.followed',
        entityType: 'user',
        entityId: input.userId,
        visibility: 'PUBLIC',
      })

      // Emit follow event for real-time updates
      await eventService.emit('user.followed', {
        followerId: ctx.session.user.id,
        followingId: input.userId,
      })
      
      return result
    }),

  // Unfollow a user
  unfollow: protectedProcedure
    .input(z.object({
      userId: z.string().cuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userService = new UserService(ctx.db)
      const eventService = new EventService()
      
      const result = await userService.unfollowUser(
        ctx.session.user.id, 
        input.userId
      )

      // Emit unfollow event
      await eventService.emit('user.unfollowed', {
        followerId: ctx.session.user.id,
        followingId: input.userId,
      })
      
      return result
    }),

  // Get user's followers
  getFollowers: publicProcedure
    .input(z.object({
      userId: z.string().cuid(),
      limit: z.number().min(1).max(100).default(20),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const userService = new UserService(ctx.db)
      return userService.getFollowers({
        ...input,
        viewerId: ctx.session?.user?.id,
      })
    }),

  // Get users that a user is following
  getFollowing: publicProcedure
    .input(z.object({
      userId: z.string().cuid(),
      limit: z.number().min(1).max(100).default(20),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const userService = new UserService(ctx.db)
      return userService.getFollowing({
        ...input,
        viewerId: ctx.session?.user?.id,
      })
    }),

  // Check if current user follows a specific user
  isFollowing: protectedProcedure
    .input(z.object({
      userId: z.string().cuid(),
    }))
    .query(async ({ ctx, input }) => {
      const userService = new UserService(ctx.db)
      return userService.isFollowing(ctx.session.user.id, input.userId)
    }),

  // Get user statistics
  getStats: publicProcedure
    .input(z.object({
      userId: z.string().cuid(),
    }))
    .query(async ({ ctx, input }) => {
      const userService = new UserService(ctx.db)
      const cacheService = new CacheService()
      
      // Try cache first
      const cacheKey = `user:stats:${input.userId}`
      const cached = await cacheService.get(cacheKey)
      if (cached) return cached

      const stats = await userService.getUserStats(input.userId)
      
      // Cache for 1 hour
      await cacheService.set(cacheKey, stats, 3600)
      
      return stats
    }),

  // Block a user
  block: protectedProcedure
    .input(z.object({
      userId: z.string().cuid(),
      reason: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.id === input.userId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You cannot block yourself',
        })
      }

      const userService = new UserService(ctx.db)
      const eventService = new EventService()
      
      const result = await userService.blockUser(
        ctx.session.user.id, 
        input.userId,
        input.reason
      )

      // Emit block event
      await eventService.emit('user.blocked', {
        blockerId: ctx.session.user.id,
        blockedId: input.userId,
      })

      return result
    }),

  // Unblock a user
  unblock: protectedProcedure
    .input(z.object({
      userId: z.string().cuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userService = new UserService(ctx.db)
      return userService.unblockUser(ctx.session.user.id, input.userId)
    }),

  // Get blocked users
  getBlockedUsers: protectedProcedure
    .query(async ({ ctx }) => {
      const userService = new UserService(ctx.db)
      return userService.getBlockedUsers(ctx.session.user.id)
    }),

  // Search users (for mentions and general search)
  search: publicProcedure
    .input(z.object({
      query: z.string().min(1).max(100),
      limit: z.number().min(1).max(50).default(10),
      excludeIds: z.array(z.string()).optional(),
      type: z.enum(['all', 'mentions', 'creators']).default('all'),
    }))
    .query(async ({ ctx, input }) => {
      const userService = new UserService(ctx.db)
      const cacheService = new CacheService()

      // Cache key for search results
      const cacheKey = `user:search:${input.type}:${input.query}:${input.limit}`
      
      // Try cache for non-personalized searches
      if (!input.excludeIds || input.excludeIds.length === 0) {
        const cached = await cacheService.get(cacheKey)
        if (cached) return cached
      }

      const results = await userService.searchUsers({
        ...input,
        currentUserId: ctx.session?.user?.id,
      })

      // Cache for 1 minute
      if (!input.excludeIds || input.excludeIds.length === 0) {
        await cacheService.set(cacheKey, results, 60)
      }

      return results
    }),

  // Get recommended users to follow
  getRecommendations: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(20).default(5),
    }))
    .query(async ({ ctx, input }) => {
      const userService = new UserService(ctx.db)
      return userService.getRecommendedUsers(ctx.session.user.id, input.limit)
    }),

  // Get online status
  getOnlineStatus: publicProcedure
    .input(z.object({
      userIds: z.array(z.string().cuid()).max(100),
    }))
    .query(async ({ ctx, input }) => {
      const userService = new UserService(ctx.db)
      return userService.getOnlineStatus(input.userIds)
    }),

  // Update online status
  updateOnlineStatus: protectedProcedure
    .input(z.object({
      isOnline: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userService = new UserService(ctx.db)
      const eventService = new EventService()
      
      await userService.updateOnlineStatus(
        ctx.session.user.id,
        input.isOnline
      )

      // Emit status change
      await eventService.emit(
        input.isOnline ? 'user.online' : 'user.offline',
        { userId: ctx.session.user.id }
      )

      return { success: true }
    }),

  // Get user's achievements
  getAchievements: publicProcedure
    .input(z.object({
      userId: z.string().cuid(),
      showcasedOnly: z.boolean().default(false),
    }))
    .query(async ({ ctx, input }) => {
      const userService = new UserService(ctx.db)
      return userService.getUserAchievements(input.userId, input.showcasedOnly)
    }),

  // Delete user account
  deleteAccount: protectedProcedure
    .input(z.object({
      password: z.string().min(1),
      confirmation: z.literal('DELETE MY ACCOUNT'),
    }))
    .mutation(async ({ ctx, input }) => {
      const userService = new UserService(ctx.db)
      const eventService = new EventService()
      
      // Verify password
      const isValid = await userService.verifyPassword(
        ctx.session.user.id, 
        input.password
      )
      
      if (!isValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid password',
        })
      }

      // Perform account deletion with author preservation
      await userService.deleteAccount(ctx.session.user.id)

      // Emit account deletion event
      await eventService.emit('user.account.deleted', {
        userId: ctx.session.user.id,
      })

      return { success: true }
    }),

  // Report a user
  report: protectedProcedure
    .input(z.object({
      userId: z.string().cuid(),
      reason: z.enum([
        'SPAM',
        'INAPPROPRIATE',
        'HARASSMENT',
        'MISINFORMATION',
        'HATE_SPEECH',
        'SELF_HARM',
        'OTHER',
      ]),
      description: z.string().max(1000),
      evidence: z.any().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.id === input.userId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You cannot report yourself',
        })
      }

      const userService = new UserService(ctx.db)
      return userService.reportUser({
        ...input,
        reporterId: ctx.session.user.id,
      })
    }),
})
