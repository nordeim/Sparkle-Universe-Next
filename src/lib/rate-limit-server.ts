// src/lib/rate-limit-server.ts
import { Redis } from 'ioredis'
import { TRPCError } from '@trpc/server'

// Rate limit configuration
export interface RateLimitConfig {
  limit: number
  window: number // in seconds
  prefix?: string
}

// Rate limit configs for different operations
export const rateLimitConfigs = {
  api: { limit: 100, window: 60, prefix: 'api' },
  auth: { limit: 5, window: 900, prefix: 'auth' }, // 5 attempts per 15 minutes
  write: { limit: 10, window: 3600, prefix: 'write' }, // 10 writes per hour
  comment: { limit: 30, window: 3600, prefix: 'comment' }, // 30 comments per hour
  upload: { limit: 20, window: 3600, prefix: 'upload' }, // 20 uploads per hour
  reaction: { limit: 100, window: 3600, prefix: 'reaction' }, // 100 reactions per hour
}

// Create Redis client for rate limiting (only for server-side)
let redis: Redis | null = null

function getRedisClient(): Redis | null {
  if (typeof window !== 'undefined') {
    // Don't use Redis on client side
    return null
  }

  if (!redis && process.env.REDIS_URL) {
    try {
      redis = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) return null
          return Math.min(times * 200, 2000)
        },
        enableOfflineQueue: false,
        lazyConnect: true,
      })

      redis.on('error', (err) => {
        console.error('Redis rate limit error:', err)
      })

      // Connect asynchronously
      redis.connect().catch((err) => {
        console.error('Failed to connect to Redis for rate limiting:', err)
        redis = null
      })
    } catch (error) {
      console.error('Failed to create Redis client for rate limiting:', error)
      redis = null
    }
  }

  return redis
}

// Server-side rate limiting with Redis
export async function serverRateLimit(
  config: RateLimitConfig,
  identifier: string
): Promise<{ success: boolean; remaining: number; reset: Date; retryAfter?: number }> {
  const redisClient = getRedisClient()
  
  // If Redis is not available, allow the request (fail open)
  if (!redisClient) {
    return {
      success: true,
      remaining: config.limit,
      reset: new Date(Date.now() + config.window * 1000),
    }
  }

  const key = `rate_limit:${config.prefix}:${identifier}`
  const now = Date.now()
  const window = config.window * 1000 // Convert to milliseconds
  const reset = now + window

  try {
    // Use Redis pipeline for atomic operations
    const pipeline = redisClient.pipeline()
    
    // Remove old entries
    pipeline.zremrangebyscore(key, 0, now - window)
    
    // Count current requests in window
    pipeline.zcard(key)
    
    // Add current request
    pipeline.zadd(key, now, `${now}-${Math.random()}`)
    
    // Set expiry
    pipeline.expire(key, config.window)
    
    // Execute pipeline
    const results = await pipeline.exec()
    
    if (!results) {
      // If pipeline failed, allow the request
      return {
        success: true,
        remaining: config.limit,
        reset: new Date(reset),
      }
    }

    const count = (results[1]?.[1] as number) || 0
    const remaining = Math.max(0, config.limit - count - 1)
    
    if (count >= config.limit) {
      // Get the oldest request timestamp to calculate retry after
      const oldestRequest = await redisClient.zrange(key, 0, 0, 'WITHSCORES')
      const oldestTimestamp = oldestRequest[1] ? parseInt(oldestRequest[1]) : now
      const retryAfter = Math.ceil((oldestTimestamp + window - now) / 1000)
      
      return {
        success: false,
        remaining: 0,
        reset: new Date(oldestTimestamp + window),
        retryAfter,
      }
    }

    return {
      success: true,
      remaining,
      reset: new Date(reset),
    }
  } catch (error) {
    console.error('Rate limit check error:', error)
    // On error, allow the request (fail open)
    return {
      success: true,
      remaining: config.limit,
      reset: new Date(reset),
    }
  }
}

// Helper function to check rate limit in tRPC procedures
export async function checkRateLimit(
  config: RateLimitConfig,
  identifier: string
): Promise<void> {
  const result = await serverRateLimit(config, identifier)
  
  if (!result.success) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `Rate limit exceeded. Please try again in ${result.retryAfter} seconds.`,
    })
  }
}

// Helper to get identifier from context
export function getRateLimitIdentifier(ctx: any): string {
  // If user is authenticated, use user ID
  if (ctx.session?.user?.id) {
    return `user:${ctx.session.user.id}`
  }
  
  // Otherwise, try to get IP from headers
  const forwarded = ctx.req?.headers?.['x-forwarded-for']
  const realIp = ctx.req?.headers?.['x-real-ip']
  
  if (typeof forwarded === 'string') {
    return `ip:${forwarded.split(',')[0].trim()}`
  }
  
  if (typeof realIp === 'string') {
    return `ip:${realIp}`
  }
  
  // Fallback to a generic identifier
  return 'anonymous'
}
