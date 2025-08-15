// src/server/api/routers/user.ts
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { 
  createTRPCRouter, 
  publicProcedure, 
  protectedProcedure 
} from '@/server/api/trpc'
import { 
  updateProfileSchema, 
  userPreferencesSchema 
} from '@/lib/validations/user'
import { UserService } from '@/server/services/user.service'
import { CacheService } from '@/server/services/cache.service'
import { EventService } from '@/server/services/event.service'

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
      const cacheService = new CacheService()
      await cacheService.invalidate(`user:profile:${updatedProfile.username}`)
      
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
      
      const result = await userService.followUser(
        ctx.session.user.id, 
        input.userId
      )

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
      return userService.getFollowers(input)
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
      return userService.getFollowing(input)
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
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.id === input.userId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You cannot block yourself',
        })
      }

      const userService = new UserService(ctx.db)
      return userService.blockUser(ctx.session.user.id, input.userId)
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

  // Search users
  search: publicProcedure
    .input(z.object({
      query: z.string().min(1).max(100),
      limit: z.number().min(1).max(50).default(10),
    }))
    .query(async ({ ctx, input }) => {
      const userService = new UserService(ctx.db)
      return userService.searchUsers(input.query, input.limit)
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

      // Delete account
      await userService.deleteAccount(ctx.session.user.id)

      // Emit account deletion event
      await eventService.emit('user.account.deleted', {
        userId: ctx.session.user.id,
      })

      return { success: true }
    }),
})
