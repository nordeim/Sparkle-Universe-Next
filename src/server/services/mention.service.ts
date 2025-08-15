// src/server/services/mention.service.ts
import { PrismaClient } from '@prisma/client'
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
        username: { in: params.mentionedUsernames },
      },
      select: { id: true, username: true },
    })

    // Create mention records and notifications
    const mentionPromises = mentionedUsers.map(async (user) => {
      // Create mention record
      await this.db.mention.create({
        data: {
          mentionerId: params.mentionerId,
          mentionedId: user.id,
          postId: params.postId,
          commentId: params.commentId,
        },
      })

      // Create notification
      await this.notificationService.createNotification({
        type: 'MENTION',
        userId: user.id,
        actorId: params.mentionerId,
        entityId: params.commentId || params.postId || '',
        entityType: params.commentId ? 'comment' : 'post',
        title: 'You were mentioned',
        message: `mentioned you in a ${params.commentId ? 'comment' : 'post'}`,
        actionUrl: params.postId ? `/post/${params.postId}` : undefined,
      })
    })

    await Promise.all(mentionPromises)
  }

  async getMentions(userId: string, limit: number = 20) {
    return this.db.mention.findMany({
      where: { mentionedId: userId },
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
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }
}
