// src/server/services/user.service.ts (OPTIMIZED VERSION)
import { PrismaClient, Prisma, UserRole, UserStatus } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import bcrypt from 'bcryptjs'
import { generateUsername } from '@/lib/utils'
import { NotificationService } from './notification.service'
import { ActivityService } from './activity.service'
import { GamificationService } from './gamification.service'
import { CacheService, CacheType } from './cache.service'

// Query builders for User model (addressing 70+ relations warning)
class UserQueryBuilder {
  // Basic profile - minimal fields for lists
  static basicProfile() {
    return {
      select: {
        id: true,
        username: true,
        image: true,
        role: true,
        verified: true,
        createdAt: true,
      }
    }
  }

  // Extended profile - for profile pages
  static extendedProfile() {
    return {
      select: {
        id: true,
        username: true,
        email: true,
        image: true,
        bio: true,
        role: true,
        verified: true,
        createdAt: true,
        lastSeenAt: true,
        profile: {
          select: {
            displayName: true,
            location: true,
            website: true,
            bio: true,
            interests: true,
            skills: true,
            pronouns: true,
            socialLinks: true,
          }
        },
        stats: true,
        _count: {
          select: {
            posts: { where: { published: true } },
            followers: true,
            following: true,
          }
        }
      }
    }
  }

  // Dashboard view - for authenticated user
  static dashboardView() {
    return {
      select: {
        ...this.extendedProfile().select,
        sparklePoints: true,
        premiumPoints: true,
        experience: true,
        level: true,
        balance: true,
        subscription: true,
        notificationPrefs: true,
        _count: {
          select: {
            ...this.extendedProfile().select._count.select,
            notifications: { where: { read: false } },
          }
        }
      }
    }
  }
}

export class UserService {
  private notificationService: NotificationService
  private activityService: ActivityService
  private gamificationService: GamificationService
  private cacheService: CacheService

  constructor(private db: PrismaClient) {
    this.notificationService = new NotificationService(db)
    this.activityService = new ActivityService(db)
    this.gamificationService = new GamificationService(db)
    this.cacheService = new CacheService()
  }

  async getProfileByUsername(username: string) {
    // Use cache with proper type
    const cacheKey = `user:${username}`
    const cached = await this.cacheService.get(cacheKey, CacheType.USER_PROFILE)
    if (cached) return cached

    // Use optimized query pattern
    const user = await this.db.user.findUnique({
      where: { username },
      ...UserQueryBuilder.extendedProfile(),
    })

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      })
    }

    if (user.status === UserStatus.BANNED) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'This user has been banned',
      })
    }

    // Update last seen in background (don't wait)
    this.db.user.update({
      where: { id: user.id },
      data: { lastSeenAt: new Date() },
    }).catch(console.error)

    // Cache the result
    await this.cacheService.set(cacheKey, user, undefined, CacheType.USER_PROFILE)

    return user
  }

  async getProfileById(userId: string) {
    // Use dashboard view for authenticated user's own profile
    const user = await this.db.user.findUnique({
      where: { id: userId },
      ...UserQueryBuilder.dashboardView(),
    })

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      })
    }

    // Get recent achievements separately (avoid loading all)
    const recentAchievements = await this.db.userAchievement.findMany({
      where: { userId },
      orderBy: { unlockedAt: 'desc' },
      take: 10,
      include: {
        achievement: true,
      },
    })

    return {
      ...user,
      recentAchievements,
    }
  }

  async followUser(followerId: string, followingId: string) {
    try {
      // Use transaction for atomic operations
      const result = await this.db.$transaction(async (tx) => {
        // Create follow relationship
        const follow = await tx.follow.create({
          data: {
            followerId,
            followingId,
          },
        })

        // Update stats
        await Promise.all([
          tx.userStats.update({
            where: { userId: followerId },
            data: { totalFollowing: { increment: 1 } },
          }),
          tx.userStats.update({
            where: { userId: followingId },
            data: { totalFollowers: { increment: 1 } },
          }),
        ])

        return follow
      })

      // Award XP for following
      await this.gamificationService.awardXP(
        followerId,
        XP_REWARDS.FOLLOW,
        'follow',
        followingId
      )

      // Award XP for being followed
      await this.gamificationService.awardXP(
        followingId,
        XP_REWARDS.FOLLOWED,
        'followed',
        followerId
      )

      // Create notification
      await this.notificationService.createNotification({
        type: 'USER_FOLLOWED',
        userId: followingId,
        actorId: followerId,
        entityId: followerId,
        entityType: 'user',
        title: 'New follower',
        message: 'started following you',
      })

      // Track activity
      await this.activityService.trackActivity({
        userId: followerId,
        action: 'user.followed',
        entityType: 'user',
        entityId: followingId,
      })

      // Update quest progress
      await this.gamificationService.updateQuestProgress(
        followerId,
        'FOLLOW_USERS'
      )

      // Invalidate caches
      await Promise.all([
        this.cacheService.invalidate(`user:${followerId}`),
        this.cacheService.invalidate(`user:${followingId}`),
      ])

      return result
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Already following this user',
          })
        }
      }
      throw error
    }
  }

  async searchUsers(query: string, limit: number) {
    // Use basic profile for search results
    return this.db.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { bio: { contains: query, mode: 'insensitive' } },
        ],
        status: UserStatus.ACTIVE,
      },
      ...UserQueryBuilder.basicProfile(),
      orderBy: [
        { verified: 'desc' },
        { stats: { totalFollowers: 'desc' } },
      ],
      take: limit,
    })
  }

  // ... rest of the methods remain similar but use query builders
}
