// src/hooks/use-debounce.ts
import { useEffect, useState, useRef, useCallback } from 'react'

/**
 * Debounce a value with a specified delay
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Debounce a callback function
 * @param callback - The callback to debounce
 * @param delay - The delay in milliseconds
 * @returns A debounced version of the callback
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const callbackRef = useRef(callback)

  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args)
      }, delay)
    },
    [delay]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return debouncedCallback
}

/**
 * Debounce a value with loading state
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds
 * @returns An object with the debounced value and loading state
 */
export function useDebouncedValue<T>(
  value: T,
  delay: number = 500
): {
  debouncedValue: T
  isPending: boolean
} {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    setIsPending(true)

    const handler = setTimeout(() => {
      setDebouncedValue(value)
      setIsPending(false)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return { debouncedValue, isPending }
}

/**
 * Debounce search input with optimizations for Sparkle Universe
 * @param searchTerm - The search term to debounce
 * @param delay - The delay in milliseconds
 * @returns Object with debounced search term and search states
 */
export function useDebouncedSearch(
  searchTerm: string,
  delay: number = 300
): {
  debouncedSearchTerm: string
  isSearching: boolean
  clearSearch: () => void
} {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm)
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (searchTerm) {
      setIsSearching(true)
    }

    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setIsSearching(false)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [searchTerm, delay])

  const clearSearch = useCallback(() => {
    setDebouncedSearchTerm('')
    setIsSearching(false)
  }, [])

  return {
    debouncedSearchTerm,
    isSearching,
    clearSearch,
  }
}

export default useDebounce
