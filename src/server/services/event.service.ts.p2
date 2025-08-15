// src/server/services/event.service.ts
import { EventEmitter } from 'events'
import { redis } from '@/lib/redis'

export interface DomainEvent {
  name: string
  payload: any
  timestamp: Date
  userId?: string
  metadata?: Record<string, any>
}

export class EventService extends EventEmitter {
  private static instance: EventService
  private pubClient = redis.duplicate()
  private subClient = redis.duplicate()

  private constructor() {
    super()
    this.setMaxListeners(100) // Increase max listeners
    this.setupRedisSubscriptions()
  }

  static getInstance(): EventService {
    if (!EventService.instance) {
      EventService.instance = new EventService()
    }
    return EventService.instance
  }

  private setupRedisSubscriptions() {
    // Subscribe to Redis events for distributed systems
    this.subClient.on('message', (channel: string, message: string) => {
      try {
        const event = JSON.parse(message) as DomainEvent
        super.emit(event.name, event)
      } catch (error) {
        console.error('Failed to parse Redis event:', error)
      }
    })

    // Subscribe to all domain events
    this.subClient.subscribe('domain:events').catch(console.error)
  }

  async emit(eventName: string, payload: any): Promise<void> {
    const event: DomainEvent = {
      name: eventName,
      payload,
      timestamp: new Date(),
      userId: payload.userId || payload.actorId,
      metadata: {
        source: process.env.NODE_ENV,
        version: '1.0.0',
      },
    }

    // Emit locally
    super.emit(eventName, event)

    // Publish to Redis for distributed systems
    await this.pubClient.publish('domain:events', JSON.stringify(event))

    // Log the event
    if (process.env.NODE_ENV === 'development') {
      console.log(`Event emitted: ${eventName}`, {
        userId: event.userId,
        timestamp: event.timestamp,
      })
    }

    // Store critical events in database for event sourcing
    if (this.isCriticalEvent(eventName)) {
      await this.storeEvent(event)
    }
  }

  onEvent(eventName: string, handler: (event: DomainEvent) => void): void {
    this.on(eventName, handler)
  }

  offEvent(eventName: string, handler: (event: DomainEvent) => void): void {
    this.off(eventName, handler)
  }

  private isCriticalEvent(eventName: string): boolean {
    const criticalEvents = [
      'user.deleted',
      'post.deleted',
      'payment.completed',
      'subscription.changed',
      'moderation.action',
    ]
    return criticalEvents.some(e => eventName.startsWith(e))
  }

  private async storeEvent(event: DomainEvent): Promise<void> {
    // Store in Redis with TTL for event replay capability
    const key = `event:${event.name}:${Date.now()}`
    await this.pubClient.setex(key, 86400 * 7, JSON.stringify(event)) // 7 days TTL
  }

  // Utility method to replay events (for debugging or recovery)
  async replayEvents(
    eventName: string,
    from: Date,
    to: Date = new Date()
  ): Promise<DomainEvent[]> {
    const pattern = `event:${eventName}:*`
    const keys = await this.pubClient.keys(pattern)
    const events: DomainEvent[] = []

    for (const key of keys) {
      const data = await this.pubClient.get(key)
      if (data) {
        const event = JSON.parse(data) as DomainEvent
        const eventTime = new Date(event.timestamp)
        if (eventTime >= from && eventTime <= to) {
          events.push(event)
        }
      }
    }

    return events.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
  }

  // Clean up connections
  async disconnect(): Promise<void> {
    await Promise.all([
      this.pubClient.quit(),
      this.subClient.quit(),
    ])
  }
}

// Export singleton instance
export const eventService = EventService.getInstance()
