// src/services/notification.service.ts
import { db, transaction } from '@/lib/db'
import { redis, redisHelpers } from '@/lib/redis'
import { logger } from '@/lib/monitoring'
import { 
  NotificationType, 
  NotificationPreference,
  Prisma 
} from '@prisma/client'
import { eventEmitter } from '@/lib/events/event-emitter'

export interface CreateNotificationInput {
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
}

export interface NotificationOptions {
  email?: boolean
  push?: boolean
  sms?: boolean
}

export class NotificationService {
  private static readonly CACHE_PREFIX = 'notifications:'
  private static readonly UNREAD_COUNT_KEY = 'unread_count:'

  // Create notification
  static async createNotification(
    input: CreateNotificationInput,
    options: NotificationOptions = {}
  ) {
    logger.info('Creating notification', { 
      type: input.type, 
      userId: input.userId 
    })

    // Check user preferences
    const preferences = await this.getUserPreferences(input.userId)
    if (!preferences) {
      logger.warn('User preferences not found', { userId: input.userId })
      return null
    }

    // Check if user wants this type of notification
    if (!this.shouldSendNotification(input.type, preferences)) {
      logger.info('Notification skipped due to user preferences', {
        type: input.type,
        userId: input.userId,
      })
      return null
    }

    // Create notification in database
    const notification = await db.notification.create({
      data: {
        ...input,
        expiresAt: this.calculateExpiryDate(input.type),
      },
    })

    // Update unread count in cache
    await this.incrementUnreadCount(input.userId)

    // Send real-time notification if user is online
    await this.sendRealtimeNotification(notification)

    // Queue for other channels based on preferences and options
    if (options.email || (options.email === undefined && preferences.emailNotifications)) {
      await this.queueEmailNotification(notification)
    }

    if (options.push || (options.push === undefined && preferences.pushNotifications)) {
      await this.queuePushNotification(notification)
    }

    if (options.sms || (options.sms === undefined && preferences.smsNotifications)) {
      await this.queueSmsNotification(notification)
    }

    // Emit notification created event
    eventEmitter.emit('notification:created', { notification })

    return notification
  }

  // Create bulk notifications
  static async createBulkNotifications(
    userIds: string[],
    template: Omit<CreateNotificationInput, 'userId'>,
    options: NotificationOptions = {}
  ) {
    logger.info('Creating bulk notifications', { 
      userCount: userIds.length,
      type: template.type 
    })

    const notifications = await transaction(async (tx) => {
      const created = await Promise.all(
        userIds.map((userId) =>
          tx.notification.create({
            data: {
              ...template,
              userId,
              expiresAt: this.calculateExpiryDate(template.type),
            },
          })
        )
      )
      return created
    })

    // Update unread counts
    await Promise.all(
      userIds.map((userId) => this.incrementUnreadCount(userId))
    )

    // Send realtime notifications
    await Promise.all(
      notifications.map((notification) =>
        this.sendRealtimeNotification(notification)
      )
    )

    return notifications
  }

  // Get user preferences
  private static async getUserPreferences(
    userId: string
  ): Promise<NotificationPreference | null> {
    return db.notificationPreference.findUnique({
      where: { userId },
    })
  }

  // Check if notification should be sent based on type and preferences
  private static shouldSendNotification(
    type: NotificationType,
    preferences: NotificationPreference
  ): boolean {
    const typePreferenceMap: Record<NotificationType, keyof NotificationPreference> = {
      [NotificationType.POST_LIKED]: 'postLikes',
      [NotificationType.POST_COMMENTED]: 'postComments',
      [NotificationType.COMMENT_LIKED]: 'postLikes',
      [NotificationType.USER_FOLLOWED]: 'newFollowers',
      [NotificationType.MENTION]: 'mentions',
      [NotificationType.DIRECT_MESSAGE]: 'directMessages',
      [NotificationType.GROUP_INVITE]: 'groupInvites',
      [NotificationType.EVENT_REMINDER]: 'eventReminders',
      [NotificationType.ACHIEVEMENT_UNLOCKED]: 'emailNotifications',
      [NotificationType.LEVEL_UP]: 'emailNotifications',
      [NotificationType.SYSTEM]: 'emailNotifications',
      [NotificationType.GROUP_POST]: 'groupInvites',
      [NotificationType.WATCH_PARTY_INVITE]: 'eventReminders',
      [NotificationType.YOUTUBE_PREMIERE]: 'eventReminders',
      [NotificationType.QUEST_COMPLETE]: 'emailNotifications',
      [NotificationType.TRADE_REQUEST]: 'directMessages',
      [NotificationType.CONTENT_FEATURED]: 'emailNotifications',
      [NotificationType.MILESTONE_REACHED]: 'emailNotifications',
    }

    const preferenceKey = typePreferenceMap[type]
    return preferences[preferenceKey] as boolean
  }

  // Calculate notification expiry date
  private static calculateExpiryDate(type: NotificationType): Date {
    const expiryDays = {
      [NotificationType.SYSTEM]: 30,
      [NotificationType.ACHIEVEMENT_UNLOCKED]: 90,
      [NotificationType.LEVEL_UP]: 90,
      [NotificationType.CONTENT_FEATURED]: 90,
      [NotificationType.MILESTONE_REACHED]: 90,
      // Most notifications expire after 7 days
      default: 7,
    }

    const days = expiryDays[type] || expiryDays.default
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  }

  // Send realtime notification
  private static async sendRealtimeNotification(notification: any) {
    const isOnline = await redis.exists(`presence:${notification.userId}`)
    
    if (isOnline) {
      // Publish to user's channel
      await redis.publish(
        `notifications:${notification.userId}`,
        JSON.stringify(notification)
      )
    }
  }

  // Queue email notification
  private static async queueEmailNotification(notification: any) {
    await db.notificationQueue.create({
      data: {
        userId: notification.userId,
        type: notification.type,
        channel: 'email',
        payload: notification,
        priority: notification.priority || 0,
      },
    })
  }

  // Queue push notification
  private static async queuePushNotification(notification: any) {
    await db.notificationQueue.create({
      data: {
        userId: notification.userId,
        type: notification.type,
        channel: 'push',
        payload: notification,
        priority: notification.priority || 0,
      },
    })
  }

  // Queue SMS notification
  private static async queueSmsNotification(notification: any) {
    // Only for high priority notifications
    if (notification.priority >= 2) {
      await db.notificationQueue.create({
        data: {
          userId: notification.userId,
          type: notification.type,
          channel: 'sms',
          payload: notification,
          priority: notification.priority,
        },
      })
    }
  }

  // Get notifications for user
  static async getNotifications(
    userId: string,
    options: {
      limit?: number
      cursor?: string
      unreadOnly?: boolean
      types?: NotificationType[]
    } = {}
  ) {
    const { limit = 20, cursor, unreadOnly = false, types } = options

    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(unreadOnly && { read: false }),
      ...(types && { type: { in: types } }),
      ...(cursor && { id: { lt: cursor } }),
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    }

    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      include: {
        actor: {
          select: {
            id: true,
            username: true,
            image: true,
          },
        },
      },
    })

    const hasMore = notifications.length > limit
    const items = hasMore ? notifications.slice(0, -1) : notifications
    const nextCursor = hasMore ? items[items.length - 1].id : null

    return {
      items,
      nextCursor,
      hasMore,
    }
  }

  // Mark notification as read
  static async markAsRead(
    notificationId: string,
    userId: string
  ): Promise<void> {
    const notification = await db.notification.update({
      where: {
        id: notificationId,
        userId, // Ensure user owns this notification
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    })

    // Update unread count
    await this.decrementUnreadCount(userId)

    eventEmitter.emit('notification:read', { notification })
  }

  // Mark all notifications as read
  static async markAllAsRead(userId: string): Promise<void> {
    await db.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    })

    // Clear unread count
    await redis.del(`${this.UNREAD_COUNT_KEY}${userId}`)

    eventEmitter.emit('notification:allRead', { userId })
  }

  // Get unread count
  static async getUnreadCount(userId: string): Promise<number> {
    // Try cache first
    const cached = await redis.get(`${this.UNREAD_COUNT_KEY}${userId}`)
    if (cached !== null) {
      return parseInt(cached, 10)
    }

    // Count from database
    const count = await db.notification.count({
      where: {
        userId,
        read: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    })

    // Cache for 5 minutes
    await redis.setex(`${this.UNREAD_COUNT_KEY}${userId}`, 300, count)
    return count
  }

  // Update unread count
  private static async incrementUnreadCount(userId: string): Promise<void> {
    const key = `${this.UNREAD_COUNT_KEY}${userId}`
    const exists = await redis.exists(key)
    
    if (exists) {
      await redis.incr(key)
    }
  }

  private static async decrementUnreadCount(userId: string): Promise<void> {
    const key = `${this.UNREAD_COUNT_KEY}${userId}`
    const exists = await redis.exists(key)
    
    if (exists) {
      const count = await redis.decr(key)
      if (count < 0) {
        await redis.set(key, 0)
      }
    }
  }

  // Delete notification
  static async deleteNotification(
    notificationId: string,
    userId: string
  ): Promise<void> {
    const notification = await db.notification.delete({
      where: {
        id: notificationId,
        userId, // Ensure user owns this notification
      },
    })

    if (!notification.read) {
      await this.decrementUnreadCount(userId)
    }

    eventEmitter.emit('notification:deleted', { notification })
  }

  // Clean up expired notifications
  static async cleanupExpiredNotifications(): Promise<number> {
    const result = await db.notification.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    })

    logger.info('Cleaned up expired notifications', { count: result.count })
    return result.count
  }
}
