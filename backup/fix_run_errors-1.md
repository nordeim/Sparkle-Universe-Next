## 🔍 Runtime Error Analysis

The errors indicate two critical issues:

1. **Import mismatch**: `rateLimit` vs `ratelimit` export naming
2. **Edge Runtime incompatibility**: ioredis cannot run in Next.js middleware (Edge Runtime)

The Edge Runtime doesn't support Node.js modules like ioredis. We need to implement a different rate limiting strategy for middleware.

---

## 📁 UPDATED FILE: src/middleware.ts

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Middleware configuration
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api/auth (auth routes should not be rate limited in middleware)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}

// Simple in-memory rate limiter for Edge Runtime
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetTime < now) {
      rateLimitMap.delete(key)
    }
  }
}, 60000) // Clean every minute

function getClientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for')
  const xri = request.headers.get('x-real-ip')
  const cfIp = request.headers.get('cf-connecting-ip')
  
  if (xff) {
    return xff.split(',')[0].trim()
  }
  if (xri) {
    return xri
  }
  if (cfIp) {
    return cfIp
  }
  
  return 'anonymous'
}

// Simple rate limiter for Edge Runtime
function simpleRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number; reset: Date } {
  const now = Date.now()
  const resetTime = now + windowMs
  
  const current = rateLimitMap.get(identifier)
  
  if (!current || current.resetTime < now) {
    // New window
    rateLimitMap.set(identifier, { count: 1, resetTime })
    return {
      success: true,
      remaining: limit - 1,
      reset: new Date(resetTime),
    }
  }
  
  // Existing window
  if (current.count >= limit) {
    return {
      success: false,
      remaining: 0,
      reset: new Date(current.resetTime),
    }
  }
  
  // Increment count
  current.count++
  rateLimitMap.set(identifier, current)
  
  return {
    success: true,
    remaining: limit - current.count,
    reset: new Date(current.resetTime),
  }
}

export async function middleware(request: NextRequest) {
  const start = Date.now()
  const pathname = request.nextUrl.pathname

  try {
    // Security headers
    const headers = new Headers(request.headers)
    headers.set('X-Frame-Options', 'DENY')
    headers.set('X-Content-Type-Options', 'nosniff')
    headers.set('X-XSS-Protection', '1; mode=block')
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    headers.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), interest-cohort=()'
    )
    
    // Content Security Policy
    if (!pathname.startsWith('/api')) {
      headers.set(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.youtube.com https://s.ytimg.com; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: blob: https:; " +
        "font-src 'self' data:; " +
        "connect-src 'self' https://api.github.com https://api.google.com; " +
        "media-src 'self' https://www.youtube.com; " +
        "frame-src 'self' https://www.youtube.com https://youtube.com; " +
        "object-src 'none'; " +
        "base-uri 'self'; " +
        "form-action 'self'; " +
        "frame-ancestors 'none'; " +
        "upgrade-insecure-requests;"
      )
    }

    // CORS headers for API routes
    if (pathname.startsWith('/api')) {
      const origin = request.headers.get('origin')
      const allowedOrigins = [
        process.env.NEXT_PUBLIC_APP_URL,
        'http://localhost:3000',
        'http://localhost:3001',
      ].filter(Boolean)
      
      if (origin && allowedOrigins.includes(origin)) {
        headers.set('Access-Control-Allow-Origin', origin)
      }
      
      headers.set('Access-Control-Allow-Credentials', 'true')
      headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
      headers.set(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
      )

      // Handle preflight requests
      if (request.method === 'OPTIONS') {
        return new NextResponse(null, { status: 200, headers })
      }
    }

    // Simple rate limiting for critical endpoints
    const identifier = getClientIp(request)
    let rateLimit = { limit: 100, windowMs: 60000 } // Default: 100 requests per minute

    // Adjust rate limits based on path
    if (pathname.startsWith('/api/auth/signin') || pathname.startsWith('/api/auth/signup')) {
      rateLimit = { limit: 5, windowMs: 15 * 60 * 1000 } // 5 attempts per 15 minutes
    } else if (pathname.startsWith('/api/posts') && request.method === 'POST') {
      rateLimit = { limit: 10, windowMs: 60 * 60 * 1000 } // 10 posts per hour
    } else if (pathname.startsWith('/api/comments') && request.method === 'POST') {
      rateLimit = { limit: 30, windowMs: 60 * 60 * 1000 } // 30 comments per hour
    } else if (pathname.startsWith('/api/upload')) {
      rateLimit = { limit: 20, windowMs: 60 * 60 * 1000 } // 20 uploads per hour
    }

    // Apply rate limiting
    const rateLimitResult = simpleRateLimit(
      `${identifier}:${pathname}`,
      rateLimit.limit,
      rateLimit.windowMs
    )

    // Set rate limit headers
    headers.set('X-RateLimit-Limit', rateLimit.limit.toString())
    headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
    headers.set('X-RateLimit-Reset', rateLimitResult.reset.toISOString())

    if (!rateLimitResult.success) {
      const retryAfter = Math.ceil((rateLimitResult.reset.getTime() - Date.now()) / 1000)
      headers.set('Retry-After', retryAfter.toString())
      
      return new NextResponse(
        JSON.stringify({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter,
        }),
        {
          status: 429,
          headers: {
            ...Object.fromEntries(headers.entries()),
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // Request ID for tracking
    const requestId = crypto.randomUUID()
    headers.set('X-Request-Id', requestId)

    // Add timing header
    const duration = Date.now() - start
    headers.set('X-Response-Time', `${duration}ms`)

    // Log request (in production, this would go to a logging service)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${new Date().toISOString()}] ${request.method} ${pathname} - ${duration}ms`)
    }

    // Continue with modified headers
    return NextResponse.next({
      request: {
        headers,
      },
    })
  } catch (error) {
    console.error('Middleware error:', error)
    
    // Don't block requests on middleware errors
    return NextResponse.next()
  }
}
```

---

## 📁 NEW FILE: src/lib/rate-limit-server.ts

This file provides Redis-based rate limiting for server-side API routes (not middleware):

```typescript
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
```

---

## 📁 UPDATED FILE: src/lib/rate-limit.ts

```typescript
// src/lib/rate-limit.ts
/**
 * Rate limiting utilities
 * This file exports utilities that work in both client and server environments
 * For Redis-based rate limiting, use rate-limit-server.ts
 */

// Rate limit configuration
export interface RateLimitConfig {
  limit: number
  window: number // in seconds
  prefix?: string
}

// Export rate limit configs for use across the app
export const rateLimitConfigs = {
  api: { limit: 100, window: 60, prefix: 'api' },
  auth: { limit: 5, window: 900, prefix: 'auth' },
  write: { limit: 10, window: 3600, prefix: 'write' },
  comment: { limit: 30, window: 3600, prefix: 'comment' },
  upload: { limit: 20, window: 3600, prefix: 'upload' },
  reaction: { limit: 100, window: 3600, prefix: 'reaction' },
}

// In-memory rate limiter for client-side use
const clientRateLimitMap = new Map<string, { count: number; resetTime: number }>()

// Clean up old entries periodically (client-side)
if (typeof window !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, value] of clientRateLimitMap.entries()) {
      if (value.resetTime < now) {
        clientRateLimitMap.delete(key)
      }
    }
  }, 60000) // Clean every minute
}

// Simple in-memory rate limiter (works in all environments)
export function ratelimit(
  config: RateLimitConfig,
  identifier: string
): { success: boolean; remaining: number; reset: Date; limit: number; retryAfter?: number } {
  const now = Date.now()
  const windowMs = config.window * 1000
  const resetTime = now + windowMs
  const key = `${config.prefix}:${identifier}`
  
  const current = clientRateLimitMap.get(key)
  
  if (!current || current.resetTime < now) {
    // New window
    clientRateLimitMap.set(key, { count: 1, resetTime })
    return {
      success: true,
      remaining: config.limit - 1,
      reset: new Date(resetTime),
      limit: config.limit,
    }
  }
  
  // Existing window
  if (current.count >= config.limit) {
    const retryAfter = Math.ceil((current.resetTime - now) / 1000)
    return {
      success: false,
      remaining: 0,
      reset: new Date(current.resetTime),
      limit: config.limit,
      retryAfter,
    }
  }
  
  // Increment count
  current.count++
  clientRateLimitMap.set(key, current)
  
  return {
    success: true,
    remaining: config.limit - current.count,
    reset: new Date(current.resetTime),
    limit: config.limit,
  }
}

// Helper to create a rate limiter with preset config
export function createRateLimiter(config: RateLimitConfig) {
  return (identifier: string) => ratelimit(config, identifier)
}

// Preset rate limiters
export const apiRateLimit = createRateLimiter(rateLimitConfigs.api)
export const authRateLimit = createRateLimiter(rateLimitConfigs.auth)
export const writeRateLimit = createRateLimiter(rateLimitConfigs.write)
export const commentRateLimit = createRateLimiter(rateLimitConfigs.comment)
export const uploadRateLimit = createRateLimiter(rateLimitConfigs.upload)
export const reactionRateLimit = createRateLimiter(rateLimitConfigs.reaction)

// Get client IP helper (works in browser and server)
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

// Export a default rate limiter for backward compatibility
export default ratelimit
```

---

## ✅ Summary & Validation

### **Critical Issues Fixed:**

1. ✅ **Edge Runtime Compatibility**
   - Removed ioredis dependency from middleware (not compatible with Edge Runtime)
   - Implemented simple in-memory rate limiting for middleware
   - Created separate server-side rate limiting with Redis support

2. ✅ **Import Name Fix**
   - Exported `ratelimit` function correctly
   - Maintained backward compatibility
   - Added multiple export options

3. ✅ **Security Headers Enhanced**
   - Added comprehensive CSP headers
   - Improved CORS configuration
   - Added request tracking with UUID

### **Architecture Changes:**

1. **Middleware** (`src/middleware.ts`)
   - Uses simple in-memory rate limiting (Edge Runtime compatible)
   - No Redis dependencies
   - Lightweight and fast

2. **Server-side Rate Limiting** (`src/lib/rate-limit-server.ts`)
   - Redis-based for API routes
   - Only runs in Node.js environment
   - Graceful fallback if Redis unavailable

3. **Shared Utilities** (`src/lib/rate-limit.ts`)
   - Works in all environments
   - Provides consistent interface
   - Exports for backward compatibility

### **Key Features Preserved:**

- ✅ Rate limiting functionality maintained
- ✅ Security headers properly set
- ✅ CORS configuration intact
- ✅ Request logging preserved
- ✅ Different rate limits for different endpoints

### **Testing Recommendations:**

1. Restart the development server: `npm run dev`
2. Test various endpoints to verify rate limiting
3. Check browser console for any errors
4. Verify security headers in network tab
5. Test API routes with high request volume

The solution separates concerns properly:
- Edge Runtime middleware uses lightweight in-memory solution
- Server-side API routes can use Redis when available
- Graceful degradation if Redis is unavailable
- No runtime errors from incompatible modules
