// src/lib/socket/socket-server.ts
import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'
import { parse } from 'cookie'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { redis, redisPub, redisSub } from '@/lib/redis'
import { logger } from '@/lib/monitoring'
import { db } from '@/lib/db'
import { eventEmitter } from '@/lib/events/event-emitter'
import { createAdapter } from '@socket.io/redis-adapter'

// Socket event types
export interface ServerToClientEvents {
  // Connection events
  connected: (data: { socketId: string }) => void
  error: (error: { message: string; code: string }) => void

  // User presence
  userOnline: (data: { userId: string; status: string }) => void
  userOffline: (data: { userId: string }) => void
  presenceUpdate: (data: { userId: string; status: string; location?: string }) => void

  // Notifications
  notification: (notification: any) => void
  unreadCountUpdate: (count: number) => void

  // Real-time content updates
  postCreated: (post: any) => void
  postUpdated: (post: any) => void
  postDeleted: (postId: string) => void
  commentCreated: (comment: any) => void
  commentUpdated: (comment: any) => void
  commentDeleted: (commentId: string) => void

  // Reactions
  reactionAdded: (data: { 
    entityType: 'post' | 'comment'
    entityId: string
    reaction: any
    counts: Record<string, number>
  }) => void
  reactionRemoved: (data: {
    entityType: 'post' | 'comment'
    entityId: string
    reactionType: string
    counts: Record<string, number>
  }) => void

  // Typing indicators
  userTyping: (data: { userId: string; channelId: string; username: string }) => void
  userStoppedTyping: (data: { userId: string; channelId: string }) => void

  // Direct messages
  messageReceived: (message: any) => void
  messageRead: (data: { messageId: string; readBy: string }) => void
  conversationUpdated: (conversation: any) => void

  // Live features
  watchPartyUpdate: (data: any) => void
  liveViewerCount: (data: { entityId: string; count: number }) => void
}

export interface ClientToServerEvents {
  // User presence
  updatePresence: (data: { status: string; location?: string }) => void
  
  // Subscriptions
  subscribeToPost: (postId: string) => void
  unsubscribeFromPost: (postId: string) => void
  subscribeToUser: (userId: string) => void
  unsubscribeFromUser: (userId: string) => void
  subscribeToConversation: (conversationId: string) => void
  unsubscribeFromConversation: (conversationId: string) => void

  // Typing indicators
  startTyping: (data: { channelId: string; channelType: string }) => void
  stopTyping: (data: { channelId: string; channelType: string }) => void

  // Direct messages
  sendMessage: (data: { conversationId: string; content: string; type: string }) => void
  markMessageRead: (messageId: string) => void

  // Real-time interactions
  addReaction: (data: {
    entityType: 'post' | 'comment'
    entityId: string
    reactionType: string
  }) => void
  removeReaction: (data: {
    entityType: 'post' | 'comment'
    entityId: string
    reactionType: string
  }) => void

  // Live features
  joinWatchParty: (partyId: string) => void
  leaveWatchParty: (partyId: string) => void
  updateWatchPartyState: (data: { partyId: string; state: any }) => void
}

export interface InterServerEvents {
  ping: () => void
}

export interface SocketData {
  userId: string
  username: string
  sessionId: string
}

// Enhanced Socket class with authentication
class AuthenticatedSocket {
  private io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
  private userSockets: Map<string, Set<string>> = new Map() // userId -> socketIds
  private socketRooms: Map<string, Set<string>> = new Map() // socketId -> rooms

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        credentials: true,
      },
      pingTimeout: 20000,
      pingInterval: 25000,
      transports: ['websocket', 'polling'],
      allowEIO3: true,
    })

    // Set up Redis adapter for horizontal scaling
    const pubClient = redisPub
    const subClient = redisSub
    this.io.adapter(createAdapter(pubClient, subClient))

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const sessionToken = this.extractSessionToken(socket)
        if (!sessionToken) {
          return next(new Error('Authentication required'))
        }

        const session = await this.validateSession(sessionToken)
        if (!session) {
          return next(new Error('Invalid session'))
        }

        // Attach user data to socket
        socket.data.userId = session.user.id
        socket.data.username = session.user.username
        socket.data.sessionId = sessionToken

        next()
      } catch (error) {
        logger.error('Socket authentication error:', error)
        next(new Error('Authentication failed'))
      }
    })

    this.setupEventHandlers()
    this.setupCleanupHandlers()
  }

  private extractSessionToken(socket: Socket): string | null {
    // Try to get token from handshake auth
    const token = socket.handshake.auth?.token
    if (token) return token

    // Try to get from cookies
    const cookies = socket.handshake.headers.cookie
    if (cookies) {
      const parsed = parse(cookies)
      return parsed['next-auth.session-token'] || parsed['__Secure-next-auth.session-token'] || null
    }

    return null
  }

  private async validateSession(sessionToken: string) {
    // Validate session using NextAuth
    // In production, this would check the session from database/Redis
    const session = await getServerSession(authOptions)
    return session
  }

  private setupEventHandlers() {
    this.io.on('connection', async (socket) => {
      const { userId, username } = socket.data
      logger.info('Socket connected', { socketId: socket.id, userId })

      // Track user socket
      this.addUserSocket(userId, socket.id)

      // Join user's personal room
      socket.join(`user:${userId}`)

      // Update presence
      await this.updateUserPresence(userId, 'online')

      // Send connection confirmation
      socket.emit('connected', { socketId: socket.id })

      // Set up event handlers
      this.handlePresenceEvents(socket)
      this.handleSubscriptionEvents(socket)
      this.handleTypingEvents(socket)
      this.handleMessageEvents(socket)
      this.handleReactionEvents(socket)
      this.handleLiveFeatureEvents(socket)

      // Handle disconnect
      socket.on('disconnect', async (reason) => {
        logger.info('Socket disconnected', { socketId: socket.id, userId, reason })
        
        this.removeUserSocket(userId, socket.id)
        
        // Check if user has no more active sockets
        const userSockets = this.userSockets.get(userId)
        if (!userSockets || userSockets.size === 0) {
          await this.updateUserPresence(userId, 'offline')
        }
      })
    })
  }

  private handlePresenceEvents(socket: Socket) {
    socket.on('updatePresence', async ({ status, location }) => {
      const { userId } = socket.data
      
      await this.updateUserPresence(userId, status, location)
      
      // Broadcast to user's followers
      const followers = await this.getUserFollowers(userId)
      followers.forEach(followerId => {
        this.io.to(`user:${followerId}`).emit('presenceUpdate', {
          userId,
          status,
          location,
        })
      })
    })
  }

  private handleSubscriptionEvents(socket: Socket) {
    socket.on('subscribeToPost', (postId) => {
      socket.join(`post:${postId}`)
      logger.debug('User subscribed to post', { userId: socket.data.userId, postId })
    })

    socket.on('unsubscribeFromPost', (postId) => {
      socket.leave(`post:${postId}`)
    })

    socket.on('subscribeToUser', (userId) => {
      socket.join(`user-updates:${userId}`)
    })

    socket.on('unsubscribeFromUser', (userId) => {
      socket.leave(`user-updates:${userId}`)
    })

    socket.on('subscribeToConversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`)
    })

    socket.on('unsubscribeFromConversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`)
    })
  }

  private handleTypingEvents(socket: Socket) {
    const typingTimers = new Map<string, NodeJS.Timeout>()

    socket.on('startTyping', ({ channelId, channelType }) => {
      const { userId, username } = socket.data
      const key = `${userId}:${channelId}`

      // Clear existing timer
      const existingTimer = typingTimers.get(key)
      if (existingTimer) {
        clearTimeout(existingTimer)
      }

      // Broadcast typing indicator
      socket.to(channelId).emit('userTyping', {
        userId,
        channelId,
        username,
      })

      // Auto-stop typing after 5 seconds
      const timer = setTimeout(() => {
        socket.to(channelId).emit('userStoppedTyping', {
          userId,
          channelId,
        })
        typingTimers.delete(key)
      }, 5000)

      typingTimers.set(key, timer)
    })

    socket.on('stopTyping', ({ channelId }) => {
      const { userId } = socket.data
      const key = `${userId}:${channelId}`

      // Clear timer
      const timer = typingTimers.get(key)
      if (timer) {
        clearTimeout(timer)
        typingTimers.delete(key)
      }

      // Broadcast stop typing
      socket.to(channelId).emit('userStoppedTyping', {
        userId,
        channelId,
      })
    })

    // Clean up timers on disconnect
    socket.on('disconnect', () => {
      typingTimers.forEach(timer => clearTimeout(timer))
      typingTimers.clear()
    })
  }

  private handleMessageEvents(socket: Socket) {
    socket.on('sendMessage', async ({ conversationId, content, type }) => {
      const { userId } = socket.data

      try {
        // Validate user is part of conversation
        const participant = await db.conversationParticipant.findUnique({
          where: {
            conversationId_userId: {
              conversationId,
              userId,
            },
          },
        })

        if (!participant || !participant.isActive) {
          socket.emit('error', { 
            message: 'Not authorized to send messages in this conversation',
            code: 'UNAUTHORIZED',
          })
          return
        }

        // Create message (implement in message service)
        const message = await db.message.create({
          data: {
            conversationId,
            senderId: userId,
            content,
            messageType: type,
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                image: true,
              },
            },
          },
        })

        // Broadcast to conversation participants
        this.io.to(`conversation:${conversationId}`).emit('messageReceived', message)

        // Update conversation
        await db.conversation.update({
          where: { id: conversationId },
          data: {
            lastMessageId: message.id,
            lastMessageAt: new Date(),
            messageCount: { increment: 1 },
          },
        })

      } catch (error) {
        logger.error('Failed to send message:', error)
        socket.emit('error', { 
          message: 'Failed to send message',
          code: 'MESSAGE_SEND_FAILED',
        })
      }
    })

    socket.on('markMessageRead', async (messageId) => {
      const { userId } = socket.data

      try {
        await db.messageRead.create({
          data: {
            messageId,
            userId,
          },
        })

        // Notify sender
        const message = await db.message.findUnique({
          where: { id: messageId },
          select: { senderId: true, conversationId: true },
        })

        if (message) {
          this.io.to(`user:${message.senderId}`).emit('messageRead', {
            messageId,
            readBy: userId,
          })
        }
      } catch (error) {
        logger.error('Failed to mark message as read:', error)
      }
    })
  }

  private handleReactionEvents(socket: Socket) {
    socket.on('addReaction', async ({ entityType, entityId, reactionType }) => {
      const { userId } = socket.data

      try {
        // Add reaction to database
        await db.reaction.create({
          data: {
            type: reactionType as any,
            userId,
            ...(entityType === 'post' ? { postId: entityId } : { commentId: entityId }),
          },
        })

        // Get updated reaction counts
        const counts = await this.getReactionCounts(entityType, entityId)

        // Broadcast to relevant room
        const room = entityType === 'post' ? `post:${entityId}` : `comment:${entityId}`
        this.io.to(room).emit('reactionAdded', {
          entityType,
          entityId,
          reaction: { userId, type: reactionType },
          counts,
        })

      } catch (error) {
        logger.error('Failed to add reaction:', error)
        socket.emit('error', { 
          message: 'Failed to add reaction',
          code: 'REACTION_ADD_FAILED',
        })
      }
    })

    socket.on('removeReaction', async ({ entityType, entityId, reactionType }) => {
      const { userId } = socket.data

      try {
        // Remove reaction from database
        await db.reaction.deleteMany({
          where: {
            type: reactionType as any,
            userId,
            ...(entityType === 'post' ? { postId: entityId } : { commentId: entityId }),
          },
        })

        // Get updated reaction counts
        const counts = await this.getReactionCounts(entityType, entityId)

        // Broadcast to relevant room
        const room = entityType === 'post' ? `post:${entityId}` : `comment:${entityId}`
        this.io.to(room).emit('reactionRemoved', {
          entityType,
          entityId,
          reactionType,
          counts,
        })

      } catch (error) {
        logger.error('Failed to remove reaction:', error)
        socket.emit('error', { 
          message: 'Failed to remove reaction',
          code: 'REACTION_REMOVE_FAILED',
        })
      }
    })
  }

  private handleLiveFeatureEvents(socket: Socket) {
    socket.on('joinWatchParty', async (partyId) => {
      const { userId } = socket.data

      try {
        // Verify user can join
        const party = await db.watchParty.findUnique({
          where: { id: partyId },
          include: { participants: { where: { userId } } },
        })

        if (!party) {
          socket.emit('error', { 
            message: 'Watch party not found',
            code: 'PARTY_NOT_FOUND',
          })
          return
        }

        // Join party room
        socket.join(`party:${partyId}`)

        // Update participant count
        const participantCount = await db.watchPartyParticipant.count({
          where: { partyId, isActive: true },
        })

        this.io.to(`party:${partyId}`).emit('watchPartyUpdate', {
          type: 'userJoined',
          userId,
          participantCount,
        })

      } catch (error) {
        logger.error('Failed to join watch party:', error)
        socket.emit('error', { 
          message: 'Failed to join watch party',
          code: 'PARTY_JOIN_FAILED',
        })
      }
    })

    socket.on('leaveWatchParty', (partyId) => {
      socket.leave(`party:${partyId}`)
      
      this.io.to(`party:${partyId}`).emit('watchPartyUpdate', {
        type: 'userLeft',
        userId: socket.data.userId,
      })
    })
  }

  private async updateUserPresence(userId: string, status: string, location?: string) {
    const key = `presence:${userId}`
    
    if (status === 'online') {
      await redis.setex(key, 300, JSON.stringify({ status, location, lastSeen: new Date() }))
      
      // Update user record
      await db.user.update({
        where: { id: userId },
        data: { 
          onlineStatus: true,
          lastSeenAt: new Date(),
        },
      })

      // Emit online event
      this.io.emit('userOnline', { userId, status })
    } else {
      await redis.del(key)
      
      // Update user record
      await db.user.update({
        where: { id: userId },
        data: { 
          onlineStatus: false,
          lastSeenAt: new Date(),
        },
      })

      // Emit offline event
      this.io.emit('userOffline', { userId })
    }
  }

  private async getReactionCounts(entityType: string, entityId: string) {
    const reactions = await db.reaction.groupBy({
      by: ['type'],
      where: entityType === 'post' ? { postId: entityId } : { commentId: entityId },
      _count: { type: true },
    })

    return reactions.reduce((acc, { type, _count }) => {
      acc[type] = _count.type
      return acc
    }, {} as Record<string, number>)
  }

  private async getUserFollowers(userId: string): Promise<string[]> {
    const followers = await db.follow.findMany({
      where: { followingId: userId },
      select: { followerId: true },
    })
    return followers.map(f => f.followerId)
  }

  private addUserSocket(userId: string, socketId: string) {
    const sockets = this.userSockets.get(userId) || new Set()
    sockets.add(socketId)
    this.userSockets.set(userId, sockets)
  }

  private removeUserSocket(userId: string, socketId: string) {
    const sockets = this.userSockets.get(userId)
    if (sockets) {
      sockets.delete(socketId)
      if (sockets.size === 0) {
        this.userSockets.delete(userId)
      }
    }
  }

  private setupCleanupHandlers() {
    // Clean up stale presence data periodically
    setInterval(async () => {
      const keys = await redis.keys('presence:*')
      for (const key of keys) {
        const data = await redis.get(key)
        if (data) {
          const presence = JSON.parse(data)
          const lastSeen = new Date(presence.lastSeen)
          const now = new Date()
          const diff = now.getTime() - lastSeen.getTime()
          
          // Remove if not seen for more than 5 minutes
          if (diff > 5 * 60 * 1000) {
            await redis.del(key)
            const userId = key.split(':')[1]
            this.io.emit('userOffline', { userId })
          }
        }
      }
    }, 60000) // Run every minute
  }

  // Public methods for external use
  public getIO() {
    return this.io
  }

  public async emitToUser(userId: string, event: keyof ServerToClientEvents, data: any) {
    this.io.to(`user:${userId}`).emit(event, data)
  }

  public async emitToPost(postId: string, event: keyof ServerToClientEvents, data: any) {
    this.io.to(`post:${postId}`).emit(event, data)
  }

  public async getOnlineUsers(): Promise<string[]> {
    const keys = await redis.keys('presence:*')
    return keys.map(key => key.split(':')[1])
  }

  public async getUserPresence(userId: string) {
    const data = await redis.get(`presence:${userId}`)
    return data ? JSON.parse(data) : null
  }
}

// Export singleton instance
let socketServer: AuthenticatedSocket | null = null

export function initializeSocketServer(httpServer: HTTPServer): AuthenticatedSocket {
  if (!socketServer) {
    socketServer = new AuthenticatedSocket(httpServer)
    logger.info('Socket.io server initialized')
  }
  return socketServer
}

export function getSocketServer(): AuthenticatedSocket | null {
  return socketServer
}
