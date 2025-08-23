// src/server/api/routers/analytics.ts
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, adminProcedure } from '@/server/api/trpc'
import { TRPCError } from '@trpc/server'
import { startOfDay, endOfDay, subDays, startOfWeek, startOfMonth } from 'date-fns'

export const analyticsRouter = createTRPCRouter({
  // Get dashboard overview
  getDashboard: adminProcedure
    .input(
      z.object({
        period: z.enum(['today', 'week', 'month', 'quarter', 'year']).default('week'),
      })
    )
    .query(async ({ ctx, input }) => {
      const now = new Date()
      let startDate: Date
      let compareStartDate: Date

      switch (input.period) {
        case 'today':
          startDate = startOfDay(now)
          compareStartDate = startOfDay(subDays(now, 1))
          break
        case 'week':
          startDate = startOfWeek(now)
          compareStartDate = startOfWeek(subDays(now, 7))
          break
        case 'month':
          startDate = startOfMonth(now)
          compareStartDate = startOfMonth(subDays(now, 30))
          break
        case 'quarter':
          startDate = subDays(now, 90)
          compareStartDate = subDays(now, 180)
          break
        case 'year':
          startDate = subDays(now, 365)
          compareStartDate = subDays(now, 730)
          break
        default:
          startDate = startOfWeek(now)
          compareStartDate = startOfWeek(subDays(now, 7))
      }

      // Get current period stats
      const [
        totalUsers,
        newUsers,
        totalPosts,
        totalComments,
        activeUsers,
        totalRevenue,
      ] = await Promise.all([
        ctx.db.user.count({
          where: { deleted: false },
        }),
        ctx.db.user.count({
          where: {
            createdAt: { gte: startDate },
            deleted: false,
          },
        }),
        ctx.db.post.count({
          where: {
            createdAt: { gte: startDate },
            deleted: false,
            isDraft: false,
          },
        }),
        ctx.db.comment.count({
          where: {
            createdAt: { gte: startDate },
            deleted: false,
          },
        }),
        ctx.db.user.count({
          where: {
            lastSeenAt: { gte: startDate },
            deleted: false,
          },
        }),
        ctx.db.currencyTransaction.aggregate({
          where: {
            createdAt: { gte: startDate },
          },
          _sum: {
            amount: true,
          },
        }),
      ])

      // Get comparison period stats
      const [
        prevNewUsers,
        prevTotalPosts,
        prevTotalComments,
        prevActiveUsers,
        prevTotalRevenue,
      ] = await Promise.all([
        ctx.db.user.count({
          where: {
            createdAt: {
              gte: compareStartDate,
              lt: startDate,
            },
            deleted: false,
          },
        }),
        ctx.db.post.count({
          where: {
            createdAt: {
              gte: compareStartDate,
              lt: startDate,
            },
            deleted: false,
            isDraft: false,
          },
        }),
        ctx.db.comment.count({
          where: {
            createdAt: {
              gte: compareStartDate,
              lt: startDate,
            },
            deleted: false,
          },
        }),
        ctx.db.user.count({
          where: {
            lastSeenAt: {
              gte: compareStartDate,
              lt: startDate,
            },
            deleted: false,
          },
        }),
        ctx.db.currencyTransaction.aggregate({
          where: {
            createdAt: {
              gte: compareStartDate,
              lt: startDate,
            },
          },
          _sum: {
            amount: true,
          },
        }),
      ])

      // Calculate percentage changes
      const calculateChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0
        return Math.round(((current - previous) / previous) * 100)
      }

      return {
        overview: {
          totalUsers,
          newUsers,
          newUsersChange: calculateChange(newUsers, prevNewUsers),
          totalPosts,
          totalPostsChange: calculateChange(totalPosts, prevTotalPosts),
          totalComments,
          totalCommentsChange: calculateChange(totalComments, prevTotalComments),
          activeUsers,
          activeUsersChange: calculateChange(activeUsers, prevActiveUsers),
          totalRevenue: totalRevenue._sum.amount || 0,
          totalRevenueChange: calculateChange(
            totalRevenue._sum.amount || 0,
            prevTotalRevenue._sum.amount || 0
          ),
        },
        period: input.period,
      }
    }),

  // Get user growth data
  getUserGrowth: adminProcedure
    .input(
      z.object({
        days: z.number().min(7).max(365).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const dates = []
      const now = new Date()

      for (let i = input.days - 1; i >= 0; i--) {
        const date = subDays(now, i)
        dates.push({
          date: date.toISOString().split('T')[0],
          start: startOfDay(date),
          end: endOfDay(date),
        })
      }

      const growth = await Promise.all(
        dates.map(async ({ date, start, end }) => {
          const [users, activeUsers, newUsers, returningUsers] = await Promise.all([
            ctx.db.user.count({
              where: {
                createdAt: { lte: end },
                deleted: false,
              },
            }),
            ctx.db.user.count({
              where: {
                lastSeenAt: {
                  gte: start,
                  lte: end,
                },
                deleted: false,
              },
            }),
            ctx.db.user.count({
              where: {
                createdAt: {
                  gte: start,
                  lte: end,
                },
                deleted: false,
              },
            }),
            ctx.db.user.count({
              where: {
                createdAt: { lt: start },
                lastSeenAt: {
                  gte: start,
                  lte: end,
                },
                deleted: false,
              },
            }),
          ])

          return {
            date,
            users,
            activeUsers,
            newUsers,
            returningUsers,
          }
        })
      )

      return growth
    }),

  // Get content metrics
  getContentMetrics: adminProcedure
    .input(
      z.object({
        period: z.enum(['day', 'week', 'month']).default('week'),
      })
    )
    .query(async ({ ctx, input }) => {
      const now = new Date()
      const startDate = 
        input.period === 'day' ? subDays(now, 1) :
        input.period === 'week' ? subDays(now, 7) :
        subDays(now, 30)

      const [topPosts, topCreators, contentTypes] = await Promise.all([
        // Top posts by engagement
        ctx.db.post.findMany({
          where: {
            createdAt: { gte: startDate },
            deleted: false,
            isDraft: false,
          },
          orderBy: [
            { views: 'desc' },
          ],
          take: 10,
          select: {
            id: true,
            title: true,
            views: true,
            author: {
              select: {
                id: true,
                username: true,
                image: true,
              },
            },
            _count: {
              select: {
                comments: true,
                reactions: true,
              },
            },
          },
        }),

        // Top creators by posts
        ctx.db.user.findMany({
          where: {
            posts: {
              some: {
                createdAt: { gte: startDate },
                deleted: false,
                isDraft: false,
              },
            },
          },
          orderBy: {
            posts: {
              _count: 'desc',
            },
          },
          take: 10,
          select: {
            id: true,
            username: true,
            image: true,
            verified: true,
            _count: {
              select: {
                posts: {
                  where: {
                    createdAt: { gte: startDate },
                    deleted: false,
                    isDraft: false,
                  },
                },
              },
            },
          },
        }),

        // Content type distribution
        ctx.db.post.groupBy({
          by: ['contentType'],
          where: {
            createdAt: { gte: startDate },
            deleted: false,
            isDraft: false,
          },
          _count: true,
        }),
      ])

      return {
        topPosts,
        topCreators,
        contentTypes: contentTypes.map(type => ({
          type: type.contentType,
          count: type._count,
        })),
      }
    }),

  // Get engagement metrics
  getEngagementMetrics: adminProcedure
    .input(
      z.object({
        period: z.enum(['day', 'week', 'month']).default('week'),
      })
    )
    .query(async ({ ctx, input }) => {
      const now = new Date()
      const startDate = 
        input.period === 'day' ? subDays(now, 1) :
        input.period === 'week' ? subDays(now, 7) :
        subDays(now, 30)

      const [reactions, comments, shares, avgSessionTime] = await Promise.all([
        ctx.db.reaction.count({
          where: {
            createdAt: { gte: startDate },
          },
        }),
        ctx.db.comment.count({
          where: {
            createdAt: { gte: startDate },
            deleted: false,
          },
        }),
        ctx.db.activityStream.count({
          where: {
            createdAt: { gte: startDate },
          },
        }),
        // Average session time would be calculated from session tracking
        Promise.resolve(0), // Placeholder
      ])

      // Get reaction distribution
      const reactionTypes = await ctx.db.reaction.groupBy({
        by: ['type'],
        where: {
          createdAt: { gte: startDate },
        },
        _count: true,
      })

      return {
        totalReactions: reactions,
        totalComments: comments,
        totalShares: shares,
        avgSessionTime,
        reactionDistribution: reactionTypes.map(r => ({
          type: r.type,
          count: r._count,
        })),
      }
    }),

  // Get revenue analytics
  getRevenueAnalytics: adminProcedure
    .input(
      z.object({
        period: z.enum(['day', 'week', 'month', 'year']).default('month'),
      })
    )
    .query(async ({ ctx, input }) => {
      const now = new Date()
      const startDate = 
        input.period === 'day' ? subDays(now, 1) :
        input.period === 'week' ? subDays(now, 7) :
        input.period === 'month' ? subDays(now, 30) :
        subDays(now, 365)

      const [
        totalRevenue,
        subscriptionRevenue,
        virtualGoodsRevenue,
        tipRevenue,
        topSpenders,
      ] = await Promise.all([
        ctx.db.currencyTransaction.aggregate({
          where: {
            createdAt: { gte: startDate },
          },
          _sum: {
            amount: true,
          },
        }),
        ctx.db.userSubscription.aggregate({
          where: {
            createdAt: { gte: startDate },
          },
          _sum: {
            amount: true,
          },
        }),
        ctx.db.storePurchase.aggregate({
          where: {
            createdAt: { gte: startDate },
          },
          _sum: {
            totalPrice: true,
          },
        }),
        ctx.db.tipTransaction.aggregate({
          where: {
            createdAt: { gte: startDate },
          },
          _sum: {
            amount: true,
          },
        }),
        ctx.db.user.findMany({
          where: {
            currencyTransactions: {
              some: {
                createdAt: { gte: startDate },
              },
            },
          },
          orderBy: {
            currencyTransactions: {
              _count: 'desc',
            },
          },
          take: 10,
          select: {
            id: true,
            username: true,
            image: true,
            currencyTransactions: {
              where: {
                createdAt: { gte: startDate },
              },
              select: {
                amount: true,
              },
            },
          },
        }),
      ])

      return {
        totalRevenue: totalRevenue._sum.amount || 0,
        subscriptionRevenue: subscriptionRevenue._sum.amount || 0,
        virtualGoodsRevenue: virtualGoodsRevenue._sum.totalPrice || 0,
        tipRevenue: tipRevenue._sum.amount || 0,
        topSpenders: topSpenders.map((user: any) => ({
          ...user,
          totalSpent: user.currencyTransactions.reduce((sum: number, t: any) => sum + Number(t.amount), 0),
        })),
      }
    }),
})
