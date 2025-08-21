// src/components/providers/query-provider.tsx
'use client'

import * as React from 'react'
import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
  type QueryClientConfig,
} from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { logger } from '@/lib/monitoring'
import { toast } from 'sonner'

/**
 * Create a stable QueryClient instance with production-ready configuration
 */
function makeQueryClient(): QueryClient {
  const queryClientConfig: QueryClientConfig = {
    defaultOptions: {
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
          // Retry up to 3 times for other errors
          return failureCount < 3
        },
        // Retry delay with exponential backoff
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Refetch on window focus in production only
        refetchOnWindowFocus: process.env.NODE_ENV === 'production',
        // Don't refetch on reconnect by default
        refetchOnReconnect: 'always',
      },
      mutations: {
        // Retry mutations once on network error
        retry: 1,
        retryDelay: 1000,
      },
    },
    // Query cache with global error handling
    queryCache: new QueryCache({
      onError: (error, query) => {
        // Log errors in development
        if (process.env.NODE_ENV === 'development') {
          logger.error('Query error:', {
            queryKey: query.queryKey,
            error: error instanceof Error ? error.message : error,
          })
        }
        
        // Show user-friendly error messages
        if (query.state.data !== undefined) {
          toast.error('Failed to fetch data. Please try again.')
        }
      },
      onSuccess: (data, query) => {
        // Log successful queries in development for debugging
        if (process.env.NODE_ENV === 'development') {
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
            error: error instanceof Error ? error.message : error,
          })
        }
        
        // Show user-friendly error messages
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Something went wrong. Please try again.'
        
        // Don't show toast for mutations that handle their own errors
        if (!mutation.options.meta?.skipGlobalError) {
          toast.error(errorMessage)
        }
      },
      onSuccess: (_data, _variables, _context, mutation) => {
        // Show success message if specified in meta
        const successMessage = mutation.options.meta?.successMessage as string
        if (successMessage) {
          toast.success(successMessage)
        }
      },
    }),
  }
  
  return new QueryClient(queryClientConfig)
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
  // NOTE: Avoid useState for query client if you don't expect it to change
  const queryClient = getQueryClient()
  
  return (
    <QueryClientProvider client={queryClient}>
      <React.Suspense fallback={null}>
        {children}
      </React.Suspense>
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false}
          position="bottom-right"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  )
}

/**
 * Custom hook to invalidate queries with logging
 */
export function useInvalidateQueries() {
  const queryClient = getQueryClient()
  
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
  const queryClient = getQueryClient()
  
  return React.useCallback(
    async (queryKey: unknown[], queryFn: () => Promise<unknown>) => {
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Prefetching query:', { queryKey })
      }
      return queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime: 10 * 60 * 1000, // Consider prefetched data fresh for 10 minutes
      })
    },
    [queryClient]
  )
}
