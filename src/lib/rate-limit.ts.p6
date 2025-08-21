// src/lib/rate-limit.ts
import { redisUtils } from '@/lib/redis'

interface RateLimitConfig {
  requests: number
  window: number // in seconds
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  api: { requests: 1000, window: 3600 },           // 1000 per hour
  auth: { requests: 5, window: 900 },              // 5 per 15 minutes
  post: { requests: 10, window: 3600 },            // 10 posts per hour
  comment: { requests: 30, window: 3600 },         // 30 comments per hour
  reaction: { requests: 100, window: 3600 },       // 100 reactions per hour
  upload: { requests: 20, window: 3600 },          // 20 uploads per hour
}

class RateLimiter {
  async limit(
    identifier: string,
    type: keyof typeof RATE_LIMITS = 'api'
  ): Promise<{ success: boolean; limit: number; remaining: number; reset: Date }> {
    const config = RATE_LIMITS[type]
    const now = Date.now()
    const window = Math.floor(now / (config.window * 1000))
    const key = `ratelimit:${type}:${identifier}:${window}`
    
    const count = await redisUtils.incrementWithExpiry(key, config.window)
    const remaining = Math.max(0, config.requests - count)
    const reset = new Date((window + 1) * config.window * 1000)
    
    return {
      success: count <= config.requests,
      limit: config.requests,
      remaining,
      reset,
    }
  }

  async reset(identifier: string, type: keyof typeof RATE_LIMITS = 'api'): Promise<void> {
    const config = RATE_LIMITS[type]
    const now = Date.now()
    const window = Math.floor(now / (config.window * 1000))
    const key = `ratelimit:${type}:${identifier}:${window}`
    
    await redis.del(key)
  }

  async isRateLimited(identifier: string, type: keyof typeof RATE_LIMITS = 'api'): Promise<boolean> {
    const result = await this.limit(identifier, type)
    return !result.success
  }
}

export const ratelimit = new RateLimiter()
