// src/lib/redis.ts
import Redis from 'ioredis'
import { logger } from '@/lib/monitoring'

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
const redisPassword = process.env.REDIS_PASSWORD

// Create Redis client with retry strategy
export const redis = new Redis(redisUrl, {
  password: redisPassword,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000)
    logger.warn(`Redis connection retry attempt ${times}, delay: ${delay}ms`)
    return delay
  },
  reconnectOnError: (err) => {
    const targetError = 'READONLY'
    if (err.message.includes(targetError)) {
      // Only reconnect when the error contains "READONLY"
      return true
    }
    return false
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
})

// Redis pub/sub client (separate connection)
export const redisPub = redis.duplicate()
export const redisSub = redis.duplicate()

// Connection event handlers
redis.on('connect', () => {
  logger.info('Redis connected')
})

redis.on('error', (error) => {
  logger.error('Redis error:', error)
})

redis.on('close', () => {
  logger.warn('Redis connection closed')
})

// Helper functions for common operations
export const redisHelpers = {
  // Set with expiration
  async setex(key: string, seconds: number, value: any): Promise<void> {
    await redis.setex(key, seconds, JSON.stringify(value))
  },

  // Get and parse JSON
  async getJSON<T>(key: string): Promise<T | null> {
    const value = await redis.get(key)
    if (!value) return null
    try {
      return JSON.parse(value) as T
    } catch {
      return null
    }
  },

  // Set JSON with optional expiration
  async setJSON(key: string, value: any, expirationSeconds?: number): Promise<void> {
    const json = JSON.stringify(value)
    if (expirationSeconds) {
      await redis.setex(key, expirationSeconds, json)
    } else {
      await redis.set(key, json)
    }
  },

  // Increment with expiration
  async incrWithExpire(key: string, expirationSeconds: number): Promise<number> {
    const multi = redis.multi()
    multi.incr(key)
    multi.expire(key, expirationSeconds)
    const results = await multi.exec()
    return results?.[0]?.[1] as number
  },

  // Cache wrapper function
  async cached<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number
  ): Promise<T> {
    // Try to get from cache
    const cached = await redisHelpers.getJSON<T>(key)
    if (cached !== null) {
      return cached
    }

    // Fetch and cache
    const value = await fetcher()
    await redisHelpers.setJSON(key, value, ttlSeconds)
    return value
  },

  // Delete keys by pattern
  async deletePattern(pattern: string): Promise<number> {
    const keys = await redis.keys(pattern)
    if (keys.length === 0) return 0
    return await redis.del(...keys)
  },

  // Session management
  session: {
    async set(sessionId: string, data: any, ttlSeconds: number = 86400): Promise<void> {
      await redisHelpers.setJSON(`session:${sessionId}`, data, ttlSeconds)
    },

    async get<T>(sessionId: string): Promise<T | null> {
      return await redisHelpers.getJSON<T>(`session:${sessionId}`)
    },

    async delete(sessionId: string): Promise<void> {
      await redis.del(`session:${sessionId}`)
    },

    async extend(sessionId: string, ttlSeconds: number = 86400): Promise<void> {
      await redis.expire(`session:${sessionId}`, ttlSeconds)
    },
  },

  // Rate limiting helpers
  rateLimiting: {
    async checkLimit(
      identifier: string,
      maxRequests: number,
      windowSeconds: number
    ): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
      const key = `rate_limit:${identifier}`
      const current = await redisHelpers.incrWithExpire(key, windowSeconds)
      
      return {
        allowed: current <= maxRequests,
        remaining: Math.max(0, maxRequests - current),
        resetAt: new Date(Date.now() + windowSeconds * 1000),
      }
    },

    async resetLimit(identifier: string): Promise<void> {
      await redis.del(`rate_limit:${identifier}`)
    },
  },

  // Leaderboard helpers
  leaderboard: {
    async addScore(
      leaderboardKey: string,
      userId: string,
      score: number
    ): Promise<void> {
      await redis.zadd(leaderboardKey, score, userId)
    },

    async getTopUsers(
      leaderboardKey: string,
      count: number = 10
    ): Promise<Array<{ userId: string; score: number; rank: number }>> {
      const results = await redis.zrevrange(leaderboardKey, 0, count - 1, 'WITHSCORES')
      const users: Array<{ userId: string; score: number; rank: number }> = []
      
      for (let i = 0; i < results.length; i += 2) {
        users.push({
          userId: results[i],
          score: parseFloat(results[i + 1]),
          rank: i / 2 + 1,
        })
      }
      
      return users
    },

    async getUserRank(leaderboardKey: string, userId: string): Promise<number | null> {
      const rank = await redis.zrevrank(leaderboardKey, userId)
      return rank === null ? null : rank + 1
    },
  },
}

// Connection check
export async function checkRedisConnection(): Promise<boolean> {
  try {
    await redis.ping()
    return true
  } catch (error) {
    logger.error('Redis connection check failed:', error)
    return false
  }
}

// Cleanup function
export async function disconnectRedis(): Promise<void> {
  await redis.quit()
  await redisPub.quit()
  await redisSub.quit()
}
