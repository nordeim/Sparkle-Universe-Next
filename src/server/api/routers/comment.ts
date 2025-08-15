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
  version: z.number().int().optional(), // For optimistic locking
})

export const commentRouter = createTRPCRouter({
  // Create a new comment
  create: protectedProcedure
    .input(createCommentSchema)
    .mutation(async ({ ctx, input }) => {
      const commentService = new CommentService(ctx.db)
      const eventService = new EventService()
      const mentionService = new MentionService(ctx.db)
      const cacheService = new CacheService()
      
      // Create comment with transaction
      const comment = await ctx.db.$transaction(async (tx) => {
        const commentService = new CommentService(tx as any)
        const mentionService = new MentionService(tx as any)
        
        // Create the comment
        const newComment = await commentService.createComment({
          ...input,
          authorId: ctx.session.user.id,
        })

        // Process mentions if any
        if (input.mentions && input.mentions.length > 0) {
          await mentionService.processMentions({
            mentionerId: ctx.session.user.id,
            mentionedUsernames: input.mentions,
            commentId: newComment.id,
            postId: input.postId,
          })
        }

        return newComment
      })

      // Invalidate caches
      await cacheService.delPattern(`comments:${input.postId}`)
      await cacheService.delPattern(`post:${input.postId}`)

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

  // Update existing comment with optimistic locking
  update: protectedProcedure
    .input(updateCommentSchema)
    .mutation(async ({ ctx, input }) => {
      const commentService = new CommentService(ctx.db)
      const eventService = new EventService()
      const cacheService = new CacheService()
      
      const comment = await commentService.updateCommentWithVersion(
        input.id,
        ctx.session.user.id,
        input.content,
        input.version
      )

      // Invalidate caches
      await cacheService.delPattern(`comments:${comment.postId}`)
      await cacheService.del(`comment:${input.id}`)

      // Emit real-time event
      await eventService.emit('comment.updated', {
        postId: comment.postId,
        commentId: comment.id,
        content: comment.content,
        edited: true,
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
      const cacheService = new CacheService()
      
      const result = await commentService.deleteComment(
        input.id, 
        ctx.session.user.id
      )

      // Invalidate caches
      await cacheService.delPattern(`comments:${result.postId}`)
      await cacheService.del(`comment:${input.id}`)

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
      const cacheService = new CacheService()
      
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

      // Invalidate comment cache
      await cacheService.del(`comment:${input.commentId}`)

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
      
      // Cache key for first page of top-level comments
      const cacheKey = `comments:${input.postId}:${input.sortBy}:${input.limit}`
      
      // Try cache for first page
      if (!input.cursor && !input.parentId && input.sortBy === 'newest') {
        const cached = await cacheService.get(cacheKey)
        if (cached) return cached
      }

      const result = await commentService.listComments({
        ...input,
        userId: ctx.session?.user?.id,
      })

      // Cache first page
      if (!input.cursor && !input.parentId && input.sortBy === 'newest') {
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
      const cacheService = new CacheService()
      
      // Try cache first
      const cacheKey = `comment:${input.id}`
      const cached = await cacheService.get(cacheKey)
      if (cached) return cached
      
      const comment = await commentService.getComment(
        input.id, 
        ctx.session?.user?.id
      )
      
      // Cache for 5 minutes
      await cacheService.set(cacheKey, comment, 300)
      
      return comment
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
      const eventService = new EventService()
      const cacheService = new CacheService()
      
      const result = await commentService.togglePinComment(
        input.commentId,
        ctx.session.user.id
      )

      // Invalidate caches
      await cacheService.delPattern(`comments:${result.postId}`)

      // Emit event
      await eventService.emit('comment.pinned', {
        postId: result.postId,
        commentId: input.commentId,
        pinned: result.pinned,
      })

      return result
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
        'COPYRIGHT',
        'NSFW',
        'HATE_SPEECH',
        'SELF_HARM',
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

  // Legacy endpoints for backward compatibility
  like: protectedProcedure
    .input(z.object({
      commentId: z.string().cuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Redirect to react endpoint
      const commentService = new CommentService(ctx.db)
      const eventService = new EventService()
      
      const result = await commentService.addReaction(
        input.commentId,
        ctx.session.user.id,
        ReactionType.LIKE
      )

      const reactionCounts = await commentService.getCommentReactions(input.commentId)

      await eventService.emit('comment.liked', {
        commentId: input.commentId,
        userId: ctx.session.user.id,
        likes: reactionCounts[ReactionType.LIKE],
      })

      return { ...result, likes: reactionCounts[ReactionType.LIKE] }
    }),

  unlike: protectedProcedure
    .input(z.object({
      commentId: z.string().cuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Redirect to react endpoint
      const commentService = new CommentService(ctx.db)
      const eventService = new EventService()
      
      const result = await commentService.removeReaction(
        input.commentId,
        ctx.session.user.id,
        ReactionType.LIKE
      )

      const reactionCounts = await commentService.getCommentReactions(input.commentId)

      await eventService.emit('comment.unliked', {
        commentId: input.commentId,
        userId: ctx.session.user.id,
        likes: reactionCounts[ReactionType.LIKE],
      })

      return { ...result, likes: reactionCounts[ReactionType.LIKE] }
    }),
})
