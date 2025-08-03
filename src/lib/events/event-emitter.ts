// src/lib/events/event-emitter.ts
import { EventEmitter } from 'events'
import { logger } from '@/lib/monitoring'

export interface SystemEvents {
  // User events
  'user:created': { user: any }
  'user:updated': { user: any }
  'user:deleted': { userId: string }
  'user:statusChanged': { user: any; status: string; reason?: string }
  'user:levelUp': { userId: string; oldLevel: number; newLevel: number }
  
  // Auth events
  'auth:login': { userId: string; ipAddress: string }
  'auth:logout': { sessionToken: string }
  'auth:emailVerified': { userId: string }
  'auth:passwordReset': { userId: string }
  'auth:sendVerificationEmail': { userId: string; email: string; code: string }
  'auth:sendPasswordResetEmail': { userId: string; email: string; token: string }
  
  // Notification events
  'notification:created': { notification: any }
  'notification:read': { notification: any }
  'notification:allRead': { userId: string }
  'notification:deleted': { notification: any }
  
  // Post events
  'post:created': { post: any }
  'post:updated': { post: any }
  'post:deleted': { postId: string }
  'post:published': { post: any }
  'post:liked': { postId: string; userId: string }
  'post:viewed': { postId: string; userId: string }
  
  // Comment events
  'comment:created': { comment: any }
  'comment:updated': { comment: any }
  'comment:deleted': { commentId: string }
  
  // Achievement events
  'achievement:unlocked': { userId: string; achievementId: string }
  'achievement:progress': { userId: string; achievementId: string; progress: number }
  
  // System events
  'system:error': { error: Error; context?: any }
  'system:warning': { message: string; context?: any }
  'system:info': { message: string; context?: any }
}

class TypedEventEmitter extends EventEmitter {
  emit<K extends keyof SystemEvents>(
    event: K,
    data: SystemEvents[K]
  ): boolean {
    logger.debug(`Event emitted: ${event}`, data)
    return super.emit(event, data)
  }

  on<K extends keyof SystemEvents>(
    event: K,
    listener: (data: SystemEvents[K]) => void
  ): this {
    return super.on(event, listener)
  }

  once<K extends keyof SystemEvents>(
    event: K,
    listener: (data: SystemEvents[K]) => void
  ): this {
    return super.once(event, listener)
  }

  off<K extends keyof SystemEvents>(
    event: K,
    listener: (data: SystemEvents[K]) => void
  ): this {
    return super.off(event, listener)
  }

  removeAllListeners<K extends keyof SystemEvents>(event?: K): this {
    return super.removeAllListeners(event)
  }
}

// Create singleton instance
export const eventEmitter = new TypedEventEmitter()

// Set max listeners to prevent memory leaks warning
eventEmitter.setMaxListeners(50)

// Error handling
eventEmitter.on('error', (error) => {
  logger.error('EventEmitter error:', error)
})

// System event handlers
eventEmitter.on('system:error', ({ error, context }) => {
  logger.error('System error event:', error, context)
})

eventEmitter.on('system:warning', ({ message, context }) => {
  logger.warn('System warning event:', message, context)
})

eventEmitter.on('system:info', ({ message, context }) => {
  logger.info('System info event:', message, context)
})

// Export event types for use in other files
export type { SystemEvents }
