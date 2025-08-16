// src/server/api/routers/admin.ts
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { TRPCError } from '@trpc/server'
import { AdminService } from '@/server/services/admin.service'
import { AnalyticsService } from '@/server/services/analytics.service'
import { ModerationService } from '@/server/services/moderation.service'
import { SystemService } from '@/server/services/system.service'
import { UserRole } from '@prisma/client'

// Admin middleware - ensures user is admin or moderator
const adminProcedure = protectedProcedure.use(async (opts) => {
  if (!['ADMIN', 'MODERATOR'].includes(opts.ctx.session.user.role)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin or Moderator access required',
    })
  }
  return opts.next({
    ctx: {
      ...opts.ctx,
      isAdmin: opts.ctx.session.user.role === 'ADMIN',
      isModerator: opts.ctx.session.user.role === 'MODERATOR',
    }
  })
})

// Super admin only procedures
const superAdminProcedure = adminProcedure.use(async (opts) => {
  if (opts.ctx.session.user.role !== 'ADMIN') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required',
    })
  }
  return opts.next()
})

export const adminRouter = createTRPCRouter({
  // ===== DASHBOARD =====
  getDashboardStats: adminProcedure
    .input(z.object({
      period: z.enum(['today', 'week', 'month', 'quarter', 'year']).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const adminService = new AdminService(ctx.db)
      const analyticsService = new AnalyticsService(ctx.db)
      
      const [basicStats, advancedStats] = await Promise.all([
        adminService.getDashboardStats(input.period || 'week'),
        analyticsService.getAdvancedMetrics(input.period || 'week'),
      ])

      return {
        users: {
          total: basicStats.totalUsers,
          active: basicStats.activeUsers,
          new: basicStats.newUsers,
          online: basicStats.onlineUsers,
          growth: basicStats.userGrowth,
          activeGrowth: advancedStats.activeUserGrowth,
          newToday: basicStats.newUsersToday,
          dau: advancedStats.dau,
          mau: advancedStats.mau,
          avgSessionDuration: advancedStats.avgSessionDuration,
          retentionRate: advancedStats.retentionRate,
        },
        content: {
          posts: basicStats.totalPosts,
          comments: basicStats.totalComments,
          postsGrowth: basicStats.postGrowth,
          postsToday: basicStats.postsToday,
        },
        engagement: {
          reactions: basicStats.totalReactions,
          comments: basicStats.totalComments,
          shares: advancedStats.totalShares,
          rate: advancedStats.engagementRate,
          rateChange: advancedStats.engagementRateChange,
          viralityScore: advancedStats.viralityScore,
        },
        moderation: {
          pending: basicStats.pendingReports,
          approvedToday: basicStats.approvedToday,
          rejectedToday: basicStats.rejectedToday,
          aiAccuracy: advancedStats.aiModerationAccuracy,
        },
      }
    }),

  getAnalytics: adminProcedure
    .input(z.object({
      period: z.enum(['day', 'week', 'month', 'quarter', 'year']),
      metric: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const analyticsService = new AnalyticsService(ctx.db)
      return analyticsService.getAnalytics(input.period, input.metric)
    }),

  getSystemHealth: adminProcedure
    .query(async ({ ctx }) => {
      const systemService = new SystemService(ctx.db)
      return systemService.getSystemHealth()
    }),

  getAlerts: adminProcedure
    .query(async ({ ctx }) => {
      const adminService = new AdminService(ctx.db)
      return adminService.getActiveAlerts()
    }),

  // ===== USER MANAGEMENT =====
  getUsers: adminProcedure
    .input(z.object({
      search: z.string().optional(),
      filter: z.enum(['all', 'active', 'verified', 'banned', 'admin', 'new']).optional(),
      sortField: z.enum(['username', 'email', 'createdAt', 'level', 'posts', 'followers']).optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
      page: z.number().default(0),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ ctx, input }) => {
      const adminService = new AdminService(ctx.db)
      return adminService.getUsers(input)
    }),

  getUserDetails: adminProcedure
    .input(z.object({
      userId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const adminService = new AdminService(ctx.db)
      return adminService.getUserDetails(input.userId)
    }),

  banUser: adminProcedure
    .input(z.object({
      userId: z.string(),
      reason: z.string(),
      duration: z.number().optional(), // Days, undefined = permanent
      notifyUser: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      const adminService = new AdminService(ctx.db)
      return adminService.banUser({
        ...input,
        bannedBy: ctx.session.user.id,
      })
    }),

  unbanUser: adminProcedure
    .input(z.object({
      userId: z.string(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const adminService = new AdminService(ctx.db)
      return adminService.unbanUser(input.userId, ctx.session.user.id)
    }),

  verifyUser: adminProcedure
    .input(z.object({
      userId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const adminService = new AdminService(ctx.db)
      return adminService.verifyUser(input.userId, ctx.session.user.id)
    }),

  updateUserRole: superAdminProcedure
    .input(z.object({
      userId: z.string(),
      role: z.nativeEnum(UserRole),
    }))
    .mutation(async ({ ctx, input }) => {
      const adminService = new AdminService(ctx.db)
      return adminService.updateUserRole(
        input.userId, 
        input.role,
        ctx.session.user.id
      )
    }),

  deleteUser: superAdminProcedure
    .input(z.object({
      userId: z.string(),
      deleteContent: z.boolean().default(false),
      reason: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const adminService = new AdminService(ctx.db)
      return adminService.deleteUser({
        ...input,
        deletedBy: ctx.session.user.id,
      })
    }),

  sendUserEmail: adminProcedure
    .input(z.object({
      userId: z.string().optional(),
      userIds: z.array(z.string()).optional(),
      subject: z.string(),
      message: z.string(),
      template: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const adminService = new AdminService(ctx.db)
      return adminService.sendUserEmail({
        ...input,
        sentBy: ctx.session.user.id,
      })
    }),

  bulkUserAction: adminProcedure
    .input(z.object({
      action: z.enum(['verify', 'ban', 'unban', 'delete', 'email', 'role']),
      userIds: z.array(z.string()),
      params: z.any().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const adminService = new AdminService(ctx.db)
      return adminService.bulkUserAction({
        ...input,
        performedBy: ctx.session.user.id,
      })
    }),

  // ===== CONTENT MODERATION =====
  getModerationQueue: adminProcedure
    .input(z.object({
      type: z.enum(['posts', 'comments', 'users', 'media']).optional(),
      filter: z.enum(['all', 'ai-flagged', 'user-reported', 'escalated', 'new']).optional(),
      priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      limit: z.number().default(50),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const moderationService = new ModerationService(ctx.db)
      return moderationService.getModerationQueue(input)
    }),

  getModerationStats: adminProcedure
    .query(async ({ ctx }) => {
      const moderationService = new ModerationService(ctx.db)
      return moderationService.getModerationStats()
    }),

  moderateContent: adminProcedure
    .input(z.object({
      itemId: z.string(),
      action: z.enum(['approve', 'reject', 'escalate', 'ignore']),
      reason: z.string().optional(),
      note: z.string().optional(),
      banDuration: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const moderationService = new ModerationService(ctx.db)
      return moderationService.moderateContent({
        ...input,
        moderatorId: ctx.session.user.id,
      })
    }),

  bulkModerate: adminProcedure
    .input(z.object({
      itemIds: z.array(z.string()),
      action: z.enum(['approve', 'reject', 'escalate', 'ignore']),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const moderationService = new ModerationService(ctx.db)
      return moderationService.bulkModerate({
        ...input,
        moderatorId: ctx.session.user.id,
      })
    }),

  getAIModerationSettings: adminProcedure
    .query(async ({ ctx }) => {
      const moderationService = new ModerationService(ctx.db)
      return moderationService.getAISettings()
    }),

  updateAIModerationSettings: superAdminProcedure
    .input(z.object({
      enabled: z.boolean().optional(),
      threshold: z.number().min(0).max(100).optional(),
      autoApproveThreshold: z.number().min(0).max(100).optional(),
      autoRejectThreshold: z.number().min(0).max(100).optional(),
      categories: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const moderationService = new ModerationService(ctx.db)
      return moderationService.updateAISettings(input)
    }),

  // ===== SITE SETTINGS =====
  getSiteSettings: adminProcedure
    .input(z.object({
      category: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const adminService = new AdminService(ctx.db)
      return adminService.getSiteSettings(input.category)
    }),

  updateSiteSettings: superAdminProcedure
    .input(z.object({
      settings: z.record(z.any()),
      category: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const adminService = new AdminService(ctx.db)
      return adminService.updateSiteSettings({
        settings: input.settings,
        category: input.category,
        updatedBy: ctx.session.user.id,
      })
    }),

  // ===== FEATURE FLAGS =====
  getFeatureFlags: adminProcedure
    .query(async ({ ctx }) => {
      const adminService = new AdminService(ctx.db)
      return adminService.getFeatureFlags()
    }),

  updateFeatureFlag: superAdminProcedure
    .input(z.object({
      flag: z.string(),
      enabled: z.boolean(),
      rolloutPercentage: z.number().min(0).max(100).optional(),
      conditions: z.any().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const adminService = new AdminService(ctx.db)
      return adminService.updateFeatureFlag(input)
    }),

  // ===== SYSTEM ADMINISTRATION =====
  getSystemLogs: superAdminProcedure
    .input(z.object({
      type: z.enum(['error', 'warning', 'info', 'audit']).optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      limit: z.number().default(100),
    }))
    .query(async ({ ctx, input }) => {
      const systemService = new SystemService(ctx.db)
      return systemService.getSystemLogs(input)
    }),

  runSystemMaintenance: superAdminProcedure
    .input(z.object({
      task: z.enum(['cleanup', 'optimize', 'backup', 'cache-clear']),
      force: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const systemService = new SystemService(ctx.db)
      return systemService.runMaintenance({
        ...input,
        initiatedBy: ctx.session.user.id,
      })
    }),

  // ===== EXPORT/IMPORT =====
  exportData: superAdminProcedure
    .input(z.object({
      type: z.enum(['users', 'posts', 'analytics', 'all']),
      format: z.enum(['csv', 'json', 'xlsx']).default('csv'),
      filters: z.any().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const adminService = new AdminService(ctx.db)
      return adminService.exportData({
        ...input,
        exportedBy: ctx.session.user.id,
      })
    }),

  // ===== REAL-TIME MONITORING =====
  getRealtimeMetrics: adminProcedure
    .query(async ({ ctx }) => {
      const analyticsService = new AnalyticsService(ctx.db)
      return analyticsService.getRealtimeMetrics()
    }),

  // ===== AUDIT LOGS =====
  getAuditLogs: superAdminProcedure
    .input(z.object({
      userId: z.string().optional(),
      action: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      limit: z.number().default(100),
    }))
    .query(async ({ ctx, input }) => {
      const adminService = new AdminService(ctx.db)
      return adminService.getAuditLogs(input)
    }),
})
