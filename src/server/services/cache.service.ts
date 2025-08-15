// src/server/services/cache.service.ts
import Redis from 'ioredis'
import { z } from 'zod'

// Cache configuration
const CACHE_PREFIX = 'sparkle:'
const DEFAULT_TTL = 300 // 5 minutes in seconds

export class CacheService {
  private static instance: CacheService
  private redis: Redis | null = null
  private isConnected: boolean = false

  constructor() {
    // Singleton pattern
    if (CacheService.instance) {
      return CacheService.instance
    }

    this.initializeRedis()
    CacheService.instance = this
  }

  private initializeRedis() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
      
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true,
        retryStrategy: (times) => {
          if (times > 3) {
            console.error('Redis connection failed after 3 retries')
            return null
          }
          return Math.min(times * 200, 2000)
        },
      })

      this.redis.on('connect', () => {
        this.isConnected = true
        console.log('Redis connected successfully')
      })

      this.redis.on('error', (error) => {
        console.error('Redis error:', error)
        this.isConnected = false
      })

      this.redis.on('close', () => {
        this.isConnected = false
        console.log('Redis connection closed')
      })

      // Connect to Redis
      this.redis.connect().catch((error) => {
        console.error('Failed to connect to Redis:', error)
        this.isConnected = false
      })
    } catch (error) {
      console.error('Failed to initialize Redis:', error)
      this.redis = null
      this.isConnected = false
    }
  }

  /**
   * Get a value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    if (!this.isConnected || !this.redis) {
      return null
    }

    try {
      const fullKey = `${CACHE_PREFIX}${key}`
      const value = await this.redis.get(fullKey)
      
      if (!value) {
        return null
      }

      return JSON.parse(value) as T
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error)
      return null
    }
  }

  /**
   * Set a value in cache with optional TTL
   */
  async set<T = any>(key: string, value: T, ttl: number = DEFAULT_TTL): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      return false
    }

    try {
      const fullKey = `${CACHE_PREFIX}${key}`
      const serialized = JSON.stringify(value)
      
      if (ttl > 0) {
        await this.redis.setex(fullKey, ttl, serialized)
      } else {
        await this.redis.set(fullKey, serialized)
      }
      
      return true
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error)
      return false
    }
  }

  /**
   * Delete a key from cache
   */
  async del(key: string | string[]): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      return false
    }

    try {
      const keys = Array.isArray(key) ? key : [key]
      const fullKeys = keys.map(k => `${CACHE_PREFIX}${k}`)
      
      if (fullKeys.length > 0) {
        await this.redis.del(...fullKeys)
      }
      
      return true
    } catch (error) {
      console.error(`Cache delete error for keys:`, error)
      return false
    }
  }

  /**
   * Delete all keys matching a pattern
   */
  async delPattern(pattern: string): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      return false
    }

    try {
      const fullPattern = `${CACHE_PREFIX}${pattern}*`
      const keys = await this.redis.keys(fullPattern)
      
      if (keys.length > 0) {
        // Remove the prefix before passing to del
        const cleanKeys = keys.map(k => k.replace(CACHE_PREFIX, ''))
        await this.del(cleanKeys)
      }
      
      return true
    } catch (error) {
      console.error(`Cache delete pattern error for ${pattern}:`, error)
      return false
    }
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      return false
    }

    try {
      const fullKey = `${CACHE_PREFIX}${key}`
      const exists = await this.redis.exists(fullKey)
      return exists === 1
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error)
      return false
    }
  }

  /**
   * Get remaining TTL for a key
   */
  async ttl(key: string): Promise<number> {
    if (!this.isConnected || !this.redis) {
      return -1
    }

    try {
      const fullKey = `${CACHE_PREFIX}${key}`
      return await this.redis.ttl(fullKey)
    } catch (error) {
      console.error(`Cache TTL error for key ${key}:`, error)
      return -1
    }
  }

  /**
   * Increment a numeric value
   */
  async incr(key: string, amount: number = 1): Promise<number | null> {
    if (!this.isConnected || !this.redis) {
      return null
    }

    try {
      const fullKey = `${CACHE_PREFIX}${key}`
      return await this.redis.incrby(fullKey, amount)
    } catch (error) {
      console.error(`Cache increment error for key ${key}:`, error)
      return null
    }
  }

  /**
   * Decrement a numeric value
   */
  async decr(key: string, amount: number = 1): Promise<number | null> {
    if (!this.isConnected || !this.redis) {
      return null
    }

    try {
      const fullKey = `${CACHE_PREFIX}${key}`
      return await this.redis.decrby(fullKey, amount)
    } catch (error) {
      console.error(`Cache decrement error for key ${key}:`, error)
      return null
    }
  }

  /**
   * Set value with expiration only if key doesn't exist
   */
  async setNX(key: string, value: any, ttl: number = DEFAULT_TTL): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      return false
    }

    try {
      const fullKey = `${CACHE_PREFIX}${key}`
      const serialized = JSON.stringify(value)
      const result = await this.redis.set(fullKey, serialized, 'EX', ttl, 'NX')
      return result === 'OK'
    } catch (error) {
      console.error(`Cache setNX error for key ${key}:`, error)
      return false
    }
  }

  /**
   * Get multiple values at once
   */
  async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
    if (!this.isConnected || !this.redis || keys.length === 0) {
      return keys.map(() => null)
    }

    try {
      const fullKeys = keys.map(k => `${CACHE_PREFIX}${k}`)
      const values = await this.redis.mget(...fullKeys)
      
      return values.map(value => {
        if (!value) return null
        try {
          return JSON.parse(value) as T
        } catch {
          return null
        }
      })
    } catch (error) {
      console.error(`Cache mget error:`, error)
      return keys.map(() => null)
    }
  }

  /**
   * Set multiple values at once
   */
  async mset(items: Record<string, any>, ttl: number = DEFAULT_TTL): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      return false
    }

    try {
      const pipeline = this.redis.pipeline()
      
      for (const [key, value] of Object.entries(items)) {
        const fullKey = `${CACHE_PREFIX}${key}`
        const serialized = JSON.stringify(value)
        
        if (ttl > 0) {
          pipeline.setex(fullKey, ttl, serialized)
        } else {
          pipeline.set(fullKey, serialized)
        }
      }
      
      await pipeline.exec()
      return true
    } catch (error) {
      console.error(`Cache mset error:`, error)
      return false
    }
  }

  /**
   * Clear all cache (use with caution)
   */
  async flush(): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      return false
    }

    try {
      const keys = await this.redis.keys(`${CACHE_PREFIX}*`)
      if (keys.length > 0) {
        await this.redis.del(...keys)
      }
      return true
    } catch (error) {
      console.error('Cache flush error:', error)
      return false
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    connected: boolean
    keyCount: number
    memoryUsage: string
  } | null> {
    if (!this.isConnected || !this.redis) {
      return {
        connected: false,
        keyCount: 0,
        memoryUsage: '0 KB',
      }
    }

    try {
      const keys = await this.redis.keys(`${CACHE_PREFIX}*`)
      const info = await this.redis.info('memory')
      const memoryMatch = info.match(/used_memory_human:(.+)/)
      
      return {
        connected: this.isConnected,
        keyCount: keys.length,
        memoryUsage: memoryMatch ? memoryMatch[1].trim() : 'Unknown',
      }
    } catch (error) {
      console.error('Cache stats error:', error)
      return null
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit()
      this.isConnected = false
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService()
