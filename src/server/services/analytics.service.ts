// src/server/services/analytics.service.ts
import { PrismaClient } from '@prisma/client'
import { Redis } from 'ioredis'
import { startOfDay, endOfDay, subDays, subMonths, subYears, format } from 'date-fns'
import type { TimePeriod } from '@/types/global'

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
  private redis: Redis
  private readonly CACHE_TTL = {
    DASHBOARD: 300,
    GROWTH: 600,
    CONTENT: 300,
    REVENUE: 900,
    CREATORS: 600,
  }

  constructor(private db: PrismaClient) {
    this.redis = new Redis(process.env.REDIS_URL!)
  }

  async getDashboardStats(period: TimePeriod = 'week'): Promise<DashboardStats> {
    const cacheKey = `analytics:dashboard:${period}`
    const cached = await this.redis.get(cacheKey)
    
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
      this.db.user.count({
        where: {
          deleted: false,
        },
      }),
      this.db.post.count({
        where: {
          createdAt: { gte: startDate },
          deleted: false,
          published: true,
        },
      }),
      this.db.comment.count({
        where: {
          createdAt: { gte: startDate },
          deleted: false,
        },
      }),
      this.db.reaction.count({
        where: {
          createdAt: { gte: startDate },
        },
      }),
      this.db.user.count({
        where: {
          lastSeenAt: { gte: startDate },
          deleted: false,
        },
      }),
      this.db.user.count({
        where: {
          createdAt: { gte: startDate },
          deleted: false,
        },
      }),
      this.getRevenue(startDate),
      this.db.user.count({
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

    await this.redis.setex(cacheKey, this.CACHE_TTL.DASHBOARD, JSON.stringify(stats))
    
    return stats
  }

  async getUserGrowth(period: TimePeriod = 'month'): Promise<UserGrowthData[]> {
    const cacheKey = `analytics:user-growth:${period}`
    const cached = await this.redis.get(cacheKey)
    
    if (cached) {
      return JSON.parse(cached)
    }

    const startDate = this.getStartDate(period)
    
    const users = await this.db.user.findMany({
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

    const growthMap = new Map<string, number>()
    let cumulative = await this.db.user.count({
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

    await this.redis.setex(cacheKey, this.CACHE_TTL.GROWTH, JSON.stringify(growth))
    
    return growth
  }

  async getContentPerformance(limit: number = 10): Promise<ContentPerformanceData[]> {
    const cacheKey = `analytics:content-performance:${limit}`
    const cached = await this.redis.get(cacheKey)
    
    if (cached) {
      return JSON.parse(cached)
    }

    const posts = await this.db.post.findMany({
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
        stats: true,
      },
      orderBy: [
        { createdAt: 'desc' },
      ],
      take: limit,
    })

    const performance: ContentPerformanceData[] = posts.map(post => ({
      id: post.id,
      title: post.title,
      views: post.stats?.viewCount || 0,
      comments: post._count.comments,
      reactions: post._count.reactions,
      shares: post.stats?.shareCount || 0,
      engagement: this.calculateEngagement(
        post.stats?.viewCount || 0,
        post._count.comments,
        post._count.reactions,
        post.stats?.shareCount || 0
      ),
      author: post.author?.username || 'Unknown',
      createdAt: post.createdAt,
    }))

    await this.redis.setex(cacheKey, this.CACHE_TTL.CONTENT, JSON.stringify(performance))
    
    return performance
  }

  async getRevenueAnalytics(period: TimePeriod = 'month'): Promise<RevenueData[]> {
    const cacheKey = `analytics:revenue:${period}`
    const cached = await this.redis.get(cacheKey)
    
    if (cached) {
      return JSON.parse(cached)
    }

    const startDate = this.getStartDate(period)
    
    const transactions = await this.db.currencyTransaction.findMany({
      where: {
        createdAt: { gte: startDate },
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

    await this.redis.setex(cacheKey, this.CACHE_TTL.REVENUE, JSON.stringify(revenue))
    
    return revenue
  }

  async getTopCreators(limit: number = 10): Promise<TopCreator[]> {
    const cacheKey = `analytics:top-creators:${limit}`
    const cached = await this.redis.get(cacheKey)
    
    if (cached) {
      return JSON.parse(cached)
    }

    const creators = await this.db.user.findMany({
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

    await this.redis.setex(cacheKey, this.CACHE_TTL.CREATORS, JSON.stringify(topCreators))
    
    return topCreators
  }

  async getAdvancedMetrics(period: TimePeriod) {
    const startDate = this.getStartDate(period)
    
    const [userMetrics, contentMetrics, revenueMetrics] = await Promise.all([
      this.getUserMetrics(startDate),
      this.getContentMetrics(startDate),
      this.getRevenueMetrics(startDate),
    ])

    // Calculate additional metrics
    const dau = await this.db.user.count({
      where: {
        lastSeenAt: { gte: subDays(new Date(), 1) },
        deleted: false,
      },
    })

    const mau = await this.db.user.count({
      where: {
        lastSeenAt: { gte: subDays(new Date(), 30) },
        deleted: false,
      },
    })

    const sessionData = await this.db.session.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        expires: true,
      },
    })

    const avgSessionDuration = sessionData.reduce((sum, session) => {
      const duration = session.expires.getTime() - session.createdAt.getTime()
      return sum + duration
    }, 0) / (sessionData.length || 1)

    const retentionRate = mau > 0 ? (dau / mau) * 100 : 0

    return {
      users: {
        ...userMetrics,
        activeGrowth: 0, // Calculate if needed
        dau,
        mau,
        avgSessionDuration: Math.round(avgSessionDuration / 1000 / 60), // In minutes
        retentionRate,
      },
      content: {
        ...contentMetrics,
        shares: 0, // Get from PostStats if available
      },
      revenue: revenueMetrics,
      engagement: {
        rate: this.calculateEngagementRate(contentMetrics),
        rateChange: 0, // Calculate if needed
        viralityScore: 0, // Calculate if needed
      },
      moderation: {
        aiAccuracy: 85, // Get from actual AI moderation stats if available
      },
      period,
    }
  }

  async getAnalytics(period: TimePeriod, metric?: string) {
    const [
      userGrowth,
      contentPerformance,
      topCreators,
      engagementMetrics,
    ] = await Promise.all([
      this.getUserGrowth(period),
      this.getContentPerformance(),
      this.getTopCreators(),
      this.getEngagementMetrics(),
    ])

    return {
      userGrowth,
      contentPerformance,
      topCreators,
      engagementMetrics,
    }
  }

  async getEngagementMetrics(userId?: string) {
    const where = userId ? { authorId: userId } : {}
    
    const [posts, avgEngagement] = await Promise.all([
      this.db.post.findMany({
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
          stats: true,
        },
        take: 100,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.db.postStats.aggregate({
        where: {
          post: {
            ...where,
            deleted: false,
            published: true,
          },
        },
        _avg: {
          viewCount: true,
          shareCount: true,
        },
      }),
    ])

    const totalViews = posts.reduce((sum, post) => sum + (post.stats?.viewCount || 0), 0)
    const totalComments = posts.reduce((sum, post) => sum + post._count.comments, 0)
    const totalReactions = posts.reduce((sum, post) => sum + post._count.reactions, 0)
    const totalShares = posts.reduce((sum, post) => sum + (post.stats?.shareCount || 0), 0)

    return {
      posts: posts.length,
      totalViews,
      totalComments,
      totalReactions,
      totalShares,
      avgViews: avgEngagement._avg?.viewCount || 0,
      avgShares: avgEngagement._avg?.shareCount || 0,
      engagementRate: this.calculateEngagement(totalViews, totalComments, totalReactions, totalShares),
    }
  }

  async getRealtimeMetrics() {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    
    const [
      activeUsers,
      recentPosts,
      recentComments,
      currentSessions,
    ] = await Promise.all([
      this.db.user.count({
        where: {
          lastSeenAt: { gte: fiveMinutesAgo },
          deleted: false,
        },
      }),
      this.db.post.count({
        where: {
          createdAt: { gte: fiveMinutesAgo },
          deleted: false,
        },
      }),
      this.db.comment.count({
        where: {
          createdAt: { gte: fiveMinutesAgo },
          deleted: false,
        },
      }),
      this.db.session.count({
        where: {
          expires: { gte: new Date() },
        },
      }),
    ])

    return {
      activeUsers,
      recentPosts,
      recentComments,
      currentSessions,
      timestamp: new Date(),
    }
  }

  // Private helper methods
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
    const result = await this.db.currencyTransaction.aggregate({
      where: {
        createdAt: { gte: since },
      },
      _sum: {
        amount: true,
      },
    })
    
    return Number(result._sum.amount || 0)
  }

  private async getCreatorRevenue(userId: string): Promise<number> {
    const result = await this.db.creatorPayout.aggregate({
      where: {
        userId,
        payoutStatus: 'COMPLETED',
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
    
    const { totalLikesReceived } = creator.stats
    const totalPosts = creator._count.posts
    
    if (totalPosts === 0) return 0
    
    return (totalLikesReceived / totalPosts)
  }

  private calculateEngagementRate(contentMetrics: any): number {
    const total = contentMetrics.posts + contentMetrics.comments + contentMetrics.reactions
    if (total === 0) return 0
    return (contentMetrics.reactions / total) * 100
  }

  private async getUserMetrics(since: Date) {
    const [total, active, new_users, verified] = await Promise.all([
      this.db.user.count({ where: { deleted: false } }),
      this.db.user.count({
        where: {
          lastSeenAt: { gte: since },
          deleted: false,
        },
      }),
      this.db.user.count({
        where: {
          createdAt: { gte: since },
          deleted: false,
        },
      }),
      this.db.user.count({
        where: {
          verified: true,
          deleted: false,
        },
      }),
    ])

    return { total, active, new: new_users, verified }
  }

  private async getContentMetrics(since: Date) {
    const [posts, comments, reactions] = await Promise.all([
      this.db.post.count({
        where: {
          createdAt: { gte: since },
          deleted: false,
        },
      }),
      this.db.comment.count({
        where: {
          createdAt: { gte: since },
          deleted: false,
        },
      }),
      this.db.reaction.count({
        where: {
          createdAt: { gte: since },
        },
      }),
    ])

    return { posts, comments, reactions }
  }

  private async getRevenueMetrics(since: Date) {
    const result = await this.db.currencyTransaction.aggregate({
      where: {
        createdAt: { gte: since },
      },
      _sum: {
        amount: true,
      },
      _count: true,
    })

    return {
      total: Number(result._sum.amount || 0),
      transactions: result._count,
    }
  }
}
