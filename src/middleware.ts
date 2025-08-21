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
