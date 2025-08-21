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
