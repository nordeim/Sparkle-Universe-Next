// src/server/services/cache.service.ts
import { redis, redisUtils } from '@/lib/redis'
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
  [CacheType.USER_PROFILE]: 300    // 5 minutes
  [CacheType.POST_CONTENT]: 600    // 10 minutes
  [CacheType.FEED]: 60             // 1 minute
  [CacheType.TRENDING]: 900        // 15 minutes
  [CacheType.LEADERBOARD]: 300     // 5 minutes
  [CacheType.STATS]: 1800          // 30 minutes
}

const CACHE_TTL: CacheTTL = {
  [CacheType.USER_PROFILE]: 300,
  [CacheType.POST_CONTENT]: 600,
  [CacheType.FEED]: 60,
  [CacheType.TRENDING]: 900,
  [CacheType.LEADERBOARD]: 300,
  [CacheType.STATS]: 1800,
}

export class CacheService {
  private prefix = 'cache:'

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
      const finalTTL = ttl || (type ? CACHE_TTL[type] : 300)
      
      await redis.setex(fullKey, finalTTL, serialized)
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error)
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
    const keys = await redis.keys(`${this.prefix}*`)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  }

  private getKey(key: string, type?: CacheType): string {
    return type ? `${this.prefix}${type}:${key}` : `${this.prefix}${key}`
  }
}
