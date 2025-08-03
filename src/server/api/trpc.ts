// src/server/api/trpc.ts
import { initTRPC, TRPCError } from '@trpc/server'
import { type CreateNextContextOptions } from '@trpc/server/adapters/next'
import { type FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'
import { getServerSession } from 'next-auth'
import superjson from 'superjson'
import { ZodError } from 'zod'
import { authOptions } from '@/lib/auth/auth.config'
import { db } from '@/lib/db'
import { ratelimit } from '@/lib/rate-limit'
import type { Session } from 'next-auth'

interface CreateContextOptions {
  session: Session | null
  headers: Headers
  req?: Request
}

/**
 * This helper generates the "internals" for a tRPC context.
 */
const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    session: opts.session,
    db,
    headers: opts.headers,
    req: opts.req,
  }
}

/**
 * This is the actual context you will use in your router. It will be used to process every request
 * that goes through your tRPC endpoint.
 */
export const createTRPCContext = async (
  opts: FetchCreateContextFnOptions | CreateNextContextOptions
) => {
  // Get session from NextAuth
  const session = await getServerSession(authOptions)

  // For API routes
  if ('req' in opts && 'res' in opts) {
    return createInnerTRPCContext({
      session,
      headers: new Headers(),
      req: opts.req as any,
    })
  }

  // For app directory
  return createInnerTRPCContext({
    session,
    headers: opts.resHeaders,
    req: opts.req,
  })
}

/**
 * Initialize tRPC backend
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

/**
 * Create a server-side caller
 */
export const createCallerFactory = t.createCallerFactory

/**
 * These are the pieces you use to build your tRPC API
 */
export const createTRPCRouter = t.router
export const publicProcedure = t.procedure

/**
 * Middleware for timing procedures
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now()
  const result = await next()
  const end = Date.now()
  console.log(`[TRPC] ${path} took ${end - start}ms`)
  return result
})

/**
 * Middleware for rate limiting
 */
const rateLimitMiddleware = t.middleware(async ({ ctx, next, path }) => {
  // Get identifier from session or IP
  const identifier = ctx.session?.user?.id ?? ctx.headers.get('x-forwarded-for') ?? 'anonymous'
  
  const { success } = await ratelimit.limit(identifier)
  
  if (!success) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: 'Rate limit exceeded',
    })
  }

  return next()
})

/**
 * Middleware for authenticated procedures
 */
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ 
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to perform this action',
    })
  }
  
  return next({
    ctx: {
      // infers the `session` as non-nullable
      session: { ...ctx.session, user: ctx.session.user },
    },
  })
})

/**
 * Middleware for admin procedures
 */
const enforceUserIsAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  if (ctx.session.user.role !== 'ADMIN') {
    throw new TRPCError({ 
      code: 'FORBIDDEN',
      message: 'You must be an admin to perform this action',
    })
  }

  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  })
})

/**
 * Public (unauthenticated) procedure with rate limiting
 */
export const publicProcedureWithRateLimit = t.procedure
  .use(timingMiddleware)
  .use(rateLimitMiddleware)

/**
 * Protected (authenticated) procedure
 */
export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(rateLimitMiddleware)
  .use(enforceUserIsAuthed)

/**
 * Admin procedure
 */
export const adminProcedure = t.procedure
  .use(timingMiddleware)
  .use(enforceUserIsAuthed)
  .use(enforceUserIsAdmin)
