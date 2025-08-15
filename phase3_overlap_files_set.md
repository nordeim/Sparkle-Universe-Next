# src/server/api/routers/comment.ts
```ts
// src/server/api/routers/comment.ts
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { 
  createTRPCRouter, 
  publicProcedure, 
  protectedProcedure 
} from '@/server/api/trpc'
import { CommentService } from '@/server/services/comment.service'
import { CacheService } from '@/server/services/cache.service'
import { EventService } from '@/server/services/event.service'
import { MentionService } from '@/server/services/mention.service'
import { ReactionType } from '@prisma/client'

const createCommentSchema = z.object({
  postId: z.string().cuid(),
  content: z.string()
    .min(1, 'Comment cannot be empty')
    .max(5000, 'Comment must be less than 5000 characters'),
  parentId: z.string().cuid().optional(),
  youtubeTimestamp: z.number().int().positive().optional(),
  quotedTimestamp: z.string().optional(),
  mentions: z.array(z.string()).optional(),
})

const updateCommentSchema = z.object({
  id: z.string().cuid(),
  content: z.string()
    .min(1, 'Comment cannot be empty')
    .max(5000, 'Comment must be less than 5000 characters'),
})

export const commentRouter = createTRPCRouter({
  // Create a new comment
  create: protectedProcedure
    .input(createCommentSchema)
    .mutation(async ({ ctx, input }) => {
      const commentService = new CommentService(ctx.db)
      const eventService = new EventService()
      const mentionService = new MentionService(ctx.db)
      
      // Create comment
      const comment = await commentService.createComment({
        ...input,
        authorId: ctx.session.user.id,
      })

      // Process mentions
      if (input.mentions && input.mentions.length > 0) {
        await mentionService.processMentions({
          mentionerId: ctx.session.user.id,
          mentionedUsernames: input.mentions,
          commentId: comment.id,
          postId: input.postId,
        })
      }

      // Emit real-time event
      await eventService.emit('comment.created', {
        postId: input.postId,
        comment: {
          ...comment,
          author: {
            id: ctx.session.user.id,
            username: ctx.session.user.username,
            image: ctx.session.user.image,
          },
        },
      })

      return comment
    }),

  // Update existing comment
  update: protectedProcedure
    .input(updateCommentSchema)
    .mutation(async ({ ctx, input }) => {
      const commentService = new CommentService(ctx.db)
      const eventService = new EventService()
      
      const comment = await commentService.updateComment(
        input.id,
        ctx.session.user.id,
        input.content
      )

      // Emit real-time event
      await eventService.emit('comment.updated', {
        postId: comment.postId,
        commentId: comment.id,
        content: comment.content,
      })

      return comment
    }),

  // Delete comment
  delete: protectedProcedure
    .input(z.object({
      id: z.string().cuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const commentService = new CommentService(ctx.db)
      const eventService = new EventService()
      
      const result = await commentService.deleteComment(
        input.id, 
        ctx.session.user.id
      )

      // Emit real-time event
      await eventService.emit('comment.deleted', {
        postId: result.postId,
        commentId: input.id,
      })

      return { success: true }
    }),

  // Add or update reaction
  react: protectedProcedure
    .input(z.object({
      commentId: z.string().cuid(),
      type: z.nativeEnum(ReactionType),
      remove: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const commentService = new CommentService(ctx.db)
      const eventService = new EventService()
      
      let result
      if (input.remove) {
        result = await commentService.removeReaction(
          input.commentId,
          ctx.session.user.id,
          input.type
        )
      } else {
        result = await commentService.addReaction(
          input.commentId,
          ctx.session.user.id,
          input.type
        )
      }

      // Get updated reaction counts
      const reactionCounts = await commentService.getCommentReactions(input.commentId)

      // Emit real-time event
      await eventService.emit('comment.reaction', {
        commentId: input.commentId,
        userId: ctx.session.user.id,
        type: input.type,
        action: result.action,
        reactionCounts,
      })

      return { ...result, reactionCounts }
    }),

  // Legacy like endpoint (for backward compatibility)
  like: protectedProcedure
    .input(z.object({
      commentId: z.string().cuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const commentService = new CommentService(ctx.db)
      const eventService = new EventService()
      
      const result = await commentService.likeComment(
        input.commentId, 
        ctx.session.user.id
      )

      // Emit real-time event
      await eventService.emit('comment.liked', {
        commentId: input.commentId,
        userId: ctx.session.user.id,
        likes: result.likes,
      })

      return result
    }),

  // Legacy unlike endpoint
  unlike: protectedProcedure
    .input(z.object({
      commentId: z.string().cuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const commentService = new CommentService(ctx.db)
      const eventService = new EventService()
      
      const result = await commentService.unlikeComment(
        input.commentId, 
        ctx.session.user.id
      )

      // Emit real-time event
      await eventService.emit('comment.unliked', {
        commentId: input.commentId,
        userId: ctx.session.user.id,
        likes: result.likes,
      })

      return result
    }),

  // List comments for a post
  list: publicProcedure
    .input(z.object({
      postId: z.string().cuid(),
      limit: z.number().min(1).max(50).default(20),
      cursor: z.string().optional(),
      sortBy: z.enum(['newest', 'oldest', 'popular']).default('newest'),
      parentId: z.string().cuid().optional().nullable(),
    }))
    .query(async ({ ctx, input }) => {
      const commentService = new CommentService(ctx.db)
      const cacheService = new CacheService()
      
      // Try cache for first page of top-level comments
      if (!input.cursor && !input.parentId && input.sortBy === 'newest') {
        const cacheKey = `comments:${input.postId}:${input.limit}`
        const cached = await cacheService.get(cacheKey)
        if (cached) return cached
      }

      const result = await commentService.listComments({
        ...input,
        userId: ctx.session?.user?.id,
      })

      // Cache first page
      if (!input.cursor && !input.parentId && input.sortBy === 'newest') {
        const cacheKey = `comments:${input.postId}:${input.limit}`
        await cacheService.set(cacheKey, result, 60) // 1 minute cache
      }

      return result
    }),

  // Get single comment with context
  get: publicProcedure
    .input(z.object({
      id: z.string().cuid(),
    }))
    .query(async ({ ctx, input }) => {
      const commentService = new CommentService(ctx.db)
      return commentService.getComment(input.id, ctx.session?.user?.id)
    }),

  // Get comment thread (all replies)
  getThread: publicProcedure
    .input(z.object({
      commentId: z.string().cuid(),
      limit: z.number().min(1).max(50).default(10),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const commentService = new CommentService(ctx.db)
      return commentService.getCommentThread({
        ...input,
        userId: ctx.session?.user?.id,
      })
    }),

  // Pin/unpin comment (post author only)
  togglePin: protectedProcedure
    .input(z.object({
      commentId: z.string().cuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const commentService = new CommentService(ctx.db)
      return commentService.togglePinComment(
        input.commentId,
        ctx.session.user.id
      )
    }),

  // Report a comment
  report: protectedProcedure
    .input(z.object({
      commentId: z.string().cuid(),
      reason: z.enum([
        'SPAM',
        'INAPPROPRIATE',
        'HARASSMENT',
        'MISINFORMATION',
        'HATE_SPEECH',
        'OTHER',
      ]),
      description: z.string().max(1000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const commentService = new CommentService(ctx.db)
      return commentService.reportComment({
        ...input,
        reporterId: ctx.session.user.id,
      })
    }),

  // Get user's recent comments
  getUserComments: publicProcedure
    .input(z.object({
      userId: z.string().cuid(),
      limit: z.number().min(1).max(50).default(20),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const commentService = new CommentService(ctx.db)
      return commentService.getUserComments(input)
    }),

  // Start typing indicator
  startTyping: protectedProcedure
    .input(z.object({
      postId: z.string().cuid(),
      parentId: z.string().cuid().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const eventService = new EventService()
      
      eventService.emitTyping(
        input.postId,
        ctx.session.user.id,
        ctx.session.user.username || 'User',
        true
      )

      return { success: true }
    }),

  // Stop typing indicator
  stopTyping: protectedProcedure
    .input(z.object({
      postId: z.string().cuid(),
      parentId: z.string().cuid().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const eventService = new EventService()
      
      eventService.emitTyping(
        input.postId,
        ctx.session.user.id,
        ctx.session.user.username || 'User',
        false
      )

      return { success: true }
    }),
})

```

# src/server/api/routers/notification.ts
```ts
// src/server/api/routers/notification.ts
import { z } from 'zod'
import { 
  createTRPCRouter, 
  protectedProcedure 
} from '@/server/api/trpc'
import { NotificationService } from '@/server/services/notification.service'
import { CacheService } from '@/server/services/cache.service'
import { EventService } from '@/server/services/event.service'

export const notificationRouter = createTRPCRouter({
  // List notifications
  list: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(20),
      cursor: z.string().optional(),
      unreadOnly: z.boolean().optional().default(false),
      type: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const notificationService = new NotificationService(ctx.db)
      return notificationService.listNotifications({
        ...input,
        userId: ctx.session.user.id,
      })
    }),

  // Get unread count
  getUnreadCount: protectedProcedure
    .query(async ({ ctx }) => {
      const notificationService = new NotificationService(ctx.db)
      const cacheService = new CacheService()
      
      // Try cache first
      const cacheKey = `notifications:unread:${ctx.session.user.id}`
      const cached = await cacheService.get(cacheKey)
      if (cached) return cached

      const result = await notificationService.getUnreadCount(ctx.session.user.id)
      
      // Cache for 30 seconds
      await cacheService.set(cacheKey, result, 30)
      
      return result
    }),

  // Mark as read
  markAsRead: protectedProcedure
    .input(z.object({
      id: z.string().cuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const notificationService = new NotificationService(ctx.db)
      const cacheService = new CacheService()
      const eventService = new EventService()
      
      const notification = await notificationService.markAsRead(
        input.id,
        ctx.session.user.id
      )

      // Invalidate cache
      await cacheService.del(`notifications:unread:${ctx.session.user.id}`)

      // Emit event
      await eventService.emit('notification.read', {
        userId: ctx.session.user.id,
        notificationId: input.id,
      })

      return notification
    }),

  // Mark all as read
  markAllAsRead: protectedProcedure
    .mutation(async ({ ctx }) => {
      const notificationService = new NotificationService(ctx.db)
      const cacheService = new CacheService()
      const eventService = new EventService()
      
      const result = await notificationService.markAllAsRead(ctx.session.user.id)

      // Invalidate cache
      await cacheService.del(`notifications:unread:${ctx.session.user.id}`)

      // Emit event
      await eventService.emit('notification.allRead', {
        userId: ctx.session.user.id,
      })

      return result
    }),

  // Delete notification
  delete: protectedProcedure
    .input(z.object({
      id: z.string().cuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const notificationService = new NotificationService(ctx.db)
      const cacheService = new CacheService()
      
      await notificationService.deleteNotification(
        input.id,
        ctx.session.user.id
      )

      // Invalidate cache
      await cacheService.del(`notifications:unread:${ctx.session.user.id}`)

      return { success: true }
    }),

  // Update preferences
  updatePreferences: protectedProcedure
    .input(z.object({
      emailNotifications: z.boolean().optional(),
      pushNotifications: z.boolean().optional(),
      postLikes: z.boolean().optional(),
      postComments: z.boolean().optional(),
      newFollowers: z.boolean().optional(),
      mentions: z.boolean().optional(),
      directMessages: z.boolean().optional(),
      groupInvites: z.boolean().optional(),
      eventReminders: z.boolean().optional(),
      marketingEmails: z.boolean().optional(),
      weeklyDigest: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const notificationService = new NotificationService(ctx.db)
      return notificationService.updatePreferences(
        ctx.session.user.id,
        input
      )
    }),

  // Get preferences
  getPreferences: protectedProcedure
    .query(async ({ ctx }) => {
      const notificationService = new NotificationService(ctx.db)
      return notificationService.getPreferences(ctx.session.user.id)
    }),

  // Test notification (for development)
  test: protectedProcedure
    .mutation(async ({ ctx }) => {
      const notificationService = new NotificationService(ctx.db)
      return notificationService.createNotification({
        type: 'SYSTEM',
        userId: ctx.session.user.id,
        title: 'Test Notification',
        message: 'This is a test notification',
        data: {
          timestamp: new Date(),
        },
      })
    }),
})

```

# src/server/api/routers/user.ts
```ts
// src/server/api/routers/user.ts
import { z } from 'zod'
import { 
  createTRPCRouter, 
  publicProcedure,
  protectedProcedure 
} from '@/server/api/trpc'

export const userRouter = createTRPCRouter({
  // ... existing endpoints ...

  /**
   * Search users for mentions
   */
  search: publicProcedure
    .input(z.object({
      query: z.string().min(1).max(50),
      limit: z.number().min(1).max(20).default(5),
      excludeIds: z.array(z.string()).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { query, limit, excludeIds = [] } = input

      // Search users by username or display name
      const users = await ctx.db.user.findMany({
        where: {
          AND: [
            {
              OR: [
                {
                  username: {
                    contains: query,
                    mode: 'insensitive',
                  },
                },
                {
                  profile: {
                    displayName: {
                      contains: query,
                      mode: 'insensitive',
                    },
                  },
                },
              ],
            },
            {
              id: {
                notIn: excludeIds,
              },
            },
            {
              status: 'ACTIVE',
            },
            {
              deleted: false,
            },
          ],
        },
        select: {
          id: true,
          username: true,
          image: true,
          verified: true,
          role: true,
          profile: {
            select: {
              displayName: true,
            },
          },
        },
        take: limit,
        orderBy: [
          {
            verified: 'desc', // Verified users first
          },
          {
            followers: {
              _count: 'desc', // Most followed users first
            },
          },
        ],
      })

      return users
    }),

  // ... rest of user router endpoints ...
})

```

# src/server/services/activity.service.ts
```ts
// src/server/services/activity.service.ts
import { PrismaClient } from '@prisma/client'
import { cacheService } from './cache.service'

interface ActivityData {
  userId: string
  action: string
  entityType: string
  entityId: string
  entityData?: any
  metadata?: any
  visibility?: 'PUBLIC' | 'FOLLOWERS' | 'PRIVATE'
}

export class ActivityService {
  constructor(private db: PrismaClient) {}

  /**
   * Track user activity
   */
  async trackActivity(data: ActivityData) {
    try {
      // Create activity stream entry
      const activity = await this.db.activityStream.create({
        data: {
          userId: data.userId,
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          entityData: data.entityData,
          metadata: data.metadata,
          visibility: data.visibility || 'PUBLIC',
        },
      })

      // Update daily activity stats
      await this.updateDailyStats(data.userId, data.action)

      // Update user's last activity
      await this.db.user.update({
        where: { id: data.userId },
        data: { lastSeenAt: new Date() },
      })

      // Invalidate relevant caches
      await cacheService.delPattern(`activity:${data.userId}`)
      await cacheService.delPattern(`feed:${data.userId}`)

      return activity
    } catch (error) {
      console.error('Failed to track activity:', error)
      return null
    }
  }

  /**
   * Update daily activity statistics
   */
  private async updateDailyStats(userId: string, action: string) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const updateData: any = {}

    // Map actions to stat fields
    switch (action) {
      case 'post.created':
        updateData.postsCreated = { increment: 1 }
        break
      case 'post.viewed':
        updateData.postsViewed = { increment: 1 }
        break
      case 'comment.created':
        updateData.commentsCreated = { increment: 1 }
        break
      case 'reaction.added':
        updateData.reactionsGiven = { increment: 1 }
        break
      case 'message.sent':
        updateData.messagesSent = { increment: 1 }
        break
      case 'user.login':
        updateData.loginCount = { increment: 1 }
        break
    }

    // Always update pageViews and minutesActive
    updateData.pageViews = { increment: 1 }
    updateData.minutesActive = { increment: 1 }

    try {
      await this.db.userActivity.upsert({
        where: {
          userId_date: {
            userId,
            date: today,
          },
        },
        update: updateData,
        create: {
          userId,
          date: today,
          ...Object.keys(updateData).reduce((acc, key) => {
            acc[key] = updateData[key].increment || 0
            return acc
          }, {} as any),
        },
      })
    } catch (error) {
      console.error('Failed to update daily stats:', error)
    }
  }

  /**
   * Get user's activity feed
   */
  async getUserActivityFeed(params: {
    userId: string
    limit: number
    cursor?: string
    includeFollowing?: boolean
  }) {
    const cacheKey = `activity:feed:${params.userId}:${params.limit}:${params.cursor || 'first'}`
    
    // Try cache first
    if (!params.cursor) {
      const cached = await cacheService.get(cacheKey)
      if (cached) return cached
    }

    let userIds = [params.userId]

    // Include following users if requested
    if (params.includeFollowing) {
      const following = await this.db.follow.findMany({
        where: { followerId: params.userId },
        select: { followingId: true },
      })
      userIds = [...userIds, ...following.map(f => f.followingId)]
    }

    const activities = await this.db.activityStream.findMany({
      where: {
        OR: [
          { userId: { in: userIds } },
          { visibility: 'PUBLIC' },
        ],
      },
      take: params.limit + 1,
      cursor: params.cursor ? { id: params.cursor } : undefined,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            image: true,
            profile: {
              select: {
                displayName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    let nextCursor: string | undefined = undefined
    if (activities.length > params.limit) {
      const nextItem = activities.pop()
      nextCursor = nextItem!.id
    }

    const result = {
      items: activities,
      nextCursor,
    }

    // Cache first page
    if (!params.cursor) {
      await cacheService.set(cacheKey, result, 60) // 1 minute cache
    }

    return result
  }

  /**
   * Get activity statistics for a user
   */
  async getUserActivityStats(userId: string, days: number = 30) {
    const cacheKey = `activity:stats:${userId}:${days}`
    
    const cached = await cacheService.get(cacheKey)
    if (cached) return cached

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const stats = await this.db.userActivity.aggregate({
      where: {
        userId,
        date: { gte: startDate },
      },
      _sum: {
        loginCount: true,
        pageViews: true,
        postsCreated: true,
        postsViewed: true,
        commentsCreated: true,
        reactionsGiven: true,
        messagesSent: true,
        minutesActive: true,
        xpEarned: true,
        pointsEarned: true,
        achievementsUnlocked: true,
      },
      _avg: {
        minutesActive: true,
      },
      _count: {
        date: true,
      },
    })

    const result = {
      totalDays: stats._count.date,
      totals: stats._sum,
      averages: {
        minutesPerDay: stats._avg.minutesActive || 0,
        postsPerDay: (stats._sum.postsCreated || 0) / stats._count.date,
        commentsPerDay: (stats._sum.commentsCreated || 0) / stats._count.date,
      },
    }

    await cacheService.set(cacheKey, result, 300) // 5 minute cache
    return result
  }

  /**
   * Get trending activities
   */
  async getTrendingActivities(limit: number = 20) {
    const cacheKey = `activity:trending:${limit}`
    
    const cached = await cacheService.get(cacheKey)
    if (cached) return cached

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    const trending = await this.db.activityStream.groupBy({
      by: ['entityType', 'entityId'],
      where: {
        createdAt: { gte: oneHourAgo },
        visibility: 'PUBLIC',
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

    // Enrich with entity data
    const enrichedTrending = await Promise.all(
      trending.map(async (item) => {
        let entity = null
        
        switch (item.entityType) {
          case 'post':
            entity = await this.db.post.findUnique({
              where: { id: item.entityId },
              select: {
                id: true,
                title: true,
                slug: true,
                author: {
                  select: {
                    username: true,
                    image: true,
                  },
                },
              },
            })
            break
          case 'user':
            entity = await this.db.user.findUnique({
              where: { id: item.entityId },
              select: {
                id: true,
                username: true,
                image: true,
                profile: {
                  select: {
                    displayName: true,
                  },
                },
              },
            })
            break
        }

        return {
          ...item,
          entity,
          activityCount: item._count.id,
        }
      })
    )

    await cacheService.set(cacheKey, enrichedTrending, 60) // 1 minute cache
    return enrichedTrending
  }

  /**
   * Clean up old activities
   */
  async cleanupOldActivities(daysToKeep: number = 90) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    const result = await this.db.activityStream.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    })

    return result.count
  }
}

```

# src/server/services/cache.service.ts
```ts
// src/server/services/cache.service.ts
import Redis from 'ioredis'
import { z } from 'zod'

// Cache configuration
const CACHE_PREFIX = 'sparkle:'
const DEFAULT_TTL = 300 // 5 minutes in seconds

export class CacheService {
  private static instance: CacheService
  private redis: Redis | null = null
  private isConnected: boolean = false

  constructor() {
    // Singleton pattern
    if (CacheService.instance) {
      return CacheService.instance
    }

    this.initializeRedis()
    CacheService.instance = this
  }

  private initializeRedis() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
      
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true,
        retryStrategy: (times) => {
          if (times > 3) {
            console.error('Redis connection failed after 3 retries')
            return null
          }
          return Math.min(times * 200, 2000)
        },
      })

      this.redis.on('connect', () => {
        this.isConnected = true
        console.log('Redis connected successfully')
      })

      this.redis.on('error', (error) => {
        console.error('Redis error:', error)
        this.isConnected = false
      })

      this.redis.on('close', () => {
        this.isConnected = false
        console.log('Redis connection closed')
      })

      // Connect to Redis
      this.redis.connect().catch((error) => {
        console.error('Failed to connect to Redis:', error)
        this.isConnected = false
      })
    } catch (error) {
      console.error('Failed to initialize Redis:', error)
      this.redis = null
      this.isConnected = false
    }
  }

  /**
   * Get a value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    if (!this.isConnected || !this.redis) {
      return null
    }

    try {
      const fullKey = `${CACHE_PREFIX}${key}`
      const value = await this.redis.get(fullKey)
      
      if (!value) {
        return null
      }

      return JSON.parse(value) as T
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error)
      return null
    }
  }

  /**
   * Set a value in cache with optional TTL
   */
  async set<T = any>(key: string, value: T, ttl: number = DEFAULT_TTL): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      return false
    }

    try {
      const fullKey = `${CACHE_PREFIX}${key}`
      const serialized = JSON.stringify(value)
      
      if (ttl > 0) {
        await this.redis.setex(fullKey, ttl, serialized)
      } else {
        await this.redis.set(fullKey, serialized)
      }
      
      return true
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error)
      return false
    }
  }

  /**
   * Delete a key from cache
   */
  async del(key: string | string[]): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      return false
    }

    try {
      const keys = Array.isArray(key) ? key : [key]
      const fullKeys = keys.map(k => `${CACHE_PREFIX}${k}`)
      
      if (fullKeys.length > 0) {
        await this.redis.del(...fullKeys)
      }
      
      return true
    } catch (error) {
      console.error(`Cache delete error for keys:`, error)
      return false
    }
  }

  /**
   * Delete all keys matching a pattern
   */
  async delPattern(pattern: string): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      return false
    }

    try {
      const fullPattern = `${CACHE_PREFIX}${pattern}*`
      const keys = await this.redis.keys(fullPattern)
      
      if (keys.length > 0) {
        // Remove the prefix before passing to del
        const cleanKeys = keys.map(k => k.replace(CACHE_PREFIX, ''))
        await this.del(cleanKeys)
      }
      
      return true
    } catch (error) {
      console.error(`Cache delete pattern error for ${pattern}:`, error)
      return false
    }
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      return false
    }

    try {
      const fullKey = `${CACHE_PREFIX}${key}`
      const exists = await this.redis.exists(fullKey)
      return exists === 1
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error)
      return false
    }
  }

  /**
   * Get remaining TTL for a key
   */
  async ttl(key: string): Promise<number> {
    if (!this.isConnected || !this.redis) {
      return -1
    }

    try {
      const fullKey = `${CACHE_PREFIX}${key}`
      return await this.redis.ttl(fullKey)
    } catch (error) {
      console.error(`Cache TTL error for key ${key}:`, error)
      return -1
    }
  }

  /**
   * Increment a numeric value
   */
  async incr(key: string, amount: number = 1): Promise<number | null> {
    if (!this.isConnected || !this.redis) {
      return null
    }

    try {
      const fullKey = `${CACHE_PREFIX}${key}`
      return await this.redis.incrby(fullKey, amount)
    } catch (error) {
      console.error(`Cache increment error for key ${key}:`, error)
      return null
    }
  }

  /**
   * Decrement a numeric value
   */
  async decr(key: string, amount: number = 1): Promise<number | null> {
    if (!this.isConnected || !this.redis) {
      return null
    }

    try {
      const fullKey = `${CACHE_PREFIX}${key}`
      return await this.redis.decrby(fullKey, amount)
    } catch (error) {
      console.error(`Cache decrement error for key ${key}:`, error)
      return null
    }
  }

  /**
   * Set value with expiration only if key doesn't exist
   */
  async setNX(key: string, value: any, ttl: number = DEFAULT_TTL): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      return false
    }

    try {
      const fullKey = `${CACHE_PREFIX}${key}`
      const serialized = JSON.stringify(value)
      const result = await this.redis.set(fullKey, serialized, 'EX', ttl, 'NX')
      return result === 'OK'
    } catch (error) {
      console.error(`Cache setNX error for key ${key}:`, error)
      return false
    }
  }

  /**
   * Get multiple values at once
   */
  async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
    if (!this.isConnected || !this.redis || keys.length === 0) {
      return keys.map(() => null)
    }

    try {
      const fullKeys = keys.map(k => `${CACHE_PREFIX}${k}`)
      const values = await this.redis.mget(...fullKeys)
      
      return values.map(value => {
        if (!value) return null
        try {
          return JSON.parse(value) as T
        } catch {
          return null
        }
      })
    } catch (error) {
      console.error(`Cache mget error:`, error)
      return keys.map(() => null)
    }
  }

  /**
   * Set multiple values at once
   */
  async mset(items: Record<string, any>, ttl: number = DEFAULT_TTL): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      return false
    }

    try {
      const pipeline = this.redis.pipeline()
      
      for (const [key, value] of Object.entries(items)) {
        const fullKey = `${CACHE_PREFIX}${key}`
        const serialized = JSON.stringify(value)
        
        if (ttl > 0) {
          pipeline.setex(fullKey, ttl, serialized)
        } else {
          pipeline.set(fullKey, serialized)
        }
      }
      
      await pipeline.exec()
      return true
    } catch (error) {
      console.error(`Cache mset error:`, error)
      return false
    }
  }

  /**
   * Clear all cache (use with caution)
   */
  async flush(): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      return false
    }

    try {
      const keys = await this.redis.keys(`${CACHE_PREFIX}*`)
      if (keys.length > 0) {
        await this.redis.del(...keys)
      }
      return true
    } catch (error) {
      console.error('Cache flush error:', error)
      return false
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    connected: boolean
    keyCount: number
    memoryUsage: string
  } | null> {
    if (!this.isConnected || !this.redis) {
      return {
        connected: false,
        keyCount: 0,
        memoryUsage: '0 KB',
      }
    }

    try {
      const keys = await this.redis.keys(`${CACHE_PREFIX}*`)
      const info = await this.redis.info('memory')
      const memoryMatch = info.match(/used_memory_human:(.+)/)
      
      return {
        connected: this.isConnected,
        keyCount: keys.length,
        memoryUsage: memoryMatch ? memoryMatch[1].trim() : 'Unknown',
      }
    } catch (error) {
      console.error('Cache stats error:', error)
      return null
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit()
      this.isConnected = false
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService()

```

# src/server/services/comment.service.ts
```ts
// src/server/services/comment.service.ts
import { 
  PrismaClient, 
  Prisma, 
  ModerationStatus,
  ReactionType,
  ReportReason,
  NotificationType 
} from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { NotificationService } from './notification.service'
import { ActivityService } from './activity.service'
import { ModerationService } from './moderation.service'
import type { EditHistoryEntry, ReactionCounts } from '@/types/comment'

export class CommentService {
  private notificationService: NotificationService
  private activityService: ActivityService
  private moderationService: ModerationService

  constructor(private db: PrismaClient) {
    this.notificationService = new NotificationService(db)
    this.activityService = new ActivityService(db)
    this.moderationService = new ModerationService(db)
  }

  async createComment(input: {
    postId: string
    content: string
    authorId: string
    parentId?: string
    youtubeTimestamp?: number
    quotedTimestamp?: string
  }) {
    // Validate post exists and allows comments
    const post = await this.db.post.findUnique({
      where: { id: input.postId },
      select: { 
        id: true, 
        authorId: true, 
        allowComments: true,
        title: true,
      },
    })

    if (!post) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Post not found',
      })
    }

    if (!post.allowComments) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Comments are disabled for this post',
      })
    }

    // Check comment depth if replying
    if (input.parentId) {
      const depth = await this.getCommentDepth(input.parentId)
      
      if (depth >= 5) { // Allow up to 5 levels of nesting
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Maximum comment nesting depth reached (5 levels)',
        })
      }

      const parentComment = await this.db.comment.findUnique({
        where: { id: input.parentId },
        select: { id: true, postId: true, deleted: true },
      })

      if (!parentComment || parentComment.postId !== input.postId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid parent comment',
        })
      }

      if (parentComment.deleted) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot reply to deleted comment',
        })
      }
    }

    // Check for rate limiting
    const recentCommentCount = await this.db.comment.count({
      where: {
        authorId: input.authorId,
        createdAt: {
          gte: new Date(Date.now() - 60 * 1000), // Last minute
        },
      },
    })

    if (recentCommentCount >= 5) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: 'Please wait before posting another comment',
      })
    }

    // Check for spam/moderation
    const moderationResult = await this.moderationService.checkContent(
      input.content,
      'comment'
    )

    const moderationStatus = moderationResult.shouldBlock 
      ? ModerationStatus.REJECTED
      : moderationResult.requiresReview
      ? ModerationStatus.PENDING
      : ModerationStatus.AUTO_APPROVED

    // Create comment
    const comment = await this.db.comment.create({
      data: {
        content: input.content,
        postId: input.postId,
        authorId: input.authorId,
        parentId: input.parentId,
        youtubeTimestamp: input.youtubeTimestamp,
        quotedTimestamp: input.quotedTimestamp, // Now properly included
        moderationStatus,
        moderationNotes: moderationResult.reasons?.join(', '),
      },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
        _count: {
          select: {
            reactions: true,
            replies: true,
          },
        },
      },
    })

    // Update post stats
    await this.db.postStats.update({
      where: { postId: input.postId },
      data: { commentCount: { increment: 1 } },
    })

    // Update user stats
    await this.db.userStats.update({
      where: { userId: input.authorId },
      data: { totalComments: { increment: 1 } },
    })

    // Track activity
    await this.activityService.trackActivity({
      userId: input.authorId,
      action: 'comment.created',
      entityType: 'comment',
      entityId: comment.id,
      entityData: {
        postId: input.postId,
        parentId: input.parentId,
      },
    })

    // Send notifications
    if (moderationStatus !== ModerationStatus.REJECTED) {
      await this.sendCommentNotifications(comment, post)
    }

    return comment
  }

  async updateComment(commentId: string, userId: string, content: string) {
    const comment = await this.db.comment.findUnique({
      where: { id: commentId },
      select: { 
        authorId: true, 
        createdAt: true,
        deleted: true,
        content: true,
        editHistory: true,
      },
    })

    if (!comment) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Comment not found',
      })
    }

    if (comment.deleted) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Cannot edit deleted comment',
      })
    }

    if (comment.authorId !== userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Not authorized to edit this comment',
      })
    }

    // Note: Edit window removed as per requirements
    // Users can edit their comments at any time

    // Check moderation
    const moderationResult = await this.moderationService.checkContent(
      content,
      'comment'
    )

    // Store edit history with proper typing
    const editHistory: EditHistoryEntry[] = [
      ...(comment.editHistory as EditHistoryEntry[] || []),
      {
        content: comment.content,
        editedAt: new Date().toISOString(),
        editorId: userId,
      },
    ]

    return this.db.comment.update({
      where: { id: commentId },
      data: { 
        content,
        edited: true,
        editedAt: new Date(),
        editHistory: editHistory as any, // Prisma Json type
        moderationStatus: moderationResult.shouldBlock 
          ? ModerationStatus.REJECTED
          : moderationResult.requiresReview
          ? ModerationStatus.PENDING
          : ModerationStatus.AUTO_APPROVED,
      },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
        _count: {
          select: {
            reactions: true,
            replies: true,
          },
        },
      },
    })
  }

  async addReaction(commentId: string, userId: string, type: ReactionType) {
    // Check if user already has a reaction on this comment
    const existingReaction = await this.db.reaction.findFirst({
      where: {
        commentId,
        userId,
      },
    })

    if (existingReaction) {
      if (existingReaction.type === type) {
        // Same reaction - remove it
        await this.db.reaction.delete({
          where: { id: existingReaction.id },
        })

        // Update stats if it was a like
        if (type === ReactionType.LIKE) {
          const comment = await this.db.comment.findUnique({
            where: { id: commentId },
            select: { authorId: true },
          })

          if (comment && comment.authorId !== userId) {
            await this.db.userStats.update({
              where: { userId: comment.authorId },
              data: { totalLikesReceived: { decrement: 1 } },
            })
          }
        }

        return { success: true, action: 'removed' }
      } else {
        // Different reaction - update it
        await this.db.reaction.update({
          where: { id: existingReaction.id },
          data: { type },
        })

        return { success: true, action: 'updated' }
      }
    }

    // No existing reaction - create new one
    await this.db.reaction.create({
      data: {
        commentId,
        userId,
        type,
      },
    })

    const comment = await this.db.comment.findUnique({
      where: { id: commentId },
      select: {
        authorId: true,
        postId: true,
        content: true,
      },
    })

    if (comment && comment.authorId !== userId) {
      // Update stats if it's a like
      if (type === ReactionType.LIKE) {
        await this.db.userStats.update({
          where: { userId: comment.authorId },
          data: { totalLikesReceived: { increment: 1 } },
        })
      }

      // Create notification
      await this.notificationService.createNotification({
        type: NotificationType.COMMENT_LIKED,
        userId: comment.authorId,
        actorId: userId,
        entityId: commentId,
        entityType: 'comment',
        title: 'Comment reaction',
        message: `reacted with ${type.toLowerCase()} to your comment`,
        data: {
          postId: comment.postId,
          commentPreview: comment.content.substring(0, 100),
          reactionType: type,
        },
      })
    }

    return { success: true, action: 'added' }
  }

  async removeReaction(commentId: string, userId: string, type: ReactionType) {
    await this.db.reaction.delete({
      where: {
        commentId_userId_type: {
          commentId,
          userId,
          type,
        },
      },
    })

    const comment = await this.db.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true },
    })

    if (comment && comment.authorId !== userId && type === ReactionType.LIKE) {
      await this.db.userStats.update({
        where: { userId: comment.authorId },
        data: { totalLikesReceived: { decrement: 1 } },
      })
    }

    return { success: true }
  }

  async getCommentReactions(commentId: string): Promise<ReactionCounts> {
    const reactions = await this.db.reaction.groupBy({
      by: ['type'],
      where: { commentId },
      _count: { type: true },
    })

    const counts: ReactionCounts = {
      [ReactionType.LIKE]: 0,
      [ReactionType.LOVE]: 0,
      [ReactionType.FIRE]: 0,
      [ReactionType.SPARKLE]: 0,
      [ReactionType.MIND_BLOWN]: 0,
      [ReactionType.LAUGH]: 0,
      [ReactionType.CRY]: 0,
      [ReactionType.ANGRY]: 0,
      total: 0,
    }

    reactions.forEach(reaction => {
      counts[reaction.type] = reaction._count.type
      counts.total += reaction._count.type
    })

    return counts
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.db.comment.findUnique({
      where: { id: commentId },
      include: {
        post: {
          select: { authorId: true },
        },
        _count: {
          select: { replies: true },
        },
      },
    })

    if (!comment) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Comment not found',
      })
    }

    // Allow deletion by comment author or post author
    if (comment.authorId !== userId && comment.post.authorId !== userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Not authorized to delete this comment',
      })
    }

    // If comment has replies, soft delete
    if (comment._count.replies > 0) {
      await this.db.comment.update({
        where: { id: commentId },
        data: {
          deleted: true,
          deletedAt: new Date(),
          deletedBy: userId,
          content: '[deleted]',
        },
      })
    } else {
      // Hard delete if no replies
      await this.db.comment.delete({
        where: { id: commentId },
      })
    }

    // Update post stats
    await this.db.postStats.update({
      where: { postId: comment.postId },
      data: { commentCount: { decrement: 1 } },
    })

    // Update user stats
    await this.db.userStats.update({
      where: { userId: comment.authorId },
      data: { totalComments: { decrement: 1 } },
    })

    return { success: true, postId: comment.postId }
  }

  async listComments(params: {
    postId: string
    limit: number
    cursor?: string
    sortBy: 'newest' | 'oldest' | 'popular'
    parentId?: string | null
    userId?: string
  }) {
    const orderBy: any = 
      params.sortBy === 'popular' 
        ? [
            { pinned: 'desc' },
            { reactions: { _count: 'desc' } },
            { replies: { _count: 'desc' } },
            { createdAt: 'desc' },
          ]
        : params.sortBy === 'oldest'
        ? { createdAt: 'asc' }
        : { createdAt: 'desc' }

    const where: Prisma.CommentWhereInput = {
      postId: params.postId,
      parentId: params.parentId,
      moderationStatus: {
        not: ModerationStatus.REJECTED,
      },
    }

    const comments = await this.db.comment.findMany({
      where,
      take: params.limit + 1,
      cursor: params.cursor ? { id: params.cursor } : undefined,
      include: {
        author: {
          include: {
            profile: true,
          },
        },
        _count: {
          select: {
            reactions: true,
            replies: true,
          },
        },
        reactions: params.userId ? {
          where: { userId: params.userId },
          select: { type: true },
        } : false,
        // Include first 3 replies for preview
        replies: {
          where: {
            moderationStatus: {
              not: ModerationStatus.REJECTED,
            },
          },
          take: 3,
          include: {
            author: {
              include: {
                profile: true,
              },
            },
            _count: {
              select: {
                reactions: true,
                replies: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy,
    })

    let nextCursor: string | undefined = undefined
    if (comments.length > params.limit) {
      const nextItem = comments.pop()
      nextCursor = nextItem!.id
    }

    // Get reaction counts for each comment
    const commentsWithReactions = await Promise.all(
      comments.map(async (comment) => {
        const reactionCounts = await this.getCommentReactions(comment.id)
        const userReaction = params.userId && comment.reactions && comment.reactions.length > 0 
          ? comment.reactions[0].type 
          : null

        return {
          ...comment,
          reactionCounts,
          userReaction: {
            hasReacted: !!userReaction,
            reactionType: userReaction,
          },
          reactions: undefined, // Remove raw reactions data
        }
      })
    )

    return {
      items: commentsWithReactions,
      nextCursor,
    }
  }

  async getComment(commentId: string, userId?: string) {
    const comment = await this.db.comment.findUnique({
      where: { id: commentId },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        parent: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        _count: {
          select: {
            reactions: true,
            replies: true,
          },
        },
        reactions: userId ? {
          where: { userId },
          select: { type: true },
        } : false,
      },
    })

    if (!comment) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Comment not found',
      })
    }

    const reactionCounts = await this.getCommentReactions(commentId)
    const userReaction = userId && comment.reactions && comment.reactions.length > 0 
      ? comment.reactions[0].type 
      : null

    return {
      ...comment,
      reactionCounts,
      userReaction: {
        hasReacted: !!userReaction,
        reactionType: userReaction,
      },
      reactions: undefined,
    }
  }

  async getCommentThread(params: {
    commentId: string
    limit: number
    cursor?: string
    userId?: string
  }) {
    const thread = await this.db.comment.findMany({
      where: {
        parentId: params.commentId,
        moderationStatus: {
          not: ModerationStatus.REJECTED,
        },
      },
      take: params.limit + 1,
      cursor: params.cursor ? { id: params.cursor } : undefined,
      include: {
        author: {
          include: {
            profile: true,
          },
        },
        _count: {
          select: {
            reactions: true,
            replies: true,
          },
        },
        reactions: params.userId ? {
          where: { userId: params.userId },
          select: { type: true },
        } : false,
      },
      orderBy: { createdAt: 'asc' },
    })

    let nextCursor: string | undefined = undefined
    if (thread.length > params.limit) {
      const nextItem = thread.pop()
      nextCursor = nextItem!.id
    }

    // Get reaction counts for each comment
    const threadWithReactions = await Promise.all(
      thread.map(async (comment) => {
        const reactionCounts = await this.getCommentReactions(comment.id)
        const userReaction = params.userId && comment.reactions && comment.reactions.length > 0 
          ? comment.reactions[0].type 
          : null

        return {
          ...comment,
          reactionCounts,
          userReaction: {
            hasReacted: !!userReaction,
            reactionType: userReaction,
          },
          reactions: undefined,
        }
      })
    )

    return {
      items: threadWithReactions,
      nextCursor,
    }
  }

  // Legacy like/unlike methods for backward compatibility
  async likeComment(commentId: string, userId: string) {
    return this.addReaction(commentId, userId, ReactionType.LIKE)
  }

  async unlikeComment(commentId: string, userId: string) {
    return this.removeReaction(commentId, userId, ReactionType.LIKE)
  }

  async togglePinComment(commentId: string, userId: string) {
    const comment = await this.db.comment.findUnique({
      where: { id: commentId },
      include: {
        post: {
          select: { authorId: true },
        },
      },
    })

    if (!comment) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Comment not found',
      })
    }

    // Only post author can pin comments
    if (comment.post.authorId !== userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only the post author can pin comments',
      })
    }

    // Unpin other comments first
    if (!comment.pinned) {
      await this.db.comment.updateMany({
        where: {
          postId: comment.postId,
          pinned: true,
        },
        data: { pinned: false },
      })
    }

    return this.db.comment.update({
      where: { id: commentId },
      data: { pinned: !comment.pinned },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
        _count: {
          select: {
            reactions: true,
            replies: true,
          },
        },
      },
    })
  }

  async reportComment(params: {
    commentId: string
    reporterId: string
    reason: string
    description?: string
  }) {
    const comment = await this.db.comment.findUnique({
      where: { id: params.commentId },
      select: { id: true, authorId: true },
    })

    if (!comment) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Comment not found',
      })
    }

    if (comment.authorId === params.reporterId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Cannot report your own comment',
      })
    }

    const report = await this.db.report.create({
      data: {
        entityType: 'comment',
        reportedCommentId: params.commentId,
        reporterId: params.reporterId,
        reason: params.reason as ReportReason,
        description: params.description,
      },
    })

    // Update comment moderation status
    await this.db.comment.update({
      where: { id: params.commentId },
      data: {
        moderationStatus: ModerationStatus.UNDER_REVIEW,
      },
    })

    // Add to moderation queue
    await this.db.aiModerationQueue.create({
      data: {
        entityType: 'comment',
        entityId: params.commentId,
        humanReviewRequired: true,
        reviewPriority: 1,
      },
    })

    return report
  }

  async getUserComments(params: {
    userId: string
    limit: number
    cursor?: string
  }) {
    const comments = await this.db.comment.findMany({
      where: {
        authorId: params.userId,
        deleted: false,
        moderationStatus: {
          not: ModerationStatus.REJECTED,
        },
      },
      take: params.limit + 1,
      cursor: params.cursor ? { id: params.cursor } : undefined,
      include: {
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
            author: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        _count: {
          select: {
            reactions: true,
            replies: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    let nextCursor: string | undefined = undefined
    if (comments.length > params.limit) {
      const nextItem = comments.pop()
      nextCursor = nextItem!.id
    }

    return {
      items: comments,
      nextCursor,
    }
  }

  // Helper methods
  private async getCommentDepth(commentId: string): Promise<number> {
    let depth = 0
    let currentId: string | null = commentId

    while (currentId && depth < 10) { // Safety limit
      const comment = await this.db.comment.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      })

      if (!comment || !comment.parentId) {
        break
      }

      currentId = comment.parentId
      depth++
    }

    return depth
  }

  private async sendCommentNotifications(comment: any, post: any) {
    const notificationPromises = []

    // Notify post author (if not self-comment)
    if (post.authorId !== comment.authorId) {
      notificationPromises.push(
        this.notificationService.createNotification({
          type: NotificationType.POST_COMMENTED,
          userId: post.authorId,
          actorId: comment.authorId,
          entityId: comment.id,
          entityType: 'comment',
          title: 'New comment',
          message: `commented on your post "${post.title}"`,
          data: {
            postId: post.id,
            commentPreview: comment.content.substring(0, 100),
          },
        })
      )
    }

    // Notify parent comment author (if reply)
    if (comment.parentId) {
      const parentComment = await this.db.comment.findUnique({
        where: { id: comment.parentId },
        select: { authorId: true },
      })

      if (parentComment && parentComment.authorId !== comment.authorId) {
        notificationPromises.push(
          this.notificationService.createNotification({
            type: NotificationType.POST_COMMENTED, // Using existing type
            userId: parentComment.authorId,
            actorId: comment.authorId,
            entityId: comment.id,
            entityType: 'comment',
            title: 'New reply',
            message: 'replied to your comment',
            data: {
              postId: post.id,
              parentCommentId: comment.parentId,
              commentPreview: comment.content.substring(0, 100),
              isReply: true,
            },
          })
        )
      }
    }

    await Promise.all(notificationPromises)
  }
}

```

# src/server/services/event.service.ts
```ts
// src/server/services/event.service.ts
import { Server as SocketIOServer } from 'socket.io'
import Redis from 'ioredis'

class EventService {
  private static instance: EventService
  private io: SocketIOServer | null = null
  private pubClient: Redis | null = null
  private subClient: Redis | null = null
  private isInitialized: boolean = false

  constructor() {
    if (EventService.instance) {
      return EventService.instance
    }
    EventService.instance = this
  }

  /**
   * Initialize Socket.IO server (called from server initialization)
   */
  initializeSocketIO(io: SocketIOServer) {
    this.io = io
    this.setupRedisAdapters()
    this.isInitialized = true
    console.log('EventService initialized with Socket.IO')
  }

  /**
   * Set up Redis adapters for Socket.IO scaling
   */
  private setupRedisAdapters() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
      
      this.pubClient = new Redis(redisUrl)
      this.subClient = new Redis(redisUrl)

      this.pubClient.on('error', (err) => {
        console.error('Redis pub client error:', err)
      })

      this.subClient.on('error', (err) => {
        console.error('Redis sub client error:', err)
      })

      // Note: Socket.IO Redis adapter setup would happen in the main server file
      // This is just for pub/sub functionality
    } catch (error) {
      console.error('Failed to setup Redis adapters:', error)
    }
  }

  /**
   * Emit an event to specific users or rooms
   */
  async emit(event: string, data: any, target?: {
    userId?: string
    room?: string
    broadcast?: boolean
  }) {
    if (!this.io) {
      console.warn('Socket.IO not initialized, event not emitted:', event)
      return
    }

    try {
      if (target?.userId) {
        // Emit to specific user
        this.io.to(`user:${target.userId}`).emit(event, data)
      } else if (target?.room) {
        // Emit to specific room
        this.io.to(target.room).emit(event, data)
      } else if (target?.broadcast) {
        // Broadcast to all connected clients
        this.io.emit(event, data)
      } else {
        // Default: emit based on data context
        this.emitContextual(event, data)
      }

      // Also publish to Redis for other servers
      if (this.pubClient) {
        await this.pubClient.publish(`sparkle:events:${event}`, JSON.stringify({
          event,
          data,
          target,
          timestamp: Date.now(),
        }))
      }
    } catch (error) {
      console.error(`Failed to emit event ${event}:`, error)
    }
  }

  /**
   * Emit event based on data context
   */
  private emitContextual(event: string, data: any) {
    if (!this.io) return

    // Determine target based on event type and data
    switch (event) {
      case 'notification.created':
        if (data.userId) {
          this.io.to(`user:${data.userId}`).emit(event, data)
        }
        break

      case 'comment.created':
      case 'comment.updated':
      case 'comment.deleted':
        if (data.postId) {
          this.io.to(`post:${data.postId}`).emit(event, data)
        }
        break

      case 'comment.liked':
      case 'comment.unliked':
        if (data.commentId) {
          // Emit to post room (assuming comment is in a post)
          this.io.to(`comment:${data.commentId}`).emit(event, data)
        }
        break

      case 'comment.typing.start':
      case 'comment.typing.stop':
        if (data.postId) {
          this.io.to(`post:${data.postId}`).emit(event, data)
        }
        break

      case 'post.updated':
      case 'post.deleted':
        if (data.postId) {
          this.io.to(`post:${data.postId}`).emit(event, data)
        }
        break

      case 'user.online':
      case 'user.offline':
        if (data.userId) {
          // Broadcast to user's followers
          this.io.to(`followers:${data.userId}`).emit(event, data)
        }
        break

      default:
        console.warn(`Unknown event type for contextual emission: ${event}`)
    }
  }

  /**
   * Join a user to their personal room
   */
  joinUserRoom(socketId: string, userId: string) {
    if (!this.io) return
    
    const socket = this.io.sockets.sockets.get(socketId)
    if (socket) {
      socket.join(`user:${userId}`)
      socket.join(`followers:${userId}`)
    }
  }

  /**
   * Join a socket to a specific room
   */
  joinRoom(socketId: string, room: string) {
    if (!this.io) return
    
    const socket = this.io.sockets.sockets.get(socketId)
    if (socket) {
      socket.join(room)
    }
  }

  /**
   * Leave a room
   */
  leaveRoom(socketId: string, room: string) {
    if (!this.io) return
    
    const socket = this.io.sockets.sockets.get(socketId)
    if (socket) {
      socket.leave(room)
    }
  }

  /**
   * Get users in a room
   */
  async getRoomUsers(room: string): Promise<string[]> {
    if (!this.io) return []
    
    const sockets = await this.io.in(room).fetchSockets()
    return sockets.map(s => s.id)
  }

  /**
   * Emit typing indicator
   */
  emitTyping(postId: string, userId: string, username: string, isTyping: boolean) {
    this.emit('comment.typing', {
      postId,
      userId,
      username,
      isTyping,
    }, {
      room: `post:${postId}`,
    })
  }

  /**
   * Emit notification
   */
  emitNotification(userId: string, notification: any) {
    this.emit('notification.created', {
      notification,
    }, {
      userId,
    })
  }

  /**
   * Emit activity update
   */
  emitActivity(activity: any) {
    this.emit('activity.created', activity, {
      broadcast: activity.visibility === 'PUBLIC',
    })
  }

  /**
   * Get Socket.IO server instance
   */
  getIO(): SocketIOServer | null {
    return this.io
  }

  /**
   * Check if service is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.io !== null
  }

  /**
   * Cleanup connections
   */
  async cleanup() {
    if (this.pubClient) {
      await this.pubClient.quit()
    }
    if (this.subClient) {
      await this.subClient.quit()
    }
    this.io = null
    this.isInitialized = false
  }
}

// Export singleton instance
export const eventService = new EventService()

// Also export class for typing
export { EventService }

```

# src/server/services/notification.service.ts
```ts
// src/server/services/notification.service.ts
import { PrismaClient, NotificationType } from '@prisma/client'
import { eventService } from './event.service'

interface NotificationPreferenceKeys {
  [NotificationType.POST_LIKED]: 'postLikes'
  [NotificationType.POST_COMMENTED]: 'postComments'
  [NotificationType.COMMENT_LIKED]: 'postComments'
  [NotificationType.USER_FOLLOWED]: 'newFollowers'
  [NotificationType.MENTION]: 'mentions'
  [NotificationType.DIRECT_MESSAGE]: 'directMessages'
  [NotificationType.GROUP_INVITE]: 'groupInvites'
  [NotificationType.EVENT_REMINDER]: 'eventReminders'
  [key: string]: string
}

export class NotificationService {
  constructor(private db: PrismaClient) {}

  async createNotification(params: {
    type: NotificationType
    userId: string
    actorId?: string
    entityId?: string
    entityType?: string
    title: string
    message: string
    data?: any
    imageUrl?: string
    actionUrl?: string
    priority?: number
  }) {
    try {
      // Check user notification preferences
      const prefs = await this.db.notificationPreference.findUnique({
        where: { userId: params.userId },
      })

      // Check if this notification type is enabled
      const notificationTypeKey = this.getPreferenceKey(params.type)
      if (prefs && notificationTypeKey && !prefs[notificationTypeKey as keyof typeof prefs]) {
        return null // User has disabled this notification type
      }

      // Check for duplicate notifications
      const recentDuplicate = await this.db.notification.findFirst({
        where: {
          userId: params.userId,
          type: params.type,
          entityId: params.entityId,
          createdAt: {
            gte: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes
          },
        },
      })

      if (recentDuplicate) {
        return null // Prevent duplicate notifications
      }

      // Create notification
      const notification = await this.db.notification.create({
        data: {
          type: params.type,
          userId: params.userId,
          actorId: params.actorId,
          entityId: params.entityId,
          entityType: params.entityType,
          title: params.title,
          message: params.message,
          data: params.data,
          imageUrl: params.imageUrl,
          actionUrl: params.actionUrl,
          priority: params.priority || 0,
        },
        include: {
          actor: {
            include: {
              profile: true,
            },
          },
        },
      })

      // Emit real-time notification
      eventService.emitNotification(params.userId, notification)

      // Queue email notification if enabled
      if (prefs?.emailNotifications) {
        await this.queueEmailNotification(notification)
      }

      // Queue push notification if enabled
      if (prefs?.pushNotifications) {
        await this.queuePushNotification(notification)
      }

      return notification
    } catch (error) {
      console.error('Failed to create notification:', error)
      return null
    }
  }

  async listNotifications(params: {
    userId: string
    limit: number
    cursor?: string
    unreadOnly?: boolean
    type?: string
  }) {
    const where: any = {
      userId: params.userId,
    }

    if (params.unreadOnly) {
      where.read = false
    }

    if (params.type) {
      where.type = params.type
    }

    const notifications = await this.db.notification.findMany({
      where,
      take: params.limit + 1,
      cursor: params.cursor ? { id: params.cursor } : undefined,
      include: {
        actor: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    let nextCursor: string | undefined = undefined
    if (notifications.length > params.limit) {
      const nextItem = notifications.pop()
      nextCursor = nextItem!.id
    }

    return {
      items: notifications,
      nextCursor,
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.db.notification.count({
      where: {
        userId,
        read: false,
      },
    })
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.db.notification.update({
      where: {
        id: notificationId,
        userId, // Ensure user owns this notification
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    })
  }

  async markAllAsRead(userId: string) {
    const result = await this.db.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    })

    return { updated: result.count }
  }

  async deleteNotification(notificationId: string, userId: string) {
    await this.db.notification.delete({
      where: {
        id: notificationId,
        userId, // Ensure user owns this notification
      },
    })
  }

  async updatePreferences(userId: string, preferences: any) {
    return this.db.notificationPreference.upsert({
      where: { userId },
      update: preferences,
      create: {
        userId,
        ...preferences,
      },
    })
  }

  async getPreferences(userId: string) {
    const prefs = await this.db.notificationPreference.findUnique({
      where: { userId },
    })

    // Return defaults if no preferences exist
    return prefs || {
      emailNotifications: true,
      pushNotifications: true,
      postLikes: true,
      postComments: true,
      newFollowers: true,
      mentions: true,
      directMessages: true,
      groupInvites: true,
      eventReminders: true,
      marketingEmails: false,
      weeklyDigest: true,
    }
  }

  private getPreferenceKey(type: NotificationType): string | null {
    const preferenceMap: NotificationPreferenceKeys = {
      [NotificationType.POST_LIKED]: 'postLikes',
      [NotificationType.POST_COMMENTED]: 'postComments',
      [NotificationType.COMMENT_LIKED]: 'postComments',
      [NotificationType.USER_FOLLOWED]: 'newFollowers',
      [NotificationType.MENTION]: 'mentions',
      [NotificationType.DIRECT_MESSAGE]: 'directMessages',
      [NotificationType.GROUP_INVITE]: 'groupInvites',
      [NotificationType.GROUP_POST]: 'groupInvites',
      [NotificationType.EVENT_REMINDER]: 'eventReminders',
      [NotificationType.WATCH_PARTY_INVITE]: 'eventReminders',
      [NotificationType.ACHIEVEMENT_UNLOCKED]: 'postLikes', // Map to existing pref
      [NotificationType.LEVEL_UP]: 'postLikes',
      [NotificationType.SYSTEM]: 'postLikes',
      [NotificationType.YOUTUBE_PREMIERE]: 'eventReminders',
      [NotificationType.QUEST_COMPLETE]: 'postLikes',
      [NotificationType.TRADE_REQUEST]: 'directMessages',
      [NotificationType.CONTENT_FEATURED]: 'postLikes',
      [NotificationType.MILESTONE_REACHED]: 'postLikes',
    }

    return preferenceMap[type] || null
  }

  private async queueEmailNotification(notification: any) {
    // Queue email notification for processing
    await this.db.notificationQueue.create({
      data: {
        userId: notification.userId,
        type: 'notification',
        channel: 'email',
        payload: notification,
        priority: notification.priority || 0,
      },
    })
  }

  private async queuePushNotification(notification: any) {
    // Queue push notification for processing
    await this.db.notificationQueue.create({
      data: {
        userId: notification.userId,
        type: 'notification',
        channel: 'push',
        payload: notification,
        priority: notification.priority || 0,
      },
    })
  }
}

```

