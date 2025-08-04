## 🎯 Phase 1 Enhancement Plan

### 📋 Files to Update:
1. `/src/lib/db.ts` - Enhanced with more middleware and utilities
2. `/src/lib/auth/auth.config.ts` - Security hardening and 2FA prep
3. `/src/lib/auth/auth.ts` - Additional auth utilities
4. `/src/app/layout.tsx` - Error boundaries and monitoring
5. `/src/lib/utils.ts` - Additional utilities

### 📋 New Files to Create:
1. `/src/lib/redis.ts` - Redis client setup
2. `/src/lib/rate-limit.ts` - Rate limiting implementation
3. `/src/lib/security.ts` - Security utilities
4. `/src/services/user.service.ts` - User service layer
5. `/src/services/auth.service.ts` - Auth service layer
6. `/src/services/notification.service.ts` - Notification service
7. `/src/lib/events/event-emitter.ts` - Event system
8. `/src/lib/monitoring.ts` - Performance monitoring
9. `/src/components/error-boundary.tsx` - Error handling
10. `/src/middleware.ts` - Next.js middleware
11. `/src/lib/analytics.ts` - Custom analytics
12. `/src/types/index.ts` - Shared types

---

## 📁 Updated Phase 1 Files

### 1. `/src/lib/db.ts` - Enhanced Database Client

```typescript
// src/lib/db.ts
import { PrismaClient, Prisma } from '@prisma/client'
import { logger } from '@/lib/monitoring'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create Prisma client with enhanced configuration
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [
      {
        emit: 'event',
        level: 'query',
      },
      {
        emit: 'event',
        level: 'error',
      },
      {
        emit: 'event',
        level: 'warn',
      },
    ],
    errorFormat: 'minimal',
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

// Enhanced query logging in development
if (process.env.NODE_ENV === 'development') {
  db.$on('query' as never, (e: any) => {
    logger.debug('Query:', {
      query: e.query,
      params: e.params,
      duration: e.duration,
    })
  })
}

// Error logging
db.$on('error' as never, (e: any) => {
  logger.error('Database error:', e)
})

// Middleware for soft deletes
db.$use(async (params, next) => {
  // Models that support soft delete
  const softDeleteModels = ['User', 'Post', 'Comment', 'Group', 'Event']
  
  if (softDeleteModels.includes(params.model || '')) {
    if (params.action === 'delete') {
      params.action = 'update'
      params.args['data'] = { deletedAt: new Date() }
    }
    
    if (params.action === 'deleteMany') {
      params.action = 'updateMany'
      if (params.args.data !== undefined) {
        params.args.data['deletedAt'] = new Date()
      } else {
        params.args['data'] = { deletedAt: new Date() }
      }
    }
    
    // Exclude soft deleted records from queries
    if (params.action === 'findUnique' || params.action === 'findFirst') {
      params.args.where = { ...params.args.where, deletedAt: null }
    }
    
    if (params.action === 'findMany') {
      if (params.args.where) {
        if (params.args.where.deletedAt === undefined) {
          params.args.where['deletedAt'] = null
        }
      } else {
        params.args['where'] = { deletedAt: null }
      }
    }
  }
  
  return next(params)
})

// Middleware for automatic updatedAt
db.$use(async (params, next) => {
  if (params.action === 'update' || params.action === 'updateMany') {
    params.args.data = {
      ...params.args.data,
      updatedAt: new Date(),
    }
  }
  
  return next(params)
})

// Middleware for version control (optimistic locking)
db.$use(async (params, next) => {
  const versionedModels = ['User', 'Post', 'UserBalance', 'Trade']
  
  if (versionedModels.includes(params.model || '') && params.action === 'update') {
    const { where, data } = params.args
    
    // Increment version on update
    if (data.version === undefined) {
      data.version = { increment: 1 }
    }
    
    // Add version check to where clause
    if (where.version !== undefined) {
      const currentVersion = where.version
      delete where.version
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        { version: currentVersion }
      ]
    }
  }
  
  const result = await next(params)
  
  // Check if update affected any rows
  if (params.action === 'update' && result === null) {
    throw new Error('Optimistic lock error: Record was modified by another process')
  }
  
  return result
})

// Database error handler with specific error types
export function handleDatabaseError(error: unknown): never {
  logger.error('Database error:', error)
  
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        const target = error.meta?.target as string[]
        throw new Error(`Duplicate value for ${target?.join(', ') || 'field'}`)
      case 'P2025':
        throw new Error('Record not found')
      case 'P2003':
        throw new Error('Foreign key constraint failed')
      case 'P2014':
        throw new Error('Invalid ID provided')
      default:
        throw new Error(`Database error: ${error.message}`)
    }
  }
  
  if (error instanceof Prisma.PrismaClientValidationError) {
    throw new Error('Invalid data provided')
  }
  
  if (error instanceof Error) {
    throw error
  }
  
  throw new Error('An unknown database error occurred')
}

// Enhanced transaction helper with retry logic
export async function transaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  options?: {
    maxWait?: number
    timeout?: number
    isolationLevel?: Prisma.TransactionIsolationLevel
    maxRetries?: number
  }
): Promise<T> {
  const { maxRetries = 3, ...txOptions } = options || {}
  
  let lastError: Error | undefined
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await db.$transaction(fn, {
        maxWait: txOptions.maxWait || 5000,
        timeout: txOptions.timeout || 10000,
        isolationLevel: txOptions.isolationLevel,
      })
    } catch (error) {
      lastError = error as Error
      
      // Don't retry on validation errors
      if (error instanceof Prisma.PrismaClientValidationError) {
        throw error
      }
      
      // Check if error is retryable
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ['P2034', 'P2024'].includes(error.code) && // Transaction conflicts
        attempt < maxRetries
      ) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100))
        continue
      }
      
      throw error
    }
  }
  
  throw lastError
}

// Batch operations helper
export async function batchOperation<T, R>(
  items: T[],
  operation: (batch: T[]) => Promise<R[]>,
  batchSize: number = 100
): Promise<R[]> {
  const results: R[] = []
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await operation(batch)
    results.push(...batchResults)
  }
  
  return results
}

// Connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await db.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    logger.error('Database connection check failed:', error)
    return false
  }
}

// Cleanup function for graceful shutdown
export async function disconnectDatabase(): Promise<void> {
  await db.$disconnect()
}
```

### 2. `/src/lib/redis.ts` - Redis Client Setup

```typescript
// src/lib/redis.ts
import Redis from 'ioredis'
import { logger } from '@/lib/monitoring'

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
const redisPassword = process.env.REDIS_PASSWORD

// Create Redis client with retry strategy
export const redis = new Redis(redisUrl, {
  password: redisPassword,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000)
    logger.warn(`Redis connection retry attempt ${times}, delay: ${delay}ms`)
    return delay
  },
  reconnectOnError: (err) => {
    const targetError = 'READONLY'
    if (err.message.includes(targetError)) {
      // Only reconnect when the error contains "READONLY"
      return true
    }
    return false
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
})

// Redis pub/sub client (separate connection)
export const redisPub = redis.duplicate()
export const redisSub = redis.duplicate()

// Connection event handlers
redis.on('connect', () => {
  logger.info('Redis connected')
})

redis.on('error', (error) => {
  logger.error('Redis error:', error)
})

redis.on('close', () => {
  logger.warn('Redis connection closed')
})

// Helper functions for common operations
export const redisHelpers = {
  // Set with expiration
  async setex(key: string, seconds: number, value: any): Promise<void> {
    await redis.setex(key, seconds, JSON.stringify(value))
  },

  // Get and parse JSON
  async getJSON<T>(key: string): Promise<T | null> {
    const value = await redis.get(key)
    if (!value) return null
    try {
      return JSON.parse(value) as T
    } catch {
      return null
    }
  },

  // Set JSON with optional expiration
  async setJSON(key: string, value: any, expirationSeconds?: number): Promise<void> {
    const json = JSON.stringify(value)
    if (expirationSeconds) {
      await redis.setex(key, expirationSeconds, json)
    } else {
      await redis.set(key, json)
    }
  },

  // Increment with expiration
  async incrWithExpire(key: string, expirationSeconds: number): Promise<number> {
    const multi = redis.multi()
    multi.incr(key)
    multi.expire(key, expirationSeconds)
    const results = await multi.exec()
    return results?.[0]?.[1] as number
  },

  // Cache wrapper function
  async cached<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number
  ): Promise<T> {
    // Try to get from cache
    const cached = await redisHelpers.getJSON<T>(key)
    if (cached !== null) {
      return cached
    }

    // Fetch and cache
    const value = await fetcher()
    await redisHelpers.setJSON(key, value, ttlSeconds)
    return value
  },

  // Delete keys by pattern
  async deletePattern(pattern: string): Promise<number> {
    const keys = await redis.keys(pattern)
    if (keys.length === 0) return 0
    return await redis.del(...keys)
  },

  // Session management
  session: {
    async set(sessionId: string, data: any, ttlSeconds: number = 86400): Promise<void> {
      await redisHelpers.setJSON(`session:${sessionId}`, data, ttlSeconds)
    },

    async get<T>(sessionId: string): Promise<T | null> {
      return await redisHelpers.getJSON<T>(`session:${sessionId}`)
    },

    async delete(sessionId: string): Promise<void> {
      await redis.del(`session:${sessionId}`)
    },

    async extend(sessionId: string, ttlSeconds: number = 86400): Promise<void> {
      await redis.expire(`session:${sessionId}`, ttlSeconds)
    },
  },

  // Rate limiting helpers
  rateLimiting: {
    async checkLimit(
      identifier: string,
      maxRequests: number,
      windowSeconds: number
    ): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
      const key = `rate_limit:${identifier}`
      const current = await redisHelpers.incrWithExpire(key, windowSeconds)
      
      return {
        allowed: current <= maxRequests,
        remaining: Math.max(0, maxRequests - current),
        resetAt: new Date(Date.now() + windowSeconds * 1000),
      }
    },

    async resetLimit(identifier: string): Promise<void> {
      await redis.del(`rate_limit:${identifier}`)
    },
  },

  // Leaderboard helpers
  leaderboard: {
    async addScore(
      leaderboardKey: string,
      userId: string,
      score: number
    ): Promise<void> {
      await redis.zadd(leaderboardKey, score, userId)
    },

    async getTopUsers(
      leaderboardKey: string,
      count: number = 10
    ): Promise<Array<{ userId: string; score: number; rank: number }>> {
      const results = await redis.zrevrange(leaderboardKey, 0, count - 1, 'WITHSCORES')
      const users: Array<{ userId: string; score: number; rank: number }> = []
      
      for (let i = 0; i < results.length; i += 2) {
        users.push({
          userId: results[i],
          score: parseFloat(results[i + 1]),
          rank: i / 2 + 1,
        })
      }
      
      return users
    },

    async getUserRank(leaderboardKey: string, userId: string): Promise<number | null> {
      const rank = await redis.zrevrank(leaderboardKey, userId)
      return rank === null ? null : rank + 1
    },
  },
}

// Connection check
export async function checkRedisConnection(): Promise<boolean> {
  try {
    await redis.ping()
    return true
  } catch (error) {
    logger.error('Redis connection check failed:', error)
    return false
  }
}

// Cleanup function
export async function disconnectRedis(): Promise<void> {
  await redis.quit()
  await redisPub.quit()
  await redisSub.quit()
}
```

### 3. `/src/lib/rate-limit.ts` - Rate Limiting Implementation

```typescript
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
```

### 4. `/src/lib/security.ts` - Security Utilities

```typescript
// src/lib/security.ts
import { createHash, randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { logger } from '@/lib/monitoring'
import { LoginHistory, SecurityAlert } from '@prisma/client'

// Constants
const SALT_ROUNDS = 12
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

// IP address utilities
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }
  
  return 'unknown'
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

// Verify password
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Generate secure token
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString('hex')
}

// Generate verification code
export function generateVerificationCode(length: number = 6): string {
  const digits = '0123456789'
  let code = ''
  const bytes = randomBytes(length)
  
  for (let i = 0; i < length; i++) {
    code += digits[bytes[i] % 10]
  }
  
  return code
}

// Create hash for data integrity
export function createHash(data: string): string {
  return createHash('sha256').update(data).digest('hex')
}

// Login attempt tracking
export async function trackLoginAttempt(
  email: string,
  ipAddress: string,
  userAgent: string,
  success: boolean,
  reason?: string
): Promise<LoginHistory> {
  try {
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true },
    })

    if (!user) {
      throw new Error('User not found')
    }

    const loginHistory = await db.loginHistory.create({
      data: {
        userId: user.id,
        ipAddress,
        userAgent,
        success,
        reason,
      },
    })

    // Check for suspicious activity
    if (!success) {
      await checkSuspiciousActivity(user.id, ipAddress)
    }

    return loginHistory
  } catch (error) {
    logger.error('Failed to track login attempt:', error)
    throw error
  }
}

// Check for suspicious login activity
async function checkSuspiciousActivity(
  userId: string,
  ipAddress: string
): Promise<void> {
  const recentAttempts = await db.loginHistory.count({
    where: {
      userId,
      success: false,
      createdAt: {
        gte: new Date(Date.now() - LOCKOUT_DURATION),
      },
    },
  })

  if (recentAttempts >= MAX_LOGIN_ATTEMPTS) {
    await createSecurityAlert(
      userId,
      'MULTIPLE_FAILED_LOGINS',
      'Multiple Failed Login Attempts',
      `${recentAttempts} failed login attempts detected from IP: ${ipAddress}`,
      'high'
    )

    // You could also implement account lockout here
    // await db.user.update({
    //   where: { id: userId },
    //   data: { 
    //     lockedUntil: new Date(Date.now() + LOCKOUT_DURATION),
    //   },
    // })
  }

  // Check for new IP address
  const knownIp = await db.loginHistory.findFirst({
    where: {
      userId,
      ipAddress,
      success: true,
    },
  })

  if (!knownIp) {
    await createSecurityAlert(
      userId,
      'NEW_IP_LOGIN',
      'Login from New IP Address',
      `Login attempt from new IP address: ${ipAddress}`,
      'medium'
    )
  }
}

// Create security alert
export async function createSecurityAlert(
  userId: string,
  type: string,
  title: string,
  description: string,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): Promise<SecurityAlert> {
  const alert = await db.securityAlert.create({
    data: {
      userId,
      type,
      title,
      description,
      severity,
    },
  })

  // Send notification based on severity
  if (severity === 'high' || severity === 'critical') {
    await db.notification.create({
      data: {
        userId,
        type: 'SYSTEM',
        title: `Security Alert: ${title}`,
        message: description,
        data: { alertId: alert.id, severity },
      },
    })
  }

  logger.warn('Security alert created:', { userId, type, severity })
  return alert
}

// Validate password strength
export function validatePasswordStrength(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  // Check for common passwords
  const commonPasswords = [
    'password', 'password123', '12345678', 'qwerty123',
    'sparkle123', 'admin123', 'letmein', 'welcome123'
  ]
  
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// CSRF token generation and validation
export const csrf = {
  generate(): string {
    return generateSecureToken(32)
  },

  validate(token: string, sessionToken: string): boolean {
    return token === sessionToken
  },
}

// Input sanitization
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
}

// SQL injection prevention helper
export function escapeSqlString(str: string): string {
  return str.replace(/'/g, "''")
}

// XSS prevention for user-generated content
export function sanitizeHtml(html: string): string {
  // In production, use a library like DOMPurify
  // This is a basic implementation
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

// Session fingerprinting
export function generateSessionFingerprint(
  userAgent: string,
  acceptLanguage: string,
  acceptEncoding: string
): string {
  const data = `${userAgent}:${acceptLanguage}:${acceptEncoding}`
  return createHash(data)
}

// Check if IP is from known VPN/proxy
export async function isVpnOrProxy(ip: string): Promise<boolean> {
  // In production, integrate with services like IPQualityScore
  // This is a placeholder implementation
  const knownVpnRanges = [
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16',
  ]
  
  // Implement actual VPN detection logic
  return false
}

// Rate-limited password reset
const passwordResetAttempts = new Map<string, number>()

export async function canRequestPasswordReset(email: string): Promise<boolean> {
  const attempts = passwordResetAttempts.get(email) || 0
  
  if (attempts >= 3) {
    return false
  }
  
  passwordResetAttempts.set(email, attempts + 1)
  
  // Clear attempts after 1 hour
  setTimeout(() => {
    passwordResetAttempts.delete(email)
  }, 60 * 60 * 1000)
  
  return true
}
```

### 5. `/src/services/user.service.ts` - User Service Layer

```typescript
// src/services/user.service.ts
import { db, transaction } from '@/lib/db'
import { redis, redisHelpers } from '@/lib/redis'
import { logger } from '@/lib/monitoring'
import { 
  User, 
  UserRole, 
  UserStatus, 
  Prisma,
  NotificationType 
} from '@prisma/client'
import { hashPassword, validatePasswordStrength } from '@/lib/security'
import { generateUsername } from '@/lib/utils'
import { eventEmitter } from '@/lib/events/event-emitter'

// User creation input
export interface CreateUserInput {
  email: string
  password?: string
  username?: string
  provider?: string
  providerId?: string
  image?: string
  emailVerified?: boolean
}

// User update input
export interface UpdateUserInput {
  username?: string
  bio?: string
  image?: string
  displayName?: string
  location?: string
  website?: string
  socialLinks?: {
    twitter?: string
    instagram?: string
    tiktok?: string
    discord?: string
    youtube?: string
  }
}

// User service class
export class UserService {
  // Cache keys
  private static readonly CACHE_PREFIX = 'user:'
  private static readonly CACHE_TTL = 300 // 5 minutes

  // Create a new user
  static async createUser(input: CreateUserInput): Promise<User> {
    logger.info('Creating new user', { email: input.email })

    // Validate input
    if (!input.username) {
      input.username = generateUsername(input.email)
    }

    // Ensure username is unique
    let username = input.username
    let attempts = 0
    while (attempts < 5) {
      const existing = await db.user.findUnique({ where: { username } })
      if (!existing) break
      username = `${input.username}${Math.random().toString(36).substring(2, 6)}`
      attempts++
    }

    if (attempts === 5) {
      throw new Error('Failed to generate unique username')
    }

    // Hash password if provided
    let hashedPassword: string | undefined
    if (input.password) {
      const passwordValidation = validatePasswordStrength(input.password)
      if (!passwordValidation.valid) {
        throw new Error(passwordValidation.errors.join(', '))
      }
      hashedPassword = await hashPassword(input.password)
    }

    // Create user with profile in transaction
    const user = await transaction(async (tx) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          email: input.email,
          username,
          hashedPassword,
          emailVerified: input.emailVerified ? new Date() : null,
          image: input.image,
          status: input.emailVerified ? UserStatus.ACTIVE : UserStatus.PENDING_VERIFICATION,
          role: UserRole.USER,
        },
      })

      // Create profile
      await tx.profile.create({
        data: {
          userId: newUser.id,
          displayName: username,
        },
      })

      // Create user stats
      await tx.userStats.create({
        data: {
          userId: newUser.id,
        },
      })

      // Create user balance
      await tx.userBalance.create({
        data: {
          userId: newUser.id,
          sparklePoints: 100, // Welcome bonus
        },
      })

      // Create notification preferences
      await tx.notificationPreference.create({
        data: {
          userId: newUser.id,
        },
      })

      // Send welcome notification
      await tx.notification.create({
        data: {
          type: NotificationType.SYSTEM,
          userId: newUser.id,
          title: 'Welcome to Sparkle Universe! ✨',
          message: 'Your journey in the Sparkle community begins now. Complete your profile to earn your first achievement!',
        },
      })

      // Log XP for account creation
      await tx.xpLog.create({
        data: {
          userId: newUser.id,
          amount: 10,
          source: 'account_created',
          reason: 'Created account',
          totalXp: 10,
        },
      })

      return newUser
    })

    // Emit user created event
    eventEmitter.emit('user:created', { user })

    logger.info('User created successfully', { userId: user.id })
    return user
  }

  // Get user by ID with caching
  static async getUserById(
    userId: string, 
    include?: Prisma.UserInclude
  ): Promise<User | null> {
    // Try cache first (only for basic queries)
    if (!include) {
      const cached = await redisHelpers.getJSON<User>(
        `${this.CACHE_PREFIX}${userId}`
      )
      if (cached) return cached
    }

    // Fetch from database
    const user = await db.user.findUnique({
      where: { id: userId },
      include,
    })

    // Cache the result (only for basic queries)
    if (user && !include) {
      await redisHelpers.setJSON(
        `${this.CACHE_PREFIX}${userId}`,
        user,
        this.CACHE_TTL
      )
    }

    return user
  }

  // Get user by username
  static async getUserByUsername(
    username: string,
    include?: Prisma.UserInclude
  ): Promise<User | null> {
    return db.user.findUnique({
      where: { username },
      include,
    })
  }

  // Update user
  static async updateUser(
    userId: string,
    input: UpdateUserInput
  ): Promise<User> {
    logger.info('Updating user', { userId })

    const user = await transaction(async (tx) => {
      // Update user
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          username: input.username,
          bio: input.bio,
          image: input.image,
        },
      })

      // Update profile if social links provided
      if (input.displayName || input.location || input.website || input.socialLinks) {
        await tx.profile.update({
          where: { userId },
          data: {
            displayName: input.displayName,
            location: input.location,
            website: input.website,
            twitterUsername: input.socialLinks?.twitter,
            instagramUsername: input.socialLinks?.instagram,
            tiktokUsername: input.socialLinks?.tiktok,
            discordUsername: input.socialLinks?.discord,
            youtubeChannelId: input.socialLinks?.youtube,
          },
        })
      }

      return updatedUser
    })

    // Invalidate cache
    await redis.del(`${this.CACHE_PREFIX}${userId}`)

    // Emit user updated event
    eventEmitter.emit('user:updated', { user })

    return user
  }

  // Update user status
  static async updateUserStatus(
    userId: string,
    status: UserStatus,
    reason?: string
  ): Promise<User> {
    const user = await db.user.update({
      where: { id: userId },
      data: {
        status,
        banReason: status === UserStatus.BANNED ? reason : null,
      },
    })

    // Invalidate cache
    await redis.del(`${this.CACHE_PREFIX}${userId}`)

    // Emit status change event
    eventEmitter.emit('user:statusChanged', { user, status, reason })

    return user
  }

  // Get user stats
  static async getUserStats(userId: string) {
    const stats = await db.userStats.findUnique({
      where: { userId },
    })

    if (!stats) {
      // Create stats if they don't exist
      return db.userStats.create({
        data: { userId },
      })
    }

    return stats
  }

  // Update user experience and level
  static async addExperience(
    userId: string,
    amount: number,
    source: string,
    reason?: string
  ): Promise<void> {
    await transaction(async (tx) => {
      // Get current user data
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { experience: true, level: true },
      })

      if (!user) throw new Error('User not found')

      const newExperience = user.experience + amount
      const newLevel = this.calculateLevel(newExperience)

      // Update user
      await tx.user.update({
        where: { id: userId },
        data: {
          experience: newExperience,
          level: newLevel,
        },
      })

      // Log XP gain
      await tx.xpLog.create({
        data: {
          userId,
          amount,
          source,
          reason,
          totalXp: newExperience,
        },
      })

      // Check for level up
      if (newLevel > user.level) {
        // Create level up notification
        await tx.notification.create({
          data: {
            type: NotificationType.LEVEL_UP,
            userId,
            title: `Level Up! You're now level ${newLevel}! 🎉`,
            message: `Congratulations on reaching level ${newLevel}! Keep up the great work!`,
            data: { 
              oldLevel: user.level, 
              newLevel,
              experience: newExperience 
            },
          },
        })

        // Award level up bonus
        await tx.userBalance.update({
          where: { userId },
          data: {
            sparklePoints: { increment: newLevel * 10 },
          },
        })

        // Emit level up event
        eventEmitter.emit('user:levelUp', { 
          userId, 
          oldLevel: user.level, 
          newLevel 
        })
      }
    })
  }

  // Calculate level from experience
  private static calculateLevel(experience: number): number {
    // Simple level calculation: level = floor(sqrt(experience / 100))
    return Math.floor(Math.sqrt(experience / 100)) + 1
  }

  // Search users
  static async searchUsers(
    query: string,
    options: {
      limit?: number
      offset?: number
      role?: UserRole
      status?: UserStatus
    } = {}
  ) {
    const { limit = 20, offset = 0, role, status } = options

    return db.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { username: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
              { bio: { contains: query, mode: 'insensitive' } },
            ],
          },
          role ? { role } : {},
          status ? { status } : {},
          { deletedAt: null },
        ],
      },
      include: {
        profile: true,
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
          },
        },
      },
      take: limit,
      skip: offset,
      orderBy: {
        followers: {
          _count: 'desc',
        },
      },
    })
  }

  // Get user's public profile
  static async getPublicProfile(username: string) {
    const user = await db.user.findUnique({
      where: { username },
      include: {
        profile: true,
        stats: true,
        _count: {
          select: {
            posts: { where: { published: true } },
            followers: true,
            following: true,
          },
        },
      },
    })

    if (!user || user.status === UserStatus.BANNED) {
      return null
    }

    // Remove sensitive data
    const { hashedPassword, emailVerified, ...publicUser } = user
    return publicUser
  }

  // Check if username is available
  static async isUsernameAvailable(username: string): Promise<boolean> {
    const user = await db.user.findUnique({
      where: { username },
      select: { id: true },
    })
    return !user
  }

  // Delete user (soft delete)
  static async deleteUser(userId: string): Promise<void> {
    await db.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.DELETED,
        deletedAt: new Date(),
      },
    })

    // Clear cache
    await redis.del(`${this.CACHE_PREFIX}${userId}`)

    // Emit user deleted event
    eventEmitter.emit('user:deleted', { userId })
  }
}
```

### 6. `/src/services/auth.service.ts` - Authentication Service

```typescript
// src/services/auth.service.ts
import { db } from '@/lib/db'
import { redis, redisHelpers } from '@/lib/redis'
import { 
  hashPassword, 
  verifyPassword, 
  generateSecureToken,
  generateVerificationCode,
  trackLoginAttempt,
  createSecurityAlert
} from '@/lib/security'
import { UserService } from './user.service'
import { logger } from '@/lib/monitoring'
import { eventEmitter } from '@/lib/events/event-emitter'
import { UserStatus } from '@prisma/client'

export interface LoginInput {
  email: string
  password: string
  ipAddress: string
  userAgent: string
}

export interface RegisterInput {
  email: string
  password: string
  username?: string
}

export interface PasswordResetInput {
  email: string
  token: string
  newPassword: string
}

export class AuthService {
  private static readonly VERIFICATION_CODE_TTL = 600 // 10 minutes
  private static readonly PASSWORD_RESET_TTL = 3600 // 1 hour
  private static readonly LOGIN_LOCKOUT_DURATION = 900 // 15 minutes
  private static readonly MAX_LOGIN_ATTEMPTS = 5

  // Register new user
  static async register(input: RegisterInput) {
    logger.info('User registration attempt', { email: input.email })

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: input.email },
    })

    if (existingUser) {
      throw new Error('Email already registered')
    }

    // Create user
    const user = await UserService.createUser({
      email: input.email,
      password: input.password,
      username: input.username,
    })

    // Generate verification code
    const verificationCode = generateVerificationCode()
    await redisHelpers.setJSON(
      `email_verify:${user.id}`,
      { code: verificationCode, email: user.email },
      this.VERIFICATION_CODE_TTL
    )

    // Send verification email (implement email service)
    eventEmitter.emit('auth:sendVerificationEmail', {
      userId: user.id,
      email: user.email,
      code: verificationCode,
    })

    logger.info('User registered successfully', { userId: user.id })
    return user
  }

  // Login user
  static async login(input: LoginInput) {
    const { email, password, ipAddress, userAgent } = input

    // Check if user exists
    const user = await db.user.findUnique({
      where: { email },
      include: { profile: true },
    })

    if (!user) {
      await trackLoginAttempt(email, ipAddress, userAgent, false, 'User not found')
      throw new Error('Invalid credentials')
    }

    // Check if account is locked
    const lockoutKey = `lockout:${user.id}`
    const isLocked = await redis.get(lockoutKey)
    if (isLocked) {
      throw new Error('Account temporarily locked due to multiple failed attempts')
    }

    // Check user status
    if (user.status === UserStatus.BANNED) {
      throw new Error('Account has been banned')
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new Error('Account has been suspended')
    }

    // Verify password
    if (!user.hashedPassword) {
      throw new Error('Please use social login for this account')
    }

    const isValidPassword = await verifyPassword(password, user.hashedPassword)
    if (!isValidPassword) {
      await this.handleFailedLogin(user.id, email, ipAddress, userAgent)
      throw new Error('Invalid credentials')
    }

    // Track successful login
    await trackLoginAttempt(email, ipAddress, userAgent, true)

    // Update last seen
    await db.user.update({
      where: { id: user.id },
      data: { lastSeenAt: new Date() },
    })

    // Clear any failed login attempts
    await redis.del(`failed_attempts:${user.id}`)

    // Generate session token
    const sessionToken = generateSecureToken()
    const sessionData = {
      userId: user.id,
      ipAddress,
      userAgent,
      createdAt: new Date(),
    }

    // Store session in Redis
    await redisHelpers.session.set(sessionToken, sessionData, 86400 * 30) // 30 days

    eventEmitter.emit('auth:login', { userId: user.id, ipAddress })

    return {
      user,
      sessionToken,
    }
  }

  // Handle failed login attempt
  private static async handleFailedLogin(
    userId: string,
    email: string,
    ipAddress: string,
    userAgent: string
  ) {
    const attemptsKey = `failed_attempts:${userId}`
    
    // Increment failed attempts
    const attempts = await redisHelpers.incrWithExpire(
      attemptsKey,
      this.LOGIN_LOCKOUT_DURATION
    )

    await trackLoginAttempt(email, ipAddress, userAgent, false, 'Invalid password')

    // Lock account if too many attempts
    if (attempts >= this.MAX_LOGIN_ATTEMPTS) {
      const lockoutKey = `lockout:${userId}`
      await redis.setex(lockoutKey, this.LOGIN_LOCKOUT_DURATION, '1')
      
      await createSecurityAlert(
        userId,
        'ACCOUNT_LOCKED',
        'Account Locked',
        `Account locked due to ${attempts} failed login attempts`,
        'high'
      )
    }
  }

  // Verify email
  static async verifyEmail(userId: string, code: string) {
    const storedData = await redisHelpers.getJSON<{ code: string; email: string }>(
      `email_verify:${userId}`
    )

    if (!storedData || storedData.code !== code) {
      throw new Error('Invalid or expired verification code')
    }

    // Update user
    await db.user.update({
      where: { id: userId },
      data: {
        emailVerified: new Date(),
        status: UserStatus.ACTIVE,
      },
    })

    // Delete verification code
    await redis.del(`email_verify:${userId}`)

    // Award XP for email verification
    await UserService.addExperience(userId, 20, 'email_verified')

    eventEmitter.emit('auth:emailVerified', { userId })
  }

  // Request password reset
  static async requestPasswordReset(email: string) {
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    })

    if (!user) {
      // Don't reveal if email exists
      return
    }

    // Generate reset token
    const resetToken = generateSecureToken()
    const resetData = {
      userId: user.id,
      email: user.email,
      token: resetToken,
    }

    // Store in Redis
    await redisHelpers.setJSON(
      `password_reset:${resetToken}`,
      resetData,
      this.PASSWORD_RESET_TTL
    )

    // Send reset email
    eventEmitter.emit('auth:sendPasswordResetEmail', {
      userId: user.id,
      email: user.email,
      token: resetToken,
    })
  }

  // Reset password
  static async resetPassword(input: PasswordResetInput) {
    const resetData = await redisHelpers.getJSON<{
      userId: string
      email: string
      token: string
    }>(`password_reset:${input.token}`)

    if (!resetData || resetData.email !== input.email) {
      throw new Error('Invalid or expired reset token')
    }

    // Hash new password
    const hashedPassword = await hashPassword(input.newPassword)

    // Update password
    await db.user.update({
      where: { id: resetData.userId },
      data: { hashedPassword },
    })

    // Delete reset token
    await redis.del(`password_reset:${input.token}`)

    // Create security alert
    await createSecurityAlert(
      resetData.userId,
      'PASSWORD_CHANGED',
      'Password Changed',
      'Your password was successfully changed',
      'medium'
    )

    eventEmitter.emit('auth:passwordReset', { userId: resetData.userId })
  }

  // Logout
  static async logout(sessionToken: string) {
    await redisHelpers.session.delete(sessionToken)
    eventEmitter.emit('auth:logout', { sessionToken })
  }

  // Validate session
  static async validateSession(sessionToken: string) {
    const sessionData = await redisHelpers.session.get(sessionToken)
    
    if (!sessionData) {
      return null
    }

    // Extend session
    await redisHelpers.session.extend(sessionToken)

    return sessionData
  }

  // Setup two-factor authentication
  static async setupTwoFactor(userId: string) {
    // Implementation for 2FA setup
    // This would involve generating a secret and QR code
    throw new Error('Not implemented')
  }

  // Verify two-factor code
  static async verifyTwoFactor(userId: string, code: string) {
    // Implementation for 2FA verification
    throw new Error('Not implemented')
  }
}
```

### 7. `/src/services/notification.service.ts` - Notification Service

```typescript
// src/services/notification.service.ts
import { db, transaction } from '@/lib/db'
import { redis, redisHelpers } from '@/lib/redis'
import { logger } from '@/lib/monitoring'
import { 
  NotificationType, 
  NotificationPreference,
  Prisma 
} from '@prisma/client'
import { eventEmitter } from '@/lib/events/event-emitter'

export interface CreateNotificationInput {
  type: NotificationType
  userId: string
  actorId?: string
  entityId?: string
  entityType?: string
  title: string
  message: string
  data?: any
  imageUrl?: string
  actionUrl?: string
  priority?: number
}

export interface NotificationOptions {
  email?: boolean
  push?: boolean
  sms?: boolean
}

export class NotificationService {
  private static readonly CACHE_PREFIX = 'notifications:'
  private static readonly UNREAD_COUNT_KEY = 'unread_count:'

  // Create notification
  static async createNotification(
    input: CreateNotificationInput,
    options: NotificationOptions = {}
  ) {
    logger.info('Creating notification', { 
      type: input.type, 
      userId: input.userId 
    })

    // Check user preferences
    const preferences = await this.getUserPreferences(input.userId)
    if (!preferences) {
      logger.warn('User preferences not found', { userId: input.userId })
      return null
    }

    // Check if user wants this type of notification
    if (!this.shouldSendNotification(input.type, preferences)) {
      logger.info('Notification skipped due to user preferences', {
        type: input.type,
        userId: input.userId,
      })
      return null
    }

    // Create notification in database
    const notification = await db.notification.create({
      data: {
        ...input,
        expiresAt: this.calculateExpiryDate(input.type),
      },
    })

    // Update unread count in cache
    await this.incrementUnreadCount(input.userId)

    // Send real-time notification if user is online
    await this.sendRealtimeNotification(notification)

    // Queue for other channels based on preferences and options
    if (options.email || (options.email === undefined && preferences.emailNotifications)) {
      await this.queueEmailNotification(notification)
    }

    if (options.push || (options.push === undefined && preferences.pushNotifications)) {
      await this.queuePushNotification(notification)
    }

    if (options.sms || (options.sms === undefined && preferences.smsNotifications)) {
      await this.queueSmsNotification(notification)
    }

    // Emit notification created event
    eventEmitter.emit('notification:created', { notification })

    return notification
  }

  // Create bulk notifications
  static async createBulkNotifications(
    userIds: string[],
    template: Omit<CreateNotificationInput, 'userId'>,
    options: NotificationOptions = {}
  ) {
    logger.info('Creating bulk notifications', { 
      userCount: userIds.length,
      type: template.type 
    })

    const notifications = await transaction(async (tx) => {
      const created = await Promise.all(
        userIds.map((userId) =>
          tx.notification.create({
            data: {
              ...template,
              userId,
              expiresAt: this.calculateExpiryDate(template.type),
            },
          })
        )
      )
      return created
    })

    // Update unread counts
    await Promise.all(
      userIds.map((userId) => this.incrementUnreadCount(userId))
    )

    // Send realtime notifications
    await Promise.all(
      notifications.map((notification) =>
        this.sendRealtimeNotification(notification)
      )
    )

    return notifications
  }

  // Get user preferences
  private static async getUserPreferences(
    userId: string
  ): Promise<NotificationPreference | null> {
    return db.notificationPreference.findUnique({
      where: { userId },
    })
  }

  // Check if notification should be sent based on type and preferences
  private static shouldSendNotification(
    type: NotificationType,
    preferences: NotificationPreference
  ): boolean {
    const typePreferenceMap: Record<NotificationType, keyof NotificationPreference> = {
      [NotificationType.POST_LIKED]: 'postLikes',
      [NotificationType.POST_COMMENTED]: 'postComments',
      [NotificationType.COMMENT_LIKED]: 'postLikes',
      [NotificationType.USER_FOLLOWED]: 'newFollowers',
      [NotificationType.MENTION]: 'mentions',
      [NotificationType.DIRECT_MESSAGE]: 'directMessages',
      [NotificationType.GROUP_INVITE]: 'groupInvites',
      [NotificationType.EVENT_REMINDER]: 'eventReminders',
      [NotificationType.ACHIEVEMENT_UNLOCKED]: 'emailNotifications',
      [NotificationType.LEVEL_UP]: 'emailNotifications',
      [NotificationType.SYSTEM]: 'emailNotifications',
      [NotificationType.GROUP_POST]: 'groupInvites',
      [NotificationType.WATCH_PARTY_INVITE]: 'eventReminders',
      [NotificationType.YOUTUBE_PREMIERE]: 'eventReminders',
      [NotificationType.QUEST_COMPLETE]: 'emailNotifications',
      [NotificationType.TRADE_REQUEST]: 'directMessages',
      [NotificationType.CONTENT_FEATURED]: 'emailNotifications',
      [NotificationType.MILESTONE_REACHED]: 'emailNotifications',
    }

    const preferenceKey = typePreferenceMap[type]
    return preferences[preferenceKey] as boolean
  }

  // Calculate notification expiry date
  private static calculateExpiryDate(type: NotificationType): Date {
    const expiryDays = {
      [NotificationType.SYSTEM]: 30,
      [NotificationType.ACHIEVEMENT_UNLOCKED]: 90,
      [NotificationType.LEVEL_UP]: 90,
      [NotificationType.CONTENT_FEATURED]: 90,
      [NotificationType.MILESTONE_REACHED]: 90,
      // Most notifications expire after 7 days
      default: 7,
    }

    const days = expiryDays[type] || expiryDays.default
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  }

  // Send realtime notification
  private static async sendRealtimeNotification(notification: any) {
    const isOnline = await redis.exists(`presence:${notification.userId}`)
    
    if (isOnline) {
      // Publish to user's channel
      await redis.publish(
        `notifications:${notification.userId}`,
        JSON.stringify(notification)
      )
    }
  }

  // Queue email notification
  private static async queueEmailNotification(notification: any) {
    await db.notificationQueue.create({
      data: {
        userId: notification.userId,
        type: notification.type,
        channel: 'email',
        payload: notification,
        priority: notification.priority || 0,
      },
    })
  }

  // Queue push notification
  private static async queuePushNotification(notification: any) {
    await db.notificationQueue.create({
      data: {
        userId: notification.userId,
        type: notification.type,
        channel: 'push',
        payload: notification,
        priority: notification.priority || 0,
      },
    })
  }

  // Queue SMS notification
  private static async queueSmsNotification(notification: any) {
    // Only for high priority notifications
    if (notification.priority >= 2) {
      await db.notificationQueue.create({
        data: {
          userId: notification.userId,
          type: notification.type,
          channel: 'sms',
          payload: notification,
          priority: notification.priority,
        },
      })
    }
  }

  // Get notifications for user
  static async getNotifications(
    userId: string,
    options: {
      limit?: number
      cursor?: string
      unreadOnly?: boolean
      types?: NotificationType[]
    } = {}
  ) {
    const { limit = 20, cursor, unreadOnly = false, types } = options

    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(unreadOnly && { read: false }),
      ...(types && { type: { in: types } }),
      ...(cursor && { id: { lt: cursor } }),
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    }

    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      include: {
        actor: {
          select: {
            id: true,
            username: true,
            image: true,
          },
        },
      },
    })

    const hasMore = notifications.length > limit
    const items = hasMore ? notifications.slice(0, -1) : notifications
    const nextCursor = hasMore ? items[items.length - 1].id : null

    return {
      items,
      nextCursor,
      hasMore,
    }
  }

  // Mark notification as read
  static async markAsRead(
    notificationId: string,
    userId: string
  ): Promise<void> {
    const notification = await db.notification.update({
      where: {
        id: notificationId,
        userId, // Ensure user owns this notification
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    })

    // Update unread count
    await this.decrementUnreadCount(userId)

    eventEmitter.emit('notification:read', { notification })
  }

  // Mark all notifications as read
  static async markAllAsRead(userId: string): Promise<void> {
    await db.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    })

    // Clear unread count
    await redis.del(`${this.UNREAD_COUNT_KEY}${userId}`)

    eventEmitter.emit('notification:allRead', { userId })
  }

  // Get unread count
  static async getUnreadCount(userId: string): Promise<number> {
    // Try cache first
    const cached = await redis.get(`${this.UNREAD_COUNT_KEY}${userId}`)
    if (cached !== null) {
      return parseInt(cached, 10)
    }

    // Count from database
    const count = await db.notification.count({
      where: {
        userId,
        read: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    })

    // Cache for 5 minutes
    await redis.setex(`${this.UNREAD_COUNT_KEY}${userId}`, 300, count)
    return count
  }

  // Update unread count
  private static async incrementUnreadCount(userId: string): Promise<void> {
    const key = `${this.UNREAD_COUNT_KEY}${userId}`
    const exists = await redis.exists(key)
    
    if (exists) {
      await redis.incr(key)
    }
  }

  private static async decrementUnreadCount(userId: string): Promise<void> {
    const key = `${this.UNREAD_COUNT_KEY}${userId}`
    const exists = await redis.exists(key)
    
    if (exists) {
      const count = await redis.decr(key)
      if (count < 0) {
        await redis.set(key, 0)
      }
    }
  }

  // Delete notification
  static async deleteNotification(
    notificationId: string,
    userId: string
  ): Promise<void> {
    const notification = await db.notification.delete({
      where: {
        id: notificationId,
        userId, // Ensure user owns this notification
      },
    })

    if (!notification.read) {
      await this.decrementUnreadCount(userId)
    }

    eventEmitter.emit('notification:deleted', { notification })
  }

  // Clean up expired notifications
  static async cleanupExpiredNotifications(): Promise<number> {
    const result = await db.notification.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    })

    logger.info('Cleaned up expired notifications', { count: result.count })
    return result.count
  }
}
```

### 8. `/src/lib/events/event-emitter.ts` - Event System

```typescript
// src/lib/events/event-emitter.ts
import { EventEmitter } from 'events'
import { logger } from '@/lib/monitoring'

export interface SystemEvents {
  // User events
  'user:created': { user: any }
  'user:updated': { user: any }
  'user:deleted': { userId: string }
  'user:statusChanged': { user: any; status: string; reason?: string }
  'user:levelUp': { userId: string; oldLevel: number; newLevel: number }
  
  // Auth events
  'auth:login': { userId: string; ipAddress: string }
  'auth:logout': { sessionToken: string }
  'auth:emailVerified': { userId: string }
  'auth:passwordReset': { userId: string }
  'auth:sendVerificationEmail': { userId: string; email: string; code: string }
  'auth:sendPasswordResetEmail': { userId: string; email: string; token: string }
  
  // Notification events
  'notification:created': { notification: any }
  'notification:read': { notification: any }
  'notification:allRead': { userId: string }
  'notification:deleted': { notification: any }
  
  // Post events
  'post:created': { post: any }
  'post:updated': { post: any }
  'post:deleted': { postId: string }
  'post:published': { post: any }
  'post:liked': { postId: string; userId: string }
  'post:viewed': { postId: string; userId: string }
  
  // Comment events
  'comment:created': { comment: any }
  'comment:updated': { comment: any }
  'comment:deleted': { commentId: string }
  
  // Achievement events
  'achievement:unlocked': { userId: string; achievementId: string }
  'achievement:progress': { userId: string; achievementId: string; progress: number }
  
  // System events
  'system:error': { error: Error; context?: any }
  'system:warning': { message: string; context?: any }
  'system:info': { message: string; context?: any }
}

class TypedEventEmitter extends EventEmitter {
  emit<K extends keyof SystemEvents>(
    event: K,
    data: SystemEvents[K]
  ): boolean {
    logger.debug(`Event emitted: ${event}`, data)
    return super.emit(event, data)
  }

  on<K extends keyof SystemEvents>(
    event: K,
    listener: (data: SystemEvents[K]) => void
  ): this {
    return super.on(event, listener)
  }

  once<K extends keyof SystemEvents>(
    event: K,
    listener: (data: SystemEvents[K]) => void
  ): this {
    return super.once(event, listener)
  }

  off<K extends keyof SystemEvents>(
    event: K,
    listener: (data: SystemEvents[K]) => void
  ): this {
    return super.off(event, listener)
  }

  removeAllListeners<K extends keyof SystemEvents>(event?: K): this {
    return super.removeAllListeners(event)
  }
}

// Create singleton instance
export const eventEmitter = new TypedEventEmitter()

// Set max listeners to prevent memory leaks warning
eventEmitter.setMaxListeners(50)

// Error handling
eventEmitter.on('error', (error) => {
  logger.error('EventEmitter error:', error)
})

// System event handlers
eventEmitter.on('system:error', ({ error, context }) => {
  logger.error('System error event:', error, context)
})

eventEmitter.on('system:warning', ({ message, context }) => {
  logger.warn('System warning event:', message, context)
})

eventEmitter.on('system:info', ({ message, context }) => {
  logger.info('System info event:', message, context)
})

// Export event types for use in other files
export type { SystemEvents }
```

### 9. `/src/lib/monitoring.ts` - Monitoring and Logging

```typescript
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
```

### 10. `/src/components/error-boundary.tsx` - Error Boundary Component

```typescript
// src/components/error-boundary.tsx
'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import { trackError } from '@/lib/monitoring'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service
    trackError(error, {
      componentStack: errorInfo.componentStack,
      digest: errorInfo.digest,
    })
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return (
        <FallbackComponent
          error={this.state.error!}
          reset={this.reset}
        />
      )
    }

    return this.props.children
  }
}

function DefaultErrorFallback({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="mb-4 rounded-full bg-red-100 p-3 dark:bg-red-900/20">
          <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="mb-2 text-2xl font-bold">Oops! Something went wrong</h2>
        <p className="mb-6 text-muted-foreground">
          We apologize for the inconvenience. An error occurred while loading this page.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <pre className="mb-6 max-w-full overflow-auto rounded-lg bg-gray-100 p-4 text-left text-sm dark:bg-gray-800">
            <code>{error.message}</code>
          </pre>
        )}
        <div className="flex gap-4">
          <Button onClick={reset} variant="default">
            Try Again
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
          >
            Go Home
          </Button>
        </div>
      </div>
    </div>
  )
}

// Async error boundary for Next.js app directory
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>
) {
  return function WithErrorBoundaryComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}
```

### 11. `/src/middleware.ts` - Next.js Middleware

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/security'
import { logger } from '@/lib/monitoring'

// Middleware configuration
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
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

    // CORS headers for API routes
    if (pathname.startsWith('/api')) {
      headers.set('Access-Control-Allow-Credentials', 'true')
      headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_APP_URL || '*')
      headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
      headers.set(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
      )

      // Handle preflight requests
      if (request.method === 'OPTIONS') {
        return new NextResponse(null, { status: 200, headers })
      }
    }

    // Rate limiting for different routes
    let rateLimitConfig = rateLimitConfigs.api

    if (pathname.startsWith('/api/auth')) {
      rateLimitConfig = rateLimitConfigs.auth
    } else if (
      pathname.startsWith('/api/posts') && 
      request.method === 'POST'
    ) {
      rateLimitConfig = rateLimitConfigs.write
    } else if (pathname.startsWith('/api/upload')) {
      rateLimitConfig = rateLimitConfigs.upload
    }

    // Apply rate limiting
    const identifier = getClientIp(request) || 'anonymous'
    const rateLimitResult = await rateLimit(rateLimitConfig, identifier)

    // Set rate limit headers
    headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString())
    headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
    headers.set('X-RateLimit-Reset', rateLimitResult.reset.toISOString())

    if (!rateLimitResult.success) {
      headers.set('Retry-After', rateLimitResult.retryAfter!.toString())
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers,
      })
    }

    // Logging
    const duration = Date.now() - start
    logger.info('Middleware processed request', {
      method: request.method,
      pathname,
      duration: `${duration}ms`,
      ip: identifier,
    })

    // Continue with modified headers
    return NextResponse.next({
      headers,
    })
  } catch (error) {
    logger.error('Middleware error', error, {
      method: request.method,
      pathname,
    })

    // Don't block requests on middleware errors
    return NextResponse.next()
  }
}
```

### 12. `/src/lib/analytics.ts` - Custom Analytics

```typescript
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
```

### 13. `/src/types/index.ts` - Shared Types

```typescript
// src/types/index.ts
import { User, Post, Comment, Notification } from '@prisma/client'

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasMore: boolean
}

export interface CursorPaginatedResponse<T> {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
}

// User types
export interface UserWithProfile extends User {
  profile: {
    displayName: string | null
    location: string | null
    website: string | null
    bannerImage: string | null
  } | null
}

export interface PublicUser {
  id: string
  username: string
  image: string | null
  bio: string | null
  verified: boolean
  level: number
  createdAt: Date
}

export interface UserStats {
  posts: number
  followers: number
  following: number
  likes: number
}

// Post types
export interface PostWithAuthor extends Post {
  author: PublicUser
  _count: {
    comments: number
    reactions: number
  }
}

export interface PostWithDetails extends PostWithAuthor {
  tags: Array<{
    tag: {
      id: string
      name: string
      slug: string
    }
  }>
  reactions: Array<{
    type: string
    userId: string
  }>
}

// Comment types
export interface CommentWithAuthor extends Comment {
  author: PublicUser
  _count: {
    reactions: number
    replies: number
  }
}

export interface CommentWithReplies extends CommentWithAuthor {
  replies: CommentWithAuthor[]
  reactions: Array<{
    type: string
    userId: string
  }>
}

// Notification types
export interface NotificationWithActor extends Notification {
  actor: PublicUser | null
}

// Form types
export interface LoginFormData {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterFormData {
  email: string
  username: string
  password: string
  confirmPassword: string
  agreeToTerms: boolean
}

export interface PostFormData {
  title: string
  content: string
  excerpt?: string
  coverImage?: string
  tags: string[]
  published: boolean
}

export interface ProfileFormData {
  displayName?: string
  bio?: string
  location?: string
  website?: string
  socialLinks?: {
    twitter?: string
    instagram?: string
    tiktok?: string
    discord?: string
    youtube?: string
  }
}

// Search types
export interface SearchFilters {
  query: string
  type?: 'posts' | 'users' | 'tags'
  sortBy?: 'relevance' | 'recent' | 'popular'
  timeRange?: 'day' | 'week' | 'month' | 'year' | 'all'
  tags?: string[]
}

// WebSocket event types
export interface SocketEvents {
  // Connection events
  connect: () => void
  disconnect: (reason: string) => void
  error: (error: Error) => void

  // User events
  userOnline: (userId: string) => void
  userOffline: (userId: string) => void
  userTyping: (data: { userId: string; channelId: string }) => void

  // Notification events
  notification: (notification: NotificationWithActor) => void

  // Real-time updates
  postUpdate: (post: PostWithAuthor) => void
  commentUpdate: (comment: CommentWithAuthor) => void
  reactionUpdate: (data: { 
    entityType: 'post' | 'comment'
    entityId: string
    reactions: Record<string, number>
  }) => void
}

// Error types
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400,
    public isOperational: boolean = true
  ) {
    super(message)
    this.name = 'AppError'
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public fields?: Record<string, string>) {
    super(message, 'VALIDATION_ERROR', 400)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403)
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404)
    this.name = 'NotFoundError'
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter: number) {
    super('Too many requests', 'RATE_LIMIT_ERROR', 429)
    this.name = 'RateLimitError'
  }
}

// Utility types
export type Nullable<T> = T | null
export type Optional<T> = T | undefined
export type Maybe<T> = T | null | undefined

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
  Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
  }[Keys]

export type RequireOnlyOne<T, Keys extends keyof T = keyof T> =
  Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?:
      Required<Pick<T, K>> &
      Partial<Record<Exclude<Keys, K>, undefined>>
  }[Keys]
```

### 14. `/src/app/layout.tsx` - Updated Root Layout

```typescript
// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { AuthProvider } from '@/components/providers/auth-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { QueryProvider } from '@/components/providers/query-provider'
import { Toaster } from '@/components/ui/toaster'
import { ErrorBoundary } from '@/components/error-boundary'
import { trackPageView } from '@/lib/analytics'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: 'Sparkle Universe - Where Fans Become Stars',
    template: '%s | Sparkle Universe',
  },
  description: 'The next-generation community platform for Sparkle YouTube fans. Connect, create, and celebrate your passion in a vibrant, feature-rich environment.',
  keywords: ['Sparkle', 'YouTube', 'community', 'blog', 'forum', 'fan platform'],
  authors: [{ name: 'Sparkle Universe Team' }],
  creator: 'Sparkle Universe',
  publisher: 'Sparkle Universe',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Sparkle Universe',
    title: 'Sparkle Universe - Where Fans Become Stars',
    description: 'The next-generation community platform for Sparkle YouTube fans.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Sparkle Universe',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sparkle Universe - Where Fans Become Stars',
    description: 'The next-generation community platform for Sparkle YouTube fans.',
    images: ['/twitter-image.png'],
    creator: '@sparkleuniverse',
    site: '@sparkleuniverse',
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
      },
    ],
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: '/',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

// Track page views on route changes
function ClientAnalytics() {
  'use client'
  
  if (typeof window !== 'undefined') {
    trackPageView(window.location.pathname, document.referrer)
  }
  
  return null
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Prevent FOUC (Flash of Unstyled Content)
              try {
                const theme = localStorage.getItem('theme') || 'dark';
                document.documentElement.classList.add(theme);
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ErrorBoundary>
          <AuthProvider>
            <QueryProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="dark"
                enableSystem
                disableTransitionOnChange
              >
                {children}
                <Toaster />
                <Analytics />
                <SpeedInsights />
                <ClientAnalytics />
              </ThemeProvider>
            </QueryProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
```

### 15. `/src/lib/utils.ts` - Enhanced Utilities

```typescript
// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistance, formatRelative, isValid } from 'date-fns'

/**
 * Merge Tailwind CSS classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date to a human-readable string
 */
export function formatDate(date: Date | string | number): string {
  const d = new Date(date)
  if (!isValid(d)) return 'Invalid date'
  
  return format(d, 'MMMM d, yyyy')
}

/**
 * Format a date to relative time (e.g., "2 hours ago")
 */
export function formatRelativeDate(date: Date | string | number): string {
  const d = new Date(date)
  if (!isValid(d)) return 'Invalid date'
  
  return formatDistance(d, new Date(), { addSuffix: true })
}

/**
 * Format a date with full relative context
 */
export function formatRelativeDateTime(date: Date | string | number): string {
  const d = new Date(date)
  if (!isValid(d)) return 'Invalid date'
  
  return formatRelative(d, new Date())
}

/**
 * Generate an absolute URL
 */
export function absoluteUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
}

/**
 * Generate a username from an email
 */
export function generateUsername(email: string): string {
  const base = email.split('@')[0].toLowerCase()
  const cleanBase = base.replace(/[^a-z0-9]/g, '')
  const random = Math.random().toString(36).substring(2, 6)
  return `${cleanBase}${random}`
}

/**
 * Generate a slug from a title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading and trailing hyphens
    .substring(0, 100) // Limit length
}

/**
 * Format a number to a human-readable string
 */
export function formatNumber(num: number): string {
  const formatter = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
  })
  return formatter.format(num)
}

/**
 * Format a number with full formatting
 */
export function formatLongNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

/**
 * Format currency
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD'
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

/**
 * Format duration in seconds to a readable format
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

/**
 * Truncate text to a maximum length
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * Strip HTML tags from a string
 */
export function stripHtml(html: string): string {
  if (typeof window !== 'undefined') {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    return doc.body.textContent || ''
  }
  return html.replace(/<[^>]*>/g, '').trim()
}

/**
 * Get initials from a name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Throttle a function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Get error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  }
  return 'An unexpected error occurred'
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json)
  } catch {
    return fallback
  }
}

/**
 * Check if running on client
 */
export const isClient = typeof window !== 'undefined'

/**
 * Check if running on server
 */
export const isServer = !isClient

/**
 * Sleep for a given number of milliseconds
 */
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    retries?: number
    delay?: number
    maxDelay?: number
    factor?: number
    onRetry?: (error: Error, attempt: number) => void
  } = {}
): Promise<T> {
  const {
    retries = 3,
    delay = 1000,
    maxDelay = 30000,
    factor = 2,
    onRetry,
  } = options

  let lastError: Error

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      if (attempt === retries) {
        throw lastError
      }

      const waitTime = Math.min(delay * Math.pow(factor, attempt), maxDelay)
      
      if (onRetry) {
        onRetry(lastError, attempt + 1)
      }

      await sleep(waitTime)
    }
  }

  throw lastError!
}

/**
 * Create a cancellable promise
 */
export function makeCancellable<T>(promise: Promise<T>) {
  let hasCancelled = false

  const wrappedPromise = new Promise<T>((resolve, reject) => {
    promise.then(
      value => (hasCancelled ? reject({ isCancelled: true }) : resolve(value)),
      error => (hasCancelled ? reject({ isCancelled: true }) : reject(error))
    )
  })

  return {
    promise: wrappedPromise,
    cancel() {
      hasCancelled = true
    },
  }
}

/**
 * Get YouTube video ID from URL
 */
export function getYouTubeVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  const match = url.match(regex)
  return match ? match[1] : null
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`
}

/**
 * Generate a random color
 */
export function generateRandomColor(): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#6C5CE7', '#A29BFE', '#FD79A8', '#FDCB6E', '#6C5CE7',
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

/**
 * Check if a string is a valid URL
 */
export function isValidUrl(string: string): boolean {
  try {
    new URL(string)
    return true
  } catch {
    return false
  }
}

/**
 * Get query parameters from URL
 */
export function getQueryParams(url: string): Record<string, string> {
  const params = new URLSearchParams(new URL(url).search)
  const result: Record<string, string> = {}
  
  params.forEach((value, key) => {
    result[key] = value
  })
  
  return result
}

/**
 * Merge and deduplicate arrays
 */
export function uniqueArray<T>(array: T[]): T[] {
  return Array.from(new Set(array))
}

/**
 * Group array items by key
 */
export function groupBy<T>(
  array: T[],
  key: keyof T | ((item: T) => string)
): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = typeof key === 'function' ? key(item) : String(item[key])
    if (!result[groupKey]) {
      result[groupKey] = []
    }
    result[groupKey].push(item)
    return result
  }, {} as Record<string, T[]>)
}

/**
 * Pick specific keys from an object
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key]
    }
  })
  return result
}

/**
 * Omit specific keys from an object
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj }
  keys.forEach(key => {
    delete result[key]
  })
  return result as Omit<T, K>
}
```
