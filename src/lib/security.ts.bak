// src/lib/security.ts
import { createHash, randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { logger } from '@/lib/monitoring'
import { LoginHistory, SecurityAlert } from '@prisma/client'

// Constants
const SALT_ROUNDS = 12
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

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
  
  return 'unknown'
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

// Verify password
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Generate secure token
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString('hex')
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

// Create hash for data integrity
export function createHash(data: string): string {
  return createHash('sha256').update(data).digest('hex')
}

// Login attempt tracking
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

    const loginHistory = await db.loginHistory.create({
      data: {
        userId: user.id,
        ipAddress,
        userAgent,
        success,
        reason,
      },
    })

    // Check for suspicious activity
    if (!success) {
      await checkSuspiciousActivity(user.id, ipAddress)
    }

    return loginHistory
  } catch (error) {
    logger.error('Failed to track login attempt:', error)
    throw error
  }
}

// Check for suspicious login activity
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

    // You could also implement account lockout here
    // await db.user.update({
    //   where: { id: userId },
    //   data: { 
    //     lockedUntil: new Date(Date.now() + LOCKOUT_DURATION),
    //   },
    // })
  }

  // Check for new IP address
  const knownIp = await db.loginHistory.findFirst({
    where: {
      userId,
      ipAddress,
      success: true,
    },
  })

  if (!knownIp) {
    await createSecurityAlert(
      userId,
      'NEW_IP_LOGIN',
      'Login from New IP Address',
      `Login attempt from new IP address: ${ipAddress}`,
      'medium'
    )
  }
}

// Create security alert
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
        title: `Security Alert: ${title}`,
        message: description,
        data: { alertId: alert.id, severity },
      },
    })
  }

  logger.warn('Security alert created:', { userId, type, severity })
  return alert
}

// Validate password strength
export function validatePasswordStrength(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  // Check for common passwords
  const commonPasswords = [
    'password', 'password123', '12345678', 'qwerty123',
    'sparkle123', 'admin123', 'letmein', 'welcome123'
  ]
  
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// CSRF token generation and validation
export const csrf = {
  generate(): string {
    return generateSecureToken(32)
  },

  validate(token: string, sessionToken: string): boolean {
    return token === sessionToken
  },
}

// Input sanitization
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
}

// SQL injection prevention helper
export function escapeSqlString(str: string): string {
  return str.replace(/'/g, "''")
}

// XSS prevention for user-generated content
export function sanitizeHtml(html: string): string {
  // In production, use a library like DOMPurify
  // This is a basic implementation
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

// Session fingerprinting
export function generateSessionFingerprint(
  userAgent: string,
  acceptLanguage: string,
  acceptEncoding: string
): string {
  const data = `${userAgent}:${acceptLanguage}:${acceptEncoding}`
  return createHash(data)
}

// Check if IP is from known VPN/proxy
export async function isVpnOrProxy(ip: string): Promise<boolean> {
  // In production, integrate with services like IPQualityScore
  // This is a placeholder implementation
  const knownVpnRanges = [
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16',
  ]
  
  // Implement actual VPN detection logic
  return false
}

// Rate-limited password reset
const passwordResetAttempts = new Map<string, number>()

export async function canRequestPasswordReset(email: string): Promise<boolean> {
  const attempts = passwordResetAttempts.get(email) || 0
  
  if (attempts >= 3) {
    return false
  }
  
  passwordResetAttempts.set(email, attempts + 1)
  
  // Clear attempts after 1 hour
  setTimeout(() => {
    passwordResetAttempts.delete(email)
  }, 60 * 60 * 1000)
  
  return true
}
