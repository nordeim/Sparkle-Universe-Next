// src/lib/analytics.ts
import { logger } from '@/lib/monitoring'

// Analytics event types
export interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
  userId?: string
  timestamp?: Date
}

// Page view event
export interface PageViewEvent {
  path: string
  referrer?: string
  userId?: string
}

// Custom events
export type CustomEventName =
  | 'user_signup'
  | 'user_login'
  | 'post_created'
  | 'post_liked'
  | 'post_shared'
  | 'comment_created'
  | 'profile_updated'
  | 'achievement_unlocked'
  | 'level_up'
  | 'purchase_completed'
  | 'search_performed'
  | 'video_watched'
  | 'feature_used'

class Analytics {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private queue: AnalyticsEvent[] = []
  private flushInterval: NodeJS.Timeout | null = null

  constructor() {
    // Start flush interval
    if (!this.isDevelopment) {
      this.flushInterval = setInterval(() => this.flush(), 30000) // 30 seconds
    }
  }

  // Track page view
  trackPageView(event: PageViewEvent): void {
    this.track('page_view', {
      path: event.path,
      referrer: event.referrer,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      title: typeof document !== 'undefined' ? document.title : undefined,
    })
  }

  // Track custom event
  track(
    eventName: CustomEventName | string,
    properties?: Record<string, any>,
    userId?: string
  ): void {
    const event: AnalyticsEvent = {
      name: eventName,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
      },
      userId,
      timestamp: new Date(),
    }

    if (this.isDevelopment) {
      logger.debug('Analytics event', event)
      return
    }

    // Add to queue
    this.queue.push(event)

    // Flush if queue is getting large
    if (this.queue.length >= 50) {
      this.flush()
    }

    // Send to Google Analytics if available
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, properties)
    }

    // Send to PostHog if available
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.capture(eventName, properties)
    }
  }

  // Identify user
  identify(userId: string, traits?: Record<string, any>): void {
    if (this.isDevelopment) {
      logger.debug('Analytics identify', { userId, traits })
      return
    }

    // PostHog identify
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.identify(userId, traits)
    }

    // Google Analytics user ID
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', process.env.NEXT_PUBLIC_GA_ID!, {
        user_id: userId,
      })
    }
  }

  // Track timing
  trackTiming(
    category: string,
    variable: string,
    value: number,
    label?: string
  ): void {
    this.track('timing_complete', {
      timing_category: category,
      timing_variable: variable,
      timing_value: value,
      timing_label: label,
    })
  }

  // Track error
  trackError(error: Error, fatal: boolean = false): void {
    this.track('exception', {
      description: error.message,
      stack: error.stack,
      fatal,
    })
  }

  // Flush events to analytics service
  private async flush(): Promise<void> {
    if (this.queue.length === 0) return

    const events = [...this.queue]
    this.queue = []

    try {
      // Send to your analytics endpoint
      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events }),
      })

      if (!response.ok) {
        throw new Error(`Analytics flush failed: ${response.status}`)
      }
    } catch (error) {
      logger.error('Failed to flush analytics', error)
      // Re-add events to queue for retry
      this.queue.unshift(...events)
    }
  }

  // Clean up
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
    this.flush()
  }
}

// Export singleton instance
export const analytics = new Analytics()

// Helper functions
export function trackPageView(path: string, referrer?: string): void {
  analytics.trackPageView({ path, referrer })
}

export function trackEvent(
  eventName: CustomEventName | string,
  properties?: Record<string, any>
): void {
  analytics.track(eventName, properties)
}

export function identifyUser(
  userId: string,
  traits?: Record<string, any>
): void {
  analytics.identify(userId, traits)
}

// React hook for analytics
export function useAnalytics() {
  return {
    track: trackEvent,
    trackPageView,
    identify: identifyUser,
    trackTiming: analytics.trackTiming.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
  }
}

// Next.js specific helpers
export function trackServerEvent(
  eventName: string,
  properties?: Record<string, any>
): void {
  // Server-side tracking would go directly to analytics service
  logger.info('Server analytics event', { eventName, properties })
}

// Declare global types
declare global {
  interface Window {
    gtag?: (...args: any[]) => void
    posthog?: any
  }
}
