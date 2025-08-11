// src/services/user.service.ts
import { db, transaction } from '@/lib/db'
import { redis, redisHelpers } from '@/lib/redis'
import { logger, performance } from '@/lib/monitoring'
import { 
  User, 
  UserRole, 
  UserStatus, 
  Prisma,
  NotificationType 
} from '@prisma/client'
import { 
  hashPassword, 
  validatePasswordStrength,
  validateField,
  SCHEMA_LIMITS,
  generateCorrelationId
} from '@/lib/security'
import { generateUsername, generateSlug } from '@/lib/utils'
import { eventEmitter } from '@/lib/events/event-emitter'

// Cache configuration
const CACHE_CONFIG = {
  USER_TTL: 300,        // 5 minutes for user data
  PROFILE_TTL: 600,     // 10 minutes for profiles
  STATS_TTL: 60,        // 1 minute for stats (changes frequently)
  LIST_TTL: 120,        // 2 minutes for lists
} as const

// User creation input with validation
export interface CreateUserInput {
  email: string
  password?: string
  username?: string
  provider?: string
  providerId?: string
  image?: string
  emailVerified?: boolean
}

// User update input with validation
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

// Cache keys generator
const CacheKeys = {
  user: (id: string) => `user:${id}`,
  userByUsername: (username: string) => `user:username:${username}`,
  userProfile: (id: string) => `user:profile:${id}`,
  userStats: (id: string) => `user:stats:${id}`,
  userList: (params: string) => `user:list:${params}`,
} as const

// Enhanced User service class
export class UserService {
  // Create a new user with comprehensive validation
  static async createUser(input: CreateUserInput): Promise<User> {
    const correlationId = generateCorrelationId()
    const timer = performance.start('user.create')
    
    logger.info('Creating new user', { 
      email: input.email, 
      correlationId 
    })

    try {
      // Validate email
      const emailValidation = validateField('email', input.email)
      if (!emailValidation.valid) {
        throw new Error(emailValidation.error)
      }

      // Validate username if provided
      if (input.username) {
        const usernameValidation = validateField('username', input.username)
        if (!usernameValidation.valid) {
          throw new Error(usernameValidation.error)
        }
      } else {
        input.username = generateUsername(input.email)
      }

      // Ensure username is unique
      let username = input.username
      let attempts = 0
      while (attempts < 5) {
        const existing = await db.user.findUnique({ 
          where: { username },
          select: { id: true } // Only select what we need
        })
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

      // Create user with profile in transaction with proper isolation
      const user = await transaction(async (tx) => {
        // Create user
        const newUser = await tx.user.create({
          data: {
            email: input.email,
            username,
            hashedPassword,
            authProvider: input.provider as any || 'LOCAL',
            emailVerified: input.emailVerified ? new Date() : null,
            image: input.image,
            status: input.emailVerified ? UserStatus.ACTIVE : UserStatus.PENDING_VERIFICATION,
            role: UserRole.USER,
          },
        })

        // Create related records
        const [profile, stats, balance, notificationPrefs] = await Promise.all([
          // Create profile
          tx.profile.create({
            data: {
              userId: newUser.id,
              displayName: username,
              profileCompleteness: 20, // Basic profile created
            },
          }),
          
          // Create user stats
          tx.userStats.create({
            data: {
              userId: newUser.id,
            },
          }),
          
          // Create user balance
          tx.userBalance.create({
            data: {
              userId: newUser.id,
              sparklePoints: 100, // Welcome bonus
              lifetimeEarned: 100,
            },
          }),
          
          // Create notification preferences
          tx.notificationPreference.create({
            data: {
              userId: newUser.id,
            },
          }),
        ])

        // Create currency transaction for welcome bonus
        await tx.currencyTransaction.create({
          data: {
            userId: newUser.id,
            amount: 100,
            currencyType: 'sparkle',
            transactionType: 'earn',
            source: 'welcome_bonus',
            description: 'Welcome to Sparkle Universe!',
            balanceBefore: 0,
            balanceAfter: 100,
          },
        })

        // Send welcome notification
        await tx.notification.create({
          data: {
            type: NotificationType.SYSTEM,
            userId: newUser.id,
            title: 'Welcome to Sparkle Universe! ✨',
            message: 'Your journey in the Sparkle community begins now. Complete your profile to earn your first achievement!',
            priority: 1,
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
      }, {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      })

      // Emit user created event
      eventEmitter.emit('user:created', { user, correlationId })

      const timing = performance.end('user.create')
      logger.info('User created successfully', { 
        userId: user.id, 
        duration: timing?.duration,
        correlationId 
      })
      
      return user

    } catch (error) {
      const timing = performance.end('user.create')
      logger.error('Failed to create user', error, { 
        correlationId,
        duration: timing?.duration 
      })
      throw error
    }
  }

  // Get user by ID with smart caching
  static async getUserById(
    userId: string, 
    include?: Prisma.UserInclude,
    options?: { 
      skipCache?: boolean
      correlationId?: string 
    }
  ): Promise<User | null> {
    const correlationId = options?.correlationId || generateCorrelationId()
    
    // Generate cache key based on include params
    const cacheKey = include 
      ? `${CacheKeys.user(userId)}:${JSON.stringify(include)}`
      : CacheKeys.user(userId)
    
    // Try cache first (only for basic queries or if not skipped)
    if (!options?.skipCache) {
      const cached = await redisHelpers.getJSON<User>(cacheKey)
      if (cached) {
        logger.debug('User cache hit', { userId, correlationId })
        return cached
      }
    }

    // Fetch from database
    const user = await db.user.findUnique({
      where: { id: userId },
      include,
    })

    // Cache the result with appropriate TTL
    if (user && !options?.skipCache) {
      const ttl = include ? CACHE_CONFIG.PROFILE_TTL : CACHE_CONFIG.USER_TTL
      await redisHelpers.setJSON(cacheKey, user, ttl)
    }

    return user
  }

  // Get user by username with caching
  static async getUserByUsername(
    username: string,
    include?: Prisma.UserInclude
  ): Promise<User | null> {
    // Check cache for user ID
    const cachedId = await redis.get(CacheKeys.userByUsername(username))
    
    if (cachedId) {
      return this.getUserById(cachedId, include)
    }

    // Fetch from database
    const user = await db.user.findUnique({
      where: { username },
      include,
    })

    if (user) {
      // Cache username -> ID mapping
      await redis.setex(
        CacheKeys.userByUsername(username), 
        CACHE_CONFIG.USER_TTL,
        user.id
      )
      
      // Also cache the full user object
      await redisHelpers.setJSON(
        CacheKeys.user(user.id),
        user,
        CACHE_CONFIG.USER_TTL
      )
    }

    return user
  }

  // Update user with validation and cache invalidation
  static async updateUser(
    userId: string,
    input: UpdateUserInput
  ): Promise<User> {
    const correlationId = generateCorrelationId()
    logger.info('Updating user', { userId, correlationId })

    // Validate input fields
    if (input.username) {
      const validation = validateField('username', input.username)
      if (!validation.valid) {
        throw new Error(validation.error)
      }
    }

    if (input.bio && input.bio.length > SCHEMA_LIMITS.BIO_MAX) {
      throw new Error(`Bio must be ${SCHEMA_LIMITS.BIO_MAX} characters or less`)
    }

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
        const profileCompleteness = await this.calculateProfileCompleteness(userId, input)
        
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
            profileCompleteness,
            profileCompleted: profileCompleteness >= 80,
          },
        })
      }

      return updatedUser
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    })

    // Invalidate all caches for this user
    await this.invalidateUserCache(userId)

    // If username changed, invalidate old username cache
    const oldUser = await db.user.findUnique({
      where: { id: userId },
      select: { username: true },
    })
    
    if (oldUser && oldUser.username !== input.username) {
      await redis.del(CacheKeys.userByUsername(oldUser.username))
    }

    // Emit user updated event
    eventEmitter.emit('user:updated', { user, correlationId })

    return user
  }

  // Calculate profile completeness
  private static async calculateProfileCompleteness(
    userId: string,
    updates?: UpdateUserInput
  ): Promise<number> {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    })

    if (!user || !user.profile) return 0

    const profile = { ...user.profile, ...updates }
    let score = 20 // Base score for account creation

    // Check each field
    if (user.image) score += 15
    if (user.bio) score += 10
    if (profile.displayName) score += 10
    if (profile.location) score += 5
    if (profile.website) score += 5
    if (profile.twitterUsername) score += 5
    if (profile.instagramUsername) score += 5
    if (profile.youtubeChannelId) score += 10
    if (user.emailVerified) score += 15

    return Math.min(100, score)
  }

  // Invalidate all caches for a user
  private static async invalidateUserCache(userId: string): Promise<void> {
    const keys = [
      CacheKeys.user(userId),
      CacheKeys.userProfile(userId),
      CacheKeys.userStats(userId),
      `${CacheKeys.user(userId)}:*`, // All variations with includes
    ]

    // Delete all matching keys
    for (const pattern of keys) {
      if (pattern.includes('*')) {
        const matchingKeys = await redis.keys(pattern)
        if (matchingKeys.length > 0) {
          await redis.del(...matchingKeys)
        }
      } else {
        await redis.del(pattern)
      }
    }
  }

  // Update user status with proper state management
  static async updateUserStatus(
    userId: string,
    status: UserStatus,
    reason?: string
  ): Promise<User> {
    const correlationId = generateCorrelationId()
    
    // Validate status transition
    const currentUser = await db.user.findUnique({
      where: { id: userId },
      select: { status: true },
    })

    if (!currentUser) {
      throw new Error('User not found')
    }

    // Check if status transition is valid
    if (!this.isValidStatusTransition(currentUser.status, status)) {
      throw new Error(`Invalid status transition from ${currentUser.status} to ${status}`)
    }

    const user = await db.user.update({
      where: { id: userId },
      data: {
        status,
        banReason: status === UserStatus.BANNED ? reason : null,
        banExpiresAt: status === UserStatus.SUSPENDED 
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
          : null,
      },
    })

    // Invalidate cache
    await this.invalidateUserCache(userId)

    // Emit status change event
    eventEmitter.emit('user:statusChanged', { 
      user, 
      status, 
      reason,
      correlationId 
    })

    return user
  }

  // Check if status transition is valid
  private static isValidStatusTransition(
    from: UserStatus,
    to: UserStatus
  ): boolean {
    const validTransitions: Record<UserStatus, UserStatus[]> = {
      [UserStatus.PENDING_VERIFICATION]: [UserStatus.ACTIVE, UserStatus.DELETED],
      [UserStatus.ACTIVE]: [UserStatus.SUSPENDED, UserStatus.BANNED, UserStatus.DELETED],
      [UserStatus.SUSPENDED]: [UserStatus.ACTIVE, UserStatus.BANNED, UserStatus.DELETED],
      [UserStatus.BANNED]: [UserStatus.ACTIVE, UserStatus.DELETED],
      [UserStatus.DELETED]: [], // No transitions from deleted
    }

    return validTransitions[from]?.includes(to) || false
  }

  // Get user stats with caching
  static async getUserStats(userId: string) {
    const cacheKey = CacheKeys.userStats(userId)
    
    // Try cache first
    const cached = await redisHelpers.getJSON(cacheKey)
    if (cached) return cached

    const stats = await db.userStats.findUnique({
      where: { userId },
    })

    if (!stats) {
      // Create stats if they don't exist
      const newStats = await db.userStats.create({
        data: { userId },
      })
      
      await redisHelpers.setJSON(cacheKey, newStats, CACHE_CONFIG.STATS_TTL)
      return newStats
    }

    // Cache stats with short TTL as they change frequently
    await redisHelpers.setJSON(cacheKey, stats, CACHE_CONFIG.STATS_TTL)
    return stats
  }

  // Update user experience and level with proper calculations
  static async addExperience(
    userId: string,
    amount: number,
    source: string,
    reason?: string
  ): Promise<void> {
    const correlationId = generateCorrelationId()
    
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
            priority: 1,
          },
        })

        // Award level up bonus using proper transaction
        await tx.userBalance.update({
          where: { userId },
          data: {
            sparklePoints: { increment: newLevel * 10 },
            lifetimeEarned: { increment: newLevel * 10 },
          },
        })

        // Log currency transaction
        const balance = await tx.userBalance.findUnique({
          where: { userId },
          select: { sparklePoints: true },
        })

        await tx.currencyTransaction.create({
          data: {
            userId,
            amount: newLevel * 10,
            currencyType: 'sparkle',
            transactionType: 'earn',
            source: 'level_up',
            description: `Level ${newLevel} reward`,
            balanceBefore: (balance?.sparklePoints || 0) - (newLevel * 10),
            balanceAfter: balance?.sparklePoints || 0,
          },
        })

        // Emit level up event
        eventEmitter.emit('user:levelUp', { 
          userId, 
          oldLevel: user.level, 
          newLevel,
          correlationId 
        })
      }
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable, // For financial operations
    })

    // Invalidate stats cache
    await redis.del(CacheKeys.userStats(userId))
  }

  // Enhanced level calculation with progressive curve
  private static calculateLevel(experience: number): number {
    // Progressive level curve: each level requires more XP
    // Level 1: 0-100 XP
    // Level 2: 100-250 XP (150 required)
    // Level 3: 250-450 XP (200 required)
    // And so on...
    
    let level = 1
    let totalRequired = 0
    let increment = 100

    while (totalRequired <= experience) {
      totalRequired += increment
      if (totalRequired <= experience) {
        level++
        increment += 50 // Each level requires 50 more XP than the previous
      }
    }

    return level
  }

  // Enhanced user search with caching
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
    
    // Generate cache key for search results
    const cacheKey = CacheKeys.userList(
      `search:${query}:${limit}:${offset}:${role || ''}:${status || ''}`
    )

    // Try cache first
    const cached = await redisHelpers.getJSON(cacheKey)
    if (cached) return cached

    const results = await db.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { username: { contains: query, mode: 'insensitive' } },
              { bio: { contains: query, mode: 'insensitive' } },
            ],
          },
          role ? { role } : {},
          status ? { status } : {},
          { deletedAt: null },
        ],
      },
      include: {
        profile: {
          select: {
            displayName: true,
            location: true,
          },
        },
        _count: {
          select: {
            followers: true,
            following: true,
            posts: {
              where: { published: true },
            },
          },
        },
      },
      take: limit,
      skip: offset,
      orderBy: [
        { verified: 'desc' }, // Verified users first
        { followers: { _count: 'desc' } }, // Then by follower count
      ],
    })

    // Cache results with short TTL
    await redisHelpers.setJSON(cacheKey, results, CACHE_CONFIG.LIST_TTL)

    return results
  }

  // Get user's public profile with optimized queries
  static async getPublicProfile(username: string) {
    const correlationId = generateCorrelationId()
    const timer = performance.start('user.getPublicProfile')

    try {
      const user = await db.user.findUnique({
        where: { username },
        select: {
          id: true,
          username: true,
          image: true,
          bio: true,
          role: true,
          verified: true,
          level: true,
          createdAt: true,
          lastSeenAt: true,
          profile: {
            select: {
              displayName: true,
              location: true,
              website: true,
              twitterUsername: true,
              instagramUsername: true,
              youtubeChannelId: true,
              interests: true,
              skills: true,
            },
          },
          stats: {
            select: {
              totalPosts: true,
              totalFollowers: true,
              totalFollowing: true,
              totalLikesReceived: true,
            },
          },
          _count: {
            select: {
              posts: {
                where: { published: true },
              },
              followers: true,
              following: true,
            },
          },
        },
      })

      if (!user || user.status === UserStatus.BANNED) {
        return null
      }

      const timing = performance.end('user.getPublicProfile')
      logger.debug('Public profile fetched', {
        username,
        duration: timing?.duration,
        correlationId,
      })

      return user
    } catch (error) {
      const timing = performance.end('user.getPublicProfile')
      logger.error('Failed to get public profile', error, {
        username,
        duration: timing?.duration,
        correlationId,
      })
      throw error
    }
  }

  // Check if username is available with caching
  static async isUsernameAvailable(username: string): Promise<boolean> {
    // Validate username format
    const validation = validateField('username', username)
    if (!validation.valid) {
      return false
    }

    // Check cache first
    const cached = await redis.exists(CacheKeys.userByUsername(username))
    if (cached) return false

    const user = await db.user.findUnique({
      where: { username },
      select: { id: true },
    })
    
    return !user
  }

  // Soft delete user with cleanup
  static async deleteUser(userId: string): Promise<void> {
    const correlationId = generateCorrelationId()
    
    await transaction(async (tx) => {
      // Soft delete user
      await tx.user.update({
        where: { id: userId },
        data: {
          status: UserStatus.DELETED,
          deletedAt: new Date(),
          email: `deleted_${userId}@deleted.com`, // Anonymize email
          username: `deleted_${userId}`, // Anonymize username
        },
      })

      // Anonymize profile
      await tx.profile.updateMany({
        where: { userId },
        data: {
          displayName: 'Deleted User',
          location: null,
          website: null,
          twitterUsername: null,
          instagramUsername: null,
          youtubeChannelId: null,
        },
      })

      // Cancel active subscriptions
      await tx.userSubscription.updateMany({
        where: { userId },
        data: {
          status: 'CANCELLED' as any,
          cancelledAt: new Date(),
        },
      })
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    })

    // Clear all caches
    await this.invalidateUserCache(userId)

    // Emit user deleted event
    eventEmitter.emit('user:deleted', { userId, correlationId })
  }
}
