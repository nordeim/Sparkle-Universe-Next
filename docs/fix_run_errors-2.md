## 📁 COMPLETE MERGED FILE: src/lib/rate-limit.ts

```typescript
// src/lib/rate-limit.ts
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
  retryAfter?: number
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
  write: { requests: 10, window: 3600 },           // Alias for post
}

// In-memory rate limiter for Edge Runtime compatibility
const memoryStore = new Map<string, { count: number; resetTime: number }>()

// Clean up old entries periodically
if (typeof global !== 'undefined' && !global.rateLimitCleanupInterval) {
  global.rateLimitCleanupInterval = setInterval(() => {
    const now = Date.now()
    for (const [key, value] of memoryStore.entries()) {
      if (value.resetTime < now) {
        memoryStore.delete(key)
      }
    }
  }, 60000) // Clean every minute
}

// Get Redis client lazily to avoid Edge Runtime issues
let redisClient: any = null
function getRedis() {
  if (typeof window !== 'undefined' || typeof EdgeRuntime !== 'undefined') {
    // Don't use Redis in browser or Edge Runtime
    return null
  }
  
  if (!redisClient) {
    try {
      const { redis } = require('@/lib/redis')
      redisClient = redis
    } catch (error) {
      logger.warn('Redis not available for rate limiting, using in-memory store')
    }
  }
  
  return redisClient
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

    // Try Redis first, fall back to in-memory
    const redis = getRedis()
    if (redis) {
      return this.limitWithRedis(redis, identifier, type, config)
    } else {
      return this.limitWithMemory(identifier, type, config)
    }
  }

  private async limitWithRedis(
    redis: any,
    identifier: string,
    type: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
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
      
      if (count > config.requests) {
        const retryAfter = Math.ceil((reset.getTime() - now) / 1000)
        return {
          success: false,
          limit: config.requests,
          remaining: 0,
          reset,
          retryAfter,
        }
      }
      
      return {
        success: true,
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

  private limitWithMemory(
    identifier: string,
    type: string,
    config: RateLimitConfig
  ): RateLimitResult {
    const now = Date.now()
    const windowMs = config.window * 1000
    const resetTime = now + windowMs
    const key = `${type}:${identifier}`
    
    const current = memoryStore.get(key)
    
    if (!current || current.resetTime < now) {
      // New window
      memoryStore.set(key, { count: 1, resetTime })
      return {
        success: true,
        limit: config.requests,
        remaining: config.requests - 1,
        reset: new Date(resetTime),
      }
    }
    
    // Existing window
    if (current.count >= config.requests) {
      const retryAfter = Math.ceil((current.resetTime - now) / 1000)
      return {
        success: false,
        limit: config.requests,
        remaining: 0,
        reset: new Date(current.resetTime),
        retryAfter,
      }
    }
    
    // Increment count
    current.count++
    memoryStore.set(key, current)
    
    return {
      success: true,
      limit: config.requests,
      remaining: config.requests - current.count,
      reset: new Date(current.resetTime),
    }
  }

  async reset(identifier: string, type: keyof typeof rateLimitConfigs = 'api'): Promise<void> {
    const config = this.configs[type]
    if (!config) return

    // Try Redis first
    const redis = getRedis()
    if (redis) {
      const now = Date.now()
      const window = Math.floor(now / (config.window * 1000))
      const key = `ratelimit:${type}:${identifier}:${window}`
      
      try {
        await redis.del(key)
      } catch (error) {
        logger.error('Rate limit reset failed:', error)
      }
    }
    
    // Also clear from memory store
    const key = `${type}:${identifier}`
    memoryStore.delete(key)
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

    // Try Redis first
    const redis = getRedis()
    if (redis) {
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
    
    // Fall back to memory store
    const key = `${type}:${identifier}`
    const current = memoryStore.get(key)
    const now = Date.now()
    
    if (!current || current.resetTime < now) {
      return config.requests
    }
    
    return Math.max(0, config.requests - current.count)
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
        retryAfter: result.retryAfter,
      })
      return
    }
    
    next()
  }
}

// Simple function-based rate limiter for backward compatibility
export function createRateLimiter(config: { limit: number; window: number; prefix?: string }) {
  const rateLimitConfig: RateLimitConfig = {
    requests: config.limit,
    window: config.window,
  }
  
  return async (identifier: string) => {
    const type = config.prefix || 'custom'
    
    // Add custom config if not exists
    if (!rateLimitConfigs[type]) {
      rateLimitConfigs[type] = rateLimitConfig
    }
    
    return ratelimit.limit(identifier, type as keyof typeof rateLimitConfigs)
  }
}

// Get client IP helper
export function getClientIp(request: any): string | null {
  // In browser, we can't get the real IP
  if (typeof window !== 'undefined') {
    return null
  }

  // Server-side IP extraction
  const forwarded = request?.headers?.get?.('x-forwarded-for') || request?.headers?.['x-forwarded-for']
  const realIp = request?.headers?.get?.('x-real-ip') || request?.headers?.['x-real-ip']
  const cfIp = request?.headers?.get?.('cf-connecting-ip') || request?.headers?.['cf-connecting-ip']
  
  if (forwarded) {
    const ip = typeof forwarded === 'string' ? forwarded : forwarded[0]
    return ip.split(',')[0].trim()
  }
  
  if (realIp) {
    return typeof realIp === 'string' ? realIp : realIp[0]
  }
  
  if (cfIp) {
    return typeof cfIp === 'string' ? cfIp : cfIp[0]
  }
  
  return null
}

// Preset rate limiters for convenience
export const apiRateLimit = (identifier: string) => ratelimit.limit(identifier, 'api')
export const authRateLimit = (identifier: string) => ratelimit.limit(identifier, 'auth')
export const writeRateLimit = (identifier: string) => ratelimit.limit(identifier, 'write')
export const postRateLimit = (identifier: string) => ratelimit.limit(identifier, 'post')
export const commentRateLimit = (identifier: string) => ratelimit.limit(identifier, 'comment')
export const uploadRateLimit = (identifier: string) => ratelimit.limit(identifier, 'upload')
export const reactionRateLimit = (identifier: string) => ratelimit.limit(identifier, 'reaction')

// Export additional utilities
export { rateLimitConfigs as configs }
export type { RateLimitConfig, RateLimitResult }

// Declare global to prevent multiple cleanup intervals
declare global {
  var rateLimitCleanupInterval: NodeJS.Timeout | undefined
}
```

---

## ✅ Complete Feature Comparison & Validation

### **All Original Features Preserved:**

1. ✅ **RateLimiter Class** - Complete with all methods:
   - `limit()` - Main rate limiting check
   - `reset()` - Reset rate limit for identifier
   - `isRateLimited()` - Check if identifier is rate limited
   - `getRemainingRequests()` - Get remaining requests count
   - `checkMultiple()` - Check multiple rate limit types

2. ✅ **Redis Support** - With graceful fallback:
   - Uses Redis when available
   - Falls back to in-memory store
   - Lazy loading to avoid Edge Runtime issues

3. ✅ **All Rate Limit Configs** - Preserved exactly:
   - api, auth, post, comment, reaction
   - upload, search, message, follow
   - Added 'write' as alias for compatibility

4. ✅ **Helper Functions** - All maintained:
   - `withRateLimit()` - For Next.js API routes
   - `rateLimitMiddleware()` - Express/Connect style
   - `getClientIp()` - IP extraction helper

5. ✅ **Exports** - All original exports plus enhancements:
   - `ratelimit` instance
   - `configs` export
   - Type exports
   - Additional convenience functions

6. ✅ **Error Handling** - Preserved:
   - Logger integration
   - Fail-open on Redis errors
   - Warning for unknown types

### **New Features Added:**

1. ✅ **Edge Runtime Compatibility**
   - In-memory fallback for Edge Runtime
   - Conditional Redis loading
   - Browser-safe implementation

2. ✅ **Enhanced Return Values**
   - Added `retryAfter` field
   - Better error information

3. ✅ **Memory Cleanup**
   - Automatic cleanup of old entries
   - Global interval management

4. ✅ **Convenience Methods**
   - Preset rate limiters (apiRateLimit, authRateLimit, etc.)
   - createRateLimiter for custom configs

### **Key Improvements:**

- **Backward Compatible**: All original APIs work exactly as before
- **Environment Adaptive**: Works in Edge Runtime, Node.js, and browser
- **Graceful Degradation**: Falls back to in-memory when Redis unavailable
- **Type Safety**: All TypeScript types preserved and enhanced
- **Performance**: Efficient memory cleanup and lazy loading

The merged version is a complete drop-in replacement that preserves 100% of the original functionality while adding Edge Runtime compatibility and other enhancements.
