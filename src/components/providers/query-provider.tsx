// src/components/providers/query-provider.tsx
'use client'

import * as React from 'react'
import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
  type QueryClientConfig,
  type DefaultOptions,
} from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { logger } from '@/lib/monitoring'
import { toast } from 'sonner'

/**
 * Default query and mutation options
 */
const defaultOptions: DefaultOptions = {
  queries: {
    // Stale time: 1 minute (data considered fresh for this duration)
    staleTime: 60 * 1000,
    // Cache time: 5 minutes (data stays in cache after component unmounts)
    gcTime: 5 * 60 * 1000,
    // Retry failed requests 3 times with exponential backoff
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors (client errors)
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false
      }
      // Don't retry on specific error codes
      if (error?.code === 'UNAUTHORIZED' || error?.code === 'FORBIDDEN') {
        return false
      }
      // Retry up to 3 times for other errors
      return failureCount < 3
    },
    // Retry delay with exponential backoff
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Refetch on window focus in production only
    refetchOnWindowFocus: process.env.NODE_ENV === 'production',
    // Always refetch on reconnect
    refetchOnReconnect: 'always',
    // Network mode
    networkMode: 'online',
  },
  mutations: {
    // Retry mutations once on network error
    retry: 1,
    retryDelay: 1000,
    // Network mode
    networkMode: 'online',
  },
}

/**
 * Create a stable QueryClient instance with production-ready configuration
 */
function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions,
    // Query cache with global error handling
    queryCache: new QueryCache({
      onError: (error, query) => {
        // Log errors in development
        if (process.env.NODE_ENV === 'development') {
          logger.error('Query error:', {
            queryKey: query.queryKey,
            error: error instanceof Error ? error.message : String(error),
          })
        }
        
        // Show user-friendly error messages for failed queries with existing data
        if (query.state.data !== undefined) {
          toast.error('Failed to refresh data', {
            description: 'Using cached data. Please check your connection.',
          })
        }
      },
      onSuccess: (data, query) => {
        // Log successful queries in development for debugging
        if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG === 'true') {
          logger.debug('Query success:', {
            queryKey: query.queryKey,
            dataType: typeof data,
          })
        }
      },
    }),
    // Mutation cache with global error handling
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        // Log mutation errors
        if (process.env.NODE_ENV === 'development') {
          logger.error('Mutation error:', {
            mutationKey: mutation.options.mutationKey,
            error: error instanceof Error ? error.message : String(error),
          })
        }
        
        // Handle specific error types
        let errorMessage = 'Something went wrong. Please try again.'
        
        if (error instanceof Error) {
          errorMessage = error.message
        } else if (typeof error === 'object' && error !== null && 'message' in error) {
          errorMessage = String(error.message)
        }
        
        // Don't show toast for mutations that handle their own errors
        if (!mutation.options.meta?.skipGlobalError) {
          toast.error('Operation failed', {
            description: errorMessage,
          })
        }
      },
      onSuccess: (_data, _variables, _context, mutation) => {
        // Show success message if specified in meta
        const meta = mutation.options.meta as { successMessage?: string } | undefined
        if (meta?.successMessage) {
          toast.success(meta.successMessage)
        }
      },
      onSettled: (_data, _error, _variables, _context, mutation) => {
        // Log mutation completion in development
        if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG === 'true') {
          logger.debug('Mutation settled:', {
            mutationKey: mutation.options.mutationKey,
          })
        }
      },
    }),
  })
}

// Singleton query client for SSR
let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient()
  } else {
    // Browser: make client if we don't already have one
    if (!browserQueryClient) browserQueryClient = makeQueryClient()
    return browserQueryClient
  }
}

interface QueryProviderProps {
  children: React.ReactNode
}

/**
 * React Query Provider with Suspense boundary and error handling
 */
export function QueryProvider({ children }: QueryProviderProps) {
  // Use a stable query client
  const [queryClient] = React.useState(() => getQueryClient())
  
  return (
    <QueryClientProvider client={queryClient}>
      <React.Suspense fallback={null}>
        {children}
      </React.Suspense>
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false}
          buttonPosition="bottom-left"
        />
      )}
    </QueryClientProvider>
  )
}

/**
 * Custom hook to invalidate queries with logging
 */
export function useInvalidateQueries() {
  const queryClient = React.useContext(QueryClientProvider as any)?.queryClient || getQueryClient()
  
  return React.useCallback((queryKey: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Invalidating queries:', { queryKey })
    }
    return queryClient.invalidateQueries({ queryKey })
  }, [queryClient])
}

/**
 * Custom hook to prefetch queries
 */
export function usePrefetchQuery() {
  const queryClient = React.useContext(QueryClientProvider as any)?.queryClient || getQueryClient()
  
  return React.useCallback(
    async <T = unknown>(
      queryKey: unknown[], 
      queryFn: () => Promise<T>,
      staleTime?: number
    ) => {
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Prefetching query:', { queryKey })
      }
      return queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime: staleTime || 10 * 60 * 1000, // Default: 10 minutes
      })
    },
    [queryClient]
  )
}

/**
 * Custom hook to cancel queries
 */
export function useCancelQueries() {
  const queryClient = React.useContext(QueryClientProvider as any)?.queryClient || getQueryClient()
  
  return React.useCallback(async (queryKey?: unknown[]) => {
    if (queryKey) {
      await queryClient.cancelQueries({ queryKey })
    } else {
      await queryClient.cancelQueries()
    }
  }, [queryClient])
}

/**
 * Custom hook to reset queries
 */
export function useResetQueries() {
  const queryClient = React.useContext(QueryClientProvider as any)?.queryClient || getQueryClient()
  
  return React.useCallback((queryKey?: unknown[]) => {
    if (queryKey) {
      queryClient.resetQueries({ queryKey })
    } else {
      queryClient.clear()
    }
  }, [queryClient])
}

// Export the query client getter for use in non-React contexts
export { getQueryClient }
