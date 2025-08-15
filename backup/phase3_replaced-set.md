# original Phase3: src/server/services/user.service.ts
```ts
// src/server/services/user.service.ts
import { PrismaClient, Prisma, UserRole, UserStatus } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import bcrypt from 'bcryptjs'
import { generateUsername } from '@/lib/utils'
import { NotificationService } from './notification.service'
import { ActivityService } from './activity.service'
import { GamificationService, XP_REWARDS } from './gamification.service'
import { CacheService, CacheType } from './cache.service'

// Query builders for User model (addressing 70+ relations warning from README)
export class UserQueryBuilder {
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
            interests: true,
            skills: true,
            pronouns: true,
            socialLinks: true,
            youtubeChannelId: true,
            youtubeChannelUrl: true,
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
        id: true,
        username: true,
        email: true,
        image: true,
        bio: true,
        role: true,
        verified: true,
        createdAt: true,
        lastSeenAt: true,
        sparklePoints: true,
        premiumPoints: true,
        experience: true,
        level: true,
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

    // Invalidate cache
    await this.cacheService.invalidate(`user:${updatedUser.username}`)

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

      // Check achievements
      await this.checkFollowAchievements(followerId)

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

      // Invalidate caches
      await Promise.all([
        this.cacheService.invalidate(`user:${followerId}`),
        this.cacheService.invalidate(`user:${followingId}`),
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
          ...UserQueryBuilder.basicProfile(),
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
          ...UserQueryBuilder.basicProfile(),
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
    const cacheKey = `stats:${userId}`
    const cached = await this.cacheService.get(cacheKey, CacheType.STATS)
    if (cached) return cached

    const stats = await this.db.userStats.findUnique({
      where: { userId },
    })

    if (!stats) {
      // Create stats if they don't exist
      const newStats = await this.db.userStats.create({
        data: { userId },
      })
      await this.cacheService.set(cacheKey, newStats, undefined, CacheType.STATS)
      return newStats
    }

    await this.cacheService.set(cacheKey, stats, undefined, CacheType.STATS)
    return stats
  }

  async blockUser(blockerId: string, blockedId: string) {
    try {
      // Create block in transaction
      await this.db.$transaction(async (tx) => {
        // Create block
        await tx.block.create({
          data: {
            blockerId,
            blockedId,
          },
        })

        // Remove any existing follows
        await tx.follow.deleteMany({
          where: {
            OR: [
              { followerId: blockerId, followingId: blockedId },
              { followerId: blockedId, followingId: blockerId },
            ],
          },
        })
      })

      // Invalidate caches
      await Promise.all([
        this.cacheService.invalidate(`user:${blockerId}`),
        this.cacheService.invalidate(`user:${blockedId}`),
      ])

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
          ...UserQueryBuilder.basicProfile(),
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
      ...UserQueryBuilder.basicProfile(),
      orderBy: [
        { verified: 'desc' },
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
      ...UserQueryBuilder.basicProfile(),
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

    // Invalidate all caches for this user
    await this.cacheService.invalidate(`user:${userId}`)
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
    const achievement = await this.db.achievement.findUnique({
      where: { code: achievementCode },
    })

    if (achievement) {
      await this.gamificationService.checkAndUnlockAchievements(userId, 'follow')
    }
  }
}

```

# original Phase3: src/server/services/mention.service.ts
```ts
// src/server/services/mention.service.ts
import { PrismaClient } from '@prisma/client'
import { NotificationService } from './notification.service'

export class MentionService {
  private notificationService: NotificationService

  constructor(private db: PrismaClient) {
    this.notificationService = new NotificationService(db)
  }

  async processMentions(params: {
    mentionerId: string
    mentionedUsernames: string[]
    postId?: string
    commentId?: string
  }) {
    // Find mentioned users
    const mentionedUsers = await this.db.user.findMany({
      where: {
        username: { in: params.mentionedUsernames },
      },
      select: { id: true, username: true },
    })

    // Create mention records and notifications
    const mentionPromises = mentionedUsers.map(async (user) => {
      // Create mention record
      await this.db.mention.create({
        data: {
          mentionerId: params.mentionerId,
          mentionedId: user.id,
          postId: params.postId,
          commentId: params.commentId,
        },
      })

      // Create notification
      await this.notificationService.createNotification({
        type: 'MENTION',
        userId: user.id,
        actorId: params.mentionerId,
        entityId: params.commentId || params.postId || '',
        entityType: params.commentId ? 'comment' : 'post',
        title: 'You were mentioned',
        message: `mentioned you in a ${params.commentId ? 'comment' : 'post'}`,
        actionUrl: params.postId ? `/post/${params.postId}` : undefined,
      })
    })

    await Promise.all(mentionPromises)
  }

  async getMentions(userId: string, limit: number = 20) {
    return this.db.mention.findMany({
      where: { mentionedId: userId },
      include: {
        mentioner: {
          include: {
            profile: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        comment: {
          select: {
            id: true,
            content: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }
}

```

# original Phase3: src/server/services/moderation.service.ts
```ts
// src/server/services/moderation.service.ts
import { PrismaClient } from '@prisma/client'

interface ModerationResult {
  shouldBlock: boolean
  requiresReview: boolean
  reasons: string[]
  score: number
}

export class ModerationService {
  constructor(private db: PrismaClient) {}

  async checkContent(content: string, type: 'post' | 'comment'): Promise<ModerationResult> {
    const result: ModerationResult = {
      shouldBlock: false,
      requiresReview: false,
      reasons: [],
      score: 0,
    }

    // Check against content filters
    const filters = await this.db.contentFilter.findMany({
      where: { isActive: true },
    })

    for (const filter of filters) {
      const regex = new RegExp(filter.pattern, 'gi')
      if (regex.test(content)) {
        result.score += filter.severity
        result.reasons.push(filter.category || 'matched filter')

        if (filter.action === 'block') {
          result.shouldBlock = true
        } else if (filter.action === 'flag') {
          result.requiresReview = true
        }

        // Update hit count
        await this.db.contentFilter.update({
          where: { id: filter.id },
          data: {
            hitCount: { increment: 1 },
            lastHitAt: new Date(),
          },
        })
      }
    }

    // Check content length (spam detection)
    if (content.length > 10000) {
      result.requiresReview = true
      result.reasons.push('excessive length')
    }

    // Check for repeated characters (spam)
    const repeatedChars = /(.)\1{9,}/g
    if (repeatedChars.test(content)) {
      result.requiresReview = true
      result.reasons.push('repeated characters')
    }

    // Check for excessive caps
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length
    if (capsRatio > 0.7 && content.length > 10) {
      result.requiresReview = true
      result.reasons.push('excessive caps')
    }

    // Check for links (could be spam)
    const linkCount = (content.match(/https?:\/\//g) || []).length
    if (linkCount > 3) {
      result.requiresReview = true
      result.reasons.push('multiple links')
    }

    // TODO: Integrate with AI moderation service
    // const aiResult = await this.checkWithAI(content)
    // if (aiResult.score > 0.8) {
    //   result.shouldBlock = true
    //   result.reasons.push('AI flagged')
    // }

    return result
  }

  async reviewContent(entityId: string, entityType: string, reviewerId: string, decision: 'approve' | 'reject') {
    // Update moderation queue
    await this.db.aiModerationQueue.updateMany({
      where: {
        entityId,
        entityType,
      },
      data: {
        reviewedBy: reviewerId,
        reviewDecision: decision,
        reviewedAt: new Date(),
        humanReviewRequired: false,
      },
    })

    // Update entity moderation status
    const table = entityType === 'post' ? this.db.post : this.db.comment
    await table.update({
      where: { id: entityId },
      data: {
        moderationStatus: decision === 'approve' ? 'APPROVED' : 'REJECTED',
      },
    })
  }
}

```

# original Phase3: src/types/comment.ts
```ts
// src/types/comment.ts
import type { 
  Comment, 
  User, 
  Profile, 
  Post, 
  ReactionType,
  ModerationStatus 
} from '@prisma/client'

/**
 * Edit history entry for comments
 */
export interface EditHistoryEntry {
  content: string
  editedAt: Date | string
  editorId?: string
  editorUsername?: string
}

/**
 * Reaction count by type
 */
export interface ReactionCounts {
  [ReactionType.LIKE]: number
  [ReactionType.LOVE]: number
  [ReactionType.FIRE]: number
  [ReactionType.SPARKLE]: number
  [ReactionType.MIND_BLOWN]: number
  [ReactionType.LAUGH]: number
  [ReactionType.CRY]: number
  [ReactionType.ANGRY]: number
  total: number
}

/**
 * User reaction state for a comment
 */
export interface UserReactionState {
  hasReacted: boolean
  reactionType: ReactionType | null
  reactionId?: string
}

/**
 * Extended comment with relations
 */
export interface CommentWithRelations extends Comment {
  author: User & {
    profile: Profile | null
  }
  post?: Pick<Post, 'id' | 'title' | 'slug' | 'authorId'>
  parent?: Comment & {
    author: Pick<User, 'id' | 'username'>
  }
  replies?: CommentWithRelations[]
  _count: {
    reactions: number
    replies: number
  }
  reactionCounts?: ReactionCounts
  userReaction?: UserReactionState
  isLiked?: boolean
  editHistory?: EditHistoryEntry[]
}

/**
 * Comment form data
 */
export interface CommentFormData {
  content: string
  parentId?: string
  youtubeTimestamp?: number
  quotedTimestamp?: string
  mentions?: string[]
}

/**
 * Comment creation input
 */
export interface CreateCommentInput extends CommentFormData {
  postId: string
}

/**
 * Comment update input
 */
export interface UpdateCommentInput {
  id: string
  content: string
}

/**
 * Comment reaction input
 */
export interface CommentReactionInput {
  commentId: string
  type: ReactionType
}

/**
 * Comment list parameters
 */
export interface CommentListParams {
  postId: string
  limit?: number
  cursor?: string
  sortBy?: 'newest' | 'oldest' | 'popular'
  parentId?: string | null
  includeDeleted?: boolean
  moderationStatus?: ModerationStatus[]
}

/**
 * Comment thread parameters
 */
export interface CommentThreadParams {
  commentId: string
  limit?: number
  cursor?: string
  depth?: number
}

/**
 * Typing indicator data
 */
export interface TypingIndicator {
  userId: string
  username: string
  postId: string
  parentId?: string
  timestamp: number
}

/**
 * Comment moderation data
 */
export interface CommentModerationData {
  commentId: string
  status: ModerationStatus
  notes?: string
  reviewerId?: string
  reviewedAt?: Date
}

/**
 * Comment report data
 */
export interface CommentReportData {
  commentId: string
  reason: string
  description?: string
  evidence?: any
}

```

