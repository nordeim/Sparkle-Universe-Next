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
  'auth:2faEnabled': { userId: string }
  'auth:2faDisabled': { userId: string }
  'auth:passwordResetRequested': { userId: string; email: string }
  
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
  
  // Email events
  'email:sent': { to: string; subject: string; template?: string }
  'email:failed': { to: string; error: string }
  
  // File events
  'file:uploaded': { fileId: string; userId: string; size: number }
  'upload:progress': { fileId: string; progress: number }
  
  // System events
  'system:error': { error: Error; context?: any }
  'system:warning': { message: string; context?: any }
  'system:info': { message: string; context?: any }
  
  // Collaboration events
  'collab:cursor': { spaceId: string; userId: string; cursor: any }
  'collab:change': { spaceId: string; userId: string; changes: any }
  
  // Error event (required by EventEmitter)
  'error': Error
}

class TypedEventEmitter extends EventEmitter {
  /**
   * Emit an event with type-safe data
   */
  override emit<K extends keyof SystemEvents>(
    event: K,
    data: SystemEvents[K]
  ): boolean {
    // Special handling for error event
    if (event === 'error') {
      logger.error('EventEmitter error:', data)
      return super.emit(event, data)
    }
    
    logger.debug(`Event emitted: ${String(event)}`, data)
    return super.emit(event as string, data)
  }

  /**
   * Listen to an event with type-safe handler
   */
  override on<K extends keyof SystemEvents>(
    event: K,
    listener: (data: SystemEvents[K]) => void
  ): this {
    return super.on(event as string, listener as any)
  }

  /**
   * Listen to an event once with type-safe handler
   */
  override once<K extends keyof SystemEvents>(
    event: K,
    listener: (data: SystemEvents[K]) => void
  ): this {
    return super.once(event as string, listener as any)
  }

  /**
   * Remove a listener with type-safe handler
   */
  override off<K extends keyof SystemEvents>(
    event: K,
    listener: (data: SystemEvents[K]) => void
  ): this {
    return super.off(event as string, listener as any)
  }

  /**
   * Remove all listeners for an event
   */
  override removeAllListeners<K extends keyof SystemEvents>(event?: K): this {
    if (event) {
      return super.removeAllListeners(event as string)
    }
    return super.removeAllListeners()
  }

  /**
   * Add a listener with priority (custom method, not override)
   */
  onPriority<K extends keyof SystemEvents>(
    event: K,
    priority: number,
    listener: (data: SystemEvents[K]) => void
  ): this {
    // Store listener with priority metadata
    const priorityListener = Object.assign(listener, { priority })
    
    // Get existing listeners
    const listeners = this.listeners(event as string) as any[]
    
    // Remove all current listeners
    this.removeAllListeners(event)
    
    // Add new listener with priority
    listeners.push(priorityListener)
    
    // Sort by priority (higher priority first)
    listeners.sort((a, b) => (b.priority || 0) - (a.priority || 0))
    
    // Re-add all listeners in priority order
    listeners.forEach(l => this.on(event, l))
    
    return this
  }

  /**
   * Emit an event and wait for all async handlers
   */
  async emitAsync<K extends keyof SystemEvents>(
    event: K,
    data: SystemEvents[K]
  ): Promise<boolean> {
    const listeners = this.listeners(event as string)
    
    if (listeners.length === 0) {
      return false
    }
    
    logger.debug(`Event emitted (async): ${String(event)}`, data)
    
    try {
      await Promise.all(
        listeners.map(listener => 
          Promise.resolve(listener(data)).catch(error => {
            logger.error(`Error in async event handler for ${String(event)}:`, error)
          })
        )
      )
      return true
    } catch (error) {
      logger.error(`Error emitting async event ${String(event)}:`, error)
      return false
    }
  }
}

// Create singleton instance
export const eventEmitter = new TypedEventEmitter()

// Set max listeners to prevent memory leaks warning
eventEmitter.setMaxListeners(50)

// Error handling - using proper error event
eventEmitter.on('error', (error: Error) => {
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

// User event monitoring
eventEmitter.on('user:created', ({ user }) => {
  logger.info('New user created:', { userId: user.id, username: user.username })
})

eventEmitter.on('user:levelUp', ({ userId, oldLevel, newLevel }) => {
  logger.info('User leveled up:', { userId, oldLevel, newLevel })
})

// Achievement monitoring
eventEmitter.on('achievement:unlocked', ({ userId, achievementId }) => {
  logger.info('Achievement unlocked:', { userId, achievementId })
})

// Export a typed version for better autocomplete
export const systemEvents = eventEmitter as TypedEventEmitter

// Export event types for use in other files
export type { SystemEvents }
export type SystemEventKey = keyof SystemEvents
export type SystemEventData<K extends SystemEventKey> = SystemEvents[K]

// Helper function to create typed event handlers
export function createEventHandler<K extends SystemEventKey>(
  event: K,
  handler: (data: SystemEvents[K]) => void | Promise<void>
) {
  return { event, handler }
}

// Batch event emitter for performance
export class BatchEventEmitter {
  private queue: Array<{ event: SystemEventKey; data: any }> = []
  private timer: NodeJS.Timeout | null = null
  private batchSize = 100
  private batchDelay = 100 // ms

  constructor(
    private emitter: TypedEventEmitter = eventEmitter,
    options?: { batchSize?: number; batchDelay?: number }
  ) {
    if (options?.batchSize) this.batchSize = options.batchSize
    if (options?.batchDelay) this.batchDelay = options.batchDelay
  }

  emit<K extends SystemEventKey>(event: K, data: SystemEvents[K]) {
    this.queue.push({ event, data })
    
    if (this.queue.length >= this.batchSize) {
      this.flush()
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.batchDelay)
    }
  }

  flush() {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    
    const events = [...this.queue]
    this.queue = []
    
    events.forEach(({ event, data }) => {
      this.emitter.emit(event as any, data)
    })
  }

  destroy() {
    if (this.timer) {
      clearTimeout(this.timer)
    }
    this.flush()
  }
}
