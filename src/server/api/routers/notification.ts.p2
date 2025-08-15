// src/server/api/routers/notification.ts
import { z } from 'zod'
import { 
  createTRPCRouter, 
  protectedProcedure 
} from '@/server/api/trpc'
import { NotificationService } from '@/server/services/notification.service'

export const notificationRouter = createTRPCRouter({
  // Get notifications
  list: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(20),
      cursor: z.string().optional(),
      unreadOnly: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const notifications = await ctx.db.notification.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input.unreadOnly && { read: false }),
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: 'desc' },
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

      let nextCursor: string | undefined = undefined
      if (notifications.length > input.limit) {
        const nextItem = notifications.pop()
        nextCursor = nextItem!.id
      }

      return {
        items: notifications,
        nextCursor,
      }
    }),

  // Mark as read
  markAsRead: protectedProcedure
    .input(z.object({
      notificationId: z.string().cuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const notificationService = new NotificationService(ctx.db)
      return notificationService.markAsRead(
        input.notificationId,
        ctx.session.user.id
      )
    }),

  // Mark all as read
  markAllAsRead: protectedProcedure
    .mutation(async ({ ctx }) => {
      const notificationService = new NotificationService(ctx.db)
      return notificationService.markAllAsRead(ctx.session.user.id)
    }),

  // Get unread count
  getUnreadCount: protectedProcedure
    .query(async ({ ctx }) => {
      const notificationService = new NotificationService(ctx.db)
      return notificationService.getUnreadCount(ctx.session.user.id)
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
      marketingEmails: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.notificationPreference.upsert({
        where: { userId: ctx.session.user.id },
        create: {
          userId: ctx.session.user.id,
          ...input,
        },
        update: input,
      })
    }),
})
