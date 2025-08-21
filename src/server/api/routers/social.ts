// src/server/api/routers/social.ts
import { z } from "zod"
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc"
import { TRPCError } from "@trpc/server"

export const socialRouter = createTRPCRouter({
  // Follow a user
  follow: protectedProcedure
    .input(z.object({
      userId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = input
      const followerId = ctx.session.user.id

      if (userId === followerId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You cannot follow yourself',
        })
      }

      // Check if already following
      const existingFollow = await ctx.db.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId,
            followingId: userId,
          },
        },
      })

      if (existingFollow) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You are already following this user',
        })
      }

      // Create follow relationship
      const follow = await ctx.db.follow.create({
        data: {
          followerId,
          followingId: userId,
        },
      })

      // Create notification
      await ctx.db.notification.create({
        data: {
          userId,
          type: 'USER_FOLLOWED',
          actorId: followerId,
          entityId: followerId,
          entityType: 'user',
          title: 'New Follower',
          message: `Someone started following you`,
        },
      })

      return follow
    }),

  // Unfollow a user
  unfollow: protectedProcedure
    .input(z.object({
      userId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = input
      const followerId = ctx.session.user.id

      const follow = await ctx.db.follow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId: userId,
          },
        },
      })

      return follow
    }),

  // Get followers of a user
  getFollowers: publicProcedure
    .input(z.object({
      userId: z.string(),
      limit: z.number().min(1).max(100).default(20),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { userId, limit, cursor } = input

      const followers = await ctx.db.follow.findMany({
        where: {
          followingId: userId,
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              image: true,
              role: true,
              profile: {
                select: {
                  displayName: true,
                  bio: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      let nextCursor: typeof cursor | undefined = undefined
      if (followers.length > limit) {
        const nextItem = followers.pop()
        nextCursor = nextItem!.id
      }

      return {
        followers,
        nextCursor,
      }
    }),

  // Get users that a user is following
  getFollowing: publicProcedure
    .input(z.object({
      userId: z.string(),
      limit: z.number().min(1).max(100).default(20),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { userId, limit, cursor } = input

      const following = await ctx.db.follow.findMany({
        where: {
          followerId: userId,
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        include: {
          following: {
            select: {
              id: true,
              username: true,
              image: true,
              role: true,
              profile: {
                select: {
                  displayName: true,
                  bio: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      let nextCursor: typeof cursor | undefined = undefined
      if (following.length > limit) {
        const nextItem = following.pop()
        nextCursor = nextItem!.id
      }

      return {
        following,
        nextCursor,
      }
    }),

  // Check if current user follows another user
  isFollowing: protectedProcedure
    .input(z.object({
      userId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const follow = await ctx.db.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: ctx.session.user.id,
            followingId: input.userId,
          },
        },
      })

      return { isFollowing: !!follow }
    }),

  // Get suggested users to follow
  getSuggestions: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(10).default(5),
    }))
    .query(async ({ ctx, input }) => {
      const currentUserId = ctx.session.user.id

      // Get users the current user is already following
      const following = await ctx.db.follow.findMany({
        where: { followerId: currentUserId },
        select: { followingId: true },
      })

      const followingIds = following.map(f => f.followingId)
      followingIds.push(currentUserId) // Don't suggest self

      // Find popular users not being followed
      const suggestions = await ctx.db.user.findMany({
        where: {
          id: { notIn: followingIds },
          deleted: false,
          status: 'ACTIVE',
        },
        select: {
          id: true,
          username: true,
          image: true,
          role: true,
          profile: {
            select: {
              displayName: true,
              bio: true,
            },
          },
          _count: {
            select: {
              followers: true,
              posts: true,
            },
          },
        },
        orderBy: {
          followers: {
            _count: 'desc',
          },
        },
        take: input.limit,
      })

      return suggestions
    }),
})
