// src/server/services/comment.service.ts
import { 
  PrismaClient, 
  Prisma,
  ModerationStatus,
  ReactionType 
} from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { NotificationService } from './notification.service'
import { ActivityService } from './activity.service'
import { CacheService } from './cache.service'
import { sanitizeHtml } from '@/lib/security'

export class CommentService {
  private notificationService: NotificationService
  private activityService: ActivityService
  private cacheService: CacheService

  constructor(private db: PrismaClient) {
    this.notificationService = new NotificationService(db)
    this.activityService = new ActivityService(db)
    this.cacheService = new CacheService()
  }

  async createComment(input: {
    content: string
    postId: string
    authorId: string
    parentId?: string
    youtubeTimestamp?: number
  }) {
    // Validate post exists and is published
    const post = await this.db.post.findUnique({
      where: { id: input.postId },
      select: { 
        id: true, 
        authorId: true, 
        title: true,
        allowComments: true,
        published: true,
      },
    })

    if (!post || !post.published) {
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

    // Validate parent comment if provided
    if (input.parentId) {
      const parentComment = await this.db.comment.findUnique({
        where: { id: input.parentId },
        select: { id: true, postId: true, deleted: true },
      })

      if (!parentComment || parentComment.deleted || parentComment.postId !== input.postId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Parent comment not found',
        })
      }
    }

    // Sanitize content
    const sanitizedContent = sanitizeHtml(input.content)

    // Create comment
    const comment = await this.db.comment.create({
      data: {
        content: sanitizedContent,
        postId: input.postId,
        authorId: input.authorId,
        parentId: input.parentId,
        youtubeTimestamp: input.youtubeTimestamp,
        moderationStatus: ModerationStatus.AUTO_APPROVED, // TODO: Add AI moderation
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
        content: comment.content.substring(0, 100),
      },
    })

    // Send notifications
    if (post.authorId !== input.authorId) {
      await this.notificationService.createNotification({
        type: 'POST_COMMENTED',
        userId: post.authorId,
        actorId: input.authorId,
        entityId: comment.id,
        entityType: 'comment',
        title: 'New comment on your post',
        message: `commented on "${post.title}"`,
        actionUrl: `/post/${input.postId}#comment-${comment.id}`,
      })
    }

    // Notify parent comment author
    if (input.parentId) {
      const parentComment = await this.db.comment.findUnique({
        where: { id: input.parentId },
        select: { authorId: true },
      })

      if (parentComment && parentComment.authorId !== input.authorId) {
        await this.notificationService.createNotification({
          type: 'COMMENT_REPLY',
          userId: parentComment.authorId,
          actorId: input.authorId,
          entityId: comment.id,
          entityType: 'comment',
          title: 'New reply to your comment',
          message: 'replied to your comment',
          actionUrl: `/post/${input.postId}#comment-${comment.id}`,
        })
      }
    }

    // Check for mentions
    await this.processMentions(comment)

    // Invalidate post cache
    await this.cacheService.invalidate(`post:${input.postId}`)

    return comment
  }

  async updateComment(
    commentId: string,
    userId: string,
    content: string
  ) {
    const comment = await this.db.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true, content: true },
    })

    if (!comment) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Comment not found',
      })
    }

    if (comment.authorId !== userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Not authorized to edit this comment',
      })
    }

    // Sanitize content
    const sanitizedContent = sanitizeHtml(content)

    // Store edit history
    const editHistory = {
      content: comment.content,
      editedAt: new Date(),
    }

    const updatedComment = await this.db.comment.update({
      where: { id: commentId },
      data: {
        content: sanitizedContent,
        edited: true,
        editedAt: new Date(),
        editHistory: {
          push: editHistory,
        },
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

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.db.comment.findUnique({
      where: { id: commentId },
      select: { 
        authorId: true, 
        postId: true,
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

    if (comment.authorId !== userId) {
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

    // Soft delete
    await this.db.comment.update({
      where: { id: commentId },
      data: {
        deleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
        content: '[Deleted]',
      },
    })

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

    return { success: true }
  }

  async getPostComments(params: {
    postId: string
    limit: number
    cursor?: string
    sortBy: 'newest' | 'oldest' | 'popular'
    viewerId?: string
  }) {
    const where: Prisma.CommentWhereInput = {
      postId: params.postId,
      deleted: false,
      parentId: null, // Top-level comments only
    }

    let orderBy: Prisma.CommentOrderByWithRelationInput = {}
    switch (params.sortBy) {
      case 'newest':
        orderBy = { createdAt: 'desc' }
        break
      case 'oldest':
        orderBy = { createdAt: 'asc' }
        break
      case 'popular':
        orderBy = { reactions: { _count: 'desc' } }
        break
    }

    const comments = await this.db.comment.findMany({
      where,
      take: params.limit + 1,
      cursor: params.cursor ? { id: params.cursor } : undefined,
      orderBy,
      include: {
        author: {
          include: {
            profile: true,
          },
        },
        reactions: params.viewerId ? {
          where: { userId: params.viewerId },
          select: { type: true },
        } : false,
        _count: {
          select: {
            reactions: true,
            replies: true,
          },
        },
        // Include first 3 replies
        replies: {
          where: { deleted: false },
          take: 3,
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              include: {
                profile: true,
              },
            },
            _count: {
              select: {
                reactions: true,
              },
            },
          },
        },
      },
    })

    let nextCursor: string | undefined = undefined
    if (comments.length > params.limit) {
      const nextItem = comments.pop()
      nextCursor = nextItem!.id
    }

    return {
      items: comments.map(comment => ({
        ...comment,
        isLiked: params.viewerId ? 
          comment.reactions.some(r => r.type === ReactionType.LIKE) : 
          false,
      })),
      nextCursor,
    }
  }

  async getCommentThread(commentId: string, maxDepth: number) {
    const rootComment = await this.db.comment.findUnique({
      where: { id: commentId },
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

    if (!rootComment || rootComment.deleted) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Comment not found',
      })
    }

    // Recursively fetch replies up to maxDepth
    const fetchReplies = async (parentId: string, depth: number): Promise<any[]> => {
      if (depth >= maxDepth) return []

      const replies = await this.db.comment.findMany({
        where: {
          parentId,
          deleted: false,
        },
        orderBy: { createdAt: 'asc' },
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

      // Fetch replies for each comment
      const repliesWithChildren = await Promise.all(
        replies.map(async (reply) => ({
          ...reply,
          replies: await fetchReplies(reply.id, depth + 1),
        }))
      )

      return repliesWithChildren
    }

    const thread = {
      ...rootComment,
      replies: await fetchReplies(commentId, 1),
    }

    return thread
  }

  async likeComment(commentId: string, userId: string) {
    try {
      const reaction = await this.db.reaction.create({
        data: {
          commentId,
          userId,
          type: ReactionType.LIKE,
        },
      })

      // Get comment author
      const comment = await this.db.comment.findUnique({
        where: { id: commentId },
        select: { authorId: true, postId: true },
      })

      if (comment && comment.authorId !== userId) {
        // Create notification
        await this.notificationService.createNotification({
          type: 'COMMENT_LIKED',
          userId: comment.authorId,
          actorId: userId,
          entityId: commentId,
          entityType: 'comment',
          title: 'Your comment was liked',
          message: 'liked your comment',
          actionUrl: `/post/${comment.postId}#comment-${commentId}`,
        })
      }

      return reaction
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Already liked this comment',
          })
        }
      }
      throw error
    }
  }

  async unlikeComment(commentId: string, userId: string) {
    await this.db.reaction.deleteMany({
      where: {
        commentId,
        userId,
        type: ReactionType.LIKE,
      },
    })

    return { success: true }
  }

  async reportComment(params: {
    commentId: string
    reporterId: string
    reason: string
    description?: string
  }) {
    const report = await this.db.report.create({
      data: {
        entityType: 'comment',
        entityId: params.commentId,
        reporterId: params.reporterId,
        reason: params.reason as any,
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
      },
      take: params.limit + 1,
      cursor: params.cursor ? { id: params.cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
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

  private async processMentions(comment: any) {
    // Extract @mentions from content
    const mentionRegex = /@(\w+)/g
    const matches = comment.content.matchAll(mentionRegex)
    
    for (const match of matches) {
      const username = match[1]
      const mentionedUser = await this.db.user.findUnique({
        where: { username },
        select: { id: true },
      })

      if (mentionedUser && mentionedUser.id !== comment.authorId) {
        // Create mention record
        await this.db.mention.create({
          data: {
            mentionerId: comment.authorId,
            mentionedId: mentionedUser.id,
            commentId: comment.id,
            postId: comment.postId,
          },
        })

        // Send notification
        await this.notificationService.createNotification({
          type: 'MENTION',
          userId: mentionedUser.id,
          actorId: comment.authorId,
          entityId: comment.id,
          entityType: 'comment',
          title: 'You were mentioned',
          message: `mentioned you in a comment`,
          actionUrl: `/post/${comment.postId}#comment-${comment.id}`,
        })
      }
    }
  }
}
