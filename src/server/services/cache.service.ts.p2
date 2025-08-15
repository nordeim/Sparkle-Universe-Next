// src/server/services/cache.service.ts
import { redis } from '@/lib/redis'
import superjson from 'superjson'

export enum CacheType {
  USER_PROFILE = 'user_profile',
  POST_CONTENT = 'post_content',
  FEED = 'feed',
  TRENDING = 'trending',
  LEADERBOARD = 'leaderboard',
  STATS = 'stats',
}

interface CacheTTL {
  [CacheType.USER_PROFILE]: number
  [CacheType.POST_CONTENT]: number
  [CacheType.FEED]: number
  [CacheType.TRENDING]: number
  [CacheType.LEADERBOARD]: number
  [CacheType.STATS]: number
}

const CACHE_TTL: CacheTTL = {
  [CacheType.USER_PROFILE]: 300,    // 5 minutes
  [CacheType.POST_CONTENT]: 600,    // 10 minutes
  [CacheType.FEED]: 60,             // 1 minute
  [CacheType.TRENDING]: 900,        // 15 minutes
  [CacheType.LEADERBOARD]: 300,     // 5 minutes
  [CacheType.STATS]: 1800,          // 30 minutes
}

export class CacheService {
  private prefix = 'cache:'
  private defaultTTL = 300 // 5 minutes default

  async get<T>(key: string, type?: CacheType): Promise<T | null> {
    try {
      const fullKey = this.getKey(key, type)
      const cached = await redis.get(fullKey)
      
      if (!cached) return null
      
      // Use superjson for proper Date/BigInt serialization
      return superjson.parse(cached) as T
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error)
      return null
    }
  }

  async set<T>(key: string, value: T, ttl?: number, type?: CacheType): Promise<void> {
    try {
      const fullKey = this.getKey(key, type)
      const serialized = superjson.stringify(value)
      const finalTTL = ttl || (type ? CACHE_TTL[type] : this.defaultTTL)
      
      await redis.setex(fullKey, finalTTL, serialized)
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error)
    }
  }

  // Maintaining compatibility with original interface
  async del(key: string): Promise<void> {
    try {
      const fullKey = this.getKey(key)
      await redis.del(fullKey)
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error)
    }
  }

  async invalidate(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(`${this.prefix}${pattern}*`)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } catch (error) {
      console.error(`Cache invalidate error for pattern ${pattern}:`, error)
    }
  }

  async invalidateByType(type: CacheType): Promise<void> {
    const pattern = `${this.prefix}${type}:*`
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  }

  async remember<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number,
    type?: CacheType
  ): Promise<T> {
    const cached = await this.get<T>(key, type)
    if (cached !== null) return cached

    const fresh = await fn()
    await this.set(key, fresh, ttl, type)
    return fresh
  }

  async flush(): Promise<void> {
    try {
      const keys = await redis.keys(`${this.prefix}*`)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } catch (error) {
      console.error('Cache flush error:', error)
    }
  }

  private getKey(key: string, type?: CacheType): string {
    return type ? `${this.prefix}${type}:${key}` : `${this.prefix}${key}`
  }

  // Additional utility methods for common patterns
  async increment(key: string, amount: number = 1): Promise<number> {
    const fullKey = this.getKey(key)
    return redis.incrby(fullKey, amount)
  }

  async decrement(key: string, amount: number = 1): Promise<number> {
    const fullKey = this.getKey(key)
    return redis.decrby(fullKey, amount)
  }

  async exists(key: string, type?: CacheType): Promise<boolean> {
    const fullKey = this.getKey(key, type)
    const result = await redis.exists(fullKey)
    return result === 1
  }

  async ttl(key: string, type?: CacheType): Promise<number> {
    const fullKey = this.getKey(key, type)
    return redis.ttl(fullKey)
  }

  async expire(key: string, ttl: number, type?: CacheType): Promise<boolean> {
    const fullKey = this.getKey(key, type)
    const result = await redis.expire(fullKey, ttl)
    return result === 1
  }
}
