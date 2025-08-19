// src/lib/redis.ts
import Redis from 'ioredis'
import { createAdapter } from '@socket.io/redis-adapter'

// Configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000)
    return delay
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
  db: parseInt(process.env.REDIS_DB || '0'),
}

// Main Redis client
export const redis = new Redis(redisConfig)

// Separate clients for pub/sub (Socket.IO requires separate clients)
export const redisPub = new Redis(redisConfig)
export const redisSub = new Redis(redisConfig)

// Alias exports for compatibility
export const pubClient = redisPub
export const subClient = redisSub
export const redisClient = redis

// Create Socket.IO adapter
export const createSocketAdapter = () => {
  return createAdapter(redisPub, redisSub)
}

// Redis helper utilities
export const redisHelpers = {
  // Cache operations with automatic JSON serialization
  async getJSON<T>(key: string): Promise<T | null> {
    const data = await redis.get(key)
    return data ? JSON.parse(data) : null
  },

  async setJSON<T>(key: string, value: T, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value)
    if (ttl) {
      await redis.setex(key, ttl, serialized)
    } else {
      await redis.set(key, serialized)
    }
  },

  // Atomic increment with expiry
  async incrementWithExpiry(key: string, ttl: number): Promise<number> {
    const multi = redis.multi()
    multi.incr(key)
    multi.expire(key, ttl)
    const results = await multi.exec()
    return results?.[0]?.[1] as number || 0
  },

  // Leaderboard operations
  async addToLeaderboard(key: string, member: string, score: number): Promise<void> {
    await redis.zadd(key, score, member)
  },

  async getLeaderboard(key: string, limit: number = 10): Promise<Array<{member: string, score: number}>> {
    const results = await redis.zrevrange(key, 0, limit - 1, 'WITHSCORES')
    const leaderboard: Array<{member: string, score: number}> = []
    
    for (let i = 0; i < results.length; i += 2) {
      leaderboard.push({
        member: results[i],
        score: parseFloat(results[i + 1]),
      })
    }
    
    return leaderboard
  },

  async getLeaderboardRank(key: string, member: string): Promise<number | null> {
    const rank = await redis.zrevrank(key, member)
    return rank !== null ? rank + 1 : null
  },

  // Session management
  async setSession(sessionId: string, data: any, ttl: number = 86400): Promise<void> {
    await this.setJSON(`session:${sessionId}`, data, ttl)
  },

  async getSession<T>(sessionId: string): Promise<T | null> {
    return this.getJSON<T>(`session:${sessionId}`)
  },

  async deleteSession(sessionId: string): Promise<void> {
    await redis.del(`session:${sessionId}`)
  },

  async extendSession(sessionId: string, ttl: number = 86400): Promise<void> {
    await redis.expire(`session:${sessionId}`, ttl)
  },

  // Rate limiting
  async checkRateLimit(identifier: string, limit: number, window: number): Promise<{
    allowed: boolean
    remaining: number
    resetAt: number
  }> {
    const key = `rate:${identifier}:${Math.floor(Date.now() / (window * 1000))}`
    const count = await this.incrementWithExpiry(key, window)
    const resetAt = Math.ceil(Date.now() / (window * 1000)) * (window * 1000)
    
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      resetAt,
    }
  },

  // Cache invalidation patterns
  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  },

  async invalidateUserCache(userId: string): Promise<void> {
    await this.invalidatePattern(`*:user:${userId}:*`)
  },

  async invalidatePostCache(postId: string): Promise<void> {
    await this.invalidatePattern(`*:post:${postId}:*`)
  },

  // Queue operations
  async pushToQueue(queue: string, data: any): Promise<void> {
    await redis.rpush(queue, JSON.stringify(data))
  },

  async popFromQueue<T>(queue: string): Promise<T | null> {
    const data = await redis.lpop(queue)
    return data ? JSON.parse(data) : null
  },

  async getQueueLength(queue: string): Promise<number> {
    return redis.llen(queue)
  },

  // Set operations for unique tracking
  async addToSet(key: string, member: string, ttl?: number): Promise<boolean> {
    const added = await redis.sadd(key, member)
    if (ttl && added) {
      await redis.expire(key, ttl)
    }
    return added === 1
  },

  async removeFromSet(key: string, member: string): Promise<boolean> {
    const removed = await redis.srem(key, member)
    return removed === 1
  },

  async isInSet(key: string, member: string): Promise<boolean> {
    const exists = await redis.sismember(key, member)
    return exists === 1
  },

  async getSetMembers(key: string): Promise<string[]> {
    return redis.smembers(key)
  },

  async getSetSize(key: string): Promise<number> {
    return redis.scard(key)
  },

  // Distributed locking
  async acquireLock(resource: string, ttl: number = 5000): Promise<string | null> {
    const token = Math.random().toString(36).substring(2)
    const result = await redis.set(
      `lock:${resource}`,
      token,
      'PX',
      ttl,
      'NX'
    )
    return result === 'OK' ? token : null
  },

  async releaseLock(resource: string, token: string): Promise<boolean> {
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `
    const result = await redis.eval(script, 1, `lock:${resource}`, token)
    return result === 1
  },

  // Pub/Sub helpers
  async publish(channel: string, message: any): Promise<void> {
    await redisPub.publish(channel, JSON.stringify(message))
  },

  async subscribe(channel: string, handler: (message: any) => void): Promise<void> {
    await redisSub.subscribe(channel)
    redisSub.on('message', (ch, msg) => {
      if (ch === channel) {
        try {
          handler(JSON.parse(msg))
        } catch (error) {
          console.error(`Failed to parse message from ${channel}:`, error)
        }
      }
    })
  },

  async unsubscribe(channel: string): Promise<void> {
    await redisSub.unsubscribe(channel)
  },

  // Health check
  async ping(): Promise<boolean> {
    try {
      const result = await redis.ping()
      return result === 'PONG'
    } catch {
      return false
    }
  },
}

// Connection event handlers
redis.on('connect', () => {
  console.log('✅ Redis main client connected')
})

redis.on('error', (err) => {
  console.error('❌ Redis main client error:', err)
})

redis.on('ready', () => {
  console.log('✅ Redis main client ready')
})

redisPub.on('connect', () => {
  console.log('✅ Redis pub client connected')
})

redisPub.on('error', (err) => {
  console.error('❌ Redis pub client error:', err)
})

redisSub.on('connect', () => {
  console.log('✅ Redis sub client connected')
})

redisSub.on('error', (err) => {
  console.error('❌ Redis sub client error:', err)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📛 SIGTERM received, closing Redis connections...')
  await redis.quit()
  await redisPub.quit()
  await redisSub.quit()
})

// Default export for backward compatibility
export default redis

// Named exports for all utilities
export const redisUtils = redisHelpers
