// src/services/auth.service.ts
import { db } from '@/lib/db'
import { redis, redisHelpers } from '@/lib/redis'
import { 
  hashPassword, 
  verifyPassword, 
  generateSecureToken,
  generateVerificationCode,
  trackLoginAttempt,
  createSecurityAlert
} from '@/lib/security'
import { UserService } from './user.service'
import { logger } from '@/lib/monitoring'
import { eventEmitter } from '@/lib/events/event-emitter'
import { UserStatus } from '@prisma/client'

export interface LoginInput {
  email: string
  password: string
  ipAddress: string
  userAgent: string
}

export interface RegisterInput {
  email: string
  password: string
  username?: string
}

export interface PasswordResetInput {
  email: string
  token: string
  newPassword: string
}

export class AuthService {
  private static readonly VERIFICATION_CODE_TTL = 600 // 10 minutes
  private static readonly PASSWORD_RESET_TTL = 3600 // 1 hour
  private static readonly LOGIN_LOCKOUT_DURATION = 900 // 15 minutes
  private static readonly MAX_LOGIN_ATTEMPTS = 5

  // Register new user
  static async register(input: RegisterInput) {
    logger.info('User registration attempt', { email: input.email })

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: input.email },
    })

    if (existingUser) {
      throw new Error('Email already registered')
    }

    // Create user
    const user = await UserService.createUser({
      email: input.email,
      password: input.password,
      username: input.username,
    })

    // Generate verification code
    const verificationCode = generateVerificationCode()
    await redisHelpers.setJSON(
      `email_verify:${user.id}`,
      { code: verificationCode, email: user.email },
      this.VERIFICATION_CODE_TTL
    )

    // Send verification email (implement email service)
    eventEmitter.emit('auth:sendVerificationEmail', {
      userId: user.id,
      email: user.email,
      code: verificationCode,
    })

    logger.info('User registered successfully', { userId: user.id })
    return user
  }

  // Login user
  static async login(input: LoginInput) {
    const { email, password, ipAddress, userAgent } = input

    // Check if user exists
    const user = await db.user.findUnique({
      where: { email },
      include: { profile: true },
    })

    if (!user) {
      await trackLoginAttempt(email, ipAddress, userAgent, false, 'User not found')
      throw new Error('Invalid credentials')
    }

    // Check if account is locked
    const lockoutKey = `lockout:${user.id}`
    const isLocked = await redis.get(lockoutKey)
    if (isLocked) {
      throw new Error('Account temporarily locked due to multiple failed attempts')
    }

    // Check user status
    if (user.status === UserStatus.BANNED) {
      throw new Error('Account has been banned')
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new Error('Account has been suspended')
    }

    // Verify password
    if (!user.hashedPassword) {
      throw new Error('Please use social login for this account')
    }

    const isValidPassword = await verifyPassword(password, user.hashedPassword)
    if (!isValidPassword) {
      await this.handleFailedLogin(user.id, email, ipAddress, userAgent)
      throw new Error('Invalid credentials')
    }

    // Track successful login
    await trackLoginAttempt(email, ipAddress, userAgent, true)

    // Update last seen
    await db.user.update({
      where: { id: user.id },
      data: { lastSeenAt: new Date() },
    })

    // Clear any failed login attempts
    await redis.del(`failed_attempts:${user.id}`)

    // Generate session token
    const sessionToken = generateSecureToken()
    const sessionData = {
      userId: user.id,
      ipAddress,
      userAgent,
      createdAt: new Date(),
    }

    // Store session in Redis
    await redisHelpers.session.set(sessionToken, sessionData, 86400 * 30) // 30 days

    eventEmitter.emit('auth:login', { userId: user.id, ipAddress })

    return {
      user,
      sessionToken,
    }
  }

  // Handle failed login attempt
  private static async handleFailedLogin(
    userId: string,
    email: string,
    ipAddress: string,
    userAgent: string
  ) {
    const attemptsKey = `failed_attempts:${userId}`
    
    // Increment failed attempts
    const attempts = await redisHelpers.incrWithExpire(
      attemptsKey,
      this.LOGIN_LOCKOUT_DURATION
    )

    await trackLoginAttempt(email, ipAddress, userAgent, false, 'Invalid password')

    // Lock account if too many attempts
    if (attempts >= this.MAX_LOGIN_ATTEMPTS) {
      const lockoutKey = `lockout:${userId}`
      await redis.setex(lockoutKey, this.LOGIN_LOCKOUT_DURATION, '1')
      
      await createSecurityAlert(
        userId,
        'ACCOUNT_LOCKED',
        'Account Locked',
        `Account locked due to ${attempts} failed login attempts`,
        'high'
      )
    }
  }

  // Verify email
  static async verifyEmail(userId: string, code: string) {
    const storedData = await redisHelpers.getJSON<{ code: string; email: string }>(
      `email_verify:${userId}`
    )

    if (!storedData || storedData.code !== code) {
      throw new Error('Invalid or expired verification code')
    }

    // Update user
    await db.user.update({
      where: { id: userId },
      data: {
        emailVerified: new Date(),
        status: UserStatus.ACTIVE,
      },
    })

    // Delete verification code
    await redis.del(`email_verify:${userId}`)

    // Award XP for email verification
    await UserService.addExperience(userId, 20, 'email_verified')

    eventEmitter.emit('auth:emailVerified', { userId })
  }

  // Request password reset
  static async requestPasswordReset(email: string) {
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    })

    if (!user) {
      // Don't reveal if email exists
      return
    }

    // Generate reset token
    const resetToken = generateSecureToken()
    const resetData = {
      userId: user.id,
      email: user.email,
      token: resetToken,
    }

    // Store in Redis
    await redisHelpers.setJSON(
      `password_reset:${resetToken}`,
      resetData,
      this.PASSWORD_RESET_TTL
    )

    // Send reset email
    eventEmitter.emit('auth:sendPasswordResetEmail', {
      userId: user.id,
      email: user.email,
      token: resetToken,
    })
  }

  // Reset password
  static async resetPassword(input: PasswordResetInput) {
    const resetData = await redisHelpers.getJSON<{
      userId: string
      email: string
      token: string
    }>(`password_reset:${input.token}`)

    if (!resetData || resetData.email !== input.email) {
      throw new Error('Invalid or expired reset token')
    }

    // Hash new password
    const hashedPassword = await hashPassword(input.newPassword)

    // Update password
    await db.user.update({
      where: { id: resetData.userId },
      data: { hashedPassword },
    })

    // Delete reset token
    await redis.del(`password_reset:${input.token}`)

    // Create security alert
    await createSecurityAlert(
      resetData.userId,
      'PASSWORD_CHANGED',
      'Password Changed',
      'Your password was successfully changed',
      'medium'
    )

    eventEmitter.emit('auth:passwordReset', { userId: resetData.userId })
  }

  // Logout
  static async logout(sessionToken: string) {
    await redisHelpers.session.delete(sessionToken)
    eventEmitter.emit('auth:logout', { sessionToken })
  }

  // Validate session
  static async validateSession(sessionToken: string) {
    const sessionData = await redisHelpers.session.get(sessionToken)
    
    if (!sessionData) {
      return null
    }

    // Extend session
    await redisHelpers.session.extend(sessionToken)

    return sessionData
  }

  // Setup two-factor authentication
  static async setupTwoFactor(userId: string) {
    // Implementation for 2FA setup
    // This would involve generating a secret and QR code
    throw new Error('Not implemented')
  }

  // Verify two-factor code
  static async verifyTwoFactor(userId: string, code: string) {
    // Implementation for 2FA verification
    throw new Error('Not implemented')
  }
}
