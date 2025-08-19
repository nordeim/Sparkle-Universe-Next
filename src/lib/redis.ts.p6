// src/lib/redis.ts
import Redis from 'ioredis'
import { createAdapter } from '@socket.io/redis-adapter'

// Main Redis client
export const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000)
    return delay
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
})

// Pub/Sub clients for Socket.IO adapter
export const pubClient = redis.duplicate()
export const subClient = redis.duplicate()

// Create Socket.IO adapter
export const createSocketAdapter = () => {
  return createAdapter(pubClient, subClient)
}

// Redis utilities
export const redisUtils = {
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

  // Session management
  async setSession(sessionId: string, data: any, ttl: number = 86400): Promise<void> {
    await this.setJSON(`session:${sessionId}`, data, ttl)
  },

  async getSession<T>(sessionId: string): Promise<T | null> {
    return this.getJSON<T>(`session:${sessionId}`)
  },

  // Rate limiting
  async checkRateLimit(identifier: string, limit: number, window: number): Promise<boolean> {
    const key = `rate:${identifier}:${Math.floor(Date.now() / (window * 1000))}`
    const count = await this.incrementWithExpiry(key, window)
    return count <= limit
  },
}

// Connection event handlers
redis.on('connect', () => {
  console.log('✅ Redis connected')
})

redis.on('error', (err) => {
  console.error('❌ Redis error:', err)
})

redis.on('ready', () => {
  console.log('✅ Redis ready')
})

export default redis
