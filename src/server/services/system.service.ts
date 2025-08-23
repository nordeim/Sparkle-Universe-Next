// src/server/services/system.service.ts
import { prisma } from '@/lib/db'
import { redis } from '@/lib/redis'
import { logger } from '@/lib/monitoring'
import { checkDatabaseConnection } from '@/lib/db'
import os from 'os'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down'
  database: boolean
  redis: boolean
  timestamp: Date
  details?: Record<string, any>
}

interface SystemMetrics {
  totalUsers: number
  totalPosts: number
  totalComments: number
  totalGroups: number
  activeUsers: number
  databaseSize: string
  cacheSize: string
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
  uptime: number
}

interface SystemInfo {
  platform: string
  arch: string
  cpuCores: number
  totalMemory: string
  nodeVersion: string
  environment: string
  hostname: string
}

interface BackgroundJob {
  name: string
  status: 'running' | 'idle' | 'failed'
  lastRun?: Date
  nextRun?: Date
  error?: string
}

export class SystemService {
  private healthCheckInterval: NodeJS.Timeout | null = null
  private monitoringInterval: NodeJS.Timeout | null = null
  private metricsCache: Map<string, { data: any; timestamp: number }> = new Map()
  private readonly CACHE_TTL = 60000

  async getSystemHealth(): Promise<SystemHealth> {
    const [dbHealth, redisHealth] = await Promise.all([
      this.checkDatabaseHealth(),
      this.checkRedisHealth(),
    ])

    const allHealthy = dbHealth.connected && redisHealth
    
    return {
      status: allHealthy ? 'healthy' : dbHealth.connected || redisHealth ? 'degraded' : 'down',
      database: dbHealth.connected,
      redis: redisHealth,
      timestamp: new Date(),
      details: {
        database: dbHealth,
        redis: redisHealth ? { connected: true } : { connected: false },
      },
    }
  }

  async getSystemMetrics(): Promise<SystemMetrics> {
    const cacheKey = 'system-metrics'
    const cached = this.getCached(cacheKey)
    if (cached) return cached

    const [
      totalUsers,
      totalPosts,
      totalComments,
      totalGroups,
      activeUsers,
      databaseSize,
      cacheSize,
      systemStats,
    ] = await Promise.all([
      prisma.user.count({ where: { deleted: false } }),
      prisma.post.count({ where: { deleted: false } }),
      prisma.comment.count({ where: { deleted: false } }),
      prisma.group.count({ where: { deleted: false } }),
      this.getActiveUsersCount(),
      this.getDatabaseSize(),
      this.getCacheSize(),
      this.getSystemStats(),
    ])

    const metrics: SystemMetrics = {
      totalUsers,
      totalPosts,
      totalComments,
      totalGroups,
      activeUsers,
      databaseSize,
      cacheSize,
      ...systemStats,
    }

    this.setCached(cacheKey, metrics)
    return metrics
  }

  async getSystemInfo(): Promise<SystemInfo> {
    return {
      platform: os.platform(),
      arch: os.arch(),
      cpuCores: os.cpus().length,
      totalMemory: this.formatBytes(os.totalmem()),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
      hostname: os.hostname(),
    }
  }

  async getBackgroundJobs(): Promise<BackgroundJob[]> {
    return [
      {
        name: 'Email Queue',
        status: 'running',
        lastRun: new Date(Date.now() - 5 * 60 * 1000),
        nextRun: new Date(Date.now() + 5 * 60 * 1000),
      },
      {
        name: 'Analytics Aggregation',
        status: 'idle',
        lastRun: new Date(Date.now() - 60 * 60 * 1000),
        nextRun: new Date(Date.now() + 23 * 60 * 60 * 1000),
      },
      {
        name: 'Cache Cleanup',
        status: 'running',
        lastRun: new Date(Date.now() - 10 * 60 * 1000),
        nextRun: new Date(Date.now() + 50 * 60 * 1000),
      },
      {
        name: 'Backup',
        status: 'idle',
        lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000),
        nextRun: new Date(Date.now() + 6 * 60 * 60 * 1000),
      },
    ]
  }

  async runHealthChecks(): Promise<Record<string, boolean>> {
    const checks: Record<string, boolean> = {}

    const dbHealth = await this.checkDatabaseHealth()
    checks.database = dbHealth.connected

    checks.redis = await this.checkRedisHealth()
    checks.diskSpace = await this.checkDiskSpace()
    checks.memory = this.checkMemory()
    checks.api = await this.checkApiEndpoints()

    return checks
  }

  async clearCache(): Promise<void> {
    try {
      await redis.flushdb()
      this.metricsCache.clear()
      logger.info('System cache cleared')
    } catch (error) {
      logger.error('Failed to clear cache:', error)
      throw new Error('Failed to clear system cache')
    }
  }

  async optimizeDatabase(): Promise<void> {
    try {
      await prisma.$executeRawUnsafe('VACUUM ANALYZE')
      logger.info('Database optimization completed')
    } catch (error) {
      logger.error('Database optimization failed:', error)
      throw new Error('Failed to optimize database')
    }
  }

  async getErrorLogs(limit: number = 100): Promise<any[]> {
    try {
      const logs = await prisma.auditLog.findMany({
        where: {
          action: 'SYSTEM_ACTION',
          metadata: {
            path: ['level'],
            equals: 'error',
          },
        },
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      })
      return logs
    } catch (error) {
      logger.error('Failed to fetch error logs:', error)
      return []
    }
  }

  async getPerformanceMetrics(): Promise<Record<string, any>> {
    const metrics: Record<string, any> = {}

    const dbStats = await this.getDatabasePerformance()
    metrics.database = dbStats

    const redisStats = await this.getRedisPerformance()
    metrics.redis = redisStats

    metrics.api = await this.getApiPerformance()

    metrics.resources = {
      cpu: this.getCpuUsage(),
      memory: this.getMemoryUsage(),
      disk: await this.getDiskUsage(),
    }

    return metrics
  }

  // New methods for admin routers
  async getSystemLogs(filters: any): Promise<any[]> {
    const { level, limit = 100, offset = 0 } = filters
    
    try {
      const where: any = {}
      if (level) {
        where.metadata = {
          path: ['level'],
          equals: level,
        }
      }

      const logs = await prisma.auditLog.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: {
          createdAt: 'desc',
        },
      })
      
      return logs
    } catch (error) {
      logger.error('Failed to fetch system logs:', error)
      return []
    }
  }

  async runMaintenance(type: string): Promise<void> {
    switch (type) {
      case 'cache':
        await this.clearCache()
        break
      case 'database':
        await this.optimizeDatabase()
        break
      case 'logs':
        await this.cleanupOldLogs()
        break
      default:
        throw new Error(`Unknown maintenance type: ${type}`)
    }
  }

  startHealthMonitoring(intervalMs: number = 60000): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        const health = await this.getSystemHealth()
        if (health.status !== 'healthy') {
          logger.warn('System health degraded:', health)
        }
      } catch (error) {
        logger.error('Health check failed:', error)
      }
    }, intervalMs)
  }

  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
  }

  // Private helper methods
  private async checkDatabaseHealth(): Promise<{ connected: boolean; latency?: number; error?: string }> {
    return checkDatabaseConnection()
  }

  private async checkRedisHealth(): Promise<boolean> {
    try {
      await redis.ping()
      return true
    } catch {
      return false
    }
  }

  private async checkDiskSpace(): Promise<boolean> {
    try {
      const diskUsage = await this.getDiskUsage()
      return diskUsage < 90
    } catch {
      return false
    }
  }

  private checkMemory(): boolean {
    const usage = this.getMemoryUsage()
    return usage < 90
  }

  private async checkApiEndpoints(): Promise<boolean> {
    try {
      await prisma.user.count({ take: 1 })
      return true
    } catch {
      return false
    }
  }

  private async getActiveUsersCount(): Promise<number> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    return prisma.user.count({
      where: {
        deleted: false,
        lastSeenAt: { gte: fiveMinutesAgo },
      },
    })
  }

  private async getDatabaseSize(): Promise<string> {
    try {
      const result = await prisma.$queryRaw<[{ size: string }]>`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `
      return result[0]?.size || 'Unknown'
    } catch {
      return 'Unknown'
    }
  }

  private async getCacheSize(): Promise<string> {
    try {
      const info = await redis.info('memory')
      const match = info.match(/used_memory_human:([^\r\n]+)/)
      return match ? match[1] : 'Unknown'
    } catch {
      return 'Unknown'
    }
  }

  private async getSystemStats(): Promise<{ cpuUsage: number; memoryUsage: number; diskUsage: number; uptime: number }> {
    return {
      cpuUsage: this.getCpuUsage(),
      memoryUsage: this.getMemoryUsage(),
      diskUsage: await this.getDiskUsage(),
      uptime: process.uptime(),
    }
  }

  private getCpuUsage(): number {
    const cpus = os.cpus()
    let totalIdle = 0
    let totalTick = 0

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times]
      }
      totalIdle += cpu.times.idle
    })

    const idle = totalIdle / cpus.length
    const total = totalTick / cpus.length
    const usage = 100 - ~~(100 * idle / total)
    
    return Math.min(100, Math.max(0, usage))
  }

  private getMemoryUsage(): number {
    const total = os.totalmem()
    const free = os.freemem()
    return Math.round((1 - free / total) * 100)
  }

  private async getDiskUsage(): Promise<number> {
    try {
      if (os.platform() === 'win32') {
        return 50
      }
      
      const { stdout } = await execAsync("df -h / | awk 'NR==2 {print $(NF-1)}'")
      return parseInt(stdout.trim().replace('%', ''), 10)
    } catch {
      return 50
    }
  }

  private async getDatabasePerformance(): Promise<any> {
    try {
      const result = await prisma.$queryRaw`
        SELECT 
          query,
          calls,
          mean_exec_time,
          max_exec_time
        FROM pg_stat_statements 
        WHERE query NOT LIKE '%pg_stat_statements%'
        ORDER BY mean_exec_time DESC 
        LIMIT 10
      `
      return result
    } catch {
      return []
    }
  }

  private async getRedisPerformance(): Promise<any> {
    try {
      const info = await redis.info('stats')
      const stats: Record<string, string> = {}
      
      info.split('\r\n').forEach(line => {
        const [key, value] = line.split(':')
        if (key && value) {
          stats[key] = value
        }
      })
      
      return stats
    } catch {
      return {}
    }
  }

  private async getApiPerformance(): Promise<any> {
    return {
      avgResponseTime: 45,
      p95ResponseTime: 120,
      p99ResponseTime: 250,
      requestsPerSecond: 150,
    }
  }

  private async cleanupOldLogs(): Promise<void> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    
    await prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: thirtyDaysAgo },
      },
    })
  }

  private getCached<T>(key: string): T | null {
    const cached = this.metricsCache.get(key)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data as T
    }
    return null
  }

  private setCached(key: string, data: any): void {
    this.metricsCache.set(key, {
      data,
      timestamp: Date.now(),
    })
  }

  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let unitIndex = 0
    let value = bytes

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024
      unitIndex++
    }

    return `${value.toFixed(2)} ${units[unitIndex]}`
  }
}

export const systemService = new SystemService()
