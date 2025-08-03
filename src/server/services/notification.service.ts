// src/server/services/notification.service.ts
import { PrismaClient, NotificationType } from '@prisma/client'
import { eventService } from './event.service'

export class NotificationService {
  constructor(private db: PrismaClient) {}

  async createNotification(params: {
    type: string
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
      if (prefs && notificationTypeKey && !prefs[notificationTypeKey]) {
        return null // User has disabled this notification type
      }

      // Create notification
      const notification = await this.db.notification.create({
        data: {
          type: params.type as NotificationType,
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
      eventService.emit('notification.created', {
        userId: params.userId,
        notification,
      })

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

  async markAsRead(notificationId: string, userId: string) {
    return this.db.notification.update({
      where: {
        id: notificationId,
        userId, // Ensure user owns the notification
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    })
  }

  async markAllAsRead(userId: string) {
    return this.db.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    })
  }

  async getUnreadCount(userId: string) {
    const count = await this.db.notification.count({
      where: {
        userId,
        read: false,
      },
    })
    return { count }
  }

  private getPreferenceKey(notificationType: string): keyof NotificationPreference | null {
    const mapping: Record<string, keyof NotificationPreference> = {
      'POST_LIKED': 'postLikes',
      'POST_COMMENTED': 'postComments',
      'COMMENT_LIKED': 'postComments',
      'USER_FOLLOWED': 'newFollowers',
      'MENTION': 'mentions',
      'DIRECT_MESSAGE': 'directMessages',
      'GROUP_INVITE': 'groupInvites',
      'EVENT_REMINDER': 'eventReminders',
    }
    return mapping[notificationType] || null
  }

  private async queueEmailNotification(notification: any) {
    // TODO: Implement email queue
    console.log('Queueing email notification:', notification.id)
  }

  private async queuePushNotification(notification: any) {
    // TODO: Implement push notification queue
    console.log('Queueing push notification:', notification.id)
  }
}
