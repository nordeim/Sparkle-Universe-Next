// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { 
  format, 
  formatDistance, 
  formatRelative, 
  isValid, 
  parseISO,
  differenceInDays,
  addDays,
  startOfDay,
  endOfDay 
} from 'date-fns'
import type { ZodError, ZodSchema } from 'zod'
import { Decimal } from 'decimal.js'

// ============ CORE UTILITIES ============

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============ MISSING EXPORTS FOR TYPE FIXES ============

/**
 * Format a percentage value
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * Format duration in milliseconds to human readable format
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

/**
 * Format relative time with more detail
 */
export function formatRelativeTime(date: Date | string | number): string {
  const d = typeof date === 'string' ? parseISO(date) : new Date(date)
  if (!isValid(d)) return 'Invalid date'
  
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  
  return formatDistance(d, now, { addSuffix: true })
}

/**
 * Generate unique code for various purposes
 */
export function generateUniqueCode(prefix: string = '', length: number = 8): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 2 + length)
  return prefix ? `${prefix}_${timestamp}_${randomPart}` : `${timestamp}_${randomPart}`
}

// ============ SPARKLE UNIVERSE CONSTANTS ============

export const SPARKLE_CONSTANTS = {
  // XP Rewards (from PRD)
  XP_REWARDS: {
    POST_CREATE: 10,
    COMMENT_CREATE: 5,
    QUALITY_POST_BONUS: 50,
    HELPFUL_COMMENT: 20,
    DAILY_LOGIN: 10,
    FIRST_POST_OF_DAY: 15,
    STREAK_BONUS: 5,
    ACHIEVEMENT_UNLOCK: 25,
    QUEST_COMPLETE: 30,
    LEVEL_UP: 100,
  },
  
  // Currency Conversion (from PRD)
  CURRENCY: {
    USD_TO_PREMIUM: 100,        // $1 = 100 Premium Points
    SPARKLE_TO_PREMIUM: 1000,   // 1000 Sparkle = 1 Premium
    PLATFORM_FEE: 0.30,         // 30% platform fee
    CREATOR_SHARE: 0.70,        // 70% creator share
    MIN_PAYOUT: 10.00,          // $10 minimum payout
    MIN_TIP: 0.50,              // $0.50 minimum tip
  },
  
  // Rate Limits (from PRD)
  RATE_LIMITS: {
    COMMENTS_PER_MINUTE: 5,
    POSTS_PER_HOUR: 10,
    API_PER_HOUR_AUTH: 1000,
    API_PER_HOUR_UNAUTH: 100,
    LOGIN_ATTEMPTS: 5,
  },
  
  // Subscription Tiers
  SUBSCRIPTION_TIERS: {
    FREE: { price: 0, xpMultiplier: 1 },
    SPARKLE_FAN: { price: 4.99, xpMultiplier: 2 },
    SPARKLE_CREATOR: { price: 9.99, xpMultiplier: 3 },
    SPARKLE_LEGEND: { price: 19.99, xpMultiplier: 5 },
  },
  
  // Comment Nesting
  MAX_COMMENT_DEPTH: 5,
  
  // Badge Rarities
  BADGE_RARITY_COLORS: {
    COMMON: '#9CA3AF',
    UNCOMMON: '#10B981',
    RARE: '#3B82F6',
    EPIC: '#8B5CF6',
    LEGENDARY: '#F59E0B',
    MYTHIC: '#EC4899',
    LIMITED_EDITION: '#EF4444',
    SEASONAL: '#14B8A6',
  },
}

// ============ GAMIFICATION CALCULATIONS ============

/**
 * Calculate user level from XP (from PRD formula)
 */
export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1
}

/**
 * Calculate XP required for next level
 */
export function calculateXpForLevel(level: number): number {
  return Math.pow(level - 1, 2) * 100
}

/**
 * Calculate XP progress to next level
 */
export function calculateXpProgress(xp: number): { 
  currentLevel: number
  nextLevel: number
  currentXp: number
  requiredXp: number
  progress: number 
} {
  const currentLevel = calculateLevel(xp)
  const nextLevel = currentLevel + 1
  const currentLevelXp = calculateXpForLevel(currentLevel)
  const nextLevelXp = calculateXpForLevel(nextLevel)
  const progressXp = xp - currentLevelXp
  const requiredXp = nextLevelXp - currentLevelXp
  
  return {
    currentLevel,
    nextLevel,
    currentXp: progressXp,
    requiredXp,
    progress: progressXp / requiredXp,
  }
}

/**
 * Apply XP multiplier based on subscription tier
 */
export function applyXpMultiplier(
  baseXp: number, 
  tier: 'FREE' | 'SPARKLE_FAN' | 'SPARKLE_CREATOR' | 'SPARKLE_LEGEND'
): number {
  const multiplier = SPARKLE_CONSTANTS.SUBSCRIPTION_TIERS[tier].xpMultiplier
  return Math.floor(baseXp * multiplier)
}

// ============ MONETIZATION CALCULATIONS ============

/**
 * Convert USD to Premium Points
 */
export function usdToPremiumPoints(usd: number): number {
  return Math.floor(usd * SPARKLE_CONSTANTS.CURRENCY.USD_TO_PREMIUM)
}

/**
 * Convert Premium Points to USD
 */
export function premiumPointsToUsd(points: number): string {
  const usd = points / SPARKLE_CONSTANTS.CURRENCY.USD_TO_PREMIUM
  return usd.toFixed(2)
}

/**
 * Convert Sparkle Points to Premium Points
 */
export function sparkleToPremium(sparklePoints: number): number {
  return Math.floor(sparklePoints / SPARKLE_CONSTANTS.CURRENCY.SPARKLE_TO_PREMIUM)
}

/**
 * Calculate creator payout (70% share)
 */
export function calculateCreatorPayout(totalRevenue: number | string): {
  platformFee: string
  creatorShare: string
  platformFeeAmount: string
  creatorShareAmount: string
} {
  const revenue = new Decimal(totalRevenue)
  const platformFee = revenue.mul(SPARKLE_CONSTANTS.CURRENCY.PLATFORM_FEE)
  const creatorShare = revenue.mul(SPARKLE_CONSTANTS.CURRENCY.CREATOR_SHARE)
  
  return {
    platformFee: platformFee.toFixed(2),
    creatorShare: creatorShare.toFixed(2),
    platformFeeAmount: `$${platformFee.toFixed(2)}`,
    creatorShareAmount: `$${creatorShare.toFixed(2)}`,
  }
}

// ============ YOUTUBE UTILITIES ============

/**
 * Get YouTube video ID from URL
 */
export function getYouTubeVideoId(url: string): string | null {
  if (!url) return null
  
  const patterns = [
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
    /youtube\.com\/embed\/([^"&?\/\s]{11})/,
    /youtube\.com\/watch\?v=([^"&?\/\s]{11})/,
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  
  return null
}

/**
 * Get YouTube thumbnail URL
 */
export function getYouTubeThumbnail(
  videoId: string, 
  quality: 'default' | 'hq' | 'maxres' = 'hq'
): string {
  const qualityMap = {
    default: 'default',
    hq: 'hqdefault',
    maxres: 'maxresdefault',
  }
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`
}

/**
 * Format YouTube timestamp for display (e.g., "1:23:45")
 */
export function formatYouTubeTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

/**
 * Parse YouTube timestamp to seconds
 */
export function parseYouTubeTimestamp(timestamp: string): number {
  const parts = timestamp.split(':').reverse()
  let seconds = parseInt(parts[0] || '0')
  if (parts[1]) seconds += parseInt(parts[1]) * 60
  if (parts[2]) seconds += parseInt(parts[2]) * 3600
  return seconds
}

// ============ DATE FORMATTING (ENHANCED) ============

export function formatDate(date: Date | string | number | null | undefined): string {
  if (!date) return 'N/A'
  const d = typeof date === 'string' ? parseISO(date) : new Date(date)
  if (!isValid(d)) return 'Invalid date'
  return format(d, 'PPP')
}

export function formatDateTime(date: Date | string | number | null | undefined): string {
  if (!date) return 'N/A'
  const d = typeof date === 'string' ? parseISO(date) : new Date(date)
  if (!isValid(d)) return 'Invalid date'
  return format(d, 'PPp')
}

export function formatRelativeDate(date: Date | string | number | null | undefined): string {
  if (!date) return 'N/A'
  const d = typeof date === 'string' ? parseISO(date) : new Date(date)
  if (!isValid(d)) return 'Invalid date'
  
  const daysDiff = differenceInDays(new Date(), d)
  
  if (daysDiff === 0) return 'Today'
  if (daysDiff === 1) return 'Yesterday'
  if (daysDiff < 7) return formatRelative(d, new Date())
  if (daysDiff < 30) return `${Math.floor(daysDiff / 7)} week${Math.floor(daysDiff / 7) > 1 ? 's' : ''} ago`
  
  return formatDistance(d, new Date(), { addSuffix: true })
}

export function formatTimeAgo(date: Date | string | number | null | undefined): string {
  if (!date) return 'N/A'
  const d = typeof date === 'string' ? parseISO(date) : new Date(date)
  if (!isValid(d)) return 'Invalid date'
  return formatDistance(d, new Date(), { addSuffix: true, includeSeconds: true })
}

// ============ CONTENT PROCESSING (FIXED) ============

export function extractExcerpt(content: string | null | undefined, maxLength: number = 160): string {
  if (!content) return ''
  
  const text = content
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim()
  
  if (text.length <= maxLength) return text
  
  const truncated = text.substring(0, maxLength)
  const lastPeriod = truncated.lastIndexOf('.')
  const lastSpace = truncated.lastIndexOf(' ')
  
  if (lastPeriod > maxLength * 0.8) {
    return truncated.substring(0, lastPeriod + 1)
  }
  
  return truncated.substring(0, lastSpace) + '...'
}

export function calculateReadingTime(content: string | null | undefined): number {
  if (!content) return 0
  const wordsPerMinute = 225
  const text = stripHtml(content)
  const wordCount = text.split(/\s+/).filter(word => word.length > 0).length
  const readingTime = Math.ceil(wordCount / wordsPerMinute)
  return Math.max(1, readingTime)
}

export function formatReadingTime(minutes: number): string {
  if (minutes === 1) return '1 min read'
  return `${minutes} min read`
}

// ============ STRING MANIPULATION (FIXED) ============

export function generateUsername(email: string | null | undefined, randomLength: number = 4): string {
  if (!email) return `user${Math.random().toString(36).substring(2, 2 + randomLength)}`
  const base = email.split('@')[0].toLowerCase()
  const cleanBase = base.replace(/[^a-z0-9]/g, '').substring(0, 12)
  const random = Math.random().toString(36).substring(2, 2 + randomLength)
  return `${cleanBase}${random}`
}

export function generateSlug(title: string | null | undefined): string {
  if (!title) return ''
  return title
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100)
}

export function truncate(text: string | null | undefined, maxLength: number, suffix: string = '...'): string {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - suffix.length).trim() + suffix
}

export function stripHtml(html: string | null | undefined): string {
  if (!html) return ''
  
  if (typeof window !== 'undefined' && typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    return doc.body.textContent || ''
  }
  
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function getInitials(name: string | null | undefined, maxLength: number = 2): string {
  if (!name) return ''
  
  const parts = name.trim().split(/\s+/)
  
  if (parts.length === 1) {
    return parts[0].substring(0, maxLength).toUpperCase()
  }
  
  return parts
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, maxLength)
}

// ============ NUMBER FORMATTING ============

export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '0'
  const formatter = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  })
  return formatter.format(num)
}

export function formatLongNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '0'
  return new Intl.NumberFormat('en-US').format(num)
}

export function formatCurrency(
  amount: number | string | null | undefined, 
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  if (amount === null || amount === undefined) return '$0.00'
  const value = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatPoints(points: number | null | undefined, type: 'sparkle' | 'premium' = 'sparkle'): string {
  if (points === null || points === undefined) return type === 'sparkle' ? '✨ 0' : '💎 0'
  const formatted = formatLongNumber(points)
  const icon = type === 'sparkle' ? '✨' : '💎'
  return `${icon} ${formatted}`
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || bytes === 0) return '0 B'
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`
}

// ============ BADGE & RARITY UTILITIES ============

export function getBadgeRarityColor(rarity: string): string {
  return SPARKLE_CONSTANTS.BADGE_RARITY_COLORS[rarity as keyof typeof SPARKLE_CONSTANTS.BADGE_RARITY_COLORS] || '#9CA3AF'
}

export function getBadgeRarityClass(rarity: string): string {
  const rarityLower = rarity.toLowerCase().replace('_', '-')
  return `badge-${rarityLower}`
}

export function calculateBadgeRarityPercentage(rarity: string): string {
  const percentages = {
    COMMON: '50%+',
    UNCOMMON: '30-50%',
    RARE: '10-30%',
    EPIC: '5-10%',
    LEGENDARY: '1-5%',
    MYTHIC: '<1%',
    LIMITED_EDITION: 'Limited',
    SEASONAL: 'Seasonal',
  }
  return percentages[rarity as keyof typeof percentages] || 'Unknown'
}

// ============ SOCKET.IO UTILITIES ============

export function createSocketRoom(type: string, id: string): string {
  return `${type}:${id}`
}

export function parseSocketRoom(room: string): { type: string; id: string } | null {
  const parts = room.split(':')
  if (parts.length !== 2) return null
  return { type: parts[0], id: parts[1] }
}

export function createSocketEvent(type: string, action: string): string {
  return `${type}:${action}`
}

// ============ REACTION UTILITIES ============

export const REACTION_EMOJIS = {
  LIKE: '👍',
  LOVE: '❤️',
  FIRE: '🔥',
  SPARKLE: '✨',
  MIND_BLOWN: '🤯',
  LAUGH: '😂',
  CRY: '😢',
  ANGRY: '😠',
  CUSTOM: '⭐',
}

export function getReactionEmoji(type: string): string {
  return REACTION_EMOJIS[type as keyof typeof REACTION_EMOJIS] || '👍'
}

// ============ PERFORMANCE UTILITIES ============

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  let lastArgs: Parameters<T> | null = null
  const { leading = false, trailing = true } = options
  
  return function debounced(...args: Parameters<T>) {
    lastArgs = args
    
    if (!timeout && leading) {
      func(...args)
    }
    
    if (timeout) clearTimeout(timeout)
    
    timeout = setTimeout(() => {
      if (trailing && lastArgs) {
        func(...lastArgs)
      }
      timeout = null
      lastArgs = null
    }, wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  let lastFunc: NodeJS.Timeout | null = null
  let lastRan: number | null = null
  
  return function throttled(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      lastRan = Date.now()
      inThrottle = true
    } else {
      if (lastFunc) clearTimeout(lastFunc)
      lastFunc = setTimeout(() => {
        if (lastRan && Date.now() - lastRan >= limit) {
          func(...args)
          lastRan = Date.now()
        }
      }, limit - (Date.now() - (lastRan || 0)))
    }
  }
}

// ============ ERROR HANDLING ============

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
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

export function parseZodError(error: ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {}
  
  error.errors.forEach((err) => {
    const path = err.path.join('.')
    fieldErrors[path] = err.message
  })
  
  return fieldErrors
}

// ============ URL UTILITIES ============

export function absoluteUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  if (path.startsWith('http')) return path
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
}

export function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function getQueryParams(url: string): Record<string, string> {
  const params = new URLSearchParams(new URL(url).search)
  return Object.fromEntries(params.entries())
}

export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value))
    }
  })
  
  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

// ============ ASYNC UTILITIES ============

export const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms))

export const wait = sleep

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

// ============ ENVIRONMENT & PLATFORM ============

export const isClient = typeof window !== 'undefined'
export const isServer = !isClient
export const isDevelopment = process.env.NODE_ENV === 'development'
export const isProduction = process.env.NODE_ENV === 'production'
export const isTest = process.env.NODE_ENV === 'test'

// ============ SPARKLE UI UTILITIES ============

export function generateSparkleGradient(angle: number = 135): string {
  return `linear-gradient(${angle}deg, #8B5CF6, #EC4899, #10B981)`
}

export function generateRandomSparkleColor(): string {
  const colors = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B']
  return colors[Math.floor(Math.random() * colors.length)]
}

export function generateSparkleParticles(count: number = 5): Array<{
  id: string
  x: number
  y: number
  size: number
  duration: number
  delay: number
}> {
  return Array.from({ length: count }, (_, i) => ({
    id: `sparkle-${i}-${Date.now()}`,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 20 + 10,
    duration: Math.random() * 2 + 1,
    delay: Math.random() * 2,
  }))
}

// ============ DEFAULT EXPORT ============

const utils = {
  cn,
  
  // New Utils
  formatPercentage,
  formatDuration,
  formatRelativeTime,
  generateUniqueCode,

  // Constants
  SPARKLE_CONSTANTS,
  
  // Gamification
  calculateLevel,
  calculateXpForLevel,
  calculateXpProgress,
  applyXpMultiplier,
  
  // Monetization
  usdToPremiumPoints,
  premiumPointsToUsd,
  sparkleToPremium,
  calculateCreatorPayout,
  
  // YouTube
  getYouTubeVideoId,
  getYouTubeThumbnail,
  formatYouTubeTimestamp,
  parseYouTubeTimestamp,
  
  // Dates
  formatDate,
  formatDateTime,
  formatRelativeDate,
  formatTimeAgo,
  
  // Content
  extractExcerpt,
  calculateReadingTime,
  formatReadingTime,
  
  // Strings
  generateUsername,
  generateSlug,
  truncate,
  stripHtml,
  getInitials,
  
  // Numbers
  formatNumber,
  formatLongNumber,
  formatCurrency,
  formatPoints,
  formatFileSize,
  
  // Badges
  getBadgeRarityColor,
  getBadgeRarityClass,
  calculateBadgeRarityPercentage,
  
  // Socket.IO
  createSocketRoom,
  parseSocketRoom,
  createSocketEvent,
  
  // Reactions
  REACTION_EMOJIS,
  getReactionEmoji,
  
  // Performance
  debounce,
  throttle,
  
  // Error Handling
  getErrorMessage,
  safeJsonParse,
  parseZodError,
  
  // URLs
  absoluteUrl,
  isValidUrl,
  getQueryParams,
  buildQueryString,
  
  // Async
  sleep,
  wait,
  retry,
  
  // Environment
  isClient,
  isServer,
  isDevelopment,
  isProduction,
  isTest,
  
  // Sparkle UI
  generateSparkleGradient,
  generateRandomSparkleColor,
  generateSparkleParticles,
}

export default utils