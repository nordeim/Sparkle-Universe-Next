// src/lib/rate-limit.ts
import { redis, redisHelpers } from '@/lib/redis'
import { headers } from 'next/headers'
import { NextRequest } from 'next/server'
import { logger } from '@/lib/monitoring'

export interface RateLimitConfig {
  interval: number // Time window in seconds
  uniqueTokenPerInterval: number // Max requests per interval
  prefix?: string // Key prefix for Redis
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: Date
  retryAfter?: number
}

// Default rate limit configurations
export const rateLimitConfigs = {
  api: {
    interval: 60, // 1 minute
    uniqueTokenPerInterval: 100,
    prefix: 'rl:api',
  },
  auth: {
    interval: 900, // 15 minutes
    uniqueTokenPerInterval: 5,
    prefix: 'rl:auth',
  },
  write: {
    interval: 60, // 1 minute
    uniqueTokenPerInterval: 10,
    prefix: 'rl:write',
  },
  upload: {
    interval: 3600, // 1 hour
    uniqueTokenPerInterval: 20,
    prefix: 'rl:upload',
  },
} as const

// Get identifier from request
export function getIdentifier(req?: NextRequest): string {
  if (!req) {
    // Server-side call, try to get from headers
    const headersList = headers()
    const forwarded = headersList.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
    return ip
  }

  // Get IP from request
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  
  // You could also use user ID if authenticated
  // const userId = req.headers.get('x-user-id')
  // if (userId) return `user:${userId}`
  
  return ip
}

// Main rate limiting function
export async function rateLimit(
  config: RateLimitConfig,
  identifier?: string
): Promise<RateLimitResult> {
  const id = identifier || getIdentifier()
  const key = `${config.prefix}:${id}`
  
  try {
    const { allowed, remaining, resetAt } = await redisHelpers.rateLimiting.checkLimit(
      key,
      config.uniqueTokenPerInterval,
      config.interval
    )

    const result: RateLimitResult = {
      success: allowed,
      limit: config.uniqueTokenPerInterval,
      remaining,
      reset: resetAt,
    }

    if (!allowed) {
      result.retryAfter = Math.ceil((resetAt.getTime() - Date.now()) / 1000)
      logger.warn('Rate limit exceeded', { identifier: id, config: config.prefix })
    }

    return result
  } catch (error) {
    // If Redis is down, we'll allow the request but log the error
    logger.error('Rate limit check failed', error)
    
    return {
      success: true,
      limit: config.uniqueTokenPerInterval,
      remaining: config.uniqueTokenPerInterval,
      reset: new Date(Date.now() + config.interval * 1000),
    }
  }
}

// Rate limit middleware helper for API routes
export async function withRateLimit(
  config: RateLimitConfig,
  handler: () => Promise<Response>
): Promise<Response> {
  const result = await rateLimit(config)
  
  const headers = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toISOString(),
  }
  
  if (!result.success) {
    return new Response('Too Many Requests', {
      status: 429,
      headers: {
        ...headers,
        'Retry-After': result.retryAfter!.toString(),
      },
    })
  }
  
  const response = await handler()
  
  // Add rate limit headers to successful responses
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  return response
}

// User-specific rate limiting
export async function rateLimitByUser(
  userId: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  return rateLimit(config, `user:${userId}`)
}

// Action-specific rate limiting
export async function rateLimitByAction(
  userId: string,
  action: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  return rateLimit(config, `${userId}:${action}`)
}

// Sliding window rate limiter for more accurate limiting
export async function slidingWindowRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = Date.now()
  const windowStart = now - windowMs
  const key = `sliding:${identifier}`
  
  // Remove old entries
  await redis.zremrangebyscore(key, '-inf', windowStart)
  
  // Count current window
  const currentCount = await redis.zcard(key)
  
  if (currentCount >= maxRequests) {
    // Get oldest entry to calculate retry after
    const oldestEntry = await redis.zrange(key, 0, 0, 'WITHSCORES')
    const oldestTime = oldestEntry[1] ? parseInt(oldestEntry[1]) : now
    const retryAfter = Math.ceil((oldestTime + windowMs - now) / 1000)
    
    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      reset: new Date(oldestTime + windowMs),
      retryAfter,
    }
  }
  
  // Add current request
  await redis.zadd(key, now, `${now}:${Math.random()}`)
  await redis.expire(key, Math.ceil(windowMs / 1000))
  
  return {
    success: true,
    limit: maxRequests,
    remaining: maxRequests - currentCount - 1,
    reset: new Date(now + windowMs),
  }
}

// Reset rate limit for a specific identifier
export async function resetRateLimit(
  config: RateLimitConfig,
  identifier: string
): Promise<void> {
  const key = `${config.prefix}:${identifier}`
  await redisHelpers.rateLimiting.resetLimit(key)
}
