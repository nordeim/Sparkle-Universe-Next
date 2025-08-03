// src/server/api/routers/post.ts
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { 
  createTRPCRouter, 
  publicProcedure, 
  protectedProcedure 
} from '@/server/api/trpc'
import { 
  createPostSchema, 
  updatePostSchema,
  postFilterSchema 
} from '@/lib/validations/post'
import { PostService } from '@/server/services/post.service'
import { CacheService } from '@/server/services/cache.service'
import { EventService } from '@/server/services/event.service'
import { SearchService } from '@/server/services/search.service'

export const postRouter = createTRPCRouter({
  // Create a new post
  create: protectedProcedure
    .input(createPostSchema)
    .mutation(async ({ ctx, input }) => {
      const postService = new PostService(ctx.db)
      const eventService = new EventService()
      const searchService = new SearchService(ctx.db)
      
      const post = await postService.createPost({
        ...input,
        authorId: ctx.session.user.id,
      })

      // Index post for search
      await searchService.indexPost(post)

      // Emit post created event
      await eventService.emit('post.created', {
        postId: post.id,
        authorId: post.authorId,
        title: post.title,
      })

      return post
    }),

  // Update existing post
  update: protectedProcedure
    .input(updatePostSchema)
    .mutation(async ({ ctx, input }) => {
      const postService = new PostService(ctx.db)
      const cacheService = new CacheService()
      const searchService = new SearchService(ctx.db)
      
      const post = await postService.updatePost(
        input.id,
        ctx.session.user.id,
        input
      )

      // Update search index
      await searchService.indexPost(post)

      // Invalidate cache
      await cacheService.invalidate(`post:${post.slug}`)
      await cacheService.invalidate(`post:${post.id}`)

      return post
    }),

  // Delete post
  delete: protectedProcedure
    .input(z.object({
      id: z.string().cuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const postService = new PostService(ctx.db)
      const cacheService = new CacheService()
      const searchService = new SearchService(ctx.db)
      const eventService = new EventService()
      
      const post = await postService.deletePost(
        input.id, 
        ctx.session.user.id
      )

      // Remove from search
      await searchService.deletePost(input.id)

      // Invalidate cache
      await cacheService.invalidate(`post:${post.slug}`)
      await cacheService.invalidate(`post:${post.id}`)

      // Emit deletion event
      await eventService.emit('post.deleted', {
        postId: input.id,
        authorId: ctx.session.user.id,
      })

      return { success: true }
    }),

  // Get post by slug
  getBySlug: publicProcedure
    .input(z.object({
      slug: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const postService = new PostService(ctx.db)
      const cacheService = new CacheService()
      
      // Try cache first
      const cacheKey = `post:${input.slug}`
      const cached = await cacheService.get(cacheKey)
      if (cached) return cached

      const post = await postService.getPostBySlug(
        input.slug,
        ctx.session?.user?.id
      )

      // Cache for 5 minutes
      await cacheService.set(cacheKey, post, 300)

      return post
    }),

  // Get post by ID
  getById: publicProcedure
    .input(z.object({
      id: z.string().cuid(),
    }))
    .query(async ({ ctx, input }) => {
      const postService = new PostService(ctx.db)
      const cacheService = new CacheService()
      
      // Try cache first
      const cacheKey = `post:${input.id}`
      const cached = await cacheService.get(cacheKey)
      if (cached) return cached

      const post = await postService.getPostById(
        input.id,
        ctx.session?.user?.id
      )

      // Cache for 5 minutes
      await cacheService.set(cacheKey, post, 300)

      return post
    }),

  // List posts with filtering
  list: publicProcedure
    .input(postFilterSchema)
    .query(async ({ ctx, input }) => {
      const postService = new PostService(ctx.db)
      return postService.listPosts({
        ...input,
        userId: ctx.session?.user?.id,
      })
    }),

  // Get user's feed
  feed: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(10),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const postService = new PostService(ctx.db)
      const cacheService = new CacheService()
      
      // Try cache for first page
      if (!input.cursor) {
        const cacheKey = `feed:${ctx.session.user.id}:${input.limit}`
        const cached = await cacheService.get(cacheKey)
        if (cached) return cached
      }

      const feed = await postService.getUserFeed(
        ctx.session.user.id,
        input
      )

      // Cache first page for 1 minute
      if (!input.cursor) {
        const cacheKey = `feed:${ctx.session.user.id}:${input.limit}`
        await cacheService.set(cacheKey, feed, 60)
      }

      return feed
    }),

  // Get trending posts
  trending: publicProcedure
    .input(z.object({
      period: z.enum(['day', 'week', 'month', 'all']).default('week'),
      limit: z.number().min(1).max(50).default(10),
    }))
    .query(async ({ ctx, input }) => {
      const postService = new PostService(ctx.db)
      const cacheService = new CacheService()
      
      // Try cache
      const cacheKey = `trending:${input.period}:${input.limit}`
      const cached = await cacheService.get(cacheKey)
      if (cached) return cached

      const trending = await postService.getTrendingPosts(input)

      // Cache for 30 minutes
      await cacheService.set(cacheKey, trending, 1800)

      return trending
    }),

  // Like a post
  like: protectedProcedure
    .input(z.object({
      postId: z.string().cuid(),
      type: z.enum(['LIKE', 'LOVE', 'FIRE', 'SPARKLE']).default('LIKE'),
    }))
    .mutation(async ({ ctx, input }) => {
      const postService = new PostService(ctx.db)
      const eventService = new EventService()
      
      const reaction = await postService.likePost(
        input.postId, 
        ctx.session.user.id,
        input.type
      )

      // Emit like event
      await eventService.emit('post.liked', {
        postId: input.postId,
        userId: ctx.session.user.id,
        type: input.type,
      })

      return reaction
    }),

  // Unlike a post
  unlike: protectedProcedure
    .input(z.object({
      postId: z.string().cuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const postService = new PostService(ctx.db)
      const eventService = new EventService()
      
      await postService.unlikePost(input.postId, ctx.session.user.id)

      // Emit unlike event
      await eventService.emit('post.unliked', {
        postId: input.postId,
        userId: ctx.session.user.id,
      })

      return { success: true }
    }),

  // Bookmark a post
  bookmark: protectedProcedure
    .input(z.object({
      postId: z.string().cuid(),
      folderId: z.string().cuid().optional(),
      notes: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const postService = new PostService(ctx.db)
      return postService.bookmarkPost({
        ...input,
        userId: ctx.session.user.id,
      })
    }),

  // Remove bookmark
  unbookmark: protectedProcedure
    .input(z.object({
      postId: z.string().cuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const postService = new PostService(ctx.db)
      return postService.unbookmarkPost(
        input.postId, 
        ctx.session.user.id
      )
    }),

  // Get bookmarks
  getBookmarks: protectedProcedure
    .input(z.object({
      folderId: z.string().cuid().optional(),
      limit: z.number().min(1).max(100).default(20),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const postService = new PostService(ctx.db)
      return postService.getUserBookmarks({
        ...input,
        userId: ctx.session.user.id,
      })
    }),

  // Share a post
  share: protectedProcedure
    .input(z.object({
      postId: z.string().cuid(),
      platform: z.enum(['twitter', 'facebook', 'linkedin', 'copy']),
    }))
    .mutation(async ({ ctx, input }) => {
      const postService = new PostService(ctx.db)
      const eventService = new EventService()
      
      const shareUrl = await postService.sharePost(
        input.postId,
        input.platform
      )

      // Track share
      await eventService.emit('post.shared', {
        postId: input.postId,
        userId: ctx.session.user.id,
        platform: input.platform,
      })

      return { shareUrl }
    }),

  // Report a post
  report: protectedProcedure
    .input(z.object({
      postId: z.string().cuid(),
      reason: z.enum([
        'SPAM',
        'INAPPROPRIATE',
        'HARASSMENT',
        'MISINFORMATION',
        'COPYRIGHT',
        'OTHER',
      ]),
      description: z.string().max(1000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const postService = new PostService(ctx.db)
      return postService.reportPost({
        ...input,
        reporterId: ctx.session.user.id,
      })
    }),

  // Get related posts
  getRelated: publicProcedure
    .input(z.object({
      postId: z.string().cuid(),
      limit: z.number().min(1).max(10).default(5),
    }))
    .query(async ({ ctx, input }) => {
      const postService = new PostService(ctx.db)
      const cacheService = new CacheService()
      
      // Try cache
      const cacheKey = `related:${input.postId}:${input.limit}`
      const cached = await cacheService.get(cacheKey)
      if (cached) return cached

      const related = await postService.getRelatedPosts(
        input.postId,
        input.limit
      )

      // Cache for 1 hour
      await cacheService.set(cacheKey, related, 3600)

      return related
    }),

  // Get post series
  getSeries: publicProcedure
    .input(z.object({
      seriesId: z.string().cuid(),
    }))
    .query(async ({ ctx, input }) => {
      const postService = new PostService(ctx.db)
      return postService.getPostSeries(input.seriesId)
    }),

  // Toggle post publish status
  togglePublish: protectedProcedure
    .input(z.object({
      postId: z.string().cuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const postService = new PostService(ctx.db)
      const cacheService = new CacheService()
      
      const post = await postService.togglePublishStatus(
        input.postId,
        ctx.session.user.id
      )

      // Invalidate caches
      await cacheService.invalidate(`post:${post.slug}`)
      await cacheService.invalidate(`post:${post.id}`)

      return post
    }),
})
