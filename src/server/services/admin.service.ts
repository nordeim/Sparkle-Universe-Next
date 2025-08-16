// src/server/services/admin.service.ts
import { PrismaClient, UserRole, UserStatus, AuditAction } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { NotificationService } from './notification.service'
import { EmailService } from './email.service'
import { Redis } from 'ioredis'

export class AdminService {
  private redis: Redis
  private notificationService: NotificationService
  private emailService: EmailService

  constructor(private db: PrismaClient) {
    this.redis = new Redis(process.env.REDIS_URL!)
    this.notificationService = new NotificationService(db)
    this.emailService = new EmailService()
  }

  async getDashboardStats(period: string) {
    const now = new Date()
    const startDate = this.getStartDate(period)

    const [
      totalUsers,
      activeUsers,
      newUsers,
      onlineUsers,
      totalPosts,
      totalComments,
      totalReactions,
      pendingReports,
      approvedToday,
      rejectedToday,
      newUsersToday,
      postsToday,
    ] = await Promise.all([
      this.db.user.count({ where: { deleted: false } }),
      this.db.user.count({
        where: {
          deleted: false,
          lastSeenAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      this.db.user.count({
        where: {
          deleted: false,
          createdAt: { gte: startDate },
        },
      }),
      this.db.user.count({
        where: {
          deleted: false,
          onlineStatus: true,
        },
      }),
      this.db.post.count({ where: { deleted: false } }),
      this.db.comment.count({ where: { deleted: false } }),
      this.db.reaction.count(),
      this.db.report.count({ where: { status: 'PENDING' } }),
      this.db.report.count({
        where: {
          status: 'APPROVED',
          updatedAt: { gte: new Date(now.setHours(0, 0, 0, 0)) },
        },
      }),
      this.db.report.count({
        where: {
          status: 'REJECTED',
          updatedAt: { gte: new Date(now.setHours(0, 0, 0, 0)) },
        },
      }),
      this.db.user.count({
        where: {
          createdAt: { gte: new Date(now.setHours(0, 0, 0, 0)) },
        },
      }),
      this.db.post.count({
        where: {
          createdAt: { gte: new Date(now.setHours(0, 0, 0, 0)) },
        },
      }),
    ])

    // Calculate growth percentages
    const previousPeriodStart = this.getStartDate(period, -2)
    const previousPeriodEnd = startDate

    const [previousUsers, previousPosts] = await Promise.all([
      this.db.user.count({
        where: {
          createdAt: {
            gte: previousPeriodStart,
            lt: previousPeriodEnd,
          },
        },
      }),
      this.db.post.count({
        where: {
          createdAt: {
            gte: previousPeriodStart,
            lt: previousPeriodEnd,
          },
        },
      }),
    ])

    const userGrowth = previousUsers > 0 
      ? ((newUsers - previousUsers) / previousUsers) * 100 
      : 0

    const postGrowth = previousPosts > 0
      ? ((postsToday - previousPosts) / previousPosts) * 100
      : 0

    return {
      totalUsers,
      activeUsers,
      newUsers,
      onlineUsers,
      totalPosts,
      totalComments,
      totalReactions,
      pendingReports,
      approvedToday,
      rejectedToday,
      newUsersToday,
      postsToday,
      userGrowth,
      postGrowth,
    }
  }

  async getUsers(params: {
    search?: string
    filter?: string
    sortField?: string
    sortOrder?: string
    page: number
    limit: number
  }) {
    const where: any = { deleted: false }

    // Apply search
    if (params.search) {
      where.OR = [
        { username: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ]
    }

    // Apply filter
    switch (params.filter) {
      case 'active':
        where.status = UserStatus.ACTIVE
        break
      case 'verified':
        where.verified = true
        break
      case 'banned':
        where.banned = true
        break
      case 'admin':
        where.role = { in: [UserRole.ADMIN, UserRole.MODERATOR] }
        break
      case 'new':
        where.createdAt = { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        break
    }

    // Build orderBy
    const orderBy: any = {}
    if (params.sortField) {
      orderBy[params.sortField] = params.sortOrder || 'desc'
    } else {
      orderBy.createdAt = 'desc'
    }

    const [users, totalCount] = await Promise.all([
      this.db.user.findMany({
        where,
        orderBy,
        skip: params.page * params.limit,
        take: params.limit,
        select: {
          id: true,
          username: true,
          email: true,
          image: true,
          role: true,
          status: true,
          verified: true,
          banned: true,
          level: true,
          experience: true,
          sparklePoints: true,
          createdAt: true,
          lastSeenAt: true,
          onlineStatus: true,
          _count: {
            select: {
              posts: true,
              comments: true,
              followers: true,
            },
          },
        },
      }),
      this.db.user.count({ where }),
    ])

    return {
      users,
      totalCount,
      totalPages: Math.ceil(totalCount / params.limit),
      currentPage: params.page,
    }
  }

  async getUserDetails(userId: string) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        stats: true,
        balance: true,
        subscription: true,
        _count: {
          select: {
            posts: true,
            comments: true,
            reactions: true,
            followers: true,
            following: true,
            achievements: true,
          },
        },
      },
    })

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      })
    }

    // Get recent activity
    const recentActivity = await this.db.activityStream.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    // Get moderation history
    const moderationHistory = await this.db.moderationAction.findMany({
      where: { targetUserId: userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    return {
      user,
      recentActivity,
      moderationHistory,
    }
  }

  async banUser(params: {
    userId: string
    reason: string
    duration?: number
    bannedBy: string
    notifyUser?: boolean
  }) {
    const banExpiresAt = params.duration
      ? new Date(Date.now() + params.duration * 24 * 60 * 60 * 1000)
      : null

    const user = await this.db.user.update({
      where: { id: params.userId },
      data: {
        banned: true,
        banReason: params.reason,
        banExpiresAt,
        status: UserStatus.BANNED,
      },
    })

    // Create moderation action record
    await this.db.moderationAction.create({
      data: {
        moderatorId: params.bannedBy,
        targetUserId: params.userId,
        targetType: 'user',
        action: 'ban',
        duration: params.duration ? params.duration * 24 : null,
        reason: params.reason,
      },
    })

    // Create audit log
    await this.db.auditLog.create({
      data: {
        userId: params.bannedBy,
        action: AuditAction.UPDATE,
        entityType: 'user',
        entityId: params.userId,
        entityData: { banned: true, reason: params.reason },
        reason: `User banned: ${params.reason}`,
      },
    })

    // Notify user if requested
    if (params.notifyUser) {
      await this.notificationService.createNotification({
        type: 'SYSTEM',
        userId: params.userId,
        title: 'Account Suspended',
        message: `Your account has been suspended. Reason: ${params.reason}`,
        entityType: 'user',
        entityId: params.userId,
      })
    }

    // Invalidate user sessions
    await this.redis.del(`session:${params.userId}:*`)

    return user
  }

  async unbanUser(userId: string, unbannedBy: string) {
    const user = await this.db.user.update({
      where: { id: userId },
      data: {
        banned: false,
        banReason: null,
        banExpiresAt: null,
        status: UserStatus.ACTIVE,
      },
    })

    // Create moderation action record
    await this.db.moderationAction.create({
      data: {
        moderatorId: unbannedBy,
        targetUserId: userId,
        targetType: 'user',
        action: 'unban',
        reason: 'Ban lifted by administrator',
      },
    })

    // Create audit log
    await this.db.auditLog.create({
      data: {
        userId: unbannedBy,
        action: AuditAction.UPDATE,
        entityType: 'user',
        entityId: userId,
        entityData: { banned: false },
        reason: 'User unbanned',
      },
    })

    return user
  }

  async verifyUser(userId: string, verifiedBy: string) {
    const user = await this.db.user.update({
      where: { id: userId },
      data: {
        verified: true,
        verifiedAt: new Date(),
      },
    })

    // Create audit log
    await this.db.auditLog.create({
      data: {
        userId: verifiedBy,
        action: AuditAction.UPDATE,
        entityType: 'user',
        entityId: userId,
        entityData: { verified: true },
        reason: 'User verified by admin',
      },
    })

    // Send notification
    await this.notificationService.createNotification({
      type: 'SYSTEM',
      userId,
      title: 'Account Verified',
      message: 'Your account has been verified!',
      entityType: 'user',
      entityId: userId,
    })

    return user
  }

  async updateUserRole(userId: string, role: UserRole, updatedBy: string) {
    const user = await this.db.user.update({
      where: { id: userId },
      data: { role },
    })

    // Create audit log
    await this.db.auditLog.create({
      data: {
        userId: updatedBy,
        action: AuditAction.UPDATE,
        entityType: 'user',
        entityId: userId,
        entityData: { role },
        reason: `User role changed to ${role}`,
      },
    })

    return user
  }

  async deleteUser(params: {
    userId: string
    deleteContent: boolean
    reason: string
    deletedBy: string
  }) {
    // Soft delete user
    const user = await this.db.user.update({
      where: { id: params.userId },
      data: {
        deleted: true,
        deletedAt: new Date(),
        deletedBy: params.deletedBy,
        status: UserStatus.DELETED,
      },
    })

    // Optionally delete content
    if (params.deleteContent) {
      await Promise.all([
        this.db.post.updateMany({
          where: { authorId: params.userId },
          data: {
            deleted: true,
            deletedAt: new Date(),
            deletedBy: params.deletedBy,
          },
        }),
        this.db.comment.updateMany({
          where: { authorId: params.userId },
          data: {
            deleted: true,
            deletedAt: new Date(),
            deletedBy: params.deletedBy,
          },
        }),
      ])
    }

    // Create audit log
    await this.db.auditLog.create({
      data: {
        userId: params.deletedBy,
        action: AuditAction.DELETE,
        entityType: 'user',
        entityId: params.userId,
        entityData: { deleteContent: params.deleteContent },
        reason: params.reason,
      },
    })

    return user
  }

  async sendUserEmail(params: {
    userId?: string
    userIds?: string[]
    subject: string
    message: string
    template?: string
    sentBy: string
  }) {
    const userIds = params.userIds || (params.userId ? [params.userId] : [])
    
    if (userIds.length === 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No users specified',
      })
    }

    const users = await this.db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, username: true },
    })

    for (const user of users) {
      await this.emailService.sendEmail({
        to: user.email,
        subject: params.subject,
        template: params.template || 'admin-message',
        data: {
          username: user.username,
          message: params.message,
        },
      })
    }

    // Create audit log
    await this.db.auditLog.create({
      data: {
        userId: params.sentBy,
        action: AuditAction.CREATE,
        entityType: 'email',
        entityId: userIds.join(','),
        entityData: { subject: params.subject, userCount: users.length },
        reason: `Email sent to ${users.length} users`,
      },
    })

    return { sent: users.length }
  }

  async bulkUserAction(params: {
    action: string
    userIds: string[]
    params?: any
    performedBy: string
  }) {
    const results = []

    for (const userId of params.userIds) {
      try {
        let result
        switch (params.action) {
          case 'verify':
            result = await this.verifyUser(userId, params.performedBy)
            break
          case 'ban':
            result = await this.banUser({
              userId,
              reason: params.params?.reason || 'Bulk ban',
              duration: params.params?.duration,
              bannedBy: params.performedBy,
            })
            break
          case 'unban':
            result = await this.unbanUser(userId, params.performedBy)
            break
          case 'delete':
            result = await this.deleteUser({
              userId,
              deleteContent: params.params?.deleteContent || false,
              reason: params.params?.reason || 'Bulk delete',
              deletedBy: params.performedBy,
            })
            break
          case 'role':
            result = await this.updateUserRole(
              userId,
              params.params?.role,
              params.performedBy
            )
            break
        }
        results.push({ userId, success: true, result })
      } catch (error) {
        results.push({ userId, success: false, error: error.message })
      }
    }

    return results
  }

  async getSiteSettings(category?: string) {
    const where = category ? { category } : {}
    return this.db.siteSetting.findMany({
      where,
      orderBy: { key: 'asc' },
    })
  }

  async updateSiteSettings(params: {
    settings: Record<string, any>
    category?: string
    updatedBy: string
  }) {
    const updates = []

    for (const [key, value] of Object.entries(params.settings)) {
      updates.push(
        this.db.siteSetting.upsert({
          where: { key },
          create: {
            key,
            value,
            type: typeof value,
            category: params.category,
            updatedBy: params.updatedBy,
          },
          update: {
            value,
            updatedBy: params.updatedBy,
          },
        })
      )
    }

    await Promise.all(updates)

    // Clear cache
    await this.redis.del('site:settings:*')

    return { updated: updates.length }
  }

  async getFeatureFlags() {
    return this.db.featureFlag.findMany({
      orderBy: { flag: 'asc' },
    })
  }

  async updateFeatureFlag(params: {
    flag: string
    enabled: boolean
    rolloutPercentage?: number
    conditions?: any
  }) {
    const flag = await this.db.featureFlag.upsert({
      where: { flag: params.flag },
      create: {
        flag: params.flag,
        name: params.flag,
        enabled: params.enabled,
        rolloutPercentage: params.rolloutPercentage || 100,
        conditions: params.conditions,
      },
      update: {
        enabled: params.enabled,
        rolloutPercentage: params.rolloutPercentage,
        conditions: params.conditions,
      },
    })

    // Clear cache
    await this.redis.del(`feature:${params.flag}`)

    return flag
  }

  async getActiveAlerts() {
    // Check for system issues
    const alerts = []

    // Check for high report queue
    const pendingReports = await this.db.report.count({
      where: { status: 'PENDING' },
    })

    if (pendingReports > 50) {
      alerts.push({
        id: 'high-report-queue',
        type: 'moderation',
        severity: pendingReports > 100 ? 'error' : 'warning',
        message: `${pendingReports} reports pending moderation`,
      })
    }

    // Check for system health issues
    const healthCheck = await this.db.systemHealth.findFirst({
      orderBy: { checkedAt: 'desc' },
    })

    if (healthCheck && healthCheck.status !== 'healthy') {
      alerts.push({
        id: 'system-health',
        type: 'system',
        severity: 'error',
        message: `System status: ${healthCheck.status}`,
      })
    }

    return alerts
  }

  async getAuditLogs(params: {
    userId?: string
    action?: string
    startDate?: Date
    endDate?: Date
    limit: number
  }) {
    const where: any = {}

    if (params.userId) where.userId = params.userId
    if (params.action) where.action = params.action
    if (params.startDate || params.endDate) {
      where.createdAt = {}
      if (params.startDate) where.createdAt.gte = params.startDate
      if (params.endDate) where.createdAt.lte = params.endDate
    }

    return this.db.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: params.limit,
    })
  }

  async exportData(params: {
    type: string
    format: string
    filters?: any
    exportedBy: string
  }) {
    // Implementation depends on specific export requirements
    // This would typically generate a file and return a download URL
    
    // Create audit log
    await this.db.auditLog.create({
      data: {
        userId: params.exportedBy,
        action: AuditAction.CREATE,
        entityType: 'export',
        entityId: params.type,
        entityData: { format: params.format, filters: params.filters },
        reason: `Data export: ${params.type}`,
      },
    })

    return {
      url: `/api/admin/export/${params.type}`,
      expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    }
  }

  private getStartDate(period: string, multiplier = -1): Date {
    const now = new Date()
    switch (period) {
      case 'today':
        return new Date(now.setHours(0, 0, 0, 0))
      case 'week':
        return new Date(now.setDate(now.getDate() + 7 * multiplier))
      case 'month':
        return new Date(now.setMonth(now.getMonth() + 1 * multiplier))
      case 'quarter':
        return new Date(now.setMonth(now.getMonth() + 3 * multiplier))
      case 'year':
        return new Date(now.setFullYear(now.getFullYear() + 1 * multiplier))
      default:
        return new Date(now.setDate(now.getDate() + 7 * multiplier))
    }
  }
}
