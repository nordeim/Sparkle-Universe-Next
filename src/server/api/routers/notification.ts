// src/server/api/routers/notification.ts
import { z } from 'zod'
import { 
  createTRPCRouter, 
  protectedProcedure 
} from '@/server/api/trpc'
import { NotificationService } from '@/server/services/notification.service'
import { CacheService } from '@/server/services/cache.service'
import { EventService } from '@/server/services/event.service'

export const notificationRouter = createTRPCRouter({
  // List notifications
  list: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(20),
      cursor: z.string().optional(),
      unreadOnly: z.boolean().optional().default(false),
      type: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const notificationService = new NotificationService(ctx.db)
      return notificationService.listNotifications({
        ...input,
        userId: ctx.session.user.id,
      })
    }),

  // Get unread count
  getUnreadCount: protectedProcedure
    .query(async ({ ctx }) => {
      const notificationService = new NotificationService(ctx.db)
      const cacheService = new CacheService()
      
      // Try cache first
      const cacheKey = `notifications:unread:${ctx.session.user.id}`
      const cached = await cacheService.get(cacheKey)
      if (cached) return cached

      const result = await notificationService.getUnreadCount(ctx.session.user.id)
      
      // Cache for 30 seconds
      await cacheService.set(cacheKey, result, 30)
      
      return result
    }),

  // Mark as read
  markAsRead: protectedProcedure
    .input(z.object({
      id: z.string().cuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const notificationService = new NotificationService(ctx.db)
      const cacheService = new CacheService()
      const eventService = new EventService()
      
      const notification = await notificationService.markAsRead(
        input.id,
        ctx.session.user.id
      )

      // Invalidate cache
      await cacheService.del(`notifications:unread:${ctx.session.user.id}`)

      // Emit event
      await eventService.emit('notification.read', {
        userId: ctx.session.user.id,
        notificationId: input.id,
      })

      return notification
    }),

  // Mark all as read
  markAllAsRead: protectedProcedure
    .mutation(async ({ ctx }) => {
      const notificationService = new NotificationService(ctx.db)
      const cacheService = new CacheService()
      const eventService = new EventService()
      
      const result = await notificationService.markAllAsRead(ctx.session.user.id)

      // Invalidate cache
      await cacheService.del(`notifications:unread:${ctx.session.user.id}`)

      // Emit event
      await eventService.emit('notification.allRead', {
        userId: ctx.session.user.id,
      })

      return result
    }),

  // Delete notification
  delete: protectedProcedure
    .input(z.object({
      id: z.string().cuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const notificationService = new NotificationService(ctx.db)
      const cacheService = new CacheService()
      
      await notificationService.deleteNotification(
        input.id,
        ctx.session.user.id
      )

      // Invalidate cache
      await cacheService.del(`notifications:unread:${ctx.session.user.id}`)

      return { success: true }
    }),

  // Update preferences
  updatePreferences: protectedProcedure
    .input(z.object({
      emailNotifications: z.boolean().optional(),
      pushNotifications: z.boolean().optional(),
      postLikes: z.boolean().optional(),
      postComments: z.boolean().optional(),
      newFollowers: z.boolean().optional(),
      mentions: z.boolean().optional(),
      directMessages: z.boolean().optional(),
      groupInvites: z.boolean().optional(),
      eventReminders: z.boolean().optional(),
      marketingEmails: z.boolean().optional(),
      weeklyDigest: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const notificationService = new NotificationService(ctx.db)
      return notificationService.updatePreferences(
        ctx.session.user.id,
        input
      )
    }),

  // Get preferences
  getPreferences: protectedProcedure
    .query(async ({ ctx }) => {
      const notificationService = new NotificationService(ctx.db)
      return notificationService.getPreferences(ctx.session.user.id)
    }),

  // Test notification (for development)
  test: protectedProcedure
    .mutation(async ({ ctx }) => {
      const notificationService = new NotificationService(ctx.db)
      return notificationService.createNotification({
        type: 'SYSTEM',
        userId: ctx.session.user.id,
        title: 'Test Notification',
        message: 'This is a test notification',
        data: {
          timestamp: new Date(),
        },
      })
    }),
})
