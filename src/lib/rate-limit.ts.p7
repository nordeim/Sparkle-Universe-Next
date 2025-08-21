// src/lib/rate-limit.ts
import { redis } from '@/lib/redis'
import { logger } from '@/lib/monitoring'

interface RateLimitConfig {
  requests: number
  window: number // in seconds
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: Date
}

export const rateLimitConfigs: Record<string, RateLimitConfig> = {
  api: { requests: 1000, window: 3600 },           // 1000 per hour
  auth: { requests: 5, window: 900 },              // 5 per 15 minutes
  post: { requests: 10, window: 3600 },            // 10 posts per hour
  comment: { requests: 30, window: 3600 },         // 30 comments per hour
  reaction: { requests: 100, window: 3600 },       // 100 reactions per hour
  upload: { requests: 20, window: 3600 },          // 20 uploads per hour
  search: { requests: 60, window: 60 },            // 60 searches per minute
  message: { requests: 50, window: 3600 },         // 50 messages per hour
  follow: { requests: 30, window: 3600 },          // 30 follows per hour
}

class RateLimiter {
  private configs: Record<string, RateLimitConfig>

  constructor(configs: Record<string, RateLimitConfig>) {
    this.configs = configs
  }

  async limit(
    identifier: string,
    type: keyof typeof rateLimitConfigs = 'api'
  ): Promise<RateLimitResult> {
    const config = this.configs[type]
    if (!config) {
      logger.warn(`Unknown rate limit type: ${type}`)
      return {
        success: true,
        limit: 0,
        remaining: 0,
        reset: new Date(),
      }
    }

    const now = Date.now()
    const window = Math.floor(now / (config.window * 1000))
    const key = `ratelimit:${type}:${identifier}:${window}`
    
    try {
      const count = await redis.incr(key)
      
      // Set expiry on first request in window
      if (count === 1) {
        await redis.expire(key, config.window)
      }
      
      const remaining = Math.max(0, config.requests - count)
      const reset = new Date((window + 1) * config.window * 1000)
      
      return {
        success: count <= config.requests,
        limit: config.requests,
        remaining,
        reset,
      }
    } catch (error) {
      logger.error('Rate limit check failed:', error)
      // Fail open on error
      return {
        success: true,
        limit: config.requests,
        remaining: config.requests,
        reset: new Date(now + config.window * 1000),
      }
    }
  }

  async reset(identifier: string, type: keyof typeof rateLimitConfigs = 'api'): Promise<void> {
    const config = this.configs[type]
    if (!config) return

    const now = Date.now()
    const window = Math.floor(now / (config.window * 1000))
    const key = `ratelimit:${type}:${identifier}:${window}`
    
    try {
      await redis.del(key)
    } catch (error) {
      logger.error('Rate limit reset failed:', error)
    }
  }

  async isRateLimited(
    identifier: string, 
    type: keyof typeof rateLimitConfigs = 'api'
  ): Promise<boolean> {
    const result = await this.limit(identifier, type)
    return !result.success
  }

  async getRemainingRequests(
    identifier: string,
    type: keyof typeof rateLimitConfigs = 'api'
  ): Promise<number> {
    const config = this.configs[type]
    if (!config) return 0

    const now = Date.now()
    const window = Math.floor(now / (config.window * 1000))
    const key = `ratelimit:${type}:${identifier}:${window}`
    
    try {
      const count = await redis.get(key)
      const used = count ? parseInt(count, 10) : 0
      return Math.max(0, config.requests - used)
    } catch (error) {
      logger.error('Failed to get remaining requests:', error)
      return config.requests
    }
  }

  async checkMultiple(
    identifier: string,
    types: Array<keyof typeof rateLimitConfigs>
  ): Promise<Record<string, RateLimitResult>> {
    const results: Record<string, RateLimitResult> = {}
    
    await Promise.all(
      types.map(async (type) => {
        results[type] = await this.limit(identifier, type)
      })
    )
    
    return results
  }
}

// Create and export the rate limiter instance
export const ratelimit = new RateLimiter(rateLimitConfigs)

// Middleware helper for Next.js API routes
export async function withRateLimit(
  identifier: string,
  type: keyof typeof rateLimitConfigs = 'api'
): Promise<RateLimitResult> {
  return ratelimit.limit(identifier, type)
}

// Express/Connect middleware style helper
export function rateLimitMiddleware(type: keyof typeof rateLimitConfigs = 'api') {
  return async (req: any, res: any, next: any) => {
    const identifier = req.ip || req.headers['x-forwarded-for'] || 'anonymous'
    const result = await ratelimit.limit(identifier, type)
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', result.limit)
    res.setHeader('X-RateLimit-Remaining', result.remaining)
    res.setHeader('X-RateLimit-Reset', result.reset.toISOString())
    
    if (!result.success) {
      res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again at ${result.reset.toISOString()}`,
      })
      return
    }
    
    next()
  }
}

// Export additional utilities
export { rateLimitConfigs as configs }
export type { RateLimitConfig, RateLimitResult }
