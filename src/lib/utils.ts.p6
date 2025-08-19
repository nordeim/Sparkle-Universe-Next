// src/lib/utils.ts - COMPLETE MERGED VERSION
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistance, isValid } from 'date-fns'

/**
 * Core Tailwind CSS class merger
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============ DATE FORMATTING ============

export function formatDate(date: Date | string | number): string {
  const d = new Date(date)
  if (!isValid(d)) return 'Invalid date'
  return format(d, 'MMMM d, yyyy')
}

export function formatDateTime(date: Date | string | number): string {
  const d = new Date(date)
  if (!isValid(d)) return 'Invalid date'
  return format(d, 'MMM d, yyyy h:mm a')
}

export function formatRelativeDate(date: Date | string | number): string {
  const d = new Date(date)
  if (!isValid(d)) return 'Invalid date'
  return formatDistance(d, new Date(), { addSuffix: true })
}

// ============ CONTENT PROCESSING ============

export function extractExcerpt(content: string, maxLength: number = 160): string {
  // Strip HTML tags
  const text = content.replace(/<[^>]*>/g, '').trim()
  if (text.length <= maxLength) return text

  const truncated = text.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')
  if (lastSpace <= 0) {
    // no space found — return truncated with ellipsis
    return truncated + '...'
  }
  return truncated.substring(0, lastSpace) + '...'
}

export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 225
  const normalized = (content || '').trim()
  if (!normalized) return 1
  const wordCount = normalized.split(/\s+/).filter(Boolean).length
  const readingTime = Math.ceil(wordCount / wordsPerMinute)
  return Math.max(1, readingTime)
}

// ============ STRING MANIPULATION ============

export function generateUsername(emailOrName: string): string {
  const maybeEmail = (emailOrName || '').toLowerCase()
  const base = maybeEmail.includes('@') ? maybeEmail.split('@')[0] : maybeEmail
  const cleanBase = base.replace(/[^a-z0-9]/g, '') || 'user'
  const random = Math.random().toString(36).substring(2, 6)
  return `${cleanBase}${random}`
}

export function generateSlug(title: string): string {
  return (title || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100) // SEO-friendly length limit
}

export function truncate(text: string, maxLength: number): string {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

export function stripHtml(html: string): string {
  if (typeof window !== 'undefined' && typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    return (doc.body.textContent || '').trim()
  }
  return (html || '').replace(/<[^>]*>/g, '').trim()
}

export function getInitials(name: string): string {
  if (!name) return ''
  return name
    .split(' ')
    .map(n => n.trim())
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ============ NUMBER FORMATTING ============

export function formatNumber(num: number): string {
  const formatter = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
  })
  return formatter.format(num)
}

export function formatLongNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

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

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

// ============ YOUTUBE UTILITIES ============

export function getYouTubeVideoId(url: string): string | null {
  const regex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  const match = url.match(regex)
  return match ? match[1] : null
}

// ============ URL UTILITIES ============

export function absoluteUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
}

export function isValidUrl(string: string): boolean {
  try {
    new URL(string)
    return true
  } catch {
    return false
  }
}

export function getQueryParams(url: string): Record<string, string> {
  try {
    const params = new URL(url).searchParams
    const result: Record<string, string> = {}
    params.forEach((value, key) => {
      result[key] = value
    })
    return result
  } catch {
    // fallback for relative URLs
    try {
      const params = new URL(url, 'http://localhost').searchParams
      const result: Record<string, string> = {}
      params.forEach((value, key) => {
        result[key] = value
      })
      return result
    } catch {
      return {}
    }
  }
}

// ============ PERFORMANCE UTILITIES ============

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    if (timeout !== null) clearTimeout(timeout)
    timeout = setTimeout(() => {
      // ignore return value intentionally
      func(...args)
    }, wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// ============ ERROR HANDLING ============

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (error && typeof error === 'object' && 'message' in error) {
    // @ts-expect-error -- dynamic object
    return String((error as any).message)
  }
  return 'An unexpected error occurred'
}

export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T
  } catch {
    return fallback
  }
}

// ============ ASYNC UTILITIES ============

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
export const wait = sleep // Alias for compatibility

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

  let lastError: Error = new Error('Retry failed')

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

  throw lastError
}

// ============ ENVIRONMENT CHECKS ============

export const isClient = typeof window !== 'undefined'
export const isServer = !isClient

// ============ ARRAY UTILITIES ============

export function uniqueArray<T>(array: T[]): T[] {
  return Array.from(new Set(array))
}

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

// ============ OBJECT UTILITIES ============

export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>
  keys.forEach(key => {
    if (key in obj) {
      ;(result as any)[key] = (obj as any)[key]
    }
  })
  return result
}

export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...(obj as any) }
  keys.forEach(key => {
    delete result[key as any]
  })
  return result as Omit<T, K>
}

// ============ UI UTILITIES ============

export function generateRandomColor(): string {
  const colors = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#FFA07A',
    '#98D8C8',
    '#6C5CE7',
    '#A29BFE',
    '#FD79A8',
    '#FDCB6E',
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}
