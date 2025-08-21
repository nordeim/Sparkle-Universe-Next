// src/lib/api.ts
import { createTRPCReact } from '@trpc/react-query'
import { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import { type AppRouter } from '@/server/api/root'

export const api = createTRPCReact<AppRouter>()

export type RouterInputs = inferRouterInputs<AppRouter>
export type RouterOutputs = inferRouterOutputs<AppRouter>

// Re-export for convenience
export { type AppRouter } from '@/server/api/root'

// Helper types for common patterns
export type AsyncReturnType<T extends (...args: any) => Promise<any>> = 
  T extends (...args: any) => Promise<infer R> ? R : never

// Utility type for extracting router procedure types
export type InferQueryOutput<
  TRouter extends keyof RouterOutputs,
  TProcedure extends keyof RouterOutputs[TRouter]
> = RouterOutputs[TRouter][TProcedure]

export type InferQueryInput<
  TRouter extends keyof RouterInputs,
  TProcedure extends keyof RouterInputs[TRouter]
> = RouterInputs[TRouter][TProcedure]

// Type-safe error handling
export type TRPCErrorType = 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'BAD_REQUEST' | 'INTERNAL_SERVER_ERROR'

export function isTRPCError(error: unknown): error is { message: string; code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'code' in error
  )
}

// Export common error messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'You must be logged in to perform this action',
  FORBIDDEN: 'You do not have permission to perform this action',
  NOT_FOUND: 'The requested resource was not found',
  BAD_REQUEST: 'Invalid request parameters',
  INTERNAL_SERVER_ERROR: 'An unexpected error occurred',
} as const
