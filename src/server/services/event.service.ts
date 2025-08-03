// src/server/services/event.service.ts
import { EventEmitter } from 'events'

export interface DomainEvent {
  name: string
  payload: any
  timestamp: Date
  userId?: string
}

export class EventService extends EventEmitter {
  private static instance: EventService

  private constructor() {
    super()
    this.setMaxListeners(100) // Increase max listeners
  }

  static getInstance(): EventService {
    if (!EventService.instance) {
      EventService.instance = new EventService()
    }
    return EventService.instance
  }

  async emit(eventName: string, payload: any): Promise<void> {
    const event: DomainEvent = {
      name: eventName,
      payload,
      timestamp: new Date(),
      userId: payload.userId || payload.actorId,
    }

    // Emit the event
    super.emit(eventName, event)

    // Log the event
    console.log(`Event emitted: ${eventName}`, event)

    // TODO: Store event in database for event sourcing
    // TODO: Send to message queue for async processing
  }

  onEvent(eventName: string, handler: (event: DomainEvent) => void): void {
    this.on(eventName, handler)
  }

  offEvent(eventName: string, handler: (event: DomainEvent) => void): void {
    this.off(eventName, handler)
  }
}

// Export singleton instance
export const eventService = EventService.getInstance()
