// src/lib/security.ts
import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'crypto'
import bcrypt from 'bcryptjs'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import { db } from '@/lib/db'
import { logger } from '@/lib/monitoring'
import { LoginHistory, SecurityAlert } from '@prisma/client'

// Constants - UPDATED to match PRD requirements
const SALT_ROUNDS = 12
const PASSWORD_MIN_LENGTH = 12 // PRD requirement: 12 characters minimum
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production'
const ENCRYPTION_ALGORITHM = 'aes-256-gcm'

// Schema constraints from Prisma
export const SCHEMA_LIMITS = {
  USERNAME_MAX: 50,      // username VARCHAR(50)
  EMAIL_MAX: 255,        // email VARCHAR(255)
  POST_TITLE_MAX: 500,   // title VARCHAR(500)
  BIO_MAX: 5000,         // bio TEXT (practical limit)
  COMMENT_MAX: 10000,    // content TEXT (practical limit)
} as const

// IP address utilities
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }
  
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  if (cfConnectingIp) {
    return cfConnectingIp
  }
  
  return 'unknown'
}

// Enhanced password hashing with pepper
export async function hashPassword(password: string): Promise<string> {
  const pepper = process.env.PASSWORD_PEPPER || ''
  const pepperedPassword = password + pepper
  return bcrypt.hash(pepperedPassword, SALT_ROUNDS)
}

// Verify password with pepper
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  const pepper = process.env.PASSWORD_PEPPER || ''
  const pepperedPassword = password + pepper
  return bcrypt.compare(pepperedPassword, hashedPassword)
}

// Generate secure token with optional prefix
export function generateSecureToken(length: number = 32, prefix?: string): string {
  const token = randomBytes(length).toString('hex')
  return prefix ? `${prefix}_${token}` : token
}

// Generate verification code
export function generateVerificationCode(length: number = 6): string {
  const digits = '0123456789'
  let code = ''
  const bytes = randomBytes(length)
  
  for (let i = 0; i < length; i++) {
    code += digits[bytes[i] % 10]
  }
  
  return code
}

// Encryption utilities for sensitive data
export function encrypt(text: string): { encrypted: string; iv: string; authTag: string } {
  const iv = randomBytes(16)
  const key = Buffer.from(ENCRYPTION_KEY, 'hex')
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = (cipher as any).getAuthTag()
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  }
}

export function decrypt(encryptedData: { encrypted: string; iv: string; authTag: string }): string {
  const key = Buffer.from(ENCRYPTION_KEY, 'hex')
  const decipher = createDecipheriv(
    ENCRYPTION_ALGORITHM,
    key,
    Buffer.from(encryptedData.iv, 'hex')
  )
  
  (decipher as any).setAuthTag(Buffer.from(encryptedData.authTag, 'hex'))
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

// Enhanced password validation with PRD requirements
export function validatePasswordStrength(password: string): {
  valid: boolean
  errors: string[]
  score: number
} {
  const errors: string[] = []
  let score = 0

  // PRD requirement: minimum 12 characters
  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long`)
  } else {
    score += 20
  }

  // Additional length bonus
  if (password.length >= 16) score += 10
  if (password.length >= 20) score += 10

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  } else {
    score += 15
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  } else {
    score += 15
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  } else {
    score += 15
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character')
  } else {
    score += 15
  }

  // Check for common passwords
  const commonPasswords = [
    'password', 'password123', '123456789012', 'qwerty123456',
    'sparkle123456', 'admin1234567', 'letmein12345', 'welcome12345',
    'password1234', '12345678901', 'qwertyuiop12', 'sparkleverse'
  ]
  
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    errors.push('Password is too common or contains common phrases')
    score = Math.max(0, score - 30)
  }

  // Check for repeated characters
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password should not contain repeated characters')
    score = Math.max(0, score - 10)
  }

  return {
    valid: errors.length === 0 && score >= 60,
    errors,
    score: Math.min(100, score),
  }
}

// Field validation with schema constraints
export function validateField(field: string, value: string): {
  valid: boolean
  error?: string
} {
  switch (field) {
    case 'username':
      if (value.length > SCHEMA_LIMITS.USERNAME_MAX) {
        return { 
          valid: false, 
          error: `Username must be ${SCHEMA_LIMITS.USERNAME_MAX} characters or less` 
        }
      }
      if (!/^[a-zA-Z0-9_]+$/.test(value)) {
        return { 
          valid: false, 
          error: 'Username can only contain letters, numbers, and underscores' 
        }
      }
      return { valid: true }

    case 'email':
      if (value.length > SCHEMA_LIMITS.EMAIL_MAX) {
        return { 
          valid: false, 
          error: `Email must be ${SCHEMA_LIMITS.EMAIL_MAX} characters or less` 
        }
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        return { valid: false, error: 'Invalid email format' }
      }
      return { valid: true }

    case 'postTitle':
      if (value.length > SCHEMA_LIMITS.POST_TITLE_MAX) {
        return { 
          valid: false, 
          error: `Title must be ${SCHEMA_LIMITS.POST_TITLE_MAX} characters or less` 
        }
      }
      return { valid: true }

    default:
      return { valid: true }
  }
}

// 2FA Implementation
export const twoFactorAuth = {
  // Generate 2FA secret
  generateSecret(email: string): { secret: string; qrCode: string } {
    const secret = speakeasy.generateSecret({
      name: `Sparkle Universe (${email})`,
      issuer: 'Sparkle Universe',
      length: 32,
    })

    return {
      secret: secret.base32,
      qrCode: secret.otpauth_url || '',
    }
  },

  // Generate QR code for 2FA setup
  async generateQRCode(otpauthUrl: string): Promise<string> {
    try {
      return await QRCode.toDataURL(otpauthUrl)
    } catch (error) {
      logger.error('Failed to generate QR code', error)
      throw new Error('Failed to generate QR code')
    }
  },

  // Verify 2FA token
  verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps tolerance
    })
  },

  // Generate backup codes
  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = []
    for (let i = 0; i < count; i++) {
      const code = randomBytes(4).toString('hex').toUpperCase()
      codes.push(`${code.slice(0, 4)}-${code.slice(4)}`)
    }
    return codes
  },

  // Encrypt 2FA secret for storage
  encryptSecret(secret: string): string {
    const encrypted = encrypt(secret)
    return JSON.stringify(encrypted)
  },

  // Decrypt 2FA secret
  decryptSecret(encryptedSecret: string): string {
    const parsed = JSON.parse(encryptedSecret)
    return decrypt(parsed)
  },
}

// Login attempt tracking with enhanced security
export async function trackLoginAttempt(
  email: string,
  ipAddress: string,
  userAgent: string,
  success: boolean,
  reason?: string
): Promise<LoginHistory> {
  try {
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Parse user agent for better tracking
    const location = await getLocationFromIP(ipAddress)

    const loginHistory = await db.loginHistory.create({
      data: {
        userId: user.id,
        ipAddress,
        userAgent,
        location,
        success,
        reason,
      },
    })

    // Check for suspicious activity
    if (!success) {
      await checkSuspiciousActivity(user.id, ipAddress)
    } else {
      // Check for new device/location
      await checkNewDeviceOrLocation(user.id, ipAddress, userAgent, location)
    }

    return loginHistory
  } catch (error) {
    logger.error('Failed to track login attempt:', error)
    throw error
  }
}

// Get approximate location from IP (placeholder)
async function getLocationFromIP(ip: string): Promise<string | null> {
  // In production, use a service like MaxMind or IPGeolocation
  if (ip === '127.0.0.1' || ip === 'localhost' || ip === 'unknown') {
    return 'Local Development'
  }
  
  // Placeholder - would integrate with geolocation service
  return null
}

// Enhanced suspicious activity checking
async function checkSuspiciousActivity(
  userId: string,
  ipAddress: string
): Promise<void> {
  const recentAttempts = await db.loginHistory.count({
    where: {
      userId,
      success: false,
      createdAt: {
        gte: new Date(Date.now() - LOCKOUT_DURATION),
      },
    },
  })

  if (recentAttempts >= MAX_LOGIN_ATTEMPTS) {
    await createSecurityAlert(
      userId,
      'MULTIPLE_FAILED_LOGINS',
      'Multiple Failed Login Attempts',
      `${recentAttempts} failed login attempts detected from IP: ${ipAddress}`,
      'high'
    )

    // Lock account
    await db.user.update({
      where: { id: userId },
      data: { 
        accountLockedUntil: new Date(Date.now() + LOCKOUT_DURATION),
        accountLockoutAttempts: recentAttempts,
      },
    })
  }

  // Check for rapid attempts from different IPs (possible attack)
  const differentIPs = await db.loginHistory.groupBy({
    by: ['ipAddress'],
    where: {
      userId,
      success: false,
      createdAt: {
        gte: new Date(Date.now() - 3600000), // Last hour
      },
    },
    _count: true,
  })

  if (differentIPs.length > 5) {
    await createSecurityAlert(
      userId,
      'DISTRIBUTED_LOGIN_ATTEMPTS',
      'Login Attempts from Multiple IPs',
      `Failed login attempts from ${differentIPs.length} different IP addresses`,
      'critical'
    )
  }
}

// Check for new device or location
async function checkNewDeviceOrLocation(
  userId: string,
  ipAddress: string,
  userAgent: string,
  location: string | null
): Promise<void> {
  // Check if this is a new IP
  const knownIp = await db.loginHistory.findFirst({
    where: {
      userId,
      ipAddress,
      success: true,
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      },
    },
  })

  if (!knownIp) {
    await createSecurityAlert(
      userId,
      'NEW_IP_LOGIN',
      'Login from New IP Address',
      `Successful login from new IP address: ${ipAddress}${location ? ` (${location})` : ''}`,
      'medium'
    )
  }

  // Check for unusual time patterns
  const currentHour = new Date().getHours()
  const usualLoginHours = await db.loginHistory.groupBy({
    by: ['createdAt'],
    where: {
      userId,
      success: true,
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    },
  })

  // Analyze login patterns (simplified)
  const hourCounts = new Map<number, number>()
  usualLoginHours.forEach(login => {
    const hour = new Date(login.createdAt).getHours()
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1)
  })

  const avgLogins = Array.from(hourCounts.values()).reduce((a, b) => a + b, 0) / hourCounts.size
  const currentHourLogins = hourCounts.get(currentHour) || 0

  if (currentHourLogins === 0 && hourCounts.size > 10) {
    await createSecurityAlert(
      userId,
      'UNUSUAL_LOGIN_TIME',
      'Login at Unusual Time',
      `Login detected at ${currentHour}:00, which is outside your usual login pattern`,
      'low'
    )
  }
}

// Enhanced security alert creation
export async function createSecurityAlert(
  userId: string,
  type: string,
  title: string,
  description: string,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): Promise<SecurityAlert> {
  const alert = await db.securityAlert.create({
    data: {
      userId,
      type,
      title,
      description,
      severity,
    },
  })

  // Send notification based on severity
  if (severity === 'high' || severity === 'critical') {
    await db.notification.create({
      data: {
        userId,
        type: 'SYSTEM',
        title: `🚨 Security Alert: ${title}`,
        message: description,
        data: { alertId: alert.id, severity },
        priority: severity === 'critical' ? 3 : 2,
      },
    })

    // For critical alerts, also send email immediately
    if (severity === 'critical') {
      // Queue email notification
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { email: true },
      })

      if (user) {
        // This would trigger email service
        logger.warn('Critical security alert - email queued', { 
          userId, 
          email: user.email,
          alertType: type 
        })
      }
    }
  }

  logger.warn('Security alert created:', { userId, type, severity })
  return alert
}

// CSRF token generation and validation
export const csrf = {
  generate(): string {
    return generateSecureToken(32, 'csrf')
  },

  validate(token: string, sessionToken: string): boolean {
    if (!token || !sessionToken) return false
    return token === sessionToken
  },

  // Generate and store CSRF token in Redis
  async generateAndStore(sessionId: string): Promise<string> {
    const token = this.generate()
    const { redis } = await import('@/lib/redis')
    await redis.setex(`csrf:${sessionId}`, 3600, token) // 1 hour expiry
    return token
  },

  // Validate CSRF token from Redis
  async validateFromStore(sessionId: string, token: string): Promise<boolean> {
    const { redis } = await import('@/lib/redis')
    const storedToken = await redis.get(`csrf:${sessionId}`)
    return storedToken === token
  },
}

// Enhanced input sanitization
export function sanitizeInput(input: string, type: 'text' | 'html' | 'sql' = 'text'): string {
  let sanitized = input.trim()

  switch (type) {
    case 'html':
      // For HTML content, use a proper sanitizer in production (like DOMPurify)
      sanitized = sanitized
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
      break

    case 'sql':
      // Basic SQL injection prevention
      sanitized = sanitized.replace(/'/g, "''")
      break

    case 'text':
    default:
      // Remove potential script tags and event handlers
      sanitized = sanitized
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
      break
  }

  return sanitized
}

// Session fingerprinting with more entropy
export function generateSessionFingerprint(
  userAgent: string,
  acceptLanguage: string,
  acceptEncoding: string,
  screenResolution?: string,
  timezone?: string
): string {
  const components = [
    userAgent,
    acceptLanguage,
    acceptEncoding,
    screenResolution || 'unknown',
    timezone || 'unknown',
    // Add canvas fingerprint or WebGL fingerprint in production
  ].join('|')
  
  return createHash('sha256').update(components).digest('hex')
}

// Enhanced VPN/Proxy detection
export async function isVpnOrProxy(ip: string): Promise<boolean> {
  // Known VPN/Proxy IP ranges (simplified)
  const vpnRanges = [
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16',
    // Add more known VPN provider ranges
  ]
  
  // In production, integrate with services like:
  // - IPQualityScore
  // - MaxMind Proxy Detection
  // - IP2Proxy
  
  // Check if IP is in known VPN ranges
  for (const range of vpnRanges) {
    if (isIpInRange(ip, range)) {
      return true
    }
  }
  
  return false
}

// Helper function to check if IP is in CIDR range
function isIpInRange(ip: string, cidr: string): boolean {
  // Simplified implementation - use proper IP range checking library in production
  const [range, bits] = cidr.split('/')
  return ip.startsWith(range.split('.').slice(0, -1).join('.'))
}

// Enhanced rate-limited password reset
const passwordResetAttempts = new Map<string, { count: number; resetAt: number }>()

export async function canRequestPasswordReset(email: string): Promise<boolean> {
  const now = Date.now()
  const attempt = passwordResetAttempts.get(email)
  
  if (!attempt || now > attempt.resetAt) {
    // Reset counter after 1 hour
    passwordResetAttempts.set(email, { 
      count: 1, 
      resetAt: now + 60 * 60 * 1000 
    })
    return true
  }
  
  if (attempt.count >= 3) {
    return false
  }
  
  attempt.count++
  return true
}

// Request ID generation for distributed tracing
export function generateRequestId(): string {
  return `req_${Date.now()}_${randomBytes(8).toString('hex')}`
}

// Correlation ID for tracking across services
export function generateCorrelationId(): string {
  return `corr_${randomBytes(16).toString('hex')}`
}
