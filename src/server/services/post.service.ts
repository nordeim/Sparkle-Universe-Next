// src/server/services/post.service.ts
import { 
  PrismaClient, 
  Prisma, 
  ContentStatus,
  ModerationStatus,
  ReactionType 
} from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { generateSlug, extractExcerpt, calculateReadingTime } from '@/lib/utils'
import { NotificationService } from './notification.service'
import { ActivityService } from './activity.service'
import { AchievementService } from './achievement.service'

export class PostService {
  private notificationService: NotificationService
  private activityService: ActivityService
  private achievementService: AchievementService

  constructor(private db: PrismaClient) {
    this.notificationService = new NotificationService(db)
    this.activityService = new ActivityService(db)
    this.achievementService = new AchievementService(db)
  }

  async createPost(input: {
    title: string
    content: string
    excerpt?: string
    tags?: string[]
    categoryId?: string
    authorId: string
    youtubeVideoId?: string
    seriesId?: string
    seriesOrder?: number
    isDraft?: boolean
  }) {
    const slug = await this.generateUniqueSlug(input.title)
    const excerpt = input.excerpt || extractExcerpt(input.content)
    const readingTime = calculateReadingTime(input.content)
    const wordCount = input.content.split(/\s+/).length

    const post = await this.db.post.create({
      data: {
        title: input.title,
        content: input.content,
        excerpt,
        slug,
        authorId: input.authorId,
        categoryId: input.categoryId,
        youtubeVideoId: input.youtubeVideoId,
        seriesId: input.seriesId,
        seriesOrder: input.seriesOrder,
        readingTime,
        wordCount,
        isDraft: input.isDraft || false,
        published: !input.isDraft,
        publishedAt: !input.isDraft ? new Date() : null,
        contentStatus: input.isDraft 
          ? ContentStatus.DRAFT 
          : ContentStatus.PUBLISHED,
        tags: input.tags ? {
          connectOrCreate: input.tags.map(tag => ({
            where: { name: tag },
            create: { 
              name: tag,
              slug: generateSlug(tag),
            },
          })),
        } : undefined,
        stats: {
          create: {},
        },
      },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
        category: true,
        tags: true,
        stats: true,
        _count: {
          select: {
            comments: true,
            reactions: true,
          },
        },
      },
    })

    // Update user stats
    await this.db.userStats.update({
      where: { userId: input.authorId },
      data: { totalPosts: { increment: 1 } },
    })

    // Track activity
    await this.activityService.trackActivity({
      userId: input.authorId,
      action: 'post.created',
      entityType: 'post',
      entityId: post.id,
      entityData: {
        title: post.title,
        slug: post.slug,
      },
    })

    // Check achievements
    await this.achievementService.checkPostAchievements(input.authorId)

    // Send notifications to followers (if published)
    if (!input.isDraft) {
      await this.notifyFollowers(post)
    }

    return post
  }

  async updatePost(
    postId: string,
    userId: string,
    input: Partial<{
      title: string
      content: string
      excerpt: string
      tags: string[]
      categoryId: string
      youtubeVideoId: string
    }>
  ) {
    const post = await this.db.post.findUnique({
      where: { id: postId },
      include: { tags: true },
    })

    if (!post) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Post not found',
      })
    }

    if (post.authorId !== userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Not authorized to edit this post',
      })
    }

    // Calculate new values if content changed
    let updateData: any = { ...input }
    if (input.content) {
      updateData.readingTime = calculateReadingTime(input.content)
      updateData.wordCount = input.content.split(/\s+/).length
      if (!input.excerpt) {
        updateData.excerpt = extractExcerpt(input.content)
      }
    }

    // Update the post
    const updatedPost = await this.db.post.update({
      where: { id: postId },
      data: {
        ...updateData,
        lastEditedAt: new Date(),
        tags: input.tags ? {
          set: [], // Clear existing tags
          connectOrCreate: input.tags.map(tag => ({
            where: { name: tag },
            create: { 
              name: tag,
              slug: generateSlug(tag),
            },
          })),
        } : undefined,
      },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
        category: true,
        tags: true,
        stats: true,
        _count: {
          select: {
            comments: true,
            reactions: true,
          },
        },
      },
    })

    // Create revision
    await this.db.postRevision.create({
      data: {
        postId,
        editorId: userId,
        title: post.title,
        content: post.content,
        version: await this.getNextRevisionVersion(postId),
        changeNote: 'Post updated',
      },
    })

    return updatedPost
  }

  async deletePost(postId: string, userId: string) {
    const post = await this.db.post.findUnique({
      where: { id: postId },
    })

    if (!post) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Post not found',
      })
    }

    if (post.authorId !== userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Not authorized to delete this post',
      })
    }

    // Soft delete
    const deletedPost = await this.db.post.update({
      where: { id: postId },
      data: {
        contentStatus: ContentStatus.DELETED,
        deletedAt: new Date(),
      },
    })

    // Update user stats
    await this.db.userStats.update({
      where: { userId },
      data: { totalPosts: { decrement: 1 } },
    })

    return deletedPost
  }

  async getPostBySlug(slug: string, viewerId?: string) {
    const post = await this.db.post.findUnique({
      where: { 
        slug,
        contentStatus: ContentStatus.PUBLISHED,
      },
      include: {
        author: {
          include: {
            profile: true,
            stats: true,
          },
        },
        category: true,
        tags: true,
        stats: true,
        series: {
          include: {
            posts: {
              where: { 
                published: true,
                contentStatus: ContentStatus.PUBLISHED,
              },
              orderBy: { seriesOrder: 'asc' },
              select: {
                id: true,
                title: true,
                slug: true,
                seriesOrder: true,
              },
            },
          },
        },
        poll: {
          include: {
            options: {
              orderBy: { displayOrder: 'asc' },
            },
          },
        },
        _count: {
          select: {
            comments: true,
            reactions: true,
          },
        },
      },
    })

    if (!post) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Post not found',
      })
    }

    // Check if user has blocked the author
    if (viewerId) {
      const blocked = await this.db.block.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId: viewerId,
            blockedId: post.authorId,
          },
        },
      })

      if (blocked) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Content not available',
        })
      }
    }

    // Increment view count
    await this.incrementViewCount(post.id, viewerId)

    // Check if viewer has liked the post
    let isLiked = false
    let userReaction = null
    if (viewerId) {
      const reaction = await this.db.reaction.findUnique({
        where: {
          postId_userId_type: {
            postId: post.id,
            userId: viewerId,
            type: ReactionType.LIKE,
          },
        },
      })
      isLiked = !!reaction
      userReaction = reaction
    }

    return {
      ...post,
      isLiked,
      userReaction,
    }
  }

  async getPostById(postId: string, viewerId?: string) {
    const post = await this.db.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          include: {
            profile: true,
            stats: true,
          },
        },
        category: true,
        tags: true,
        stats: true,
        _count: {
          select: {
            comments: true,
            reactions: true,
          },
        },
      },
    })

    if (!post) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Post not found',
      })
    }

    // Allow author to see their own drafts
    if (post.isDraft && post.authorId !== viewerId) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Post not found',
      })
    }

    return post
  }

  async listPosts(params: {
    limit: number
    cursor?: string
    authorId?: string
    categoryId?: string
    tag?: string
    featured?: boolean
    sortBy?: 'latest' | 'popular' | 'trending'
    userId?: string // Viewer ID
  }) {
    const where: Prisma.PostWhereInput = {
      published: true,
      contentStatus: ContentStatus.PUBLISHED,
      authorId: params.authorId,
      categoryId: params.categoryId,
      featured: params.featured,
      tags: params.tag ? {
        some: { name: params.tag },
      } : undefined,
    }

    // Exclude posts from blocked users
    if (params.userId) {
      const blockedUsers = await this.db.block.findMany({
        where: { blockerId: params.userId },
        select: { blockedId: true },
      })
      const blockedIds = blockedUsers.map(b => b.blockedId)
      
      where.authorId = {
        notIn: blockedIds,
      }
    }

    // Determine sort order
    let orderBy: any = { createdAt: 'desc' }
    if (params.sortBy === 'popular') {
      orderBy = { stats: { totalReactionCount: 'desc' } }
    } else if (params.sortBy === 'trending') {
      orderBy = { stats: { engagementRate: 'desc' } }
    }

    const posts = await this.db.post.findMany({
      where,
      take: params.limit + 1,
      cursor: params.cursor ? { id: params.cursor } : undefined,
      include: {
        author: {
          include: {
            profile: true,
          },
        },
        category: true,
        tags: true,
        stats: true,
        _count: {
          select: {
            comments: true,
            reactions: true,
          },
        },
      },
      orderBy,
    })

    let nextCursor: string | undefined = undefined
    if (posts.length > params.limit) {
      const nextItem = posts.pop()
      nextCursor = nextItem!.id
    }

    // Check which posts are liked by the viewer
    let likedPostIds: string[] = []
    if (params.userId) {
      const reactions = await this.db.reaction.findMany({
        where: {
          userId: params.userId,
          postId: { in: posts.map(p => p.id) },
          type: ReactionType.LIKE,
        },
        select: { postId: true },
      })
      likedPostIds = reactions.map(r => r.postId)
    }

    return {
      items: posts.map(post => ({
        ...post,
        isLiked: likedPostIds.includes(post.id),
      })),
      nextCursor,
    }
  }

  async getUserFeed(userId: string, params: {
    limit: number
    cursor?: string
  }) {
    // Get users that the viewer follows
    const following = await this.db.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    })
    const followingIds = following.map(f => f.followingId)

    // Include the user's own posts
    followingIds.push(userId)

    return this.listPosts({
      ...params,
      authorId: { in: followingIds } as any,
      userId,
    })
  }

  async getTrendingPosts(params: {
    period: 'day' | 'week' | 'month' | 'all'
    limit: number
  }) {
    let dateFilter: Date | undefined
    const now = new Date()
    
    switch (params.period) {
      case 'day':
        dateFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case 'week':
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
    }

    const posts = await this.db.post.findMany({
      where: {
        published: true,
        contentStatus: ContentStatus.PUBLISHED,
        publishedAt: dateFilter ? { gte: dateFilter } : undefined,
      },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
        category: true,
        tags: true,
        stats: true,
        _count: {
          select: {
            comments: true,
            reactions: true,
          },
        },
      },
      orderBy: [
        { stats: { engagementRate: 'desc' } },
        { stats: { totalReactionCount: 'desc' } },
        { stats: { viewCount: 'desc' } },
      ],
      take: params.limit,
    })

    return posts
  }

  async likePost(postId: string, userId: string, type: ReactionType) {
    try {
      // Create reaction
      const reaction = await this.db.reaction.create({
        data: {
          postId,
          userId,
          type,
        },
      })

      // Update post stats
      await this.db.postStats.update({
        where: { postId },
        data: {
          totalReactionCount: { increment: 1 },
          [`${type.toLowerCase()}Count`]: { increment: 1 },
        },
      })

      // Update user stats
      await this.db.userStats.update({
        where: { userId },
        data: { totalLikesGiven: { increment: 1 } },
      })

      // Get post author
      const post = await this.db.post.findUnique({
        where: { id: postId },
        select: { authorId: true, title: true },
      })

      if (post && post.authorId !== userId) {
        // Update author stats
        await this.db.userStats.update({
          where: { userId: post.authorId },
          data: { totalLikesReceived: { increment: 1 } },
        })

        // Create notification
        await this.notificationService.createNotification({
          type: 'POST_LIKED',
          userId: post.authorId,
          actorId: userId,
          entityId: postId,
          entityType: 'post',
          message: `reacted to your post "${post.title}"`,
          data: { reactionType: type },
        })
      }

      // Track activity
      await this.activityService.trackActivity({
        userId,
        action: 'post.liked',
        entityType: 'post',
        entityId: postId,
        metadata: { type },
      })

      return reaction
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Already reacted to this post',
          })
        }
      }
      throw error
    }
  }

  async unlikePost(postId: string, userId: string) {
    const reaction = await this.db.reaction.findFirst({
      where: {
        postId,
        userId,
      },
    })

    if (!reaction) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Reaction not found',
      })
    }

    // Delete reaction
    await this.db.reaction.delete({
      where: { id: reaction.id },
    })

    // Update post stats
    await this.db.postStats.update({
      where: { postId },
      data: {
        totalReactionCount: { decrement: 1 },
        [`${reaction.type.toLowerCase()}Count`]: { decrement: 1 },
      },
    })

    // Update user stats
    await this.db.userStats.update({
      where: { userId },
      data: { totalLikesGiven: { decrement: 1 } },
    })

    // Get post author
    const post = await this.db.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    })

    if (post && post.authorId !== userId) {
      // Update author stats
      await this.db.userStats.update({
        where: { userId: post.authorId },
        data: { totalLikesReceived: { decrement: 1 } },
      })
    }
  }

  async bookmarkPost(params: {
    postId: string
    userId: string
    folderId?: string
    notes?: string
  }) {
    try {
      const bookmark = await this.db.bookmark.create({
        data: {
          postId: params.postId,
          userId: params.userId,
          folderId: params.folderId,
          notes: params.notes,
        },
      })

      // Update post stats
      await this.db.postStats.update({
        where: { postId: params.postId },
        data: { bookmarkCount: { increment: 1 } },
      })

      return bookmark
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Post already bookmarked',
          })
        }
      }
      throw error
    }
  }

  async unbookmarkPost(postId: string, userId: string) {
    await this.db.bookmark.delete({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    })

    // Update post stats
    await this.db.postStats.update({
      where: { postId },
      data: { bookmarkCount: { decrement: 1 } },
    })
  }

  async getUserBookmarks(params: {
    userId: string
    folderId?: string
    limit: number
    cursor?: string
  }) {
    const bookmarks = await this.db.bookmark.findMany({
      where: {
        userId: params.userId,
        folderId: params.folderId,
      },
      take: params.limit + 1,
      cursor: params.cursor ? { id: params.cursor } : undefined,
      include: {
        post: {
          include: {
            author: {
              include: {
                profile: true,
              },
            },
            category: true,
            tags: true,
            stats: true,
            _count: {
              select: {
                comments: true,
                reactions: true,
              },
            },
          },
        },
        folder: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    let nextCursor: string | undefined = undefined
    if (bookmarks.length > params.limit) {
      const nextItem = bookmarks.pop()
      nextCursor = nextItem!.id
    }

    return {
      items: bookmarks,
      nextCursor,
    }
  }

  async sharePost(postId: string, platform: string) {
    const post = await this.db.post.findUnique({
      where: { id: postId },
      select: { 
        title: true, 
        slug: true,
        excerpt: true,
      },
    })

    if (!post) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Post not found',
      })
    }

    const postUrl = `${process.env.NEXT_PUBLIC_APP_URL}/post/${post.slug}`
    const encodedUrl = encodeURIComponent(postUrl)
    const encodedTitle = encodeURIComponent(post.title)
    const encodedExcerpt = encodeURIComponent(post.excerpt || '')

    let shareUrl: string
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`
        break
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
        break
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
        break
      case 'copy':
        shareUrl = postUrl
        break
      default:
        shareUrl = postUrl
    }

    // Update share count
    await this.db.postStats.update({
      where: { postId },
      data: { shareCount: { increment: 1 } },
    })

    return shareUrl
  }

  async reportPost(params: {
    postId: string
    reporterId: string
    reason: string
    description?: string
  }) {
    const report = await this.db.report.create({
      data: {
        entityType: 'post',
        entityId: params.postId,
        reporterId: params.reporterId,
        reason: params.reason as any,
        description: params.description,
      },
    })

    // Update post moderation status
    await this.db.post.update({
      where: { id: params.postId },
      data: {
        moderationStatus: ModerationStatus.UNDER_REVIEW,
      },
    })

    return report
  }

  async getRelatedPosts(postId: string, limit: number) {
    const post = await this.db.post.findUnique({
      where: { id: postId },
      include: { tags: true },
    })

    if (!post) return []

    const tagIds = post.tags.map(t => t.id)

    // Find posts with similar tags
    const relatedPosts = await this.db.post.findMany({
      where: {
        AND: [
          { id: { not: postId } },
          { published: true },
          { contentStatus: ContentStatus.PUBLISHED },
          {
            OR: [
              { categoryId: post.categoryId },
              { tags: { some: { id: { in: tagIds } } } },
              { authorId: post.authorId },
            ],
          },
        ],
      },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
        category: true,
        tags: true,
        stats: true,
        _count: {
          select: {
            comments: true,
            reactions: true,
          },
        },
      },
      orderBy: [
        { stats: { engagementRate: 'desc' } },
        { publishedAt: 'desc' },
      ],
      take: limit,
    })

    return relatedPosts
  }

  async getPostSeries(seriesId: string) {
    const series = await this.db.postSeries.findUnique({
      where: { id: seriesId },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
        posts: {
          where: {
            published: true,
            contentStatus: ContentStatus.PUBLISHED,
          },
          orderBy: { seriesOrder: 'asc' },
          include: {
            author: {
              include: {
                profile: true,
              },
            },
            stats: true,
            _count: {
              select: {
                comments: true,
                reactions: true,
              },
            },
          },
        },
      },
    })

    if (!series) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Series not found',
      })
    }

    return series
  }

  async togglePublishStatus(postId: string, userId: string) {
    const post = await this.db.post.findUnique({
      where: { id: postId },
    })

    if (!post) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Post not found',
      })
    }

    if (post.authorId !== userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Not authorized',
      })
    }

    const updatedPost = await this.db.post.update({
      where: { id: postId },
      data: {
        published: !post.published,
        isDraft: post.published,
        publishedAt: !post.published ? new Date() : post.publishedAt,
        contentStatus: !post.published 
          ? ContentStatus.PUBLISHED 
          : ContentStatus.DRAFT,
      },
    })

    // Send notifications if newly published
    if (!post.published && updatedPost.published) {
      await this.notifyFollowers(updatedPost)
    }

    return updatedPost
  }

  // Helper methods
  private async generateUniqueSlug(title: string): Promise<string> {
    let slug = generateSlug(title)
    let counter = 1

    while (await this.db.post.findUnique({ where: { slug } })) {
      slug = `${generateSlug(title)}-${counter}`
      counter++
    }

    return slug
  }

  private async incrementViewCount(postId: string, viewerId?: string) {
    // Simple view count increment
    await this.db.postStats.update({
      where: { postId },
      data: { viewCount: { increment: 1 } },
    })

    // Track unique views if viewer is logged in
    if (viewerId) {
      const existingView = await this.db.viewHistory.findFirst({
        where: {
          postId,
          userId: viewerId,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours
          },
        },
      })

      if (!existingView) {
        await this.db.viewHistory.create({
          data: {
            postId,
            userId: viewerId,
          },
        })

        await this.db.postStats.update({
          where: { postId },
          data: { uniqueViewCount: { increment: 1 } },
        })
      }
    }

    // Update engagement rate
    await this.updateEngagementRate(postId)
  }

  private async updateEngagementRate(postId: string) {
    const stats = await this.db.postStats.findUnique({
      where: { postId },
    })

    if (!stats) return

    // Calculate engagement rate
    const engagementRate = stats.viewCount > 0
      ? ((stats.totalReactionCount + stats.commentCount + stats.shareCount) / stats.viewCount) * 100
      : 0

    await this.db.postStats.update({
      where: { postId },
      data: { engagementRate },
    })
  }

  private async getNextRevisionVersion(postId: string): Promise<number> {
    const lastRevision = await this.db.postRevision.findFirst({
      where: { postId },
      orderBy: { version: 'desc' },
    })

    return (lastRevision?.version || 0) + 1
  }

  private async notifyFollowers(post: any) {
    // Get all followers of the post author
    const followers = await this.db.follow.findMany({
      where: {
        followingId: post.authorId,
        notifyNewPosts: true,
      },
      select: { followerId: true },
    })

    // Create notifications for each follower
    const notifications = followers.map(f => ({
      type: 'USER_POSTED' as const,
      userId: f.followerId,
      actorId: post.authorId,
      entityId: post.id,
      entityType: 'post',
      message: `published a new post: "${post.title}"`,
      title: 'New Post',
    }))

    // Bulk create notifications
    for (const notification of notifications) {
      await this.notificationService.createNotification(notification)
    }
  }
}
