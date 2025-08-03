// src/services/user.service.ts
import { db, transaction } from '@/lib/db'
import { redis, redisHelpers } from '@/lib/redis'
import { logger } from '@/lib/monitoring'
import { 
  User, 
  UserRole, 
  UserStatus, 
  Prisma,
  NotificationType 
} from '@prisma/client'
import { hashPassword, validatePasswordStrength } from '@/lib/security'
import { generateUsername } from '@/lib/utils'
import { eventEmitter } from '@/lib/events/event-emitter'

// User creation input
export interface CreateUserInput {
  email: string
  password?: string
  username?: string
  provider?: string
  providerId?: string
  image?: string
  emailVerified?: boolean
}

// User update input
export interface UpdateUserInput {
  username?: string
  bio?: string
  image?: string
  displayName?: string
  location?: string
  website?: string
  socialLinks?: {
    twitter?: string
    instagram?: string
    tiktok?: string
    discord?: string
    youtube?: string
  }
}

// User service class
export class UserService {
  // Cache keys
  private static readonly CACHE_PREFIX = 'user:'
  private static readonly CACHE_TTL = 300 // 5 minutes

  // Create a new user
  static async createUser(input: CreateUserInput): Promise<User> {
    logger.info('Creating new user', { email: input.email })

    // Validate input
    if (!input.username) {
      input.username = generateUsername(input.email)
    }

    // Ensure username is unique
    let username = input.username
    let attempts = 0
    while (attempts < 5) {
      const existing = await db.user.findUnique({ where: { username } })
      if (!existing) break
      username = `${input.username}${Math.random().toString(36).substring(2, 6)}`
      attempts++
    }

    if (attempts === 5) {
      throw new Error('Failed to generate unique username')
    }

    // Hash password if provided
    let hashedPassword: string | undefined
    if (input.password) {
      const passwordValidation = validatePasswordStrength(input.password)
      if (!passwordValidation.valid) {
        throw new Error(passwordValidation.errors.join(', '))
      }
      hashedPassword = await hashPassword(input.password)
    }

    // Create user with profile in transaction
    const user = await transaction(async (tx) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          email: input.email,
          username,
          hashedPassword,
          emailVerified: input.emailVerified ? new Date() : null,
          image: input.image,
          status: input.emailVerified ? UserStatus.ACTIVE : UserStatus.PENDING_VERIFICATION,
          role: UserRole.USER,
        },
      })

      // Create profile
      await tx.profile.create({
        data: {
          userId: newUser.id,
          displayName: username,
        },
      })

      // Create user stats
      await tx.userStats.create({
        data: {
          userId: newUser.id,
        },
      })

      // Create user balance
      await tx.userBalance.create({
        data: {
          userId: newUser.id,
          sparklePoints: 100, // Welcome bonus
        },
      })

      // Create notification preferences
      await tx.notificationPreference.create({
        data: {
          userId: newUser.id,
        },
      })

      // Send welcome notification
      await tx.notification.create({
        data: {
          type: NotificationType.SYSTEM,
          userId: newUser.id,
          title: 'Welcome to Sparkle Universe! ✨',
          message: 'Your journey in the Sparkle community begins now. Complete your profile to earn your first achievement!',
        },
      })

      // Log XP for account creation
      await tx.xpLog.create({
        data: {
          userId: newUser.id,
          amount: 10,
          source: 'account_created',
          reason: 'Created account',
          totalXp: 10,
        },
      })

      return newUser
    })

    // Emit user created event
    eventEmitter.emit('user:created', { user })

    logger.info('User created successfully', { userId: user.id })
    return user
  }

  // Get user by ID with caching
  static async getUserById(
    userId: string, 
    include?: Prisma.UserInclude
  ): Promise<User | null> {
    // Try cache first (only for basic queries)
    if (!include) {
      const cached = await redisHelpers.getJSON<User>(
        `${this.CACHE_PREFIX}${userId}`
      )
      if (cached) return cached
    }

    // Fetch from database
    const user = await db.user.findUnique({
      where: { id: userId },
      include,
    })

    // Cache the result (only for basic queries)
    if (user && !include) {
      await redisHelpers.setJSON(
        `${this.CACHE_PREFIX}${userId}`,
        user,
        this.CACHE_TTL
      )
    }

    return user
  }

  // Get user by username
  static async getUserByUsername(
    username: string,
    include?: Prisma.UserInclude
  ): Promise<User | null> {
    return db.user.findUnique({
      where: { username },
      include,
    })
  }

  // Update user
  static async updateUser(
    userId: string,
    input: UpdateUserInput
  ): Promise<User> {
    logger.info('Updating user', { userId })

    const user = await transaction(async (tx) => {
      // Update user
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          username: input.username,
          bio: input.bio,
          image: input.image,
        },
      })

      // Update profile if social links provided
      if (input.displayName || input.location || input.website || input.socialLinks) {
        await tx.profile.update({
          where: { userId },
          data: {
            displayName: input.displayName,
            location: input.location,
            website: input.website,
            twitterUsername: input.socialLinks?.twitter,
            instagramUsername: input.socialLinks?.instagram,
            tiktokUsername: input.socialLinks?.tiktok,
            discordUsername: input.socialLinks?.discord,
            youtubeChannelId: input.socialLinks?.youtube,
          },
        })
      }

      return updatedUser
    })

    // Invalidate cache
    await redis.del(`${this.CACHE_PREFIX}${userId}`)

    // Emit user updated event
    eventEmitter.emit('user:updated', { user })

    return user
  }

  // Update user status
  static async updateUserStatus(
    userId: string,
    status: UserStatus,
    reason?: string
  ): Promise<User> {
    const user = await db.user.update({
      where: { id: userId },
      data: {
        status,
        banReason: status === UserStatus.BANNED ? reason : null,
      },
    })

    // Invalidate cache
    await redis.del(`${this.CACHE_PREFIX}${userId}`)

    // Emit status change event
    eventEmitter.emit('user:statusChanged', { user, status, reason })

    return user
  }

  // Get user stats
  static async getUserStats(userId: string) {
    const stats = await db.userStats.findUnique({
      where: { userId },
    })

    if (!stats) {
      // Create stats if they don't exist
      return db.userStats.create({
        data: { userId },
      })
    }

    return stats
  }

  // Update user experience and level
  static async addExperience(
    userId: string,
    amount: number,
    source: string,
    reason?: string
  ): Promise<void> {
    await transaction(async (tx) => {
      // Get current user data
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { experience: true, level: true },
      })

      if (!user) throw new Error('User not found')

      const newExperience = user.experience + amount
      const newLevel = this.calculateLevel(newExperience)

      // Update user
      await tx.user.update({
        where: { id: userId },
        data: {
          experience: newExperience,
          level: newLevel,
        },
      })

      // Log XP gain
      await tx.xpLog.create({
        data: {
          userId,
          amount,
          source,
          reason,
          totalXp: newExperience,
        },
      })

      // Check for level up
      if (newLevel > user.level) {
        // Create level up notification
        await tx.notification.create({
          data: {
            type: NotificationType.LEVEL_UP,
            userId,
            title: `Level Up! You're now level ${newLevel}! 🎉`,
            message: `Congratulations on reaching level ${newLevel}! Keep up the great work!`,
            data: { 
              oldLevel: user.level, 
              newLevel,
              experience: newExperience 
            },
          },
        })

        // Award level up bonus
        await tx.userBalance.update({
          where: { userId },
          data: {
            sparklePoints: { increment: newLevel * 10 },
          },
        })

        // Emit level up event
        eventEmitter.emit('user:levelUp', { 
          userId, 
          oldLevel: user.level, 
          newLevel 
        })
      }
    })
  }

  // Calculate level from experience
  private static calculateLevel(experience: number): number {
    // Simple level calculation: level = floor(sqrt(experience / 100))
    return Math.floor(Math.sqrt(experience / 100)) + 1
  }

  // Search users
  static async searchUsers(
    query: string,
    options: {
      limit?: number
      offset?: number
      role?: UserRole
      status?: UserStatus
    } = {}
  ) {
    const { limit = 20, offset = 0, role, status } = options

    return db.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { username: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
              { bio: { contains: query, mode: 'insensitive' } },
            ],
          },
          role ? { role } : {},
          status ? { status } : {},
          { deletedAt: null },
        ],
      },
      include: {
        profile: true,
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
          },
        },
      },
      take: limit,
      skip: offset,
      orderBy: {
        followers: {
          _count: 'desc',
        },
      },
    })
  }

  // Get user's public profile
  static async getPublicProfile(username: string) {
    const user = await db.user.findUnique({
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
      },
    })

    if (!user || user.status === UserStatus.BANNED) {
      return null
    }

    // Remove sensitive data
    const { hashedPassword, emailVerified, ...publicUser } = user
    return publicUser
  }

  // Check if username is available
  static async isUsernameAvailable(username: string): Promise<boolean> {
    const user = await db.user.findUnique({
      where: { username },
      select: { id: true },
    })
    return !user
  }

  // Delete user (soft delete)
  static async deleteUser(userId: string): Promise<void> {
    await db.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.DELETED,
        deletedAt: new Date(),
      },
    })

    // Clear cache
    await redis.del(`${this.CACHE_PREFIX}${userId}`)

    // Emit user deleted event
    eventEmitter.emit('user:deleted', { userId })
  }
}
