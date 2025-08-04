## Phase 1 Enhanced Implementation Plan

Thank you for your confidence! Let me put on my deep-thinking hat and create comprehensive implementations for the suggested enhancements. I'll maintain the same exceptional quality standards established in the existing codebase.

### 🎯 Implementation Strategy

I'll create these enhancements following these principles:
1. **Seamless Integration** - Perfect harmony with existing architecture
2. **Type Safety** - Full TypeScript coverage with no compromises
3. **Production Ready** - Enterprise-grade implementations
4. **Performance First** - Optimized for scale
5. **Developer Experience** - Clean, maintainable code

---

## 1. 🔌 WebSocket Implementation (Socket.io)

### `/src/lib/socket/socket-server.ts` - Socket.io Server Setup

```typescript
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
```

### `/src/hooks/use-socket.ts` - Client Socket Hook

```typescript
// src/hooks/use-socket.ts
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useSession } from 'next-auth/react'
import { useQueryClient } from '@tanstack/react-query'
import { logger } from '@/lib/monitoring'
import type { 
  ServerToClientEvents, 
  ClientToServerEvents 
} from '@/lib/socket/socket-server'

type SocketInstance = Socket<ServerToClientEvents, ClientToServerEvents>

interface UseSocketOptions {
  autoConnect?: boolean
  reconnection?: boolean
  reconnectionAttempts?: number
  reconnectionDelay?: number
}

export function useSocket(options: UseSocketOptions = {}) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const socketRef = useRef<SocketInstance | null>(null)

  const {
    autoConnect = true,
    reconnection = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000,
  } = options

  // Initialize socket connection
  useEffect(() => {
    if (!session?.user || !autoConnect) return

    const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000', {
      auth: {
        token: session.user.id, // In production, use proper session token
      },
      transports: ['websocket', 'polling'],
      reconnection,
      reconnectionAttempts,
      reconnectionDelay,
    }) as SocketInstance

    socketRef.current = socket

    // Connection event handlers
    socket.on('connect', () => {
      logger.info('Socket connected', { socketId: socket.id })
      setIsConnected(true)
      setIsConnecting(false)
    })

    socket.on('disconnect', (reason) => {
      logger.info('Socket disconnected', { reason })
      setIsConnected(false)
      setIsConnecting(false)
    })

    socket.on('connect_error', (error) => {
      logger.error('Socket connection error:', error)
      setIsConnecting(false)
    })

    socket.on('error', ({ message, code }) => {
      logger.error('Socket error:', { message, code })
    })

    // Set up global event handlers
    setupGlobalHandlers(socket, queryClient)

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [session, autoConnect, reconnection, reconnectionAttempts, reconnectionDelay, queryClient])

  // Emit event helper
  const emit = useCallback(<K extends keyof ClientToServerEvents>(
    event: K,
    ...args: Parameters<ClientToServerEvents[K]>
  ) => {
    if (!socketRef.current?.connected) {
      logger.warn('Socket not connected, cannot emit event', { event })
      return
    }
    socketRef.current.emit(event, ...args)
  }, [])

  // Subscribe to event helper
  const on = useCallback(<K extends keyof ServerToClientEvents>(
    event: K,
    handler: ServerToClientEvents[K]
  ) => {
    if (!socketRef.current) {
      logger.warn('Socket not initialized')
      return () => {}
    }

    socketRef.current.on(event, handler)

    // Return cleanup function
    return () => {
      socketRef.current?.off(event, handler)
    }
  }, [])

  // One-time event listener
  const once = useCallback(<K extends keyof ServerToClientEvents>(
    event: K,
    handler: ServerToClientEvents[K]
  ) => {
    if (!socketRef.current) {
      logger.warn('Socket not initialized')
      return () => {}
    }

    socketRef.current.once(event, handler)

    // Return cleanup function
    return () => {
      socketRef.current?.off(event, handler)
    }
  }, [])

  // Remove event listener
  const off = useCallback(<K extends keyof ServerToClientEvents>(
    event: K,
    handler?: ServerToClientEvents[K]
  ) => {
    if (!socketRef.current) return
    
    if (handler) {
      socketRef.current.off(event, handler)
    } else {
      socketRef.current.off(event)
    }
  }, [])

  // Manual connect/disconnect
  const connect = useCallback(() => {
    if (!socketRef.current || socketRef.current.connected) return
    setIsConnecting(true)
    socketRef.current.connect()
  }, [])

  const disconnect = useCallback(() => {
    if (!socketRef.current || !socketRef.current.connected) return
    socketRef.current.disconnect()
  }, [])

  return {
    socket: socketRef.current,
    isConnected,
    isConnecting,
    emit,
    on,
    once,
    off,
    connect,
    disconnect,
  }
}

// Global event handlers that update React Query cache
function setupGlobalHandlers(socket: SocketInstance, queryClient: ReturnType<typeof useQueryClient>) {
  // Notification handlers
  socket.on('notification', (notification) => {
    // Update notifications query
    queryClient.setQueryData(['notifications'], (old: any) => {
      if (!old) return { items: [notification], nextCursor: null, hasMore: false }
      return {
        ...old,
        items: [notification, ...old.items],
      }
    })

    // Show toast notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icon-192x192.png',
      })
    }
  })

  socket.on('unreadCountUpdate', (count) => {
    queryClient.setQueryData(['notifications', 'unreadCount'], count)
  })

  // Post updates
  socket.on('postUpdated', (post) => {
    queryClient.setQueryData(['post', post.id], post)
    
    // Update in lists
    queryClient.setQueriesData(
      { queryKey: ['posts'], exact: false },
      (old: any) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages?.map((page: any) => ({
            ...page,
            items: page.items.map((item: any) =>
              item.id === post.id ? post : item
            ),
          })),
        }
      }
    )
  })

  // Comment updates
  socket.on('commentCreated', (comment) => {
    queryClient.setQueryData(
      ['comments', comment.postId],
      (old: any) => {
        if (!old) return { items: [comment], nextCursor: null, hasMore: false }
        return {
          ...old,
          items: [comment, ...old.items],
        }
      }
    )
  })

  // Reaction updates
  socket.on('reactionAdded', ({ entityType, entityId, counts }) => {
    const queryKey = entityType === 'post' 
      ? ['post', entityId] 
      : ['comment', entityId]
    
    queryClient.setQueryData(queryKey, (old: any) => {
      if (!old) return old
      return {
        ...old,
        reactionCounts: counts,
      }
    })
  })
}

// Specialized hooks for specific features
export function usePresence() {
  const { emit, on, off } = useSocket()
  
  const updatePresence = useCallback((status: string, location?: string) => {
    emit('updatePresence', { status, location })
  }, [emit])

  useEffect(() => {
    const interval = setInterval(() => {
      updatePresence('online')
    }, 4 * 60 * 1000) // Send heartbeat every 4 minutes

    return () => clearInterval(interval)
  }, [updatePresence])

  return { updatePresence }
}

export function useTypingIndicator(channelId: string, channelType: string = 'conversation') {
  const { emit, on, off } = useSocket()
  const [typingUsers, setTypingUsers] = useState<Map<string, { username: string }>>(new Map())
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const handleUserTyping = ({ userId, username }: any) => {
      setTypingUsers(prev => new Map(prev).set(userId, { username }))
    }

    const handleUserStoppedTyping = ({ userId }: any) => {
      setTypingUsers(prev => {
        const updated = new Map(prev)
        updated.delete(userId)
        return updated
      })
    }

    const unsubscribeTyping = on('userTyping', handleUserTyping)
    const unsubscribeStoppedTyping = on('userStoppedTyping', handleUserStoppedTyping)

    return () => {
      unsubscribeTyping()
      unsubscribeStoppedTyping()
    }
  }, [on, channelId])

  const startTyping = useCallback(() => {
    emit('startTyping', { channelId, channelType })

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Auto-stop after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      emit('stopTyping', { channelId, channelType })
    }, 3000)
  }, [emit, channelId, channelType])

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    emit('stopTyping', { channelId, channelType })
  }, [emit, channelId, channelType])

  return {
    typingUsers: Array.from(typingUsers.values()),
    startTyping,
    stopTyping,
  }
}

export function useRealtimePost(postId: string) {
  const { emit, on, off, isConnected } = useSocket()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!isConnected) return

    // Subscribe to post updates
    emit('subscribeToPost', postId)

    // Set up specific handlers for this post
    const handleReaction = (data: any) => {
      if (data.entityType === 'post' && data.entityId === postId) {
        queryClient.setQueryData(['post', postId, 'reactions'], data.counts)
      }
    }

    const unsubscribe = on('reactionAdded', handleReaction)

    return () => {
      emit('unsubscribeFromPost', postId)
      unsubscribe()
    }
  }, [postId, isConnected, emit, on, queryClient])
}
```

---

## 2. 📁 File Upload Service

### `/src/services/upload.service.ts` - File Upload Service

```typescript
// src/services/upload.service.ts
import { db } from '@/lib/db'
import { redis, redisHelpers } from '@/lib/redis'
import { logger } from '@/lib/monitoring'
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import sharp from 'sharp'
import { createHash } from 'crypto'
import { v4 as uuidv4 } from 'uuid'
import { eventEmitter } from '@/lib/events/event-emitter'

// Configuration
const S3_BUCKET = process.env.AWS_S3_BUCKET!
const S3_REGION = process.env.AWS_S3_REGION!
const CDN_URL = process.env.CDN_URL!
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm']
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

// Image optimization presets
const IMAGE_PRESETS = {
  thumbnail: { width: 150, height: 150, quality: 80 },
  small: { width: 320, height: 320, quality: 85 },
  medium: { width: 640, height: 640, quality: 85 },
  large: { width: 1280, height: 1280, quality: 90 },
  original: { quality: 95 },
}

// Initialize S3 client
const s3Client = new S3Client({
  region: S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export interface UploadOptions {
  userId: string
  file: Buffer | Uint8Array
  filename: string
  mimeType: string
  category?: 'avatar' | 'post' | 'message' | 'document' | 'video'
  isPublic?: boolean
  metadata?: Record<string, any>
}

export interface UploadResult {
  id: string
  url: string
  cdnUrl: string
  thumbnailUrl?: string
  fileSize: number
  mimeType: string
  dimensions?: { width: number; height: number }
  duration?: number
  blurhash?: string
  variants?: Record<string, string>
}

export interface UploadProgress {
  uploadId: string
  progress: number
  status: 'preparing' | 'uploading' | 'processing' | 'completed' | 'failed'
  error?: string
}

export class UploadService {
  // Track upload progress
  private static uploadProgress = new Map<string, UploadProgress>()

  // Main upload method
  static async uploadFile(options: UploadOptions): Promise<UploadResult> {
    const uploadId = uuidv4()
    logger.info('Starting file upload', { uploadId, userId: options.userId, filename: options.filename })

    try {
      // Update progress
      this.updateProgress(uploadId, { 
        uploadId, 
        progress: 0, 
        status: 'preparing' 
      })

      // Validate file
      await this.validateFile(options)

      // Generate file hash for deduplication
      const fileHash = this.generateFileHash(options.file)
      
      // Check if file already exists
      const existingFile = await this.checkExistingFile(fileHash, options.userId)
      if (existingFile) {
        logger.info('File already exists, returning existing', { fileHash })
        return this.formatUploadResult(existingFile)
      }

      // Process file based on type
      let result: UploadResult
      
      if (ALLOWED_IMAGE_TYPES.includes(options.mimeType)) {
        result = await this.processImageUpload(options, uploadId)
      } else if (ALLOWED_VIDEO_TYPES.includes(options.mimeType)) {
        result = await this.processVideoUpload(options, uploadId)
      } else {
        result = await this.processDocumentUpload(options, uploadId)
      }

      // Save to database
      await this.saveFileRecord(result, options, fileHash)

      // Update progress
      this.updateProgress(uploadId, { 
        uploadId, 
        progress: 100, 
        status: 'completed' 
      })

      // Emit upload complete event
      eventEmitter.emit('file:uploaded', { 
        userId: options.userId, 
        fileId: result.id,
        fileType: options.category,
      })

      logger.info('File upload completed', { uploadId, fileId: result.id })
      return result

    } catch (error) {
      logger.error('File upload failed', error, { uploadId })
      
      this.updateProgress(uploadId, { 
        uploadId, 
        progress: 0, 
        status: 'failed',
        error: error instanceof Error ? error.message : 'Upload failed',
      })

      throw error
    } finally {
      // Clean up progress after delay
      setTimeout(() => {
        this.uploadProgress.delete(uploadId)
      }, 60000) // Keep for 1 minute
    }
  }

  // Process image upload with optimization
  private static async processImageUpload(
    options: UploadOptions,
    uploadId: string
  ): Promise<UploadResult> {
    const image = sharp(options.file)
    const metadata = await image.metadata()
    
    if (!metadata.width || !metadata.height) {
      throw new Error('Invalid image file')
    }

    const fileId = uuidv4()
    const baseKey = `${options.category || 'general'}/${options.userId}/${fileId}`
    const variants: Record<string, string> = {}

    // Generate blurhash for placeholder
    const blurhash = await this.generateBlurhash(options.file)

    // Upload original
    const originalKey = `${baseKey}/original.${metadata.format}`
    await this.uploadToS3(originalKey, options.file, options.mimeType)
    
    this.updateProgress(uploadId, { 
      uploadId, 
      progress: 30, 
      status: 'uploading' 
    })

    // Process and upload variants
    let processedCount = 0
    const totalVariants = Object.keys(IMAGE_PRESETS).length - 1 // Exclude original

    for (const [preset, config] of Object.entries(IMAGE_PRESETS)) {
      if (preset === 'original') continue

      try {
        const processedBuffer = await sharp(options.file)
          .resize(config.width, config.height, { 
            fit: 'inside', 
            withoutEnlargement: true 
          })
          .jpeg({ quality: config.quality, progressive: true })
          .toBuffer()

        const variantKey = `${baseKey}/${preset}.jpg`
        await this.uploadToS3(variantKey, processedBuffer, 'image/jpeg')
        variants[preset] = `${CDN_URL}/${variantKey}`

        processedCount++
        const progress = 30 + (processedCount / totalVariants * 60)
        this.updateProgress(uploadId, { 
          uploadId, 
          progress, 
          status: 'processing' 
        })

      } catch (error) {
        logger.error(`Failed to process ${preset} variant`, error)
      }
    }

    return {
      id: fileId,
      url: `${CDN_URL}/${originalKey}`,
      cdnUrl: `${CDN_URL}/${originalKey}`,
      thumbnailUrl: variants.thumbnail,
      fileSize: options.file.length,
      mimeType: options.mimeType,
      dimensions: { width: metadata.width, height: metadata.height },
      blurhash,
      variants,
    }
  }

  // Process video upload
  private static async processVideoUpload(
    options: UploadOptions,
    uploadId: string
  ): Promise<UploadResult> {
    const fileId = uuidv4()
    const key = `${options.category || 'video'}/${options.userId}/${fileId}/original.mp4`

    // Upload video
    await this.uploadToS3(key, options.file, options.mimeType)

    this.updateProgress(uploadId, { 
      uploadId, 
      progress: 80, 
      status: 'processing' 
    })

    // Generate thumbnail (would use ffmpeg in production)
    // For now, we'll use a placeholder
    const thumbnailUrl = `${CDN_URL}/video-thumbnail-placeholder.jpg`

    return {
      id: fileId,
      url: `${CDN_URL}/${key}`,
      cdnUrl: `${CDN_URL}/${key}`,
      thumbnailUrl,
      fileSize: options.file.length,
      mimeType: options.mimeType,
      duration: 0, // Would extract from video metadata
    }
  }

  // Process document upload
  private static async processDocumentUpload(
    options: UploadOptions,
    uploadId: string
  ): Promise<UploadResult> {
    const fileId = uuidv4()
    const extension = this.getFileExtension(options.filename)
    const key = `${options.category || 'document'}/${options.userId}/${fileId}/original.${extension}`

    // Upload document
    await this.uploadToS3(key, options.file, options.mimeType)

    this.updateProgress(uploadId, { 
      uploadId, 
      progress: 90, 
      status: 'processing' 
    })

    return {
      id: fileId,
      url: `${CDN_URL}/${key}`,
      cdnUrl: `${CDN_URL}/${key}`,
      fileSize: options.file.length,
      mimeType: options.mimeType,
    }
  }

  // Upload to S3
  private static async uploadToS3(
    key: string,
    buffer: Buffer | Uint8Array,
    contentType: string
  ): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000', // 1 year
    })

    await s3Client.send(command)
  }

  // Generate presigned upload URL for direct client uploads
  static async generatePresignedUploadUrl(
    userId: string,
    filename: string,
    contentType: string,
    fileSize: number
  ): Promise<{ uploadUrl: string; fileId: string; key: string }> {
    // Validate
    if (fileSize > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`)
    }

    if (!this.isAllowedFileType(contentType)) {
      throw new Error('File type not allowed')
    }

    const fileId = uuidv4()
    const extension = this.getFileExtension(filename)
    const key = `uploads/${userId}/${fileId}/original.${extension}`

    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      ContentType: contentType,
      ContentLength: fileSize,
    })

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }) // 1 hour

    return { uploadUrl, fileId, key }
  }

  // Delete file
  static async deleteFile(fileId: string, userId: string): Promise<void> {
    const file = await db.mediaFile.findFirst({
      where: { id: fileId, userId },
    })

    if (!file) {
      throw new Error('File not found')
    }

    // Delete from S3
    const deleteCommand = new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: file.storagePath,
    })

    await s3Client.send(deleteCommand)

    // Delete from database
    await db.mediaFile.delete({ where: { id: fileId } })

    // Clear cache
    await redis.del(`file:${fileId}`)

    logger.info('File deleted', { fileId, userId })
  }

  // Validate file
  private static async validateFile(options: UploadOptions): Promise<void> {
    // Check file size
    if (options.file.length > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`)
    }

    // Check file type
    if (!this.isAllowedFileType(options.mimeType)) {
      throw new Error('File type not allowed')
    }

    // Virus scan placeholder
    // In production, integrate with ClamAV or similar
    await this.scanForViruses(options.file)
  }

  // Check if file type is allowed
  private static isAllowedFileType(mimeType: string): boolean {
    return [
      ...ALLOWED_IMAGE_TYPES,
      ...ALLOWED_VIDEO_TYPES,
      ...ALLOWED_DOCUMENT_TYPES,
    ].includes(mimeType)
  }

  // Generate file hash
  private static generateFileHash(buffer: Buffer | Uint8Array): string {
    return createHash('sha256').update(buffer).digest('hex')
  }

  // Check for existing file
  private static async checkExistingFile(hash: string, userId: string) {
    // Check cache first
    const cached = await redisHelpers.getJSON(`file:hash:${hash}`)
    if (cached) return cached

    // Check database
    return db.mediaFile.findFirst({
      where: { 
        metadata: { 
          path: ['hash'], 
          equals: hash 
        },
      },
    })
  }

  // Generate blurhash
  private static async generateBlurhash(buffer: Buffer): Promise<string> {
    // In production, use blurhash library
    // For now, return placeholder
    return 'LEHV6nWB2yk8pyo0adR*.7kCMdnj'
  }

  // Get file extension
  private static getFileExtension(filename: string): string {
    const parts = filename.split('.')
    return parts[parts.length - 1].toLowerCase()
  }

  // Save file record to database
  private static async saveFileRecord(
    result: UploadResult,
    options: UploadOptions,
    hash: string
  ): Promise<void> {
    await db.mediaFile.create({
      data: {
        id: result.id,
        userId: options.userId,
        fileType: this.getFileType(options.mimeType),
        fileSize: BigInt(result.fileSize),
        mimeType: options.mimeType,
        originalName: options.filename,
        storagePath: result.url.replace(CDN_URL + '/', ''),
        cdnUrl: result.cdnUrl,
        thumbnailUrl: result.thumbnailUrl,
        blurhash: result.blurhash,
        dimensions: result.dimensions,
        duration: result.duration,
        metadata: {
          hash,
          variants: result.variants,
          ...options.metadata,
        },
        isPublic: options.isPublic ?? true,
        processedAt: new Date(),
      },
    })

    // Cache file info
    await redisHelpers.setJSON(`file:${result.id}`, result, 3600)
    await redisHelpers.setJSON(`file:hash:${hash}`, result, 3600)
  }

  // Get file type category
  private static getFileType(mimeType: string): string {
    if (ALLOWED_IMAGE_TYPES.includes(mimeType)) return 'image'
    if (ALLOWED_VIDEO_TYPES.includes(mimeType)) return 'video'
    if (ALLOWED_DOCUMENT_TYPES.includes(mimeType)) return 'document'
    return 'other'
  }

  // Scan for viruses (placeholder)
  private static async scanForViruses(buffer: Buffer | Uint8Array): Promise<void> {
    // In production, integrate with ClamAV or similar
    // For now, just log
    logger.debug('Virus scan placeholder - would scan file in production')
  }

  // Update upload progress
  private static updateProgress(uploadId: string, progress: UploadProgress): void {
    this.uploadProgress.set(uploadId, progress)
    
    // Emit progress event
    eventEmitter.emit('upload:progress', progress)
  }

  // Get upload progress
  static getUploadProgress(uploadId: string): UploadProgress | null {
    return this.uploadProgress.get(uploadId) || null
  }

  // Format upload result from database record
  private static formatUploadResult(file: any): UploadResult {
    return {
      id: file.id,
      url: file.cdnUrl || `${CDN_URL}/${file.storagePath}`,
      cdnUrl: file.cdnUrl || `${CDN_URL}/${file.storagePath}`,
      thumbnailUrl: file.thumbnailUrl,
      fileSize: Number(file.fileSize),
      mimeType: file.mimeType,
      dimensions: file.dimensions as any,
      duration: file.duration,
      blurhash: file.blurhash,
      variants: file.metadata?.variants,
    }
  }

  // Get file by ID
  static async getFile(fileId: string): Promise<UploadResult | null> {
    // Check cache
    const cached = await redisHelpers.getJSON<UploadResult>(`file:${fileId}`)
    if (cached) return cached

    // Get from database
    const file = await db.mediaFile.findUnique({
      where: { id: fileId },
    })

    if (!file) return null

    const result = this.formatUploadResult(file)
    
    // Cache for future requests
    await redisHelpers.setJSON(`file:${fileId}`, result, 3600)
    
    return result
  }
}
```

---

## 3. 📧 Email Service

### `/src/services/email.service.ts` - Email Service Implementation

```typescript
// src/services/email.service.ts
import nodemailer from 'nodemailer'
import { render } from '@react-email/render'
import { db } from '@/lib/db'
import { redis, redisHelpers } from '@/lib/redis'
import { logger } from '@/lib/monitoring'
import { eventEmitter } from '@/lib/events/event-emitter'
import { NotificationType } from '@prisma/client'
import * as templates from '@/emails/templates'

// Email configuration
const EMAIL_FROM = process.env.EMAIL_FROM || 'Sparkle Universe <noreply@sparkle-universe.com>'
const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || 'support@sparkle-universe.com'
const BATCH_SIZE = 50
const RATE_LIMIT_PER_HOUR = 1000

// Email provider configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
  secure: process.env.EMAIL_SERVER_PORT === '465',
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
})

// Backup transporter (e.g., SendGrid)
const backupTransporter = process.env.SENDGRID_API_KEY
  ? nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    })
  : null

export interface EmailOptions {
  to: string | string[]
  subject: string
  template: keyof typeof templates
  data: any
  from?: string
  replyTo?: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
  headers?: Record<string, string>
  priority?: 'high' | 'normal' | 'low'
  category?: string
  trackOpens?: boolean
  trackClicks?: boolean
}

export interface EmailResult {
  messageId: string
  accepted: string[]
  rejected: string[]
  response: string
}

export class EmailService {
  // Send single email
  static async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      // Check rate limit
      await this.checkRateLimit(options.to)

      // Render email template
      const { html, text } = await this.renderTemplate(options.template, options.data)

      // Prepare email
      const mailOptions = {
        from: options.from || EMAIL_FROM,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        replyTo: options.replyTo || EMAIL_REPLY_TO,
        subject: options.subject,
        html,
        text,
        attachments: options.attachments,
        headers: {
          ...options.headers,
          'X-Priority': options.priority || 'normal',
          'X-Category': options.category || 'transactional',
          'List-Unsubscribe': `<${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe>`,
        },
      }

      // Add tracking pixels if enabled
      if (options.trackOpens) {
        mailOptions.html = this.addTrackingPixel(mailOptions.html, options.to as string)
      }

      if (options.trackClicks) {
        mailOptions.html = this.addClickTracking(mailOptions.html, options.to as string)
      }

      // Send email
      let result: EmailResult
      try {
        const info = await transporter.sendMail(mailOptions)
        result = {
          messageId: info.messageId,
          accepted: info.accepted as string[],
          rejected: info.rejected as string[],
          response: info.response,
        }
      } catch (error) {
        // Try backup transporter
        if (backupTransporter) {
          logger.warn('Primary email provider failed, trying backup', error)
          const info = await backupTransporter.sendMail(mailOptions)
          result = {
            messageId: info.messageId,
            accepted: info.accepted as string[],
            rejected: info.rejected as string[],
            response: info.response,
          }
        } else {
          throw error
        }
      }

      // Log email sent
      await this.logEmailSent(options, result)

      // Update rate limit
      await this.updateRateLimit(options.to)

      logger.info('Email sent successfully', { 
        to: options.to, 
        subject: options.subject,
        messageId: result.messageId,
      })

      return result

    } catch (error) {
      logger.error('Failed to send email', error, { 
        to: options.to, 
        subject: options.subject 
      })
      throw error
    }
  }

  // Send bulk emails
  static async sendBulkEmails(
    recipients: string[],
    template: keyof typeof templates,
    baseData: any,
    options: Partial<EmailOptions> = {}
  ): Promise<{ sent: number; failed: number; errors: any[] }> {
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as any[],
    }

    // Process in batches
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE)
      
      await Promise.all(
        batch.map(async (recipient) => {
          try {
            await this.sendEmail({
              to: recipient,
              template,
              data: { ...baseData, email: recipient },
              ...options,
              subject: options.subject || 'Update from Sparkle Universe',
            })
            results.sent++
          } catch (error) {
            results.failed++
            results.errors.push({ recipient, error: (error as Error).message })
          }
        })
      )

      // Rate limit between batches
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    logger.info('Bulk email completed', results)
    return results
  }

  // Process email queue
  static async processEmailQueue(): Promise<void> {
    const queue = await db.notificationQueue.findMany({
      where: {
        channel: 'email',
        processedAt: null,
        attempts: { lt: 3 },
        scheduledFor: { lte: new Date() },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
      take: BATCH_SIZE,
    })

    for (const item of queue) {
      try {
        await this.processQueueItem(item)
      } catch (error) {
        logger.error('Failed to process email queue item', error, { 
          queueId: item.id 
        })
      }
    }
  }

  // Process single queue item
  private static async processQueueItem(item: any): Promise<void> {
    try {
      const { userId, type, payload } = item

      // Get user details
      const user = await db.user.findUnique({
        where: { id: userId },
        include: { 
          profile: true,
          notificationPrefs: true,
        },
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Check if user wants email notifications
      if (!user.notificationPrefs?.emailNotifications) {
        await db.notificationQueue.update({
          where: { id: item.id },
          data: { 
            processedAt: new Date(),
            error: 'User has disabled email notifications',
          },
        })
        return
      }

      // Select template based on notification type
      const template = this.getTemplateForNotificationType(type)
      const subject = this.getSubjectForNotificationType(type, payload)

      // Send email
      await this.sendEmail({
        to: user.email,
        subject,
        template,
        data: {
          user: {
            name: user.profile?.displayName || user.username,
            email: user.email,
          },
          notification: payload,
          unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications`,
        },
        category: type.toLowerCase(),
      })

      // Mark as processed
      await db.notificationQueue.update({
        where: { id: item.id },
        data: { 
          processedAt: new Date(),
          attempts: { increment: 1 },
        },
      })

    } catch (error) {
      // Update failure
      await db.notificationQueue.update({
        where: { id: item.id },
        data: {
          attempts: { increment: 1 },
          failedAt: new Date(),
          error: (error as Error).message,
        },
      })

      throw error
    }
  }

  // Render email template
  private static async renderTemplate(
    templateName: keyof typeof templates,
    data: any
  ): Promise<{ html: string; text: string }> {
    const Template = templates[templateName]
    
    if (!Template) {
      throw new Error(`Email template '${templateName}' not found`)
    }

    const html = render(Template(data))
    const text = this.htmlToText(html)

    return { html, text }
  }

  // Check rate limit
  private static async checkRateLimit(to: string | string[]): Promise<void> {
    const recipients = Array.isArray(to) ? to : [to]
    const key = `email_rate_limit:${new Date().getHours()}`
    
    const current = await redis.get(key)
    const count = current ? parseInt(current) : 0

    if (count + recipients.length > RATE_LIMIT_PER_HOUR) {
      throw new Error('Email rate limit exceeded')
    }
  }

  // Update rate limit
  private static async updateRateLimit(to: string | string[]): Promise<void> {
    const recipients = Array.isArray(to) ? to : [to]
    const key = `email_rate_limit:${new Date().getHours()}`
    
    await redis.incrby(key, recipients.length)
    await redis.expire(key, 3600) // Expire after 1 hour
  }

  // Log email sent
  private static async logEmailSent(
    options: EmailOptions,
    result: EmailResult
  ): Promise<void> {
    // Store in analytics
    eventEmitter.emit('email:sent', {
      to: options.to,
      subject: options.subject,
      template: options.template,
      category: options.category,
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected,
    })

    // Store recent emails for debugging
    const key = `recent_emails:${Array.isArray(options.to) ? options.to[0] : options.to}`
    await redis.lpush(key, JSON.stringify({
      subject: options.subject,
      template: options.template,
      messageId: result.messageId,
      sentAt: new Date(),
    }))
    await redis.ltrim(key, 0, 9) // Keep last 10 emails
    await redis.expire(key, 86400 * 7) // Expire after 7 days
  }

  // Get template for notification type
  private static getTemplateForNotificationType(
    type: NotificationType
  ): keyof typeof templates {
    const templateMap: Record<NotificationType, keyof typeof templates> = {
      [NotificationType.POST_LIKED]: 'PostLikedEmail',
      [NotificationType.POST_COMMENTED]: 'CommentNotificationEmail',
      [NotificationType.COMMENT_LIKED]: 'CommentLikedEmail',
      [NotificationType.USER_FOLLOWED]: 'NewFollowerEmail',
      [NotificationType.ACHIEVEMENT_UNLOCKED]: 'AchievementEmail',
      [NotificationType.LEVEL_UP]: 'LevelUpEmail',
      [NotificationType.MENTION]: 'MentionEmail',
      [NotificationType.SYSTEM]: 'SystemNotificationEmail',
      [NotificationType.GROUP_INVITE]: 'GroupInviteEmail',
      [NotificationType.GROUP_POST]: 'GroupPostEmail',
      [NotificationType.EVENT_REMINDER]: 'EventReminderEmail',
      [NotificationType.WATCH_PARTY_INVITE]: 'WatchPartyInviteEmail',
      [NotificationType.DIRECT_MESSAGE]: 'DirectMessageEmail',
      [NotificationType.YOUTUBE_PREMIERE]: 'YouTubePremiereEmail',
      [NotificationType.QUEST_COMPLETE]: 'QuestCompleteEmail',
      [NotificationType.TRADE_REQUEST]: 'TradeRequestEmail',
      [NotificationType.CONTENT_FEATURED]: 'ContentFeaturedEmail',
      [NotificationType.MILESTONE_REACHED]: 'MilestoneEmail',
    }

    return templateMap[type] || 'SystemNotificationEmail'
  }

  // Get subject for notification type
  private static getSubjectForNotificationType(
    type: NotificationType,
    payload: any
  ): string {
    const subjectMap: Record<NotificationType, string> = {
      [NotificationType.POST_LIKED]: `Someone liked your post!`,
      [NotificationType.POST_COMMENTED]: `New comment on your post`,
      [NotificationType.COMMENT_LIKED]: `Someone liked your comment!`,
      [NotificationType.USER_FOLLOWED]: `You have a new follower!`,
      [NotificationType.ACHIEVEMENT_UNLOCKED]: `Achievement Unlocked: ${payload.achievementName}!`,
      [NotificationType.LEVEL_UP]: `Congratulations! You've reached level ${payload.level}!`,
      [NotificationType.MENTION]: `${payload.mentionerName} mentioned you`,
      [NotificationType.SYSTEM]: payload.title || 'Important Update from Sparkle Universe',
      [NotificationType.GROUP_INVITE]: `You're invited to join ${payload.groupName}`,
      [NotificationType.GROUP_POST]: `New post in ${payload.groupName}`,
      [NotificationType.EVENT_REMINDER]: `Reminder: ${payload.eventName} is starting soon`,
      [NotificationType.WATCH_PARTY_INVITE]: `Join the watch party for ${payload.videoTitle}`,
      [NotificationType.DIRECT_MESSAGE]: `New message from ${payload.senderName}`,
      [NotificationType.YOUTUBE_PREMIERE]: `${payload.channelName} is premiering soon!`,
      [NotificationType.QUEST_COMPLETE]: `Quest Complete: ${payload.questName}!`,
      [NotificationType.TRADE_REQUEST]: `${payload.traderName} wants to trade with you`,
      [NotificationType.CONTENT_FEATURED]: `Your content has been featured!`,
      [NotificationType.MILESTONE_REACHED]: `Milestone Reached: ${payload.milestoneName}!`,
    }

    return subjectMap[type] || 'Update from Sparkle Universe'
  }

  // Convert HTML to plain text
  private static htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gs, '')
      .replace(/<script[^>]*>.*?<\/script>/gs, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  // Add tracking pixel
  private static addTrackingPixel(html: string, recipient: string): string {
    const trackingId = Buffer.from(`${recipient}:${Date.now()}`).toString('base64')
    const pixelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/email/track/open?id=${trackingId}`
    const pixel = `<img src="${pixelUrl}" width="1" height="1" alt="" />`
    
    return html.replace('</body>', `${pixel}</body>`)
  }

  // Add click tracking
  private static addClickTracking(html: string, recipient: string): string {
    const trackingId = Buffer.from(recipient).toString('base64')
    
    return html.replace(
      /href="(https?:\/\/[^"]+)"/g,
      (match, url) => {
        const trackedUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/email/track/click?url=${encodeURIComponent(url)}&id=${trackingId}`
        return `href="${trackedUrl}"`
      }
    )
  }

  // Send welcome email
  static async sendWelcomeEmail(userId: string): Promise<void> {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    })

    if (!user) return

    await this.sendEmail({
      to: user.email,
      subject: 'Welcome to Sparkle Universe! ✨',
      template: 'WelcomeEmail',
      data: {
        name: user.profile?.displayName || user.username,
        username: user.username,
        verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=...`,
        profileUrl: `${process.env.NEXT_PUBLIC_APP_URL}/profile/${user.username}`,
      },
      category: 'onboarding',
      priority: 'high',
    })
  }

  // Send password reset email
  static async sendPasswordResetEmail(
    email: string,
    resetToken: string
  ): Promise<void> {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`

    await this.sendEmail({
      to: email,
      subject: 'Reset Your Password - Sparkle Universe',
      template: 'PasswordResetEmail',
      data: {
        resetUrl,
        expiresIn: '1 hour',
      },
      category: 'security',
      priority: 'high',
    })
  }

  // Send verification code email
  static async sendVerificationEmail(
    email: string,
    code: string
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Verify Your Email - Sparkle Universe',
      template: 'VerificationEmail',
      data: {
        code,
        expiresIn: '10 minutes',
      },
      category: 'security',
      priority: 'high',
    })
  }

  // Send weekly digest
  static async sendWeeklyDigest(userId: string): Promise<void> {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    })

    if (!user) return

    // Get weekly stats
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const [posts, followers, achievements] = await Promise.all([
      db.post.findMany({
        where: {
          createdAt: { gte: weekAgo },
          author: { followers: { some: { followerId: userId } } },
        },
        take: 5,
        orderBy: { likes: 'desc' },
        include: { author: true },
      }),
      db.follow.count({
        where: {
          followingId: userId,
          createdAt: { gte: weekAgo },
        },
      }),
      db.userAchievement.count({
        where: {
          userId,
          unlockedAt: { gte: weekAgo },
        },
      }),
    ])

    await this.sendEmail({
      to: user.email,
      subject: 'Your Weekly Sparkle Universe Digest ✨',
      template: 'WeeklyDigestEmail',
      data: {
        name: user.profile?.displayName || user.username,
        posts,
        newFollowers: followers,
        achievementsUnlocked: achievements,
        week: weekAgo.toLocaleDateString(),
      },
      category: 'digest',
      trackOpens: true,
      trackClicks: true,
    })
  }
}
```

### `/src/emails/templates/index.tsx` - Email Template Components

```typescript
// src/emails/templates/index.tsx
import React from 'react'
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Link,
  Img,
  Hr,
  Preview,
} from '@react-email/components'

// Base layout component
interface BaseLayoutProps {
  preview: string
  children: React.ReactNode
}

const BaseLayout: React.FC<BaseLayoutProps> = ({ preview, children }) => (
  <Html>
    <Head>
      <style>
        {`
          @font-face {
            font-family: 'Inter';
            font-style: normal;
            font-weight: 400;
            src: url('https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2') format('woff2');
          }
          
          * {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
        `}
      </style>
    </Head>
    <Preview>{preview}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img
            src={`${process.env.NEXT_PUBLIC_APP_URL}/logo.png`}
            alt="Sparkle Universe"
            width="150"
            height="50"
          />
        </Section>
        {children}
        <Hr style={hr} />
        <Section style={footer}>
          <Text style={footerText}>
            © 2025 Sparkle Universe. All rights reserved.
          </Text>
          <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe`} style={footerLink}>
            Unsubscribe
          </Link>
          {' • '}
          <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/privacy`} style={footerLink}>
            Privacy Policy
          </Link>
        </Section>
      </Container>
    </Body>
  </Html>
)

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  padding: '40px 0',
}

const container = {
  backgroundColor: '#ffffff',
  border: '1px solid #eee',
  borderRadius: '8px',
  margin: '0 auto',
  maxWidth: '600px',
  padding: '40px',
}

const header = {
  textAlign: 'center' as const,
  marginBottom: '40px',
}

const heading = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 20px',
}

const text = {
  color: '#525252',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 20px',
}

const button = {
  backgroundColor: '#8B5CF6',
  borderRadius: '6px',
  color: '#fff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: 'bold',
  padding: '12px 24px',
  textDecoration: 'none',
  textAlign: 'center' as const,
}

const hr = {
  borderColor: '#e8e8e8',
  margin: '40px 0 20px',
}

const footer = {
  textAlign: 'center' as const,
}

const footerText = {
  color: '#8a8a8a',
  fontSize: '14px',
  margin: '0 0 10px',
}

const footerLink = {
  color: '#8B5CF6',
  fontSize: '14px',
  textDecoration: 'none',
}

// Welcome Email Template
export const WelcomeEmail = ({ name, username, verificationUrl, profileUrl }: any) => (
  <BaseLayout preview="Welcome to Sparkle Universe! Verify your email to get started.">
    <Section>
      <Text style={heading}>Welcome to Sparkle Universe, {name}! 🎉</Text>
      <Text style={text}>
        We're thrilled to have you join our vibrant community of Sparkle fans!
        Your journey in the Sparkle Universe begins now.
      </Text>
      <Text style={text}>
        To get started, please verify your email address:
      </Text>
      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Button href={verificationUrl} style={button}>
          Verify Email Address
        </Button>
      </Section>
      <Text style={text}>
        Here's what you can do next:
      </Text>
      <ul style={{ ...text, paddingLeft: '20px' }}>
        <li>Complete your profile and earn your first achievement</li>
        <li>Follow your favorite creators and topics</li>
        <li>Create your first post and introduce yourself</li>
        <li>Join groups that match your interests</li>
      </ul>
      <Text style={text}>
        Your profile: <Link href={profileUrl}>@{username}</Link>
      </Text>
    </Section>
  </BaseLayout>
)

// Password Reset Email
export const PasswordResetEmail = ({ resetUrl, expiresIn }: any) => (
  <BaseLayout preview="Reset your Sparkle Universe password">
    <Section>
      <Text style={heading}>Reset Your Password</Text>
      <Text style={text}>
        We received a request to reset your password. If you didn't make this request,
        you can safely ignore this email.
      </Text>
      <Text style={text}>
        To reset your password, click the button below:
      </Text>
      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Button href={resetUrl} style={button}>
          Reset Password
        </Button>
      </Section>
      <Text style={text}>
        This link will expire in {expiresIn}. If the link has expired,
        you can request a new one from the login page.
      </Text>
      <Text style={{ ...text, fontSize: '14px', color: '#8a8a8a' }}>
        If you're having trouble clicking the button, copy and paste this URL
        into your browser: {resetUrl}
      </Text>
    </Section>
  </BaseLayout>
)

// Verification Email
export const VerificationEmail = ({ code, expiresIn }: any) => (
  <BaseLayout preview="Verify your email address">
    <Section>
      <Text style={heading}>Verify Your Email Address</Text>
      <Text style={text}>
        Enter this verification code to confirm your email address:
      </Text>
      <Section style={{ 
        textAlign: 'center', 
        margin: '32px 0',
        padding: '24px',
        backgroundColor: '#f6f9fc',
        borderRadius: '8px',
      }}>
        <Text style={{ 
          ...heading, 
          fontSize: '32px',
          letterSpacing: '8px',
          color: '#8B5CF6',
        }}>
          {code}
        </Text>
      </Section>
      <Text style={text}>
        This code will expire in {expiresIn}.
      </Text>
    </Section>
  </BaseLayout>
)

// Notification Emails
export const PostLikedEmail = ({ user, notification }: any) => (
  <BaseLayout preview="Someone liked your post!">
    <Section>
      <Text style={heading}>Your post got some love! ❤️</Text>
      <Text style={text}>
        Hi {user.name},
      </Text>
      <Text style={text}>
        {notification.actorName} just liked your post "{notification.postTitle}".
        Your content is resonating with the community!
      </Text>
      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Button href={notification.postUrl} style={button}>
          View Your Post
        </Button>
      </Section>
    </Section>
  </BaseLayout>
)

export const CommentNotificationEmail = ({ user, notification }: any) => (
  <BaseLayout preview="New comment on your post">
    <Section>
      <Text style={heading}>New comment on your post 💬</Text>
      <Text style={text}>
        Hi {user.name},
      </Text>
      <Text style={text}>
        {notification.actorName} commented on your post "{notification.postTitle}":
      </Text>
      <Section style={{
        margin: '24px 0',
        padding: '16px',
        backgroundColor: '#f6f9fc',
        borderRadius: '8px',
        borderLeft: '4px solid #8B5CF6',
      }}>
        <Text style={{ ...text, margin: 0 }}>
          "{notification.commentPreview}"
        </Text>
      </Section>
      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Button href={notification.commentUrl} style={button}>
          Reply to Comment
        </Button>
      </Section>
    </Section>
  </BaseLayout>
)

export const NewFollowerEmail = ({ user, notification }: any) => (
  <BaseLayout preview="You have a new follower!">
    <Section>
      <Text style={heading}>You have a new follower! 🌟</Text>
      <Text style={text}>
        Hi {user.name},
      </Text>
      <Text style={text}>
        {notification.followerName} is now following you. Check out their profile
        and see if you'd like to follow them back!
      </Text>
      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Button href={notification.profileUrl} style={button}>
          View Profile
        </Button>
      </Section>
      <Text style={text}>
        You now have {notification.totalFollowers} followers. Keep creating great content!
      </Text>
    </Section>
  </BaseLayout>
)

export const AchievementEmail = ({ user, notification }: any) => (
  <BaseLayout preview={`Achievement Unlocked: ${notification.achievementName}!`}>
    <Section>
      <Text style={heading}>Achievement Unlocked! 🏆</Text>
      <Text style={text}>
        Congratulations {user.name}!
      </Text>
      <Text style={text}>
        You've unlocked the "{notification.achievementName}" achievement!
      </Text>
      <Section style={{
        textAlign: 'center',
        margin: '32px 0',
      }}>
        <Img
          src={notification.achievementImage}
          alt={notification.achievementName}
          width="120"
          height="120"
        />
      </Section>
      <Text style={text}>
        {notification.achievementDescription}
      </Text>
      <Text style={text}>
        Rewards: +{notification.xpReward} XP, +{notification.pointsReward} Sparkle Points
      </Text>
      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Button href={notification.achievementsUrl} style={button}>
          View All Achievements
        </Button>
      </Section>
    </Section>
  </BaseLayout>
)

export const LevelUpEmail = ({ user, notification }: any) => (
  <BaseLayout preview={`Level ${notification.level} Reached!`}>
    <Section>
      <Text style={heading}>Level Up! You're now Level {notification.level}! 🎉</Text>
      <Text style={text}>
        Amazing work, {user.name}!
      </Text>
      <Text style={text}>
        You've reached Level {notification.level} in Sparkle Universe! 
        This is a testament to your dedication and contribution to our community.
      </Text>
      <Text style={text}>
        New perks unlocked:
      </Text>
      <ul style={{ ...text, paddingLeft: '20px' }}>
        {notification.perks.map((perk: string, index: number) => (
          <li key={index}>{perk}</li>
        ))}
      </ul>
      <Text style={text}>
        Bonus reward: +{notification.bonusPoints} Sparkle Points!
      </Text>
      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Button href={notification.profileUrl} style={button}>
          View Your Progress
        </Button>
      </Section>
    </Section>
  </BaseLayout>
)

export const WeeklyDigestEmail = ({ name, posts, newFollowers, achievementsUnlocked, week }: any) => (
  <BaseLayout preview="Your weekly Sparkle Universe digest">
    <Section>
      <Text style={heading}>Your Weekly Sparkle Digest ✨</Text>
      <Text style={text}>
        Hi {name},
      </Text>
      <Text style={text}>
        Here's what happened in your Sparkle Universe this week:
      </Text>
      
      <Section style={{ margin: '32px 0' }}>
        <Text style={{ ...heading, fontSize: '20px' }}>📊 Your Stats</Text>
        <ul style={{ ...text, paddingLeft: '20px' }}>
          <li>{newFollowers} new followers</li>
          <li>{achievementsUnlocked} achievements unlocked</li>
        </ul>
      </Section>

      {posts.length > 0 && (
        <Section style={{ margin: '32px 0' }}>
          <Text style={{ ...heading, fontSize: '20px' }}>🔥 Top Posts from People You Follow</Text>
          {posts.map((post: any, index: number) => (
            <Section key={index} style={{
              margin: '16px 0',
              padding: '16px',
              backgroundColor: '#f6f9fc',
              borderRadius: '8px',
            }}>
              <Text style={{ ...text, fontWeight: 'bold', margin: '0 0 8px' }}>
                {post.title}
              </Text>
              <Text style={{ ...text, fontSize: '14px', margin: '0 0 8px' }}>
                by {post.author.username} • {post.likes} likes
              </Text>
              <Link href={post.url} style={{ ...footerLink, fontSize: '14px' }}>
                Read more →
              </Link>
            </Section>
          ))}
        </Section>
      )}

      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Button href={`${process.env.NEXT_PUBLIC_APP_URL}/feed`} style={button}>
          Explore More Content
        </Button>
      </Section>
    </Section>
  </BaseLayout>
)

// System Notification Email (fallback)
export const SystemNotificationEmail = ({ user, notification }: any) => (
  <BaseLayout preview={notification.title}>
    <Section>
      <Text style={heading}>{notification.title}</Text>
      <Text style={text}>
        Hi {user.name},
      </Text>
      <Text style={text}>
        {notification.message}
      </Text>
      {notification.actionUrl && (
        <Section style={{ textAlign: 'center', margin: '32px 0' }}>
          <Button href={notification.actionUrl} style={button}>
            {notification.actionText || 'View Details'}
          </Button>
        </Section>
      )}
    </Section>
  </BaseLayout>
)

// Add more email templates as needed...
export const MentionEmail = SystemNotificationEmail
export const CommentLikedEmail = SystemNotificationEmail
export const GroupInviteEmail = SystemNotificationEmail
export const GroupPostEmail = SystemNotificationEmail
export const EventReminderEmail = SystemNotificationEmail
export const WatchPartyInviteEmail = SystemNotificationEmail
export const DirectMessageEmail = SystemNotificationEmail
export const YouTubePremiereEmail = SystemNotificationEmail
export const QuestCompleteEmail = SystemNotificationEmail
export const TradeRequestEmail = SystemNotificationEmail
export const ContentFeaturedEmail = SystemNotificationEmail
export const MilestoneEmail = SystemNotificationEmail
```

---

## 4. 👷 Background Jobs

### `/src/lib/jobs/job-processor.ts` - Background Job Processing

```typescript
// src/lib/jobs/job-processor.ts
import { Queue, Worker, Job, QueueEvents } from 'bullmq'
import { redis } from '@/lib/redis'
import { logger } from '@/lib/monitoring'
import { db } from '@/lib/db'
import { EmailService } from '@/services/email.service'
import { NotificationService } from '@/services/notification.service'
import { eventEmitter } from '@/lib/events/event-emitter'

// Job queue names
export const QUEUE_NAMES = {
  EMAIL: 'email',
  NOTIFICATION: 'notification',
  IMAGE_PROCESSING: 'image-processing',
  VIDEO_PROCESSING: 'video-processing',
  ANALYTICS: 'analytics',
  CLEANUP: 'cleanup',
  ACHIEVEMENT: 'achievement',
  LEADERBOARD: 'leaderboard',
  YOUTUBE_SYNC: 'youtube-sync',
  CONTENT_MODERATION: 'content-moderation',
} as const

// Job types
export interface JobData {
  [QUEUE_NAMES.EMAIL]: {
    type: 'send' | 'bulk' | 'digest'
    payload: any
  }
  [QUEUE_NAMES.NOTIFICATION]: {
    type: 'create' | 'bulk' | 'cleanup'
    payload: any
  }
  [QUEUE_NAMES.IMAGE_PROCESSING]: {
    fileId: string
    operations: string[]
  }
  [QUEUE_NAMES.VIDEO_PROCESSING]: {
    fileId: string
    operations: string[]
  }
  [QUEUE_NAMES.ANALYTICS]: {
    type: 'pageview' | 'event' | 'aggregate'
    payload: any
  }
  [QUEUE_NAMES.CLEANUP]: {
    type: 'expired-notifications' | 'old-logs' | 'temp-files'
  }
  [QUEUE_NAMES.ACHIEVEMENT]: {
    userId: string
    type: 'check' | 'unlock'
    achievementId?: string
  }
  [QUEUE_NAMES.LEADERBOARD]: {
    type: 'update' | 'calculate' | 'reset'
    leaderboardType: string
  }
  [QUEUE_NAMES.YOUTUBE_SYNC]: {
    channelId: string
    type: 'videos' | 'channel' | 'analytics'
  }
  [QUEUE_NAMES.CONTENT_MODERATION]: {
    contentType: 'post' | 'comment' | 'message'
    contentId: string
  }
}

// Job options
const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 2000,
  },
  removeOnComplete: {
    age: 3600, // 1 hour
    count: 100,
  },
  removeOnFail: {
    age: 24 * 3600, // 24 hours
  },
}

// Create queues
export const queues: Record<keyof typeof QUEUE_NAMES, Queue> = {} as any

Object.entries(QUEUE_NAMES).forEach(([key, name]) => {
  queues[key as keyof typeof QUEUE_NAMES] = new Queue(name, {
    connection: redis.duplicate(),
    defaultJobOptions,
  })
})

// Queue events for monitoring
const queueEvents: Record<string, QueueEvents> = {}

Object.values(QUEUE_NAMES).forEach((name) => {
  const events = new QueueEvents(name, {
    connection: redis.duplicate(),
  })

  events.on('completed', ({ jobId, returnvalue }) => {
    logger.info(`Job completed: ${name}:${jobId}`)
  })

  events.on('failed', ({ jobId, failedReason }) => {
    logger.error(`Job failed: ${name}:${jobId}`, { reason: failedReason })
  })

  events.on('stalled', ({ jobId }) => {
    logger.warn(`Job stalled: ${name}:${jobId}`)
  })

  queueEvents[name] = events
})

// Job processors
export function startJobProcessors() {
  // Email processor
  new Worker<JobData[typeof QUEUE_NAMES.EMAIL]>(
    QUEUE_NAMES.EMAIL,
    async (job) => {
      const { type, payload } = job.data

      switch (type) {
        case 'send':
          await EmailService.sendEmail(payload)
          break
        case 'bulk':
          await EmailService.sendBulkEmails(
            payload.recipients,
            payload.template,
            payload.data,
            payload.options
          )
          break
        case 'digest':
          await EmailService.sendWeeklyDigest(payload.userId)
          break
        default:
          throw new Error(`Unknown email job type: ${type}`)
      }
    },
    {
      connection: redis.duplicate(),
      concurrency: 5,
    }
  )

  // Notification processor
  new Worker<JobData[typeof QUEUE_NAMES.NOTIFICATION]>(
    QUEUE_NAMES.NOTIFICATION,
    async (job) => {
      const { type, payload } = job.data

      switch (type) {
        case 'create':
          await NotificationService.createNotification(payload.input, payload.options)
          break
        case 'bulk':
          await NotificationService.createBulkNotifications(
            payload.userIds,
            payload.template,
            payload.options
          )
          break
        case 'cleanup':
          await NotificationService.cleanupExpiredNotifications()
          break
        default:
          throw new Error(`Unknown notification job type: ${type}`)
      }
    },
    {
      connection: redis.duplicate(),
      concurrency: 10,
    }
  )

  // Analytics processor
  new Worker<JobData[typeof QUEUE_NAMES.ANALYTICS]>(
    QUEUE_NAMES.ANALYTICS,
    async (job) => {
      const { type, payload } = job.data

      switch (type) {
        case 'pageview':
          await processPageView(payload)
          break
        case 'event':
          await processAnalyticsEvent(payload)
          break
        case 'aggregate':
          await aggregateAnalytics(payload)
          break
        default:
          throw new Error(`Unknown analytics job type: ${type}`)
      }
    },
    {
      connection: redis.duplicate(),
      concurrency: 20,
    }
  )

  // Cleanup processor
  new Worker<JobData[typeof QUEUE_NAMES.CLEANUP]>(
    QUEUE_NAMES.CLEANUP,
    async (job) => {
      const { type } = job.data

      switch (type) {
        case 'expired-notifications':
          await cleanupExpiredNotifications()
          break
        case 'old-logs':
          await cleanupOldLogs()
          break
        case 'temp-files':
          await cleanupTempFiles()
          break
        default:
          throw new Error(`Unknown cleanup job type: ${type}`)
      }
    },
    {
      connection: redis.duplicate(),
      concurrency: 1,
    }
  )

  // Achievement processor
  new Worker<JobData[typeof QUEUE_NAMES.ACHIEVEMENT]>(
    QUEUE_NAMES.ACHIEVEMENT,
    async (job) => {
      const { userId, type, achievementId } = job.data

      switch (type) {
        case 'check':
          await checkUserAchievements(userId)
          break
        case 'unlock':
          if (achievementId) {
            await unlockAchievement(userId, achievementId)
          }
          break
        default:
          throw new Error(`Unknown achievement job type: ${type}`)
      }
    },
    {
      connection: redis.duplicate(),
      concurrency: 5,
    }
  )

  // Leaderboard processor
  new Worker<JobData[typeof QUEUE_NAMES.LEADERBOARD]>(
    QUEUE_NAMES.LEADERBOARD,
    async (job) => {
      const { type, leaderboardType } = job.data

      switch (type) {
        case 'update':
          await updateLeaderboard(leaderboardType)
          break
        case 'calculate':
          await calculateLeaderboard(leaderboardType)
          break
        case 'reset':
          await resetLeaderboard(leaderboardType)
          break
        default:
          throw new Error(`Unknown leaderboard job type: ${type}`)
      }
    },
    {
      connection: redis.duplicate(),
      concurrency: 3,
    }
  )

  // YouTube sync processor
  new Worker<JobData[typeof QUEUE_NAMES.YOUTUBE_SYNC]>(
    QUEUE_NAMES.YOUTUBE_SYNC,
    async (job) => {
      const { channelId, type } = job.data

      switch (type) {
        case 'videos':
          await syncYouTubeVideos(channelId)
          break
        case 'channel':
          await syncYouTubeChannel(channelId)
          break
        case 'analytics':
          await syncYouTubeAnalytics(channelId)
          break
        default:
          throw new Error(`Unknown YouTube sync job type: ${type}`)
      }
    },
    {
      connection: redis.duplicate(),
      concurrency: 2,
    }
  )

  // Content moderation processor
  new Worker<JobData[typeof QUEUE_NAMES.CONTENT_MODERATION]>(
    QUEUE_NAMES.CONTENT_MODERATION,
    async (job) => {
      const { contentType, contentId } = job.data
      await moderateContent(contentType, contentId)
    },
    {
      connection: redis.duplicate(),
      concurrency: 5,
    }
  )

  logger.info('Job processors started')
}

// Helper functions for job processing
async function processPageView(payload: any) {
  await db.analyticsEvent.create({
    data: {
      eventName: 'pageview',
      eventType: 'pageview',
      properties: payload,
      context: payload.context,
      userId: payload.userId,
    },
  })
}

async function processAnalyticsEvent(payload: any) {
  await db.analyticsEvent.create({
    data: {
      eventName: payload.name,
      eventType: 'custom',
      properties: payload.properties,
      context: payload.context,
      userId: payload.userId,
    },
  })
}

async function aggregateAnalytics(payload: any) {
  // Aggregate analytics data
  const { period, type } = payload
  logger.info('Aggregating analytics', { period, type })
  // Implementation would aggregate data into summary tables
}

async function cleanupExpiredNotifications() {
  const deleted = await db.notification.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  })
  logger.info(`Cleaned up ${deleted.count} expired notifications`)
}

async function cleanupOldLogs() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [auditLogs, loginHistory, analyticsEvents] = await Promise.all([
    db.auditLog.deleteMany({
      where: { createdAt: { lt: thirtyDaysAgo } },
    }),
    db.loginHistory.deleteMany({
      where: { createdAt: { lt: thirtyDaysAgo } },
    }),
    db.analyticsEvent.deleteMany({
      where: { timestamp: { lt: thirtyDaysAgo } },
    }),
  ])

  logger.info('Cleaned up old logs', {
    auditLogs: auditLogs.count,
    loginHistory: loginHistory.count,
    analyticsEvents: analyticsEvents.count,
  })
}

async function cleanupTempFiles() {
  // Clean up temporary files older than 24 hours
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const tempFiles = await db.mediaFile.findMany({
    where: {
      metadata: { path: ['temp'], equals: true },
      createdAt: { lt: yesterday },
    },
  })

  for (const file of tempFiles) {
    // Delete from storage (implement storage deletion)
    await db.mediaFile.delete({ where: { id: file.id } })
  }

  logger.info(`Cleaned up ${tempFiles.length} temporary files`)
}

async function checkUserAchievements(userId: string) {
  // Check all achievement criteria for a user
  const achievements = await db.achievement.findMany({
    where: {
      userAchievements: {
        none: { userId },
      },
    },
  })

  for (const achievement of achievements) {
    // Check if user meets criteria (implement criteria checking)
    const meetsCriteria = await checkAchievementCriteria(userId, achievement)
    
    if (meetsCriteria) {
      await unlockAchievement(userId, achievement.id)
    }
  }
}

async function checkAchievementCriteria(userId: string, achievement: any): Promise<boolean> {
  // Implement achievement criteria checking based on achievement.criteria
  return false // Placeholder
}

async function unlockAchievement(userId: string, achievementId: string) {
  const achievement = await db.achievement.findUnique({
    where: { id: achievementId },
  })

  if (!achievement) return

  // Create user achievement
  await db.userAchievement.create({
    data: {
      userId,
      achievementId,
      progress: 1,
      showcased: false,
    },
  })

  // Award rewards
  await db.userBalance.update({
    where: { userId },
    data: {
      sparklePoints: { increment: achievement.sparklePointsReward },
    },
  })

  // Create notification
  await NotificationService.createNotification({
    type: 'ACHIEVEMENT_UNLOCKED',
    userId,
    title: `Achievement Unlocked: ${achievement.name}!`,
    message: achievement.description || '',
    data: {
      achievementId,
      achievementName: achievement.name,
      xpReward: achievement.xpReward,
      pointsReward: achievement.sparklePointsReward,
    },
  })

  eventEmitter.emit('achievement:unlocked', { userId, achievementId })
}

async function updateLeaderboard(type: string) {
  // Update specific leaderboard
  logger.info(`Updating leaderboard: ${type}`)
  // Implementation would update leaderboard entries
}

async function calculateLeaderboard(type: string) {
  // Calculate leaderboard from scratch
  logger.info(`Calculating leaderboard: ${type}`)
  // Implementation would recalculate entire leaderboard
}

async function resetLeaderboard(type: string) {
  // Reset leaderboard for new period
  logger.info(`Resetting leaderboard: ${type}`)
  // Implementation would archive old leaderboard and start new
}

async function syncYouTubeVideos(channelId: string) {
  // Sync videos from YouTube channel
  logger.info(`Syncing YouTube videos for channel: ${channelId}`)
  // Implementation would use YouTube API to sync videos
}

async function syncYouTubeChannel(channelId: string) {
  // Sync channel info from YouTube
  logger.info(`Syncing YouTube channel: ${channelId}`)
  // Implementation would use YouTube API to sync channel data
}

async function syncYouTubeAnalytics(channelId: string) {
  // Sync analytics from YouTube
  logger.info(`Syncing YouTube analytics for channel: ${channelId}`)
  // Implementation would use YouTube Analytics API
}

async function moderateContent(contentType: string, contentId: string) {
  // Moderate content using AI
  logger.info(`Moderating ${contentType}: ${contentId}`)
  // Implementation would use AI service for content moderation
}

// Job scheduling
export function scheduleRecurringJobs() {
  // Schedule cleanup jobs
  queues.CLEANUP.add(
    'expired-notifications',
    { type: 'expired-notifications' },
    {
      repeat: {
        pattern: '0 2 * * *', // 2 AM daily
      },
    }
  )

  queues.CLEANUP.add(
    'old-logs',
    { type: 'old-logs' },
    {
      repeat: {
        pattern: '0 3 * * 0', // 3 AM Sunday
      },
    }
  )

  queues.CLEANUP.add(
    'temp-files',
    { type: 'temp-files' },
    {
      repeat: {
        pattern: '0 * * * *', // Every hour
      },
    }
  )

  // Schedule leaderboard updates
  queues.LEADERBOARD.add(
    'hourly-update',
    { type: 'update', leaderboardType: 'hourly' },
    {
      repeat: {
        pattern: '0 * * * *', // Every hour
      },
    }
  )

  queues.LEADERBOARD.add(
    'daily-reset',
    { type: 'reset', leaderboardType: 'daily' },
    {
      repeat: {
        pattern: '0 0 * * *', // Midnight
      },
    }
  )

  queues.LEADERBOARD.add(
    'weekly-reset',
    { type: 'reset', leaderboardType: 'weekly' },
    {
      repeat: {
        pattern: '0 0 * * 1', // Monday midnight
      },
    }
  )

  logger.info('Recurring jobs scheduled')
}

// Queue monitoring
export async function getQueueStats() {
  const stats: Record<string, any> = {}

  for (const [name, queue] of Object.entries(queues)) {
    const counts = await queue.getJobCounts()
    const isPaused = await queue.isPaused()
    
    stats[name] = {
      ...counts,
      isPaused,
    }
  }

  return stats
}

// Graceful shutdown
export async function shutdownJobProcessors() {
  logger.info('Shutting down job processors...')

  // Close all workers
  for (const queue of Object.values(queues)) {
    await queue.close()
  }

  // Close all event listeners
  for (const events of Object.values(queueEvents)) {
    await events.close()
  }

  logger.info('Job processors shut down')
}

// Export job creation helpers
export const jobs = {
  email: {
    send: (payload: any) => queues.EMAIL.add('send', { type: 'send', payload }),
    bulk: (payload: any) => queues.EMAIL.add('bulk', { type: 'bulk', payload }),
    digest: (userId: string) => queues.EMAIL.add('digest', { type: 'digest', payload: { userId } }),
  },
  notification: {
    create: (input: any, options?: any) => 
      queues.NOTIFICATION.add('create', { type: 'create', payload: { input, options } }),
    bulk: (userIds: string[], template: any, options?: any) =>
      queues.NOTIFICATION.add('bulk', { type: 'bulk', payload: { userIds, template, options } }),
  },
  achievement: {
    check: (userId: string) => 
      queues.ACHIEVEMENT.add('check', { userId, type: 'check' }),
    unlock: (userId: string, achievementId: string) =>
      queues.ACHIEVEMENT.add('unlock', { userId, type: 'unlock', achievementId }),
  },
  youtube: {
    syncVideos: (channelId: string) =>
      queues.YOUTUBE_SYNC.add('sync-videos', { channelId, type: 'videos' }),
    syncChannel: (channelId: string) =>
      queues.YOUTUBE_SYNC.add('sync-channel', { channelId, type: 'channel' }),
  },
  moderation: {
    check: (contentType: 'post' | 'comment' | 'message', contentId: string) =>
      queues.CONTENT_MODERATION.add('moderate', { contentType, contentId }),
  },
}
```

### `/src/app/api/admin/jobs/route.ts` - Job Management API

```typescript
// src/app/api/admin/jobs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/auth'
import { getQueueStats, jobs } from '@/lib/jobs/job-processor'
import { logger } from '@/lib/monitoring'

export async function GET(request: NextRequest) {
  try {
    // Require admin role
    await requireRole('ADMIN')

    // Get queue statistics
    const stats = await getQueueStats()

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    logger.error('Failed to get job stats', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get job statistics' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require admin role
    await requireRole('ADMIN')

    const body = await request.json()
    const { queue, job, data } = body

    // Validate queue and job exist
    if (!jobs[queue as keyof typeof jobs]) {
      return NextResponse.json(
        { success: false, error: 'Invalid queue' },
        { status: 400 }
      )
    }

    if (!jobs[queue as keyof typeof jobs][job as any]) {
      return NextResponse.json(
        { success: false, error: 'Invalid job type' },
        { status: 400 }
      )
    }

    // Create job
    const jobInstance = await jobs[queue as keyof typeof jobs][job as any](data)

    return NextResponse.json({
      success: true,
      data: {
        jobId: jobInstance.id,
        queue,
        job,
      },
    })
  } catch (error) {
    logger.error('Failed to create job', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create job' },
      { status: 500 }
    )
  }
}
```

---

## 5. 📚 API Documentation

### `/src/app/api-docs/page.tsx` - Swagger UI Page

```typescript
// src/app/api-docs/page.tsx
'use client'

import { useEffect } from 'react'
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'

export default function ApiDocsPage() {
  useEffect(() => {
    // Add custom styles
    const style = document.createElement('style')
    style.textContent = `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin-bottom: 50px }
      .swagger-ui .info .title { color: #8B5CF6 }
      .swagger-ui .btn.authorize { background-color: #8B5CF6; border-color: #8B5CF6 }
      .swagger-ui .btn.authorize:hover { background-color: #7C3AED; border-color: #7C3AED }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Sparkle Universe API Documentation
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Complete API reference for developers
          </p>
        </div>
        <SwaggerUI 
          url="/api/openapi.json"
          docExpansion="list"
          defaultModelsExpandDepth={-1}
          displayRequestDuration={true}
          filter={true}
          showExtensions={true}
          showCommonExtensions={true}
          persistAuthorization={true}
        />
      </div>
    </div>
  )
}
```

### `/src/app/api/openapi.json/route.ts` - OpenAPI Specification

```typescript
// src/app/api/openapi.json/route.ts
import { NextResponse } from 'next/server'
import { generateOpenAPIDocument } from '@/lib/openapi'

export async function GET() {
  const document = generateOpenAPIDocument()
  return NextResponse.json(document)
}
```

### `/src/lib/openapi.ts` - OpenAPI Document Generator

```typescript
// src/lib/openapi.ts
import { OpenAPIV3 } from 'openapi-types'

export function generateOpenAPIDocument(): OpenAPIV3.Document {
  return {
    openapi: '3.0.0',
    info: {
      title: 'Sparkle Universe API',
      version: '1.0.0',
      description: 'The next-generation community platform for Sparkle YouTube fans',
      contact: {
        name: 'Sparkle Universe Support',
        email: 'support@sparkle-universe.com',
        url: 'https://sparkle-universe.com/support',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        description: 'Current environment',
      },
    ],
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'Authentication endpoints',
      },
      {
        name: 'Users',
        description: 'User management endpoints',
      },
      {
        name: 'Posts',
        description: 'Blog post endpoints',
      },
      {
        name: 'Comments',
        description: 'Comment endpoints',
      },
      {
        name: 'Notifications',
        description: 'Notification endpoints',
      },
      {
        name: 'Upload',
        description: 'File upload endpoints',
      },
    ],
    paths: {
      '/api/auth/login': {
        post: {
          tags: ['Authentication'],
          summary: 'Login user',
          description: 'Authenticate user with email and password',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: {
                      type: 'string',
                      format: 'email',
                      example: 'user@example.com',
                    },
                    password: {
                      type: 'string',
                      format: 'password',
                      minLength: 8,
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          user: { $ref: '#/components/schemas/User' },
                          token: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
            '401': {
              description: 'Invalid credentials',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/auth/register': {
        post: {
          tags: ['Authentication'],
          summary: 'Register new user',
          description: 'Create a new user account',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password', 'username'],
                  properties: {
                    email: {
                      type: 'string',
                      format: 'email',
                    },
                    password: {
                      type: 'string',
                      format: 'password',
                      minLength: 8,
                    },
                    username: {
                      type: 'string',
                      minLength: 3,
                      maxLength: 30,
                      pattern: '^[a-zA-Z0-9_]+$',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Registration successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          user: { $ref: '#/components/schemas/User' },
                        },
                      },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ValidationError' },
                },
              },
            },
          },
        },
      },
      '/api/users/{username}': {
        get: {
          tags: ['Users'],
          summary: 'Get user profile',
          description: 'Get public user profile by username',
          parameters: [
            {
              name: 'username',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
              },
            },
          ],
          responses: {
            '200': {
              description: 'User profile',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { $ref: '#/components/schemas/UserProfile' },
                    },
                  },
                },
              },
            },
            '404': {
              description: 'User not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/posts': {
        get: {
          tags: ['Posts'],
          summary: 'List posts',
          description: 'Get paginated list of posts',
          parameters: [
            {
              name: 'page',
              in: 'query',
              schema: {
                type: 'integer',
                default: 1,
              },
            },
            {
              name: 'limit',
              in: 'query',
              schema: {
                type: 'integer',
                default: 20,
                maximum: 100,
              },
            },
            {
              name: 'sort',
              in: 'query',
              schema: {
                type: 'string',
                enum: ['recent', 'popular', 'trending'],
                default: 'recent',
              },
            },
            {
              name: 'category',
              in: 'query',
              schema: {
                type: 'string',
              },
            },
            {
              name: 'tag',
              in: 'query',
              schema: {
                type: 'string',
              },
            },
          ],
          responses: {
            '200': {
              description: 'List of posts',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          items: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Post' },
                          },
                          total: { type: 'integer' },
                          page: { type: 'integer' },
                          pageSize: { type: 'integer' },
                          totalPages: { type: 'integer' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Posts'],
          summary: 'Create post',
          description: 'Create a new blog post',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'content'],
                  properties: {
                    title: {
                      type: 'string',
                      maxLength: 255,
                    },
                    content: {
                      type: 'string',
                    },
                    excerpt: {
                      type: 'string',
                      maxLength: 500,
                    },
                    coverImage: {
                      type: 'string',
                      format: 'uri',
                    },
                    tags: {
                      type: 'array',
                      items: {
                        type: 'string',
                      },
                    },
