// src/server/api/routers/message.ts
import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc"
import { TRPCError } from "@trpc/server"

export const messageRouter = createTRPCRouter({
  // Get conversations for current user
  getConversations: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(20),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const { limit, cursor } = input

      const conversations = await ctx.db.conversation.findMany({
        where: {
          participants: {
            some: {
              userId,
            },
          },
          deleted: false,
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  image: true,
                  role: true,
                },
              },
            },
          },
          messages: {
            take: 1,
            orderBy: {
              createdAt: 'desc',
            },
            include: {
              sender: {
                select: {
                  username: true,
                },
              },
            },
          },
          _count: {
            select: {
              messages: {
                where: {
                  status: {
                    not: 'READ',
                  },
                  senderId: {
                    not: userId,
                  },
                },
              },
            },
          },
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
          lastMessageAt: 'desc',
        },
      })

      let nextCursor: typeof cursor | undefined = undefined
      if (conversations.length > limit) {
        const nextItem = conversations.pop()
        nextCursor = nextItem!.id
      }

      return {
        conversations,
        nextCursor,
      }
    }),

  // Get messages in a conversation
  getMessages: protectedProcedure
    .input(z.object({
      conversationId: z.string(),
      limit: z.number().min(1).max(100).default(50),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const { conversationId, limit, cursor } = input

      // Check if user is participant
      const participant = await ctx.db.conversationParticipant.findFirst({
        where: {
          conversationId,
          userId,
        },
      })

      if (!participant) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not a participant in this conversation',
        })
      }

      const messages = await ctx.db.message.findMany({
        where: {
          conversationId,
          deleted: false,
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              image: true,
              role: true,
            },
          },
          reads: {
            where: {
              userId,
            },
          },
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
          createdAt: 'desc',
        },
      })

      let nextCursor: typeof cursor | undefined = undefined
      if (messages.length > limit) {
        const nextItem = messages.pop()
        nextCursor = nextItem!.id
      }

      // Mark messages as read
      const unreadMessageIds = messages
        .filter(m => m.senderId !== userId && m.reads.length === 0)
        .map(m => m.id)

      if (unreadMessageIds.length > 0) {
        await ctx.db.messageRead.createMany({
          data: unreadMessageIds.map(messageId => ({
            messageId,
            userId,
          })),
          skipDuplicates: true,
        })

        // Update message status
        await ctx.db.message.updateMany({
          where: {
            id: { in: unreadMessageIds },
          },
          data: {
            status: 'READ',
          },
        })
      }

      return {
        messages: messages.reverse(), // Return in chronological order
        nextCursor,
      }
    }),

  // Send a message
  sendMessage: protectedProcedure
    .input(z.object({
      conversationId: z.string().optional(),
      recipientId: z.string().optional(),
      content: z.string().min(1).max(5000),
      replyToId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const senderId = ctx.session.user.id
      const { content, replyToId } = input
      let { conversationId, recipientId } = input

      // If no conversation ID, create or find conversation
      if (!conversationId && recipientId) {
        // Check for existing conversation
        const existingConversation = await ctx.db.conversation.findFirst({
          where: {
            isGroup: false,
            participants: {
              every: {
                userId: { in: [senderId, recipientId] },
              },
            },
          },
        })

        if (existingConversation) {
          conversationId = existingConversation.id
        } else {
          // Create new conversation
          const conversation = await ctx.db.conversation.create({
            data: {
              isGroup: false,
              createdBy: senderId,
              participants: {
                createMany: {
                  data: [
                    { userId: senderId },
                    { userId: recipientId },
                  ],
                },
              },
            },
          })
          conversationId = conversation.id
        }
      }

      if (!conversationId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Conversation ID or recipient ID is required',
        })
      }

      // Check if user is participant
      const participant = await ctx.db.conversationParticipant.findFirst({
        where: {
          conversationId,
          userId: senderId,
        },
      })

      if (!participant) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not a participant in this conversation',
        })
      }

      // Create message
      const message = await ctx.db.message.create({
        data: {
          conversationId,
          senderId,
          content,
          replyToId,
          status: 'SENT',
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              image: true,
              role: true,
            },
          },
        },
      })

      // Update conversation last message time
      await ctx.db.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: new Date(),
        },
      })

      // Create notifications for other participants
      const otherParticipants = await ctx.db.conversationParticipant.findMany({
        where: {
          conversationId,
          userId: { not: senderId },
        },
      })

      for (const participant of otherParticipants) {
        await ctx.db.notification.create({
          data: {
            userId: participant.userId,
            type: 'DIRECT_MESSAGE',
            actorId: senderId,
            entityId: message.id,
            entityType: 'message',
            title: 'New Message',
            message: `You have a new message`,
          },
        })
      }

      return message
    }),

  // Delete a message (soft delete)
  deleteMessage: protectedProcedure
    .input(z.object({
      messageId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const { messageId } = input

      const message = await ctx.db.message.findUnique({
        where: { id: messageId },
      })

      if (!message) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Message not found',
        })
      }

      if (message.senderId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only delete your own messages',
        })
      }

      // Soft delete
      const deletedMessage = await ctx.db.message.update({
        where: { id: messageId },
        data: {
          deleted: true,
          deletedAt: new Date(),
        },
      })

      return deletedMessage
    }),

  // Mark conversation as read
  markAsRead: protectedProcedure
    .input(z.object({
      conversationId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const { conversationId } = input

      // Update all unread messages in conversation
      await ctx.db.message.updateMany({
        where: {
          conversationId,
          senderId: { not: userId },
          status: { not: 'READ' },
        },
        data: {
          status: 'READ',
        },
      })

      return { success: true }
    }),
})
