// src/server/services/mention.service.ts
import { PrismaClient, NotificationType } from '@prisma/client'
import { NotificationService } from './notification.service'

export class MentionService {
  private notificationService: NotificationService

  constructor(private db: PrismaClient) {
    this.notificationService = new NotificationService(db)
  }

  async processMentions(params: {
    mentionerId: string
    mentionedUsernames: string[]
    postId?: string
    commentId?: string
  }) {
    // Find mentioned users
    const mentionedUsers = await this.db.user.findMany({
      where: {
        username: { 
          in: params.mentionedUsernames,
        },
        deleted: false,
      },
      select: { 
        id: true, 
        username: true,
      },
    })

    if (mentionedUsers.length === 0) {
      return []
    }

    // Create mention records and notifications
    const mentionPromises = mentionedUsers.map(async (user) => {
      // Don't create mention for self
      if (user.id === params.mentionerId) {
        return null
      }

      // Check if mention already exists to prevent duplicates
      const existingMention = await this.db.mention.findFirst({
        where: {
          mentionerId: params.mentionerId,
          mentionedId: user.id,
          postId: params.postId,
          commentId: params.commentId,
        },
      })

      if (existingMention) {
        return existingMention
      }

      // Create mention record
      const mention = await this.db.mention.create({
        data: {
          mentionerId: params.mentionerId,
          mentionedId: user.id,
          postId: params.postId,
          commentId: params.commentId,
        },
      })

      // Create notification
      await this.notificationService.createNotification({
        type: NotificationType.MENTION,
        userId: user.id,
        actorId: params.mentionerId,
        entityId: params.commentId || params.postId || '',
        entityType: params.commentId ? 'comment' : 'post',
        title: 'You were mentioned',
        message: `mentioned you in a ${params.commentId ? 'comment' : 'post'}`,
        actionUrl: params.postId ? `/post/${params.postId}` : undefined,
        data: {
          postId: params.postId,
          commentId: params.commentId,
        },
      })

      return mention
    })

    const mentions = await Promise.all(mentionPromises)
    return mentions.filter(Boolean)
  }

  async getMentions(userId: string, limit: number = 20, cursor?: string) {
    const mentions = await this.db.mention.findMany({
      where: { 
        mentionedId: userId,
      },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      include: {
        mentioner: {
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
        comment: {
          select: {
            id: true,
            content: true,
            postId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    let nextCursor: string | undefined = undefined
    if (mentions.length > limit) {
      const nextItem = mentions.pop()
      nextCursor = nextItem!.id
    }

    return {
      items: mentions,
      nextCursor,
    }
  }

  async getMentionsForUser(userId: string, limit: number = 20, cursor?: string) {
    // Alias for getMentions for backward compatibility
    return this.getMentions(userId, limit, cursor)
  }

  async extractMentions(content: string): Promise<string[]> {
    // Extract @username mentions from content
    const mentionRegex = /@([a-zA-Z0-9_]+)/g
    const matches = content.matchAll(mentionRegex)
    const usernames = new Set<string>()

    for (const match of matches) {
      usernames.add(match[1])
    }

    return Array.from(usernames)
  }

  async acknowledgeMention(mentionId: string, userId: string) {
    const mention = await this.db.mention.findUnique({
      where: { id: mentionId },
      select: { mentionedId: true },
    })

    if (!mention || mention.mentionedId !== userId) {
      return { success: false }
    }

    await this.db.mention.update({
      where: { id: mentionId },
      data: { acknowledged: true },
    })

    return { success: true }
  }

  async deleteMention(mentionId: string, userId: string) {
    const mention = await this.db.mention.findUnique({
      where: { id: mentionId },
      select: { 
        mentionedId: true,
        mentionerId: true,
      },
    })

    // Allow deletion by either the mentioner or mentioned user
    if (!mention || (mention.mentionedId !== userId && mention.mentionerId !== userId)) {
      return { success: false }
    }

    await this.db.mention.delete({
      where: { id: mentionId },
    })

    return { success: true }
  }
}
