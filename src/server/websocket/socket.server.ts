// src/server/websocket/socket.server.ts
import { Server as HTTPServer } from 'http'
import { Server as SocketServer, Socket } from 'socket.io'
import { parse } from 'cookie'
import { db } from '@/lib/db'
import Redis from 'ioredis'
import { RateLimiter } from '@/lib/rate-limit'
import { eventService } from '@/server/services/event.service'
import { z } from 'zod'

interface SocketData {
  userId: string
  username: string
  role: string
  sessionId: string
}

interface ServerToClientEvents {
  // Notifications
  'notification:new': (notification: any) => void
  'notification:update': (data: { id: string; read: boolean }) => void
  
  // Posts
  'post:created': (post: any) => void
  'post:updated': (post: any) => void
  'post:deleted': (postId: string) => void
  'post:liked': (data: { postId: string; userId: string; likes: number }) => void
  
  // Comments
  'comment:created': (comment: any) => void
  'comment:updated': (comment: any) => void
  'comment:deleted': (data: { postId: string; commentId: string }) => void
  'comment:typing': (data: { postId: string; userId: string; username: string; isTyping: boolean }) => void
  
  // Following
  'user:followed': (data: { followerId: string; followingId: string }) => void
  'user:unfollowed': (data: { followerId: string; followingId: string }) => void
  
  // Users
  'user:online': (userId: string) => void
  'user:offline': (userId: string) => void
  'users:online': (userIds: string[]) => void
  
  // Direct Messages
  'message:new': (message: any) => void
  'message:read': (data: { messageId: string; conversationId: string }) => void
  'message:typing': (data: { conversationId: string; userId: string; isTyping: boolean }) => void
  
  // Watch parties
  'watchParty:userJoined': (data: { partyId: string; user: any }) => void
  'watchParty:userLeft': (data: { partyId: string; userId: string }) => void
  'watchParty:playbackSync': (data: { partyId: string; position: number; isPlaying: boolean }) => void
  'watchParty:message': (message: any) => void
  
  // System
  'error': (error: { message: string; code?: string }) => void
  'reconnect': () => void
}

interface ClientToServerEvents {
  // Room management
  'join:room': (room: string) => void
  'leave:room': (room: string) => void
  
  // Presence
  'presence:update': (status: 'online' | 'away' | 'busy') => void
  
  // Typing indicators
  'typing:start': (data: { channel: string; context?: any }) => void
  'typing:stop': (data: { channel: string }) => void
  
  // Direct Messages
  'message:send': (data: { conversationId: string; content: string; attachments?: any[] }) => void
  'message:markRead': (data: { messageId: string; conversationId: string }) => void
  'message:typing': (data: { conversationId: string; isTyping: boolean }) => void
  
  // Following
  'follow:user': (userId: string) => void
  'unfollow:user': (userId: string) => void
  
  // Watch party
  'watchParty:join': (partyId: string) => void
  'watchParty:leave': (partyId: string) => void
  'watchParty:sync': (data: { partyId: string; position: number; isPlaying: boolean }) => void
  'watchParty:sendMessage': (data: { partyId: string; message: string; timestamp?: number }) => void
  
  // Collaboration
  'collab:join': (spaceId: string) => void
  'collab:leave': (spaceId: string) => void
  'collab:cursor': (data: { spaceId: string; position: { x: number; y: number } }) => void
  'collab:change': (data: { spaceId: string; changes: any }) => void
}

export class WebSocketServer {
  private io: SocketServer<ClientToServerEvents, ServerToClientEvents, {}, SocketData>
  private pubClient: Redis
  private subClient: Redis
  private rateLimiter: RateLimiter

  constructor(httpServer: HTTPServer) {
    // Use ioredis as specified in README
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
    
    this.pubClient = new Redis(redisUrl)
    this.subClient = new Redis(redisUrl)

    this.rateLimiter = new RateLimiter({
      points: 100, // Number of points
      duration: 60, // Per minute
    })

    this.io = new SocketServer(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL?.split(',') || ['http://localhost:3000'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
      transports: ['websocket', 'polling'],
    })

    // Initialize EventService with Socket.IO
    eventService.initializeSocketIO(this.io)

    this.setupMiddleware()
    this.setupEventHandlers()
    this.startPresenceCleanup()
  }

  private async setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const cookies = parse(socket.request.headers.cookie || '')
        const sessionToken = cookies['next-auth.session-token'] || cookies['__Secure-next-auth.session-token']

        if (!sessionToken) {
          return next(new Error('Authentication required'))
        }

        // Verify session
        const session = await db.session.findUnique({
          where: { sessionToken },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                role: true,
                status: true,
              },
            },
          },
        })

        if (!session || session.expires < new Date()) {
          return next(new Error('Invalid or expired session'))
        }

        if (session.user.status === 'BANNED') {
          return next(new Error('Account banned'))
        }

        // Store user data
        socket.data = {
          userId: session.user.id,
          username: session.user.username,
          role: session.user.role,
          sessionId: session.id,
        }

        // Rate limiting
        const rateLimitKey = `ws:${session.user.id}`
        const { success } = await this.rateLimiter.consume(rateLimitKey, 1)
        if (!success) {
          return next(new Error('Rate limit exceeded'))
        }

        next()
      } catch (error) {
        console.error('WebSocket auth error:', error)
        next(new Error('Authentication failed'))
      }
    })
  }

  private setupEventHandlers() {
    this.io.on('connection', async (socket) => {
      console.log(`User ${socket.data.username} connected (${socket.id})`)

      // Store WebSocket session
      await this.storeWebSocketSession(socket)

      // Join user's personal room
      socket.join(`user:${socket.data.userId}`)
      eventService.joinUserRoom(socket.id, socket.data.userId)

      // Update online status
      await this.updateUserPresence(socket.data.userId, 'online')

      // Send online users to the new connection
      const onlineUsers = await this.getOnlineUsers()
      socket.emit('users:online', onlineUsers)

      // Notify others that user is online
      socket.broadcast.emit('user:online', socket.data.userId)

      // Setup event handlers
      this.setupRoomHandlers(socket)
      this.setupPresenceHandlers(socket)
      this.setupTypingHandlers(socket)
      this.setupMessageHandlers(socket)
      this.setupFollowHandlers(socket)
      this.setupWatchPartyHandlers(socket)
      this.setupCollaborationHandlers(socket)

      // Handle disconnection
      socket.on('disconnect', async (reason) => {
        console.log(`User ${socket.data.username} disconnected (${reason})`)
        
        // Clear any typing indicators
        await this.clearUserTypingIndicators(socket)

        // Update presence with delay (user might reconnect)
        const presenceKey = `presence:timeout:${socket.data.userId}`
        const existingTimeout = await this.pubClient.get(presenceKey)
        
        if (existingTimeout) {
          clearTimeout(parseInt(existingTimeout))
        }

        const timeoutId = setTimeout(async () => {
          const activeSessions = await this.getUserActiveSessions(socket.data.userId)
          if (activeSessions === 0) {
            await this.updateUserPresence(socket.data.userId, 'offline')
            socket.broadcast.emit('user:offline', socket.data.userId)
          }
          await this.pubClient.del(presenceKey)
        }, 10000)

        await this.pubClient.set(presenceKey, timeoutId.toString(), 'EX', 15)

        // Clean up WebSocket session
        await this.removeWebSocketSession(socket.id)
      })

      // Handle errors
      socket.on('error', (error) => {
        console.error(`WebSocket error for user ${socket.data.username}:`, error)
      })
    })
  }

  // Room management handlers
  private setupRoomHandlers(socket: Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>) {
    socket.on('join:room', async (room) => {
      // Validate room format
      const roomPattern = /^(post|user|group|watchParty|collab|conversation):[a-zA-Z0-9_-]+$/
      if (!roomPattern.test(room)) {
        socket.emit('error', { message: 'Invalid room format' })
        return
      }

      // Check permissions
      const hasAccess = await this.checkRoomAccess(socket.data.userId, room)
      if (!hasAccess) {
        socket.emit('error', { message: 'Access denied' })
        return
      }

      socket.join(room)
      eventService.joinRoom(socket.id, room)
      console.log(`User ${socket.data.username} joined room ${room}`)

      // Track room membership in Redis
      await this.pubClient.sadd(`room:${room}:members`, socket.data.userId)
    })

    socket.on('leave:room', async (room) => {
      socket.leave(room)
      eventService.leaveRoom(socket.id, room)
      console.log(`User ${socket.data.username} left room ${room}`)

      // Update room membership
      await this.pubClient.srem(`room:${room}:members`, socket.data.userId)
    })
  }

  // Presence handlers
  private setupPresenceHandlers(socket: Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>) {
    socket.on('presence:update', async (status) => {
      await this.updateUserPresence(socket.data.userId, status)
      
      // Broadcast to user's followers
      const followers = await db.follow.findMany({
        where: { followingId: socket.data.userId },
        select: { followerId: true },
      })

      followers.forEach(({ followerId }) => {
        this.io.to(`user:${followerId}`).emit('user:online', socket.data.userId)
      })
    })
  }

  // Typing indicators
  private setupTypingHandlers(socket: Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>) {
    socket.on('typing:start', async ({ channel, context }) => {
      const typingKey = `typing:${socket.data.userId}:${channel}`
      
      // Clear existing timeout
      const existingTimeout = await this.pubClient.get(typingKey)
      if (existingTimeout) {
        clearTimeout(parseInt(existingTimeout))
      }

      // Emit via EventService
      eventService.emitTyping(
        channel.includes('post:') ? channel.split(':')[1] : channel,
        socket.data.userId,
        socket.data.username,
        true
      )

      // Set timeout to auto-stop typing
      const timeoutId = setTimeout(() => {
        eventService.emitTyping(
          channel.includes('post:') ? channel.split(':')[1] : channel,
          socket.data.userId,
          socket.data.username,
          false
        )
        this.pubClient.del(typingKey)
      }, 3000)

      await this.pubClient.set(typingKey, timeoutId.toString(), 'EX', 5)
    })

    socket.on('typing:stop', async ({ channel }) => {
      const typingKey = `typing:${socket.data.userId}:${channel}`
      
      // Clear timeout
      const timeout = await this.pubClient.get(typingKey)
      if (timeout) {
        clearTimeout(parseInt(timeout))
        await this.pubClient.del(typingKey)
      }

      // Emit via EventService
      eventService.emitTyping(
        channel.includes('post:') ? channel.split(':')[1] : channel,
        socket.data.userId,
        socket.data.username,
        false
      )
    })
  }

  // Direct message handlers
  private setupMessageHandlers(socket: Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>) {
    socket.on('message:send', async ({ conversationId, content, attachments }) => {
      try {
        // Create message
        const message = await db.message.create({
          data: {
            conversationId,
            senderId: socket.data.userId,
            content,
            attachments: attachments || undefined,
            status: 'SENT',
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

        // Update conversation
        await db.conversation.update({
          where: { id: conversationId },
          data: {
            lastMessageId: message.id,
            lastMessageAt: new Date(),
            messageCount: { increment: 1 },
          },
        })

        // Get participants
        const participants = await db.conversationParticipant.findMany({
          where: { conversationId },
          select: { userId: true },
        })

        // Emit to all participants
        participants.forEach(({ userId }) => {
          this.io.to(`user:${userId}`).emit('message:new', message)
        })

        // Update unread counts
        await db.conversationParticipant.updateMany({
          where: {
            conversationId,
            userId: { not: socket.data.userId },
          },
          data: {
            unreadCount: { increment: 1 },
          },
        })
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' })
      }
    })

    socket.on('message:markRead', async ({ messageId, conversationId }) => {
      try {
        // Create read receipt
        await db.messageRead.create({
          data: {
            messageId,
            userId: socket.data.userId,
          },
        })

        // Update conversation participant
        await db.conversationParticipant.update({
          where: {
            conversationId_userId: {
              conversationId,
              userId: socket.data.userId,
            },
          },
          data: {
            lastReadAt: new Date(),
            lastReadMessageId: messageId,
            unreadCount: 0,
          },
        })

        // Notify sender
        const message = await db.message.findUnique({
          where: { id: messageId },
          select: { senderId: true },
        })

        if (message) {
          this.io.to(`user:${message.senderId}`).emit('message:read', {
            messageId,
            conversationId,
          })
        }
      } catch (error) {
        console.error('Failed to mark message as read:', error)
      }
    })

    socket.on('message:typing', async ({ conversationId, isTyping }) => {
      // Get participants
      const participants = await db.conversationParticipant.findMany({
        where: {
          conversationId,
          userId: { not: socket.data.userId },
        },
        select: { userId: true },
      })

      // Emit to other participants
      participants.forEach(({ userId }) => {
        this.io.to(`user:${userId}`).emit('message:typing', {
          conversationId,
          userId: socket.data.userId,
          isTyping,
        })
      })
    })
  }

  // Following handlers
  private setupFollowHandlers(socket: Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>) {
    socket.on('follow:user', async (targetUserId) => {
      try {
        // Create follow relationship
        await db.follow.create({
          data: {
            followerId: socket.data.userId,
            followingId: targetUserId,
          },
        })

        // Update stats
        await Promise.all([
          db.userStats.update({
            where: { userId: socket.data.userId },
            data: { totalFollowing: { increment: 1 } },
          }),
          db.userStats.update({
            where: { userId: targetUserId },
            data: { totalFollowers: { increment: 1 } },
          }),
        ])

        // Emit events
        this.io.to(`user:${targetUserId}`).emit('user:followed', {
          followerId: socket.data.userId,
          followingId: targetUserId,
        })

        // Create notification
        await db.notification.create({
          data: {
            type: 'USER_FOLLOWED',
            userId: targetUserId,
            actorId: socket.data.userId,
            entityId: socket.data.userId,
            entityType: 'user',
            title: 'New follower',
            message: `${socket.data.username} started following you`,
          },
        })
      } catch (error) {
        socket.emit('error', { message: 'Failed to follow user' })
      }
    })

    socket.on('unfollow:user', async (targetUserId) => {
      try {
        // Remove follow relationship
        await db.follow.delete({
          where: {
            followerId_followingId: {
              followerId: socket.data.userId,
              followingId: targetUserId,
            },
          },
        })

        // Update stats
        await Promise.all([
          db.userStats.update({
            where: { userId: socket.data.userId },
            data: { totalFollowing: { decrement: 1 } },
          }),
          db.userStats.update({
            where: { userId: targetUserId },
            data: { totalFollowers: { decrement: 1 } },
          }),
        ])

        // Emit events
        this.io.to(`user:${targetUserId}`).emit('user:unfollowed', {
          followerId: socket.data.userId,
          followingId: targetUserId,
        })
      } catch (error) {
        socket.emit('error', { message: 'Failed to unfollow user' })
      }
    })
  }

  // Watch party handlers (continued from original)
  private setupWatchPartyHandlers(socket: Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>) {
    socket.on('watchParty:join', async (partyId) => {
      const roomKey = `watchParty:${partyId}`
      
      // Verify party exists and user has access
      const party = await db.watchParty.findUnique({
        where: { id: partyId },
        include: {
          participants: {
            where: { userId: socket.data.userId },
          },
        },
      })

      if (!party || party.endedAt) {
        socket.emit('error', { message: 'Watch party not found or ended' })
        return
      }

      // Join or create participant
      if (party.participants.length === 0) {
        await db.watchPartyParticipant.create({
          data: {
            partyId,
            userId: socket.data.userId,
            role: party.hostId === socket.data.userId ? 'host' : 'viewer',
            isActive: true,
          },
        })
      } else {
        await db.watchPartyParticipant.update({
          where: { id: party.participants[0].id },
          data: { isActive: true },
        })
      }

      // Join room
      socket.join(roomKey)
      eventService.joinRoom(socket.id, roomKey)

      // Update participant count
      await db.watchParty.update({
        where: { id: partyId },
        data: { currentParticipants: { increment: 1 } },
      })

      // Get user details
      const user = await db.user.findUnique({
        where: { id: socket.data.userId },
        select: {
          id: true,
          username: true,
          image: true,
        },
      })

      // Notify others
      socket.to(roomKey).emit('watchParty:userJoined', {
        partyId,
        user,
      })
    })

    socket.on('watchParty:leave', async (partyId) => {
      const roomKey = `watchParty:${partyId}`
      
      socket.leave(roomKey)
      eventService.leaveRoom(socket.id, roomKey)

      // Update participant status
      await db.watchPartyParticipant.updateMany({
        where: {
          partyId,
          userId: socket.data.userId,
        },
        data: {
          isActive: false,
          leftAt: new Date(),
        },
      })

      // Update participant count
      await db.watchParty.update({
        where: { id: partyId },
        data: { currentParticipants: { decrement: 1 } },
      })

      // Notify others
      socket.to(roomKey).emit('watchParty:userLeft', {
        partyId,
        userId: socket.data.userId,
      })
    })

    socket.on('watchParty:sync', async ({ partyId, position, isPlaying }) => {
      const roomKey = `watchParty:${partyId}`
      
      // Verify user is host or has sync permissions
      const participant = await db.watchPartyParticipant.findFirst({
        where: {
          partyId,
          userId: socket.data.userId,
        },
      })

      if (!participant || participant.role !== 'host') {
        socket.emit('error', { message: 'Only host can control playback' })
        return
      }

      // Broadcast sync to all participants
      socket.to(roomKey).emit('watchParty:playbackSync', {
        partyId,
        position,
        isPlaying,
      })

      // Update participant positions
      await db.watchPartyParticipant.updateMany({
        where: { partyId },
        data: { playbackPosition: position },
      })
    })

    socket.on('watchParty:sendMessage', async ({ partyId, message, timestamp }) => {
      const roomKey = `watchParty:${partyId}`
      
      // Create message in database
      const chatMessage = await db.watchPartyChat.create({
        data: {
          partyId,
          userId: socket.data.userId,
          message,
          timestamp: timestamp || 0,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              image: true,
            },
          },
        },
      })

      // Update participant message count
      await db.watchPartyParticipant.updateMany({
        where: {
          partyId,
          userId: socket.data.userId,
        },
        data: {
          messageCount: { increment: 1 },
        },
      })

      // Broadcast to room
      this.io.to(roomKey).emit('watchParty:message', chatMessage)
    })
  }

  // Collaboration handlers (continued from original)
  private setupCollaborationHandlers(socket: Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>) {
    socket.on('collab:join', async (spaceId) => {
      const roomKey = `collab:${spaceId}`
      
      // Verify access
      const collaborator = await db.spaceCollaborator.findFirst({
        where: {
          spaceId,
          userId: socket.data.userId,
        },
      })

      if (!collaborator) {
        socket.emit('error', { message: 'Access denied' })
        return
      }

      socket.join(roomKey)
      eventService.joinRoom(socket.id, roomKey)

      // Update last active
      await db.spaceCollaborator.update({
        where: { id: collaborator.id },
        data: { lastActiveAt: new Date() },
      })

      // Update active users count
      await db.collaborativeSpace.update({
        where: { id: spaceId },
        data: { activeUsers: { increment: 1 } },
      })

      // Track active users in Redis
      await this.pubClient.sadd(`collab:${spaceId}:active`, socket.data.userId)
    })

    socket.on('collab:leave', async (spaceId) => {
      const roomKey = `collab:${spaceId}`
      socket.leave(roomKey)
      eventService.leaveRoom(socket.id, roomKey)

      // Update active users count
      await db.collaborativeSpace.update({
        where: { id: spaceId },
        data: { activeUsers: { decrement: 1 } },
      })

      // Remove from active users
      await this.pubClient.srem(`collab:${spaceId}:active`, socket.data.userId)
    })

    socket.on('collab:cursor', ({ spaceId, position }) => {
      const roomKey = `collab:${spaceId}`
      socket.to(roomKey).emit('collab:cursor', {
        userId: socket.data.userId,
        position,
      })
    })

    socket.on('collab:change', async ({ spaceId, changes }) => {
      const roomKey = `collab:${spaceId}`
      
      // Verify edit permissions
      const collaborator = await db.spaceCollaborator.findFirst({
        where: {
          spaceId,
          userId: socket.data.userId,
          canEdit: true,
        },
      })

      if (!collaborator) {
        socket.emit('error', { message: 'No edit permissions' })
        return
      }

      // Update space version
      await db.collaborativeSpace.update({
        where: { id: spaceId },
        data: {
          version: { increment: 1 },
          lastEditedAt: new Date(),
        },
      })

      // Broadcast changes
      socket.to(roomKey).emit('collab:change', {
        userId: socket.data.userId,
        changes,
      })
    })
  }

  // Helper methods
  private async storeWebSocketSession(socket: Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>) {
    await db.websocketSession.create({
      data: {
        userId: socket.data.userId,
        socketId: socket.id,
        ipAddress: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent'],
      },
    })
  }

  private async removeWebSocketSession(socketId: string) {
    await db.websocketSession.delete({
      where: { socketId },
    }).catch(() => {}) // Ignore if already deleted
  }

  private async getUserActiveSessions(userId: string): Promise<number> {
    return db.websocketSession.count({
      where: { userId },
    })
  }

  private async updateUserPresence(userId: string, status: string) {
    if (status === 'online') {
      await this.pubClient.sadd('users:online', userId)
      await this.pubClient.hset('users:presence', userId, Date.now().toString())
    } else {
      await this.pubClient.srem('users:online', userId)
      await this.pubClient.hdel('users:presence', userId)
    }

    // Update database
    await db.user.update({
      where: { id: userId },
      data: {
        onlineStatus: status === 'online',
        lastSeenAt: new Date(),
      },
    }).catch(() => {}) // Ignore errors

    // Update presence tracking
    if (status === 'online') {
      await db.presenceTracking.upsert({
        where: {
          userId_location: {
            userId,
            location: 'global',
          },
        },
        update: {
          status: 'active',
          lastActiveAt: new Date(),
        },
        create: {
          userId,
          location: 'global',
          locationType: 'global',
          status: 'active',
        },
      })
    }
  }

  private async getOnlineUsers(): Promise<string[]> {
    const users = await this.pubClient.smembers('users:online')
    return users || []
  }

  private async checkRoomAccess(userId: string, room: string): Promise<boolean> {
    const [type, id] = room.split(':')

    switch (type) {
      case 'post':
        // Check if post exists and is accessible
        const post = await db.post.findUnique({
          where: { id },
          select: { published: true },
        })
        return !!post?.published

      case 'user':
        // Users can join their own room
        return id === userId

      case 'group':
        // Check group membership
        const member = await db.groupMember.findUnique({
          where: {
            groupId_userId: { groupId: id, userId },
          },
        })
        return !!member

      case 'conversation':
        // Check conversation participation
        const conversationParticipant = await db.conversationParticipant.findFirst({
          where: { conversationId: id, userId },
        })
        return !!conversationParticipant

      case 'watchParty':
        // Check watch party participation
        const participant = await db.watchPartyParticipant.findFirst({
          where: { partyId: id, userId },
        })
        return !!participant

      case 'collab':
        // Check collaboration access
        const collaborator = await db.spaceCollaborator.findFirst({
          where: { spaceId: id, userId },
        })
        return !!collaborator

      default:
        return false
    }
  }

  private async clearUserTypingIndicators(socket: Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>) {
    // Clear all typing timeouts for this user from Redis
    const typingKeys = await this.pubClient.keys(`typing:${socket.data.userId}:*`)
    
    for (const key of typingKeys) {
      const timeout = await this.pubClient.get(key)
      if (timeout) {
        clearTimeout(parseInt(timeout))
      }
      await this.pubClient.del(key)
      
      // Emit typing stopped
      const channel = key.split(':').slice(2).join(':')
      eventService.emitTyping(
        channel.includes('post:') ? channel.split(':')[1] : channel,
        socket.data.userId,
        socket.data.username,
        false
      )
    }
  }

  private startPresenceCleanup() {
    // Clean up stale presence data every minute
    setInterval(async () => {
      const presence = await this.pubClient.hgetall('users:presence')
      const now = Date.now()
      const staleThreshold = 5 * 60 * 1000 // 5 minutes

      for (const [userId, timestamp] of Object.entries(presence || {})) {
        if (now - parseInt(timestamp) > staleThreshold) {
          await this.updateUserPresence(userId, 'offline')
          this.io.emit('user:offline', userId)
        }
      }
    }, 60000) // Every minute
  }

  // Public methods for emitting events from other services
  public emitToUser(userId: string, event: keyof ServerToClientEvents, data: any) {
    this.io.to(`user:${userId}`).emit(event, data)
  }

  public emitToRoom(room: string, event: keyof ServerToClientEvents, data: any) {
    this.io.to(room).emit(event, data)
  }

  public broadcast(event: keyof ServerToClientEvents, data: any) {
    this.io.emit(event, data)
  }

  public async getSocketsInRoom(room: string): Promise<string[]> {
    const sockets = await this.io.in(room).fetchSockets()
    return sockets.map(s => s.id)
  }

  public async disconnectUser(userId: string, reason?: string) {
    const sockets = await this.io.fetchSockets()
    for (const socket of sockets) {
      if (socket.data.userId === userId) {
        socket.disconnect(true)
      }
    }
  }
}
