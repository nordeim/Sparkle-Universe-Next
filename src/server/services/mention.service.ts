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

    // Create mention records
    const mentions = await Promise.all(
      mentionedUsers.map(async (user) => {
        // Don't create mention for self
        if (user.id === params.mentionerId) {
          return null
        }

        // Check if mention already exists
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

        // Create new mention
        const mention = await this.db.mention.create({
          data: {
            mentionerId: params.mentionerId,
            mentionedId: user.id,
            postId: params.postId,
            commentId: params.commentId,
          },
        })

        // Send notification
        await this.notificationService.createNotification({
          type: NotificationType.MENTION,
          userId: user.id,
          actorId: params.mentionerId,
          entityId: params.commentId || params.postId || '',
          entityType: params.commentId ? 'comment' : 'post',
          title: 'You were mentioned',
          message: `mentioned you in a ${params.commentId ? 'comment' : 'post'}`,
          data: {
            postId: params.postId,
            commentId: params.commentId,
          },
        })

        return mention
      })
    )

    return mentions.filter(Boolean)
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

  async getMentionsForUser(userId: string, limit: number = 20, cursor?: string) {
    const mentions = await this.db.mention.findMany({
      where: {
        mentionedId: userId,
      },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      include: {
        mentioner: {
          select: {
            id: true,
            username: true,
            image: true,
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
}
