// src/server/services/user.service.ts
import { PrismaClient, Prisma, UserRole, UserStatus } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import bcrypt from 'bcryptjs'
import { generateUsername } from '@/lib/utils'
import { NotificationService } from './notification.service'
import { ActivityService } from './activity.service'

export class UserService {
  private notificationService: NotificationService
  private activityService: ActivityService

  constructor(private db: PrismaClient) {
    this.notificationService = new NotificationService(db)
    this.activityService = new ActivityService(db)
  }

  async getProfileByUsername(username: string) {
    const user = await this.db.user.findUnique({
      where: { username },
      include: {
        profile: true,
        stats: true,
        _count: {
          select: {
            posts: { where: { published: true } },
            followers: true,
            following: true,
          },
        },
        achievements: {
          where: { showcased: true },
          orderBy: { showcaseOrder: 'asc' },
          take: 3,
          include: {
            achievement: true,
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

    if (user.status === UserStatus.BANNED) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'This user has been banned',
      })
    }

    // Update last seen
    await this.db.user.update({
      where: { id: user.id },
      data: { lastSeenAt: new Date() },
    })

    return user
  }

  async getProfileById(userId: string) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        stats: true,
        balance: true,
        subscription: true,
        notificationPrefs: true,
        _count: {
          select: {
            posts: { where: { published: true } },
            followers: true,
            following: true,
            notifications: { where: { read: false } },
          },
        },
        achievements: {
          orderBy: { unlockedAt: 'desc' },
          take: 10,
          include: {
            achievement: true,
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

    return user
  }

  async updateProfile(userId: string, data: any) {
    // Validate username if changed
    if (data.username) {
      const existing = await this.db.user.findUnique({
        where: { username: data.username },
      })
      
      if (existing && existing.id !== userId) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Username already taken',
        })
      }
    }

    const updatedUser = await this.db.user.update({
      where: { id: userId },
      data: {
        username: data.username,
        bio: data.bio,
        image: data.image,
        profile: {
          upsert: {
            create: {
              displayName: data.displayName,
              location: data.location,
              website: data.website,
              twitterUsername: data.twitterUsername,
              instagramUsername: data.instagramUsername,
              tiktokUsername: data.tiktokUsername,
              discordUsername: data.discordUsername,
              youtubeChannelId: data.youtubeChannelId,
              interests: data.interests || [],
              skills: data.skills || [],
              pronouns: data.pronouns,
            },
            update: {
              displayName: data.displayName,
              location: data.location,
              website: data.website,
              twitterUsername: data.twitterUsername,
              instagramUsername: data.instagramUsername,
              tiktokUsername: data.tiktokUsername,
              discordUsername: data.discordUsername,
              youtubeChannelId: data.youtubeChannelId,
              interests: data.interests || [],
              skills: data.skills || [],
              pronouns: data.pronouns,
            },
          },
        },
      },
      include: {
        profile: true,
      },
    })

    // Track profile update activity
    await this.activityService.trackActivity({
      userId,
      action: 'profile.updated',
      entityType: 'user',
      entityId: userId,
    })

    // Check profile completion
    await this.checkProfileCompletion(userId)

    return updatedUser
  }

  async updatePreferences(userId: string, preferences: any) {
    return this.db.user.update({
      where: { id: userId },
      data: {
        preferredLanguage: preferences.language,
        timezone: preferences.timezone,
        profile: {
          update: {
            themePreference: preferences.theme,
            notificationSettings: preferences.notifications,
            privacySettings: preferences.privacy,
          },
        },
        notificationPrefs: {
          upsert: {
            create: preferences.notificationPrefs,
            update: preferences.notificationPrefs,
          },
        },
      },
      include: {
        profile: true,
        notificationPrefs: true,
      },
    })
  }

  async followUser(followerId: string, followingId: string) {
    try {
      // Create follow relationship
      const follow = await this.db.follow.create({
        data: {
          followerId,
          followingId,
        },
      })

      // Update stats
      await this.db.$transaction([
        this.db.userStats.update({
          where: { userId: followerId },
          data: { totalFollowing: { increment: 1 } },
        }),
        this.db.userStats.update({
          where: { userId: followingId },
          data: { totalFollowers: { increment: 1 } },
        }),
      ])

      // Create notification
      await this.notificationService.createNotification({
        type: 'USER_FOLLOWED',
        userId: followingId,
        actorId: followerId,
        entityId: followerId,
        entityType: 'user',
        message: 'started following you',
      })

      // Track activity
      await this.activityService.trackActivity({
        userId: followerId,
        action: 'user.followed',
        entityType: 'user',
        entityId: followingId,
      })

      // Check achievements
      await this.checkFollowAchievements(followerId)

      return follow
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

  async unfollowUser(followerId: string, followingId: string) {
    try {
      await this.db.follow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      })

      // Update stats
      await this.db.$transaction([
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
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Not following this user',
          })
        }
      }
      throw error
    }
  }

  async getFollowers(params: {
    userId: string
    limit: number
    cursor?: string
  }) {
    const followers = await this.db.follow.findMany({
      where: { followingId: params.userId },
      take: params.limit + 1,
      cursor: params.cursor ? { id: params.cursor } : undefined,
      include: {
        follower: {
          include: {
            profile: true,
            stats: true,
            _count: {
              select: {
                posts: { where: { published: true } },
                followers: true,
              },
            },
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

    return {
      items: followers.map(f => f.follower),
      nextCursor,
    }
  }

  async getFollowing(params: {
    userId: string
    limit: number
    cursor?: string
  }) {
    const following = await this.db.follow.findMany({
      where: { followerId: params.userId },
      take: params.limit + 1,
      cursor: params.cursor ? { id: params.cursor } : undefined,
      include: {
        following: {
          include: {
            profile: true,
            stats: true,
            _count: {
              select: {
                posts: { where: { published: true } },
                followers: true,
              },
            },
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

    return {
      items: following.map(f => f.following),
      nextCursor,
    }
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await this.db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    })

    return !!follow
  }

  async getUserStats(userId: string) {
    const stats = await this.db.userStats.findUnique({
      where: { userId },
    })

    if (!stats) {
      // Create stats if they don't exist
      return this.db.userStats.create({
        data: { userId },
      })
    }

    return stats
  }

  async blockUser(blockerId: string, blockedId: string) {
    try {
      // Create block
      await this.db.block.create({
        data: {
          blockerId,
          blockedId,
        },
      })

      // Remove any existing follows
      await this.db.follow.deleteMany({
        where: {
          OR: [
            { followerId: blockerId, followingId: blockedId },
            { followerId: blockedId, followingId: blockerId },
          ],
        },
      })

      return { success: true }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'User already blocked',
          })
        }
      }
      throw error
    }
  }

  async unblockUser(blockerId: string, blockedId: string) {
    await this.db.block.delete({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    })

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
    })

    return blocks.map(b => b.blocked)
  }

  async searchUsers(query: string, limit: number) {
    return this.db.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { bio: { contains: query, mode: 'insensitive' } },
          { profile: { displayName: { contains: query, mode: 'insensitive' } } },
        ],
        status: UserStatus.ACTIVE,
      },
      include: {
        profile: true,
        stats: true,
        _count: {
          select: {
            posts: { where: { published: true } },
            followers: true,
          },
        },
      },
      orderBy: [
        { stats: { totalFollowers: 'desc' } },
        { createdAt: 'desc' },
      ],
      take: limit,
    })
  }

  async getRecommendedUsers(userId: string, limit: number) {
    // Get user's follows
    const userFollows = await this.db.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    })
    const followingIds = userFollows.map(f => f.followingId)

    // Get followers of users they follow (2nd degree connections)
    const recommendations = await this.db.user.findMany({
      where: {
        AND: [
          { id: { not: userId } },
          { id: { notIn: followingIds } },
          { status: UserStatus.ACTIVE },
          {
            followers: {
              some: {
                followerId: { in: followingIds },
              },
            },
          },
        ],
      },
      include: {
        profile: true,
        stats: true,
        _count: {
          select: {
            posts: { where: { published: true } },
            followers: true,
          },
        },
      },
      orderBy: [
        { stats: { totalFollowers: 'desc' } },
        { stats: { engagementRate: 'desc' } },
      ],
      take: limit,
    })

    return recommendations
  }

  async verifyPassword(userId: string, password: string): Promise<boolean> {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: { hashedPassword: true },
    })

    if (!user?.hashedPassword) return false

    return bcrypt.compare(password, user.hashedPassword)
  }

  async deleteAccount(userId: string) {
    // Soft delete the user
    await this.db.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.DELETED,
        deletedAt: new Date(),
        email: `deleted_${userId}@deleted.com`,
        username: `deleted_${userId}`,
      },
    })

    // TODO: Queue job to clean up user data after grace period
  }

  private async checkProfileCompletion(userId: string) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    })

    if (!user) return

    let completeness = 0
    if (user.image) completeness += 10
    if (user.bio) completeness += 10
    if (user.profile?.displayName) completeness += 10
    if (user.profile?.location) completeness += 10
    if (user.profile?.website) completeness += 10
    if (user.profile?.interests?.length) completeness += 10
    if (user.profile?.skills?.length) completeness += 10
    if (user.profile?.pronouns) completeness += 10
    if (user.profile?.youtubeChannelId) completeness += 20

    await this.db.profile.update({
      where: { userId },
      data: {
        profileCompleteness: completeness,
        profileCompleted: completeness >= 80,
      },
    })

    // Check achievement
    if (completeness >= 100) {
      await this.checkAchievement(userId, 'PROFILE_COMPLETE')
    }
  }

  private async checkFollowAchievements(userId: string) {
    const stats = await this.getUserStats(userId)
    
    // Check follow milestones
    const milestones = [
      { count: 10, code: 'FOLLOWING_10' },
      { count: 50, code: 'FOLLOWING_50' },
      { count: 100, code: 'FOLLOWING_100' },
    ]

    for (const milestone of milestones) {
      if (stats.totalFollowing >= milestone.count) {
        await this.checkAchievement(userId, milestone.code)
      }
    }
  }

  private async checkAchievement(userId: string, achievementCode: string) {
    // This would integrate with the achievement service
    // For now, just a placeholder
    console.log(`Checking achievement ${achievementCode} for user ${userId}`)
  }
}
