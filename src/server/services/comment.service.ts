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

  constructor(private db: PrismaClient | Prisma.TransactionClient) {
    this.notificationService = new NotificationService(db as PrismaClient)
    this.activityService = new ActivityService(db as PrismaClient)
    this.moderationService = new ModerationService(db as PrismaClient)
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
        authorName: true, // Preserved author name
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
        message: 'Please wait before posting another comment (5 per minute limit)',
      })
    }

    // Get author's current username for preservation
    const author = await this.db.user.findUnique({
      where: { id: input.authorId },
      select: { username: true },
    })

    if (!author) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Author not found',
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

    // Create comment with author name preservation
    const comment = await this.db.comment.create({
      data: {
        content: input.content,
        postId: input.postId,
        authorId: input.authorId,
        authorName: author.username, // Preserve author name
        parentId: input.parentId,
        youtubeTimestamp: input.youtubeTimestamp,
        quotedTimestamp: input.quotedTimestamp,
        moderationStatus,
        moderationNotes: moderationResult.reasons?.join(', '),
        version: 0, // Initialize version for optimistic locking
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
    await this.db.postStats.upsert({
      where: { postId: input.postId },
      create: {
        postId: input.postId,
        commentCount: 1,
      },
      update: {
        commentCount: { increment: 1 },
      },
    })

    // Update user stats
    await this.db.userStats.upsert({
      where: { userId: input.authorId },
      create: {
        userId: input.authorId,
        totalComments: 1,
      },
      update: {
        totalComments: { increment: 1 },
      },
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
        version: true,
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

    // Update with version check for optimistic locking
    const updatedComment = await this.db.comment.update({
      where: { 
        id: commentId,
        version: comment.version, // Optimistic locking
      },
      data: { 
        content,
        edited: true,
        editedAt: new Date(),
        editHistory: editHistory as any,
        version: { increment: 1 }, // Increment version
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

    return updatedComment
  }

  async updateCommentWithVersion(
    commentId: string, 
    userId: string, 
    content: string,
    expectedVersion?: number
  ) {
    const comment = await this.db.comment.findUnique({
      where: { id: commentId },
      select: { 
        authorId: true,
        version: true,
        content: true,
        editHistory: true,
        deleted: true,
        postId: true,
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

    // Check version for optimistic locking
    if (expectedVersion !== undefined && comment.version !== expectedVersion) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Comment has been modified by another user. Please refresh and try again.',
      })
    }

    // Check moderation
    const moderationResult = await this.moderationService.checkContent(
      content,
      'comment'
    )

    // Store edit history
    const editHistory: EditHistoryEntry[] = [
      ...(comment.editHistory as EditHistoryEntry[] || []),
      {
        content: comment.content,
        editedAt: new Date().toISOString(),
        editorId: userId,
      },
    ]

    try {
      const updatedComment = await this.db.comment.update({
        where: { 
          id: commentId,
          version: comment.version, // Ensure version hasn't changed
        },
        data: { 
          content,
          edited: true,
          editedAt: new Date(),
          editHistory: editHistory as any,
          version: { increment: 1 },
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

      return { ...updatedComment, postId: comment.postId }
    } catch (error) {
      // If update fails due to version mismatch, throw conflict error
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Comment has been modified. Please refresh and try again.',
        })
      }
      throw error
    }
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
      // Check if user is admin/moderator
      const user = await this.db.user.findUnique({
        where: { id: userId },
        select: { role: true },
      })

      if (!user || !['ADMIN', 'MODERATOR'].includes(user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to delete this comment',
        })
      }
    }

    // If comment has replies, soft delete to preserve thread
    if (comment._count.replies > 0) {
      await this.db.comment.update({
        where: { id: commentId },
        data: {
          deleted: true,
          deletedAt: new Date(),
          deletedBy: userId,
          content: '[deleted]',
          // Keep authorName to show who posted the deleted comment
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
    if (comment.authorId) {
      await this.db.userStats.update({
        where: { userId: comment.authorId },
        data: { totalComments: { decrement: 1 } },
      })
    }

    return { success: true, postId: comment.postId }
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

          if (comment?.authorId && comment.authorId !== userId) {
            await this.db.userStats.update({
              where: { userId: comment.authorId },
              data: { totalLikesReceived: { decrement: 1 } },
            })
          }
        }

        return { success: true, action: 'removed' as const }
      } else {
        // Different reaction - update it
        await this.db.reaction.update({
          where: { id: existingReaction.id },
          data: { type },
        })

        return { success: true, action: 'updated' as const }
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

    if (comment?.authorId && comment.authorId !== userId) {
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

    return { success: true, action: 'added' as const }
  }

  async removeReaction(commentId: string, userId: string, type: ReactionType) {
    const deleted = await this.db.reaction.deleteMany({
      where: {
        commentId,
        userId,
        type,
      },
    })

    if (deleted.count === 0) {
      return { success: false }
    }

    const comment = await this.db.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true },
    })

    if (comment?.authorId && comment.authorId !== userId && type === ReactionType.LIKE) {
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
      [ReactionType.CUSTOM]: 0,
      total: 0,
    }

    reactions.forEach(reaction => {
      counts[reaction.type] = reaction._count.type
      counts.total += reaction._count.type
    })

    return counts
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

        // Use authorName if author is deleted
        const displayAuthor = comment.author || {
          id: comment.authorId,
          username: comment.authorName || '[deleted user]',
          image: null,
          profile: null,
        }

        return {
          ...comment,
          author: displayAuthor,
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

    // Use authorName if author is deleted
    const displayAuthor = comment.author || {
      id: comment.authorId,
      username: comment.authorName || '[deleted user]',
      image: null,
      profile: null,
    }

    return {
      ...comment,
      author: displayAuthor,
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

        const displayAuthor = comment.author || {
          id: comment.authorId,
          username: comment.authorName || '[deleted user]',
          image: null,
          profile: null,
        }

        return {
          ...comment,
          author: displayAuthor,
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

    // Unpin other comments first if pinning
    if (!comment.pinned) {
      await this.db.comment.updateMany({
        where: {
          postId: comment.postId,
          pinned: true,
        },
        data: { pinned: false },
      })
    }

    const updatedComment = await this.db.comment.update({
      where: { id: commentId },
      data: { 
        pinned: !comment.pinned,
        version: { increment: 1 }, // Update version
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

    return { ...updatedComment, postId: comment.postId }
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
    if (post.authorId && post.authorId !== comment.authorId) {
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

      if (parentComment?.authorId && parentComment.authorId !== comment.authorId) {
        notificationPromises.push(
          this.notificationService.createNotification({
            type: NotificationType.POST_COMMENTED,
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
