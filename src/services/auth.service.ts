// src/services/auth.service.ts
import { db, transaction } from '@/lib/db'
import { redis, redisHelpers } from '@/lib/redis'
import { 
  hashPassword, 
  verifyPassword, 
  generateSecureToken,
  generateVerificationCode,
  trackLoginAttempt,
  createSecurityAlert,
  generateCorrelationId,
  generateRequestId
} from '@/lib/security'
import { UserService } from './user.service'
import { logger, performance } from '@/lib/monitoring'
import { eventEmitter } from '@/lib/events/event-emitter'
import { UserStatus, Prisma } from '@prisma/client'
import { jobs } from '@/lib/jobs/job-processor'
import * as speakeasy from 'speakeasy'
import * as qrcode from 'qrcode'

export interface LoginInput {
  email: string
  password: string
  ipAddress: string
  userAgent: string
  twoFactorCode?: string
  rememberMe?: boolean
}

export interface RegisterInput {
  email: string
  password: string
  username?: string
  agreeToTerms: boolean
  referralCode?: string
}

export interface PasswordResetInput {
  email: string
  token: string
  newPassword: string
}

export interface Enable2FAResult {
  secret: string
  qrCode: string
  backupCodes: string[]
}

// Two-factor authentication helpers
const twoFactorAuth = {
  generateSecret(email: string): { secret: string; qrCode: Promise<string>; backupCodes: string[] } {
    const secret = speakeasy.generateSecret({
      name: `Sparkle Universe (${email})`,
      issuer: 'Sparkle Universe',
      length: 32
    })

    const qrCode = qrcode.toDataURL(secret.otpauth_url!)

    const backupCodes = Array.from({ length: 10 }, () => 
      Math.random().toString(36).substring(2, 10).toUpperCase()
    )

    return {
      secret: secret.base32,
      qrCode,
      backupCodes
    }
  },

  verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2
    })
  },

  generateBackupCodes(count: number = 10): string[] {
    return Array.from({ length: count }, () => 
      Math.random().toString(36).substring(2, 10).toUpperCase()
    )
  }
}

export class AuthService {
  private static readonly VERIFICATION_CODE_TTL = 600 // 10 minutes
  private static readonly PASSWORD_RESET_TTL = 3600 // 1 hour
  private static readonly LOGIN_LOCKOUT_DURATION = 900 // 15 minutes
  private static readonly MAX_LOGIN_ATTEMPTS = 5
  private static readonly SESSION_TTL = 30 * 24 * 60 * 60 // 30 days
  private static readonly REMEMBER_ME_TTL = 90 * 24 * 60 * 60 // 90 days

  // Register new user with enhanced validation
  static async register(input: RegisterInput) {
    const correlationId = generateCorrelationId()
    const timer = performance.start('auth.register')
    
    logger.info('User registration attempt', { 
      email: input.email,
      correlationId 
    })

    try {
      // Validate agreement to terms
      if (!input.agreeToTerms) {
        throw new Error('You must agree to the terms and conditions')
      }

      // Check if email already exists
      const existingUser = await db.user.findUnique({
        where: { email: input.email },
        select: { id: true },
      })

      if (existingUser) {
        throw new Error('Email already registered')
      }

      // Process referral if provided
      let referrerId: string | undefined
      if (input.referralCode) {
        const referral = await db.referral.findUnique({
          where: { referralCode: input.referralCode },
          include: { referrer: { select: { id: true } } },
        })

        if (referral && referral.status === 'PENDING') {
          referrerId = referral.referrer.id
        }
      }

      // Create user
      const user = await UserService.createUser({
        email: input.email,
        password: input.password,
        username: input.username,
      })

      // Update referral if applicable
      if (referrerId && input.referralCode) {
        await transaction(async (tx) => {
          // Update referral
          await tx.referral.update({
            where: { referralCode: input.referralCode },
            data: {
              referredUserId: user.id,
              status: 'COMPLETED',
              completedAt: new Date(),
            },
          })

          // Award referral bonus to referrer
          await tx.userBalance.update({
            where: { userId: referrerId },
            data: {
              sparklePoints: { increment: 500 },
              lifetimeEarned: { increment: 500 },
            },
          })

          // Create notification for referrer
          await tx.notification.create({
            data: {
              type: 'SYSTEM',
              userId: referrerId,
              title: 'Referral Bonus Earned! 🎉',
              message: `You earned 500 Sparkle Points for referring a new user!`,
              data: { referredUserId: user.id, bonus: 500 },
            },
          })
        }, {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        })
      }

      // Generate verification code
      const verificationCode = generateVerificationCode()
      await redisHelpers.setJSON(
        `email_verify:${user.id}`,
        { code: verificationCode, email: user.email },
        this.VERIFICATION_CODE_TTL
      )

      // Queue verification email
      await jobs.email.send({
        to: user.email,
        subject: 'Verify Your Email - Sparkle Universe',
        template: 'VerificationEmail',
        data: {
          code: verificationCode,
          expiresIn: '10 minutes',
        },
      })

      const timing = performance.end('auth.register')
      logger.info('User registered successfully', { 
        userId: user.id,
        duration: timing?.duration,
        correlationId 
      })
      
      return user
    } catch (error) {
      const timing = performance.end('auth.register')
      logger.error('Registration failed', error, {
        duration: timing?.duration,
        correlationId,
      })
      throw error
    }
  }

  // Enhanced login with 2FA support
  static async login(input: LoginInput) {
    const { email, password, ipAddress, userAgent, twoFactorCode, rememberMe } = input
    const correlationId = generateCorrelationId()
    const requestId = generateRequestId()

    logger.info('Login attempt', { email, ipAddress, correlationId, requestId })

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
    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      throw new Error('Account temporarily locked due to multiple failed attempts')
    }

    // Check user status
    if (user.status === UserStatus.BANNED) {
      throw new Error('Account has been banned')
    }

    if (user.status === UserStatus.SUSPENDED) {
      if (user.banExpiresAt && user.banExpiresAt > new Date()) {
        throw new Error(`Account suspended until ${user.banExpiresAt.toLocaleDateString()}`)
      }
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

    // Check 2FA if enabled
    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        // Return indicator that 2FA is required
        return {
          requiresTwoFactor: true,
          userId: user.id,
        }
      }

      // Verify 2FA code
      if (!user.twoFactorSecret) {
        throw new Error('2FA configuration error')
      }

      const isValid2FA = twoFactorAuth.verifyToken(user.twoFactorSecret, twoFactorCode)

      if (!isValid2FA) {
        // Check backup codes
        const isBackupCode = user.twoFactorBackupCodes.includes(twoFactorCode)
        
        if (!isBackupCode) {
          await this.handleFailedLogin(user.id, email, ipAddress, userAgent)
          throw new Error('Invalid 2FA code')
        }

        // Remove used backup code
        await db.user.update({
          where: { id: user.id },
          data: {
            twoFactorBackupCodes: {
              set: user.twoFactorBackupCodes.filter(code => code !== twoFactorCode),
            },
          },
        })

        // Alert user about backup code usage
        await createSecurityAlert(
          user.id,
          'BACKUP_CODE_USED',
          'Backup Code Used',
          'A backup code was used to access your account',
          'medium'
        )
      }
    }

    // Track successful login
    await trackLoginAttempt(email, ipAddress, userAgent, true)

    // Update user
    await db.user.update({
      where: { id: user.id },
      data: { 
        lastSeenAt: new Date(),
        failedLoginAttempts: 0,
        accountLockoutAttempts: 0,
      },
    })

    // Clear any failed login attempts
    await redis.del(`failed_attempts:${user.id}`)

    // Generate session token
    const sessionToken = generateSecureToken(32, 'sess')
    const sessionData = {
      userId: user.id,
      ipAddress,
      userAgent,
      createdAt: new Date(),
    }

    // Store session in Redis with appropriate TTL
    const ttl = rememberMe ? this.REMEMBER_ME_TTL : this.SESSION_TTL
    await redis.setex(`session:${sessionToken}`, ttl, JSON.stringify(sessionData))

    // Store session in database for audit
    await db.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expires: new Date(Date.now() + ttl * 1000),
        ipAddress,
        userAgent,
      },
    })

    eventEmitter.emit('auth:login', { userId: user.id, ipAddress })

    return {
      user,
      sessionToken,
      requiresTwoFactor: false,
    }
  }

  // Enable 2FA for user
  static async enableTwoFactor(userId: string): Promise<Enable2FAResult> {
    const correlationId = generateCorrelationId()
    
    logger.info('Enabling 2FA', { userId, correlationId })

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { email: true, twoFactorEnabled: true },
    })

    if (!user) {
      throw new Error('User not found')
    }

    if (user.twoFactorEnabled) {
      throw new Error('2FA is already enabled')
    }

    // Generate secret and QR code
    const { secret, qrCode, backupCodes } = twoFactorAuth.generateSecret(user.email)
    const qrCodeDataUrl = await qrCode

    // Store temporarily in Redis (user must verify before enabling)
    await redisHelpers.setJSON(
      `2fa_setup:${userId}`,
      {
        secret,
        backupCodes,
      },
      600 // 10 minutes to complete setup
    )

    return {
      secret,
      qrCode: qrCodeDataUrl,
      backupCodes,
    }
  }

  // Verify and complete 2FA setup
  static async verifyTwoFactorSetup(
    userId: string,
    verificationCode: string
  ): Promise<boolean> {
    const correlationId = generateCorrelationId()
    
    logger.info('Verifying 2FA setup', { userId, correlationId })

    // Get setup data from Redis
    const setupData = await redisHelpers.getJSON<{
      secret: string
      backupCodes: string[]
    }>(`2fa_setup:${userId}`)

    if (!setupData) {
      throw new Error('2FA setup expired or not found')
    }

    // Verify the code
    const isValid = twoFactorAuth.verifyToken(setupData.secret, verificationCode)

    if (!isValid) {
      throw new Error('Invalid verification code')
    }

    // Enable 2FA for user
    await db.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: setupData.secret,
        twoFactorBackupCodes: setupData.backupCodes,
      },
    })

    // Clean up Redis
    await redis.del(`2fa_setup:${userId}`)

    // Create security alert
    await createSecurityAlert(
      userId,
      '2FA_ENABLED',
      'Two-Factor Authentication Enabled',
      'Two-factor authentication has been successfully enabled on your account',
      'low'
    )

    eventEmitter.emit('auth:2faEnabled', { userId })

    return true
  }

  // Disable 2FA
  static async disableTwoFactor(
    userId: string,
    password: string,
    twoFactorCode: string
  ): Promise<void> {
    const correlationId = generateCorrelationId()
    
    logger.info('Disabling 2FA', { userId, correlationId })

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        hashedPassword: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
      },
    })

    if (!user || !user.twoFactorEnabled) {
      throw new Error('2FA is not enabled')
    }

    // Verify password
    if (!user.hashedPassword || !await verifyPassword(password, user.hashedPassword)) {
      throw new Error('Invalid password')
    }

    // Verify 2FA code
    if (!user.twoFactorSecret) {
      throw new Error('2FA configuration error')
    }

    const isValid = twoFactorAuth.verifyToken(user.twoFactorSecret, twoFactorCode)

    if (!isValid) {
      throw new Error('Invalid 2FA code')
    }

    // Disable 2FA
    await db.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      },
    })

    // Create security alert
    await createSecurityAlert(
      userId,
      '2FA_DISABLED',
      'Two-Factor Authentication Disabled',
      'Two-factor authentication has been disabled on your account',
      'high'
    )

    eventEmitter.emit('auth:2faDisabled', { userId })
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
    const currentAttempts = await redis.get(attemptsKey)
    const attempts = (currentAttempts ? parseInt(currentAttempts) : 0) + 1
    await redis.setex(attemptsKey, this.LOGIN_LOCKOUT_DURATION, attempts.toString())

    await trackLoginAttempt(email, ipAddress, userAgent, false, 'Invalid password')

    // Update user record
    await db.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: { increment: 1 },
        lastFailedLoginAt: new Date(),
      },
    })

    // Lock account if too many attempts
    if (attempts >= this.MAX_LOGIN_ATTEMPTS) {
      await db.user.update({
        where: { id: userId },
        data: {
          accountLockedUntil: new Date(Date.now() + this.LOGIN_LOCKOUT_DURATION * 1000),
          accountLockoutAttempts: attempts,
        },
      })
      
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
    const correlationId = generateCorrelationId()
    
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

    // Queue achievement check
    await jobs.achievement.check(userId)

    eventEmitter.emit('auth:emailVerified', { userId })
  }

  // Request password reset with enhanced security
  static async requestPasswordReset(email: string) {
    const correlationId = generateCorrelationId()
    
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    })

    if (!user) {
      // Don't reveal if email exists
      logger.info('Password reset requested for non-existent email', { 
        email,
        correlationId 
      })
      return
    }

    // Generate reset token
    const resetToken = generateSecureToken(32, 'reset')
    const resetData = {
      userId: user.id,
      email: user.email,
      token: resetToken,
      requestedAt: new Date(),
    }

    // Store in Redis with TTL
    await redisHelpers.setJSON(
      `password_reset:${resetToken}`,
      resetData,
      this.PASSWORD_RESET_TTL
    )

    // Also store in database for audit
    await db.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: new Date(Date.now() + this.PASSWORD_RESET_TTL * 1000),
      },
    })

    // Queue reset email
    await jobs.email.send({
      to: user.email,
      subject: 'Reset Your Password - Sparkle Universe',
      template: 'PasswordResetEmail',
      data: {
        resetUrl: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`,
        expiresIn: '1 hour',
      },
    })

    eventEmitter.emit('auth:passwordResetRequested', { userId: user.id })
  }

  // Reset password with validation
  static async resetPassword(input: PasswordResetInput) {
    const correlationId = generateCorrelationId()
    
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

    // Update password and clear reset token
    await db.user.update({
      where: { id: resetData.userId },
      data: { 
        hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        lastPasswordChangedAt: new Date(),
      },
    })

    // Delete reset token from Redis
    await redis.del(`password_reset:${input.token}`)

    // Invalidate all existing sessions for security
    const sessions = await db.session.findMany({
      where: { userId: resetData.userId },
      select: { sessionToken: true },
    })

    for (const session of sessions) {
      await redis.del(`session:${session.sessionToken}`)
    }

    await db.session.deleteMany({
      where: { userId: resetData.userId },
    })

    // Create security alert
    await createSecurityAlert(
      resetData.userId,
      'PASSWORD_CHANGED',
      'Password Changed',
      'Your password was successfully changed. All sessions have been terminated.',
      'medium'
    )

    eventEmitter.emit('auth:passwordReset', { 
      userId: resetData.userId
    })
  }

  // Logout with session cleanup
  static async logout(sessionToken: string) {
    const correlationId = generateCorrelationId()
    
    // Get session data before deletion
    const sessionDataRaw = await redis.get(`session:${sessionToken}`)
    const sessionData = sessionDataRaw ? JSON.parse(sessionDataRaw) : null
    
    // Delete from Redis
    await redis.del(`session:${sessionToken}`)
    
    // Delete from database
    await db.session.delete({
      where: { sessionToken },
    }).catch(() => {
      // Session might not exist in DB
    })
    
    eventEmitter.emit('auth:logout', { 
      sessionToken,
      userId: sessionData?.userId
    })
  }

  // Validate session with refresh
  static async validateSession(sessionToken: string) {
    const sessionDataRaw = await redis.get(`session:${sessionToken}`)
    
    if (!sessionDataRaw) {
      // Check database as fallback
      const dbSession = await db.session.findUnique({
        where: { sessionToken },
        include: { user: true },
      })

      if (!dbSession || dbSession.expires < new Date()) {
        return null
      }

      // Restore to Redis
      await redis.setex(
        `session:${sessionToken}`,
        this.SESSION_TTL,
        JSON.stringify({
          userId: dbSession.userId,
          ipAddress: dbSession.ipAddress || 'unknown',
          userAgent: dbSession.userAgent || 'unknown',
          createdAt: dbSession.createdAt,
        })
      )

      return dbSession
    }

    const sessionData = JSON.parse(sessionDataRaw)

    // Extend session TTL
    await redis.expire(`session:${sessionToken}`, this.SESSION_TTL)

    return sessionData
  }
}
