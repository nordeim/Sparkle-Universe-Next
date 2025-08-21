// src/lib/analytics.ts
'use client'

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

// Simple logger for analytics (client-safe)
const analyticsLogger = {
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics Debug] ${message}`, data)
    }
  },
  info: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.info(`[Analytics Info] ${message}`, data)
    }
  },
  error: (message: string, error?: any) => {
    console.error(`[Analytics Error] ${message}`, error)
  },
}

class Analytics {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private queue: AnalyticsEvent[] = []
  private flushInterval: ReturnType<typeof setInterval> | null = null
  private isClient = typeof window !== 'undefined'

  constructor() {
    // Start flush interval only on client side
    if (!this.isDevelopment && this.isClient) {
      this.flushInterval = setInterval(() => this.flush(), 30000) // 30 seconds
    }

    // Clean up on page unload
    if (this.isClient) {
      window.addEventListener('beforeunload', () => {
        this.flush()
      })
    }
  }

  // Track page view
  trackPageView(event: PageViewEvent): void {
    this.track('page_view', {
      path: event.path,
      referrer: event.referrer,
      url: this.isClient ? window.location.href : undefined,
      title: this.isClient ? document.title : undefined,
    }, event.userId)
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
      analyticsLogger.debug('Analytics event', event)
      return
    }

    // Add to queue
    this.queue.push(event)

    // Flush if queue is getting large
    if (this.queue.length >= 50) {
      this.flush()
    }

    // Send to Google Analytics if available
    if (this.isClient && window.gtag) {
      window.gtag('event', eventName as string, properties)
    }

    // Send to PostHog if available
    if (this.isClient && window.posthog) {
      window.posthog.capture(eventName, properties)
    }
  }

  // Identify user
  identify(userId: string, traits?: Record<string, any>): void {
    if (this.isDevelopment) {
      analyticsLogger.debug('Analytics identify', { userId, traits })
      return
    }

    // Only run on client side
    if (!this.isClient) return

    // PostHog identify
    if (window.posthog) {
      window.posthog.identify(userId, traits)
    }

    // Google Analytics user ID
    if (window.gtag && process.env.NEXT_PUBLIC_GA_ID) {
      window.gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
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
      analyticsLogger.error('Failed to flush analytics', error)
      // Re-add events to queue for retry
      this.queue.unshift(...events)
    }
  }

  // Clean up
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
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
  // Using console.info instead of logger to avoid import issues
  if (process.env.NODE_ENV === 'development') {
    console.info('[Server Analytics]', { eventName, properties })
  }
  
  // In production, you would send this to your analytics service
  // For example, you could make a direct API call to your analytics backend
  if (process.env.NODE_ENV === 'production') {
    // TODO: Implement server-side analytics tracking
    // This could be a direct database write or API call
  }
}

// Declare global types
declare global {
  interface Window {
    gtag?: (...args: any[]) => void
    posthog?: any
  }
}

// Export logger if needed elsewhere
export { analyticsLogger }
