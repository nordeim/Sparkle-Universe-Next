// src/server/services/user.service.ts
import { 
  PrismaClient, 
  Prisma,
  UserRole,
  UserStatus,
  ReportReason,
  NotificationType 
} from '@prisma/client'
import { TRPCError } from '@trpc/server'
import * as bcrypt from 'bcryptjs'
import { NotificationService } from './notification.service'

export class UserService {
  private notificationService: NotificationService

  constructor(private db: PrismaClient) {
    this.notificationService = new NotificationService(db)
  }

  async getProfileByUsername(username: string) {
    const user = await this.db.user.findUnique({
      where: { 
        username,
        deleted: false,
      },
      include: {
        profile: true,
        stats: true,
        _count: {
          select: {
            posts: true,
            comments: true,
            followers: true,
            following: true,
          },
        },
      },
    })

    if (!user) {
      return null
    }

    // Don't expose sensitive fields
    const { 
      hashedPassword,
      twoFactorSecret,
      twoFactorBackupCodes,
      resetPasswordToken,
      emailVerificationToken,
      ...safeUser 
    } = user

    return safeUser
  }

  async getProfileById(userId: string) {
    const user = await this.db.user.findUnique({
      where: { 
        id: userId,
        deleted: false,
      },
      include: {
        profile: true,
        stats: true,
        subscription: true,
        balance: true,
        _count: {
          select: {
            posts: true,
            comments: true,
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

    // Don't expose sensitive fields
    const { 
      hashedPassword,
      twoFactorSecret,
      twoFactorBackupCodes,
      resetPasswordToken,
      emailVerificationToken,
      ...safeUser 
    } = user

    return safeUser
  }

  async updateProfile(userId: string, data: any) {
    // Use transaction to update both user and profile
    const result = await this.db.$transaction(async (tx) => {
      // Update profile
      const profile = await tx.profile.upsert({
        where: { userId },
        create: {
          userId,
          ...data,
        },
        update: {
          ...data,
          profileCompleteness: this.calculateProfileCompleteness(data),
        },
      })

      // Update user version for cache invalidation
      await tx.user.update({
        where: { id: userId },
        data: { 
          version: { increment: 1 },
          updatedAt: new Date(),
        },
      })

      return profile
    })

    // Get updated user with profile
    const user = await this.db.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    })

    return user
  }

  async updatePreferences(userId: string, preferences: any) {
    return this.db.user.update({
      where: { id: userId },
      data: {
        preferredLanguage: preferences.preferredLanguage,
        timezone: preferences.timezone,
        version: { increment: 1 },
      },
    })
  }

  async followUser(followerId: string, followingId: string) {
    // Check if already following
    const existingFollow = await this.db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    })

    if (existingFollow) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Already following this user',
      })
    }

    // Check if blocked
    const block = await this.db.block.findFirst({
      where: {
        OR: [
          { blockerId: followerId, blockedId: followingId },
          { blockerId: followingId, blockedId: followerId },
        ],
      },
    })

    if (block) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Cannot follow blocked user',
      })
    }

    // Create follow relationship
    const follow = await this.db.follow.create({
      data: {
        followerId,
        followingId,
      },
    })

    // Update stats
    await Promise.all([
      this.db.userStats.update({
        where: { userId: followerId },
        data: { totalFollowing: { increment: 1 } },
      }),
      this.db.userStats.update({
        where: { userId: followingId },
        data: { totalFollowers: { increment: 1 } },
      }),
    ])

    // Send notification
    await this.notificationService.createNotification({
      type: NotificationType.USER_FOLLOWED,
      userId: followingId,
      actorId: followerId,
      entityId: followerId,
      entityType: 'user',
      title: 'New follower',
      message: 'started following you',
    })

    return follow
  }

  async unfollowUser(followerId: string, followingId: string) {
    const deleted = await this.db.follow.deleteMany({
      where: {
        followerId,
        followingId,
      },
    })

    if (deleted.count === 0) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Not following this user',
      })
    }

    // Update stats
    await Promise.all([
      this.db.userStats.update({
        where: { userId: followerId },
        data: { totalFollowing: { decrement: 1 } },
      }),
      this.db.userStats.update({
        where: { userId: followingId },
        data: { totalFollowers: { decrement: 1 } },
      }),
    ])

    return { success: true }
  }

  async getFollowers(params: {
    userId: string
    limit: number
    cursor?: string
    viewerId?: string
  }) {
    const followers = await this.db.follow.findMany({
      where: { followingId: params.userId },
      take: params.limit + 1,
      cursor: params.cursor ? { id: params.cursor } : undefined,
      include: {
        follower: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    let nextCursor: string | undefined = undefined
    if (followers.length > params.limit) {
      const nextItem = followers.pop()
      nextCursor = nextItem!.id
    }

    // Check if viewer follows these users
    let followingStatus: Record<string, boolean> = {}
    if (params.viewerId) {
      const viewerFollowing = await this.db.follow.findMany({
        where: {
          followerId: params.viewerId,
          followingId: {
            in: followers.map(f => f.follower.id),
          },
        },
        select: { followingId: true },
      })

      followingStatus = viewerFollowing.reduce((acc, f) => {
        acc[f.followingId] = true
        return acc
      }, {} as Record<string, boolean>)
    }

    return {
      items: followers.map(f => ({
        ...f.follower,
        isFollowing: followingStatus[f.follower.id] || false,
      })),
      nextCursor,
    }
  }

  async getFollowing(params: {
    userId: string
    limit: number
    cursor?: string
    viewerId?: string
  }) {
    const following = await this.db.follow.findMany({
      where: { followerId: params.userId },
      take: params.limit + 1,
      cursor: params.cursor ? { id: params.cursor } : undefined,
      include: {
        following: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    let nextCursor: string | undefined = undefined
    if (following.length > params.limit) {
      const nextItem = following.pop()
      nextCursor = nextItem!.id
    }

    // Check if viewer follows these users
    let followingStatus: Record<string, boolean> = {}
    if (params.viewerId) {
      const viewerFollowing = await this.db.follow.findMany({
        where: {
          followerId: params.viewerId,
          followingId: {
            in: following.map(f => f.following.id),
          },
        },
        select: { followingId: true },
      })

      followingStatus = viewerFollowing.reduce((acc, f) => {
        acc[f.followingId] = true
        return acc
      }, {} as Record<string, boolean>)
    }

    return {
      items: following.map(f => ({
        ...f.following,
        isFollowing: followingStatus[f.following.id] || false,
      })),
      nextCursor,
    }
  }

  async isFollowing(followerId: string, followingId: string) {
    const follow = await this.db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    })

    return { isFollowing: !!follow }
  }

  async getUserStats(userId: string) {
    const stats = await this.db.userStats.findUnique({
      where: { userId },
    })

    if (!stats) {
      // Create default stats
      return this.db.userStats.create({
        data: { userId },
      })
    }

    return stats
  }

  async blockUser(blockerId: string, blockedId: string, reason?: string) {
    // Check if already blocked
    const existingBlock = await this.db.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    })

    if (existingBlock) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'User already blocked',
      })
    }

    // Create block with transaction
    const result = await this.db.$transaction(async (tx) => {
      // Create block
      const block = await tx.block.create({
        data: {
          blockerId,
          blockedId,
          reason,
        },
      })

      // Remove follow relationships
      await tx.follow.deleteMany({
        where: {
          OR: [
            { followerId: blockerId, followingId: blockedId },
            { followerId: blockedId, followingId: blockerId },
          ],
        },
      })

      return block
    })

    return result
  }

  async unblockUser(blockerId: string, blockedId: string) {
    const deleted = await this.db.block.deleteMany({
      where: {
        blockerId,
        blockedId,
      },
    })

    if (deleted.count === 0) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not blocked',
      })
    }

    return { success: true }
  }

  async getBlockedUsers(userId: string) {
    const blocks = await this.db.block.findMany({
      where: { blockerId: userId },
      include: {
        blocked: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return blocks.map(b => ({
      ...b.blocked,
      blockedAt: b.createdAt,
      reason: b.reason,
    }))
  }

  async searchUsers(params: {
    query: string
    limit: number
    excludeIds?: string[]
    type: 'all' | 'mentions' | 'creators'
    currentUserId?: string
  }) {
    const whereConditions: Prisma.UserWhereInput = {
      AND: [
        {
          OR: [
            {
              username: {
                contains: params.query,
                mode: 'insensitive' as const,
              },
            },
            {
              profile: {
                displayName: {
                  contains: params.query,
                  mode: 'insensitive' as const,
                },
              },
            },
          ],
        },
        {
          id: {
            notIn: params.excludeIds || [],
          },
        },
        {
          status: UserStatus.ACTIVE,
        },
        {
          deleted: false,
        },
      ],
    }

    // Add type-specific filters
    if (params.type === 'creators') {
      whereConditions.AND!.push({
        role: {
          in: [UserRole.CREATOR, UserRole.VERIFIED_CREATOR],
        },
      })
    }

    const users = await this.db.user.findMany({
      where: whereConditions,
      select: {
        id: true,
        username: true,
        image: true,
        verified: true,
        role: true,
        profile: {
          select: {
            displayName: true,
          },
        },
        _count: {
          select: {
            followers: true,
          },
        },
      },
      take: params.limit,
      orderBy: [
        {
          verified: 'desc',
        },
        {
          followers: {
            _count: 'desc',
          },
        },
      ],
    })

    return users
  }

  async getRecommendedUsers(userId: string, limit: number) {
    // Get user's following
    const following = await this.db.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    })

    const followingIds = following.map(f => f.followingId)

    // Get users followed by people you follow
    const recommendations = await this.db.user.findMany({
      where: {
        AND: [
          {
            id: {
              notIn: [...followingIds, userId],
            },
          },
          {
            followers: {
              some: {
                followerId: {
                  in: followingIds,
                },
              },
            },
          },
          {
            status: UserStatus.ACTIVE,
          },
          {
            deleted: false,
          },
        ],
      },
      include: {
        profile: true,
        _count: {
          select: {
            followers: true,
            posts: true,
          },
        },
      },
      take: limit,
      orderBy: {
        followers: {
          _count: 'desc',
        },
      },
    })

    return recommendations
  }

  async getOnlineStatus(userIds: string[]) {
    const users = await this.db.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        onlineStatus: true,
        lastSeenAt: true,
      },
    })

    return users.reduce((acc, user) => {
      acc[user.id] = {
        isOnline: user.onlineStatus,
        lastSeenAt: user.lastSeenAt,
      }
      return acc
    }, {} as Record<string, { isOnline: boolean; lastSeenAt: Date | null }>)
  }

  async updateOnlineStatus(userId: string, isOnline: boolean) {
    return this.db.user.update({
      where: { id: userId },
      data: {
        onlineStatus: isOnline,
        lastSeenAt: new Date(),
      },
    })
  }

  async getUserAchievements(userId: string, showcasedOnly: boolean) {
    const where: Prisma.UserAchievementWhereInput = {
      userId,
      deleted: false,
    }

    if (showcasedOnly) {
      where.showcased = true
    }

    return this.db.userAchievement.findMany({
      where,
      include: {
        achievement: true,
      },
      orderBy: showcasedOnly
        ? { showcaseOrder: 'asc' }
        : { unlockedAt: 'desc' },
    })
  }

  async verifyPassword(userId: string, password: string) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: { hashedPassword: true },
    })

    if (!user || !user.hashedPassword) {
      return false
    }

    return bcrypt.compare(password, user.hashedPassword)
  }

  async deleteAccount(userId: string) {
    // Get user's current data for preservation
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: { username: true },
    })

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      })
    }

    // Use transaction for atomic deletion
    await this.db.$transaction(async (tx) => {
      // Preserve author names in content
      await tx.post.updateMany({
        where: { authorId: userId },
        data: { 
          authorName: user.username,
          authorId: null, // Disconnect user but preserve name
        },
      })

      await tx.comment.updateMany({
        where: { authorId: userId },
        data: { 
          authorName: user.username,
          authorId: null,
        },
      })

      await tx.group.updateMany({
        where: { ownerId: userId },
        data: { 
          ownerName: user.username,
          ownerId: null,
        },
      })

      await tx.event.updateMany({
        where: { hostId: userId },
        data: { 
          hostName: user.username,
          hostId: null,
        },
      })

      await tx.postSeries.updateMany({
        where: { authorId: userId },
        data: { 
          authorName: user.username,
          authorId: null,
        },
      })

      // Soft delete user
      await tx.user.update({
        where: { id: userId },
        data: {
          deleted: true,
          deletedAt: new Date(),
          status: UserStatus.DELETED,
          email: `deleted_${userId}@deleted.com`, // Anonymize
          username: `deleted_${userId}`, // Free up username
          version: { increment: 1 },
        },
      })
    })

    return { success: true }
  }

  async reportUser(params: {
    userId: string
    reporterId: string
    reason: string
    description: string
    evidence?: any
  }) {
    return this.db.report.create({
      data: {
        entityType: 'user',
        reportedUserId: params.userId,
        reporterId: params.reporterId,
        reason: params.reason as ReportReason,
        description: params.description,
        evidence: params.evidence,
      },
    })
  }

  private calculateProfileCompleteness(data: any): number {
    const fields = [
      'displayName',
      'bio',
      'location',
      'website',
      'interests',
      'skills',
    ]

    const filledFields = fields.filter(field => data[field] && data[field].length > 0)
    return Math.round((filledFields.length / fields.length) * 100)
  }
}
