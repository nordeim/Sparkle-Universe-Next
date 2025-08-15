// src/server/services/event.service.ts
import { Server as SocketIOServer } from 'socket.io'
import Redis from 'ioredis'

class EventService {
  private static instance: EventService
  private io: SocketIOServer | null = null
  private pubClient: Redis | null = null
  private subClient: Redis | null = null
  private isInitialized: boolean = false

  constructor() {
    if (EventService.instance) {
      return EventService.instance
    }
    EventService.instance = this
  }

  /**
   * Initialize Socket.IO server (called from server initialization)
   */
  initializeSocketIO(io: SocketIOServer) {
    this.io = io
    this.setupRedisAdapters()
    this.isInitialized = true
    console.log('EventService initialized with Socket.IO')
  }

  /**
   * Set up Redis adapters for Socket.IO scaling
   */
  private setupRedisAdapters() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
      
      this.pubClient = new Redis(redisUrl)
      this.subClient = new Redis(redisUrl)

      this.pubClient.on('error', (err) => {
        console.error('Redis pub client error:', err)
      })

      this.subClient.on('error', (err) => {
        console.error('Redis sub client error:', err)
      })

      // Note: Socket.IO Redis adapter setup would happen in the main server file
      // This is just for pub/sub functionality
    } catch (error) {
      console.error('Failed to setup Redis adapters:', error)
    }
  }

  /**
   * Emit an event to specific users or rooms
   */
  async emit(event: string, data: any, target?: {
    userId?: string
    room?: string
    broadcast?: boolean
  }) {
    if (!this.io) {
      console.warn('Socket.IO not initialized, event not emitted:', event)
      return
    }

    try {
      if (target?.userId) {
        // Emit to specific user
        this.io.to(`user:${target.userId}`).emit(event, data)
      } else if (target?.room) {
        // Emit to specific room
        this.io.to(target.room).emit(event, data)
      } else if (target?.broadcast) {
        // Broadcast to all connected clients
        this.io.emit(event, data)
      } else {
        // Default: emit based on data context
        this.emitContextual(event, data)
      }

      // Also publish to Redis for other servers
      if (this.pubClient) {
        await this.pubClient.publish(`sparkle:events:${event}`, JSON.stringify({
          event,
          data,
          target,
          timestamp: Date.now(),
        }))
      }
    } catch (error) {
      console.error(`Failed to emit event ${event}:`, error)
    }
  }

  /**
   * Emit event based on data context
   */
  private emitContextual(event: string, data: any) {
    if (!this.io) return

    // Determine target based on event type and data
    switch (event) {
      case 'notification.created':
        if (data.userId) {
          this.io.to(`user:${data.userId}`).emit(event, data)
        }
        break

      case 'comment.created':
      case 'comment.updated':
      case 'comment.deleted':
        if (data.postId) {
          this.io.to(`post:${data.postId}`).emit(event, data)
        }
        break

      case 'comment.liked':
      case 'comment.unliked':
        if (data.commentId) {
          // Emit to post room (assuming comment is in a post)
          this.io.to(`comment:${data.commentId}`).emit(event, data)
        }
        break

      case 'comment.typing.start':
      case 'comment.typing.stop':
        if (data.postId) {
          this.io.to(`post:${data.postId}`).emit(event, data)
        }
        break

      case 'post.updated':
      case 'post.deleted':
        if (data.postId) {
          this.io.to(`post:${data.postId}`).emit(event, data)
        }
        break

      case 'user.online':
      case 'user.offline':
        if (data.userId) {
          // Broadcast to user's followers
          this.io.to(`followers:${data.userId}`).emit(event, data)
        }
        break

      default:
        console.warn(`Unknown event type for contextual emission: ${event}`)
    }
  }

  /**
   * Join a user to their personal room
   */
  joinUserRoom(socketId: string, userId: string) {
    if (!this.io) return
    
    const socket = this.io.sockets.sockets.get(socketId)
    if (socket) {
      socket.join(`user:${userId}`)
      socket.join(`followers:${userId}`)
    }
  }

  /**
   * Join a socket to a specific room
   */
  joinRoom(socketId: string, room: string) {
    if (!this.io) return
    
    const socket = this.io.sockets.sockets.get(socketId)
    if (socket) {
      socket.join(room)
    }
  }

  /**
   * Leave a room
   */
  leaveRoom(socketId: string, room: string) {
    if (!this.io) return
    
    const socket = this.io.sockets.sockets.get(socketId)
    if (socket) {
      socket.leave(room)
    }
  }

  /**
   * Get users in a room
   */
  async getRoomUsers(room: string): Promise<string[]> {
    if (!this.io) return []
    
    const sockets = await this.io.in(room).fetchSockets()
    return sockets.map(s => s.id)
  }

  /**
   * Emit typing indicator
   */
  emitTyping(postId: string, userId: string, username: string, isTyping: boolean) {
    this.emit('comment.typing', {
      postId,
      userId,
      username,
      isTyping,
    }, {
      room: `post:${postId}`,
    })
  }

  /**
   * Emit notification
   */
  emitNotification(userId: string, notification: any) {
    this.emit('notification.created', {
      notification,
    }, {
      userId,
    })
  }

  /**
   * Emit activity update
   */
  emitActivity(activity: any) {
    this.emit('activity.created', activity, {
      broadcast: activity.visibility === 'PUBLIC',
    })
  }

  /**
   * Get Socket.IO server instance
   */
  getIO(): SocketIOServer | null {
    return this.io
  }

  /**
   * Check if service is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.io !== null
  }

  /**
   * Cleanup connections
   */
  async cleanup() {
    if (this.pubClient) {
      await this.pubClient.quit()
    }
    if (this.subClient) {
      await this.subClient.quit()
    }
    this.io = null
    this.isInitialized = false
  }
}

// Export singleton instance
export const eventService = new EventService()

// Also export class for typing
export { EventService }
