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
