// src/server/services/analytics.service.ts
import { prisma } from '@/lib/db'
import { redis } from '@/lib/redis'
import { logger } from '@/lib/monitoring'
import type { Prisma, User } from '@prisma/client'
import { startOfDay, endOfDay, subDays, subMonths, subYears, format } from 'date-fns'

export type TimePeriod = 'day' | 'week' | 'month' | 'quarter' | 'year'

interface DashboardStats {
  users: number
  posts: number
  comments: number
  reactions: number
  activeUsers: number
  newUsers: number
  revenue: number
  engagement: number
  period: TimePeriod
}

interface UserGrowthData {
  date: string
  users: number
  cumulative: number
}

interface ContentPerformanceData {
  id: string
  title: string
  views: number
  comments: number
  reactions: number
  shares: number
  engagement: number
  author: string
  createdAt: Date
}

interface RevenueData {
  date: string
  revenue: number
  transactions: number
  avgTransactionValue: number
}

interface TopCreator {
  id: string
  username: string
  avatar: string | null
  postsCount: number
  followersCount: number
  engagementRate: number
  revenue: number
}

export class AnalyticsService {
  private readonly CACHE_TTL = {
    DASHBOARD: 300, // 5 minutes
    GROWTH: 600, // 10 minutes
    CONTENT: 300, // 5 minutes
    REVENUE: 900, // 15 minutes
    CREATORS: 600, // 10 minutes
  }

  async getDashboardStats(period: TimePeriod = 'week'): Promise<DashboardStats> {
    const cacheKey = `analytics:dashboard:${period}`
    const cached = await redis.get(cacheKey)
    
    if (cached) {
      return JSON.parse(cached)
    }

    const startDate = this.getStartDate(period)
    const previousPeriodStart = this.getPreviousPeriodStart(period)
    
    const [
      users,
      posts,
      comments,
      reactions,
      activeUsers,
      newUsers,
      revenue,
      previousActiveUsers,
    ] = await Promise.all([
      prisma.user.count({
        where: {
          deleted: false,
        },
      }),
      prisma.post.count({
        where: {
          createdAt: { gte: startDate },
          deleted: false,
          published: true,
        },
      }),
      prisma.comment.count({
        where: {
          createdAt: { gte: startDate },
          deleted: false,
        },
      }),
      prisma.reaction.count({
        where: {
          createdAt: { gte: startDate },
        },
      }),
      prisma.user.count({
        where: {
          lastSeenAt: { gte: startDate },
          deleted: false,
        },
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: startDate },
          deleted: false,
        },
      }),
      this.getRevenue(startDate),
      prisma.user.count({
        where: {
          lastSeenAt: {
            gte: previousPeriodStart,
            lt: startDate,
          },
          deleted: false,
        },
      }),
    ])

    const engagement = previousActiveUsers > 0 
      ? ((activeUsers - previousActiveUsers) / previousActiveUsers) * 100 
      : 0

    const stats: DashboardStats = {
      users,
      posts,
      comments,
      reactions,
      activeUsers,
      newUsers,
      revenue,
      engagement,
      period,
    }

    await redis.setex(cacheKey, this.CACHE_TTL.DASHBOARD, JSON.stringify(stats))
    
    return stats
  }

  async getUserGrowth(period: TimePeriod = 'month'): Promise<UserGrowthData[]> {
    const cacheKey = `analytics:user-growth:${period}`
    const cached = await redis.get(cacheKey)
    
    if (cached) {
      return JSON.parse(cached)
    }

    const startDate = this.getStartDate(period)
    
    const users = await prisma.user.findMany({
      where: {
        createdAt: { gte: startDate },
        deleted: false,
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    // Group by date and calculate cumulative
    const growthMap = new Map<string, number>()
    let cumulative = await prisma.user.count({
      where: {
        createdAt: { lt: startDate },
        deleted: false,
      },
    })

    users.forEach(user => {
      const date = format(user.createdAt, 'yyyy-MM-dd')
      growthMap.set(date, (growthMap.get(date) || 0) + 1)
    })

    const growth: UserGrowthData[] = []
    const sortedDates = Array.from(growthMap.keys()).sort()
    
    sortedDates.forEach(date => {
      const count = growthMap.get(date) || 0
      cumulative += count
      growth.push({
        date,
        users: count,
        cumulative,
      })
    })

    await redis.setex(cacheKey, this.CACHE_TTL.GROWTH, JSON.stringify(growth))
    
    return growth
  }

  async getContentPerformance(limit: number = 10): Promise<ContentPerformanceData[]> {
    const cacheKey = `analytics:content-performance:${limit}`
    const cached = await redis.get(cacheKey)
    
    if (cached) {
      return JSON.parse(cached)
    }

    const posts = await prisma.post.findMany({
      where: {
        deleted: false,
        published: true,
      },
      include: {
        author: {
          select: {
            username: true,
          },
        },
        _count: {
          select: {
            comments: true,
            reactions: true,
          },
        },
      },
      orderBy: [
        { viewCount: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    })

    const performance: ContentPerformanceData[] = posts.map(post => ({
      id: post.id,
      title: post.title,
      views: post.viewCount,
      comments: post._count.comments,
      reactions: post._count.reactions,
      shares: post.shareCount || 0,
      engagement: this.calculateEngagement(
        post.viewCount,
        post._count.comments,
        post._count.reactions,
        post.shareCount || 0
      ),
      author: post.author?.username || 'Unknown',
      createdAt: post.createdAt,
    }))

    await redis.setex(cacheKey, this.CACHE_TTL.CONTENT, JSON.stringify(performance))
    
    return performance
  }

  async getRevenueAnalytics(period: TimePeriod = 'month'): Promise<RevenueData[]> {
    const cacheKey = `analytics:revenue:${period}`
    const cached = await redis.get(cacheKey)
    
    if (cached) {
      return JSON.parse(cached)
    }

    const startDate = this.getStartDate(period)
    
    const transactions = await prisma.currencyTransaction.findMany({
      where: {
        createdAt: { gte: startDate },
        status: 'COMPLETED',
      },
      select: {
        createdAt: true,
        amount: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    const revenueMap = new Map<string, { revenue: number; count: number }>()
    
    transactions.forEach(transaction => {
      const date = format(transaction.createdAt, 'yyyy-MM-dd')
      const existing = revenueMap.get(date) || { revenue: 0, count: 0 }
      revenueMap.set(date, {
        revenue: existing.revenue + Number(transaction.amount),
        count: existing.count + 1,
      })
    })

    const revenue: RevenueData[] = Array.from(revenueMap.entries()).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      transactions: data.count,
      avgTransactionValue: data.count > 0 ? data.revenue / data.count : 0,
    }))

    await redis.setex(cacheKey, this.CACHE_TTL.REVENUE, JSON.stringify(revenue))
    
    return revenue
  }

  async getTopCreators(limit: number = 10): Promise<TopCreator[]> {
    const cacheKey = `analytics:top-creators:${limit}`
    const cached = await redis.get(cacheKey)
    
    if (cached) {
      return JSON.parse(cached)
    }

    const creators = await prisma.user.findMany({
      where: {
        role: {
          in: ['CREATOR', 'VERIFIED_CREATOR'],
        },
        deleted: false,
      },
      include: {
        _count: {
          select: {
            posts: true,
            followers: true,
          },
        },
        stats: {
          select: {
            totalLikesReceived: true,
            totalCommentsReceived: true,
            totalViews: true,
            contentQualityScore: true,
          },
        },
        profile: {
          select: {
            displayName: true,
          },
        },
      },
      orderBy: {
        followers: {
          _count: 'desc',
        },
      },
      take: limit,
    })

    const topCreators: TopCreator[] = await Promise.all(
      creators.map(async creator => {
        const revenue = await this.getCreatorRevenue(creator.id)
        const engagementRate = this.calculateCreatorEngagement(creator)
        
        return {
          id: creator.id,
          username: creator.username,
          avatar: creator.image,
          postsCount: creator._count.posts,
          followersCount: creator._count.followers,
          engagementRate,
          revenue,
        }
      })
    )

    await redis.setex(cacheKey, this.CACHE_TTL.CREATORS, JSON.stringify(topCreators))
    
    return topCreators
  }

  async getSystemMetrics() {
    const [
      totalUsers,
      totalPosts,
      totalComments,
      totalGroups,
      activeUsers,
      storageUsed,
    ] = await Promise.all([
      prisma.user.count({ where: { deleted: false } }),
      prisma.post.count({ where: { deleted: false } }),
      prisma.comment.count({ where: { deleted: false } }),
      prisma.group.count({ where: { deleted: false } }),
      prisma.user.count({
        where: {
          deleted: false,
          lastSeenAt: { gte: subDays(new Date(), 7) },
        },
      }),
      this.getStorageUsage(),
    ])

    return {
      totalUsers,
      totalPosts,
      totalComments,
      totalGroups,
      activeUsers,
      storageUsed,
      timestamp: new Date(),
    }
  }

  async getEngagementMetrics(userId?: string) {
    const where = userId ? { authorId: userId } : {}
    
    const [posts, avgEngagement] = await Promise.all([
      prisma.post.findMany({
        where: {
          ...where,
          deleted: false,
          published: true,
        },
        include: {
          _count: {
            select: {
              comments: true,
              reactions: true,
            },
          },
        },
        take: 100,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.post.aggregate({
        where: {
          ...where,
          deleted: false,
          published: true,
        },
        _avg: {
          viewCount: true,
          shareCount: true,
        },
      }),
    ])

    const totalViews = posts.reduce((sum, post) => sum + post.viewCount, 0)
    const totalComments = posts.reduce((sum, post) => sum + post._count.comments, 0)
    const totalReactions = posts.reduce((sum, post) => sum + post._count.reactions, 0)
    const totalShares = posts.reduce((sum, post) => sum + (post.shareCount || 0), 0)

    return {
      posts: posts.length,
      totalViews,
      totalComments,
      totalReactions,
      totalShares,
      avgViews: avgEngagement._avg.viewCount || 0,
      avgShares: avgEngagement._avg.shareCount || 0,
      engagementRate: this.calculateEngagement(totalViews, totalComments, totalReactions, totalShares),
    }
  }

  private getStartDate(period: TimePeriod): Date {
    const now = new Date()
    switch (period) {
      case 'day':
        return startOfDay(now)
      case 'week':
        return subDays(now, 7)
      case 'month':
        return subMonths(now, 1)
      case 'quarter':
        return subMonths(now, 3)
      case 'year':
        return subYears(now, 1)
      default:
        return subDays(now, 7)
    }
  }

  private getPreviousPeriodStart(period: TimePeriod): Date {
    const now = new Date()
    switch (period) {
      case 'day':
        return subDays(startOfDay(now), 1)
      case 'week':
        return subDays(now, 14)
      case 'month':
        return subMonths(now, 2)
      case 'quarter':
        return subMonths(now, 6)
      case 'year':
        return subYears(now, 2)
      default:
        return subDays(now, 14)
    }
  }

  private async getRevenue(since: Date): Promise<number> {
    const result = await prisma.currencyTransaction.aggregate({
      where: {
        createdAt: { gte: since },
        status: 'COMPLETED',
      },
      _sum: {
        amount: true,
      },
    })
    
    return Number(result._sum.amount || 0)
  }

  private async getCreatorRevenue(userId: string): Promise<number> {
    const result = await prisma.creatorPayout.aggregate({
      where: {
        userId,
        status: 'COMPLETED',
      },
      _sum: {
        finalAmount: true,
      },
    })
    
    return Number(result._sum.finalAmount || 0)
  }

  private calculateEngagement(views: number, comments: number, reactions: number, shares: number): number {
    if (views === 0) return 0
    
    const interactions = comments + reactions + shares
    return (interactions / views) * 100
  }

  private calculateCreatorEngagement(creator: any): number {
    if (!creator.stats) return 0
    
    const { totalViews, totalLikesReceived, totalCommentsReceived } = creator.stats
    
    if (totalViews === 0) return 0
    
    const interactions = totalLikesReceived + totalCommentsReceived
    return (interactions / totalViews) * 100
  }

  private async getStorageUsage(): Promise<string> {
    try {
      const result = await prisma.$queryRaw<[{ size: string }]>`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `
      return result[0]?.size || 'Unknown'
    } catch (error) {
      logger.error('Failed to get storage usage:', error)
      return 'Unknown'
    }
  }
}

export const analyticsService = new AnalyticsService()
