// src/server/services/realtime.service.ts
import { Server as HTTPServer } from 'http'
import { Server as SocketServer } from 'socket.io'
import { PrismaClient } from '@prisma/client'
import { verify } from 'jsonwebtoken'
import { redisClient } from '@/lib/redis'

export class RealtimeService {
  private io: SocketServer
  private db: PrismaClient

  constructor(server: HTTPServer, db: PrismaClient) {
    this.db = db
    this.io = new SocketServer(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL,
        credentials: true,
      },
    })

    this.setupMiddleware()
    this.setupEventHandlers()
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token
        if (!token) {
          return next(new Error('Authentication required'))
        }

        const decoded = verify(token, process.env.JWT_SECRET!) as any
        const user = await this.db.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, username: true, role: true },
        })

        if (!user) {
          return next(new Error('User not found'))
        }

        socket.data.user = user
        next()
      } catch (error) {
        next(new Error('Invalid token'))
      }
    })
  }

  private setupEventHandlers() {
    this.io.on('connection', async (socket) => {
      const user = socket.data.user
      console.log(`User ${user.username} connected`)

      // Join user's personal room
      socket.join(`user:${user.id}`)

      // Update online status
      await this.setUserOnline(user.id, socket.id)

      // Join followed users' activity rooms
      const following = await this.db.follow.findMany({
        where: { followerId: user.id },
        select: { followingId: true },
      })
      
      for (const follow of following) {
        socket.join(`activity:${follow.followingId}`)
      }

      // Event handlers
      socket.on('join:post', async (postId: string) => {
        socket.join(`post:${postId}`)
        await this.updatePresence(user.id, 'post', postId)
      })

      socket.on('leave:post', async (postId: string) => {
        socket.leave(`post:${postId}`)
      })

      socket.on('join:watchParty', async (partyId: string) => {
        socket.join(`party:${partyId}`)
        await this.updatePresence(user.id, 'watchParty', partyId)
      })

      socket.on('typing:start', async (data: { channelId: string }) => {
        socket.to(data.channelId).emit('user:typing', {
          userId: user.id,
          username: user.username,
        })
      })

      socket.on('typing:stop', async (data: { channelId: string }) => {
        socket.to(data.channelId).emit('user:stopTyping', {
          userId: user.id,
        })
      })

      socket.on('disconnect', async () => {
        console.log(`User ${user.username} disconnected`)
        await this.setUserOffline(user.id, socket.id)
      })
    })
  }

  // Public methods for emitting events
  async notifyUser(userId: string, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data)
  }

  async notifyFollowers(userId: string, event: string, data: any) {
    this.io.to(`activity:${userId}`).emit(event, data)
  }

  async notifyPost(postId: string, event: string, data: any) {
    this.io.to(`post:${postId}`).emit(event, data)
  }

  async notifyWatchParty(partyId: string, event: string, data: any) {
    this.io.to(`party:${partyId}`).emit(event, data)
  }

  // Online status management
  private async setUserOnline(userId: string, socketId: string) {
    await this.db.websocketSession.create({
      data: {
        userId,
        socketId,
      },
    })

    await this.db.user.update({
      where: { id: userId },
      data: { onlineStatus: true },
    })

    // Store in Redis for quick access
    await redisClient.sadd(`online:users`, userId)
    
    // Notify followers
    this.notifyFollowers(userId, 'user:online', { userId })
  }

  private async setUserOffline(userId: string, socketId: string) {
    await this.db.websocketSession.delete({
      where: { socketId },
    })

    // Check if user has other active sessions
    const activeSessions = await this.db.websocketSession.count({
      where: { userId },
    })

    if (activeSessions === 0) {
      await this.db.user.update({
        where: { id: userId },
        data: { onlineStatus: false },
      })

      // Remove from Redis
      await redisClient.srem(`online:users`, userId)
      
      // Notify followers
      this.notifyFollowers(userId, 'user:offline', { userId })
    }
  }

  private async updatePresence(userId: string, type: string, location: string) {
    await this.db.presenceTracking.upsert({
      where: {
        userId_location: {
          userId,
          location,
        },
      },
      create: {
        userId,
        location,
        locationType: type,
      },
      update: {
        lastActiveAt: new Date(),
      },
    })
  }
}
