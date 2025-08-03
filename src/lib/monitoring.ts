// src/lib/monitoring.ts
import { headers } from 'next/headers'
import { eventEmitter } from '@/lib/events/event-emitter'

// Log levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

// Log context interface
interface LogContext {
  [key: string]: any
}

// Performance timing interface
interface PerformanceTiming {
  name: string
  startTime: number
  endTime?: number
  duration?: number
  metadata?: any
}

// Logger class
class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private logLevel: LogLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR]
    const currentLevelIndex = levels.indexOf(this.logLevel)
    const messageLevelIndex = levels.indexOf(level)
    return messageLevelIndex >= currentLevelIndex
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` ${JSON.stringify(context)}` : ''
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) return

    const formattedMessage = this.formatMessage(level, message, context)

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage)
        break
      case LogLevel.INFO:
        console.log(formattedMessage)
        break
      case LogLevel.WARN:
        console.warn(formattedMessage)
        break
      case LogLevel.ERROR:
        console.error(formattedMessage)
        // Send error to monitoring service
        this.sendToMonitoring('error', message, context)
        break
    }
  }

  private sendToMonitoring(type: string, message: string, context?: LogContext): void {
    // In production, send to monitoring service (e.g., Sentry, DataDog)
    if (!this.isDevelopment) {
      // Implementation would go here
      // Example: Sentry.captureException(new Error(message), { extra: context })
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context)
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context)
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context)
  }

  error(message: string, error?: any, context?: LogContext): void {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
    }
    this.log(LogLevel.ERROR, message, errorContext)
  }
}

// Performance monitoring
class PerformanceMonitor {
  private timings = new Map<string, PerformanceTiming>()

  start(name: string, metadata?: any): void {
    this.timings.set(name, {
      name,
      startTime: performance.now(),
      metadata,
    })
  }

  end(name: string): PerformanceTiming | null {
    const timing = this.timings.get(name)
    if (!timing) {
      logger.warn(`Performance timing '${name}' not found`)
      return null
    }

    timing.endTime = performance.now()
    timing.duration = timing.endTime - timing.startTime

    this.timings.delete(name)

    // Log slow operations
    if (timing.duration > 1000) {
      logger.warn(`Slow operation detected: ${name}`, {
        duration: `${timing.duration.toFixed(2)}ms`,
        metadata: timing.metadata,
      })
    }

    return timing
  }

  async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.start(name)
    try {
      const result = await fn()
      const timing = this.end(name)
      if (timing) {
        logger.debug(`Performance: ${name}`, {
          duration: `${timing.duration?.toFixed(2)}ms`,
        })
      }
      return result
    } catch (error) {
      this.end(name)
      throw error
    }
  }
}

// Request tracking
export async function trackRequest(request: Request) {
  try {
    const url = new URL(request.url)
    const method = request.method
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const referer = request.headers.get('referer') || 'direct'

    logger.info('Request', {
      method,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      userAgent,
      referer,
    })
  } catch (error) {
    logger.error('Failed to track request', error)
  }
}

// Error tracking
export function trackError(error: Error, context?: any) {
  logger.error('Application error', error, context)
  
  // Emit error event
  eventEmitter.emit('system:error', { error, context })
}

// Custom metrics
class Metrics {
  private counters = new Map<string, number>()
  private gauges = new Map<string, number>()
  private histograms = new Map<string, number[]>()

  increment(name: string, value: number = 1): void {
    const current = this.counters.get(name) || 0
    this.counters.set(name, current + value)
  }

  decrement(name: string, value: number = 1): void {
    this.increment(name, -value)
  }

  gauge(name: string, value: number): void {
    this.gauges.set(name, value)
  }

  histogram(name: string, value: number): void {
    const values = this.histograms.get(name) || []
    values.push(value)
    this.histograms.set(name, values)
  }

  getMetrics() {
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: Object.fromEntries(
        Array.from(this.histograms.entries()).map(([key, values]) => [
          key,
          {
            count: values.length,
            min: Math.min(...values),
            max: Math.max(...values),
            avg: values.reduce((a, b) => a + b, 0) / values.length,
          },
        ])
      ),
    }
  }

  reset(): void {
    this.counters.clear()
    this.gauges.clear()
    this.histograms.clear()
  }
}

// Web Vitals tracking
export function trackWebVitals(metric: {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
}) {
  logger.info('Web Vital', {
    name: metric.name,
    value: metric.value.toFixed(2),
    rating: metric.rating,
  })

  // Send to analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.value),
      metric_rating: metric.rating,
      non_interaction: true,
    })
  }
}

// Export instances
export const logger = new Logger()
export const performance = new PerformanceMonitor()
export const metrics = new Metrics()

// Re-export for convenience
export { trackError as captureException }

// Global error handlers
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    trackError(new Error(event.reason), {
      type: 'unhandledRejection',
    })
  })

  window.addEventListener('error', (event) => {
    trackError(event.error, {
      type: 'windowError',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    })
  })
}
