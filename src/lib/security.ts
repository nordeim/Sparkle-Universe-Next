// src/lib/security.ts
import crypto from 'crypto'
import DOMPurify from 'isomorphic-dompurify'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import type { User, SecurityAlert, LoginHistory } from '@prisma/client'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'

// ============ SCHEMA LIMITS ============
export const SCHEMA_LIMITS = {
  username: { min: 3, max: 30 },
  password: { min: 8, max: 128 },
  email: { max: 255 },
  bio: { max: 500 },
  postTitle: { min: 1, max: 200 },
  postContent: { min: 1, max: 50000 },
  commentContent: { min: 1, max: 5000 },
  tagName: { min: 2, max: 30 },
  groupName: { min: 3, max: 100 },
  groupDescription: { max: 1000 },
}

// ============ HTML SANITIZATION ============
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li',
      'blockquote', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'img', 'video', 'iframe', 'span', 'div'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'width', 'height',
      'class', 'id', 'target', 'rel', 'data-*',
      'allowfullscreen', 'frameborder'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):)|^\/(?!\/)/,
    ADD_TAGS: ['iframe'], // For YouTube embeds
    ADD_ATTR: ['allowfullscreen', 'frameborder'],
    FORBID_TAGS: ['script', 'style'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick'],
  })
}

// ============ TOKEN GENERATION ============
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

export function generateShortCode(length: number = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  const bytes = crypto.randomBytes(length)
  
  for (let i = 0; i < length; i++) {
    code += chars[bytes[i] % chars.length]
  }
  
  return code
}

export function generateVerificationCode(length: number = 6): string {
  const code = Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, '0')
  return code
}

export function generateUniqueCode(prefix?: string): string {
  const timestamp = Date.now().toString(36)
  const random = crypto.randomBytes(4).toString('hex')
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`
}

export function generateCorrelationId(): string {
  return `corr_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`
}

export function generateRequestId(): string {
  return `req_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`
}

// ============ PASSWORD MANAGEMENT ============
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12')
  return bcrypt.hash(password, saltRounds)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function validatePasswordStrength(password: string): {
  valid: boolean
  errors: string[]
  score: number
} {
  const errors: string[] = []
  let score = 0

  // Length check
  if (password.length < SCHEMA_LIMITS.password.min) {
    errors.push(`Password must be at least ${SCHEMA_LIMITS.password.min} characters`)
  } else if (password.length > SCHEMA_LIMITS.password.max) {
    errors.push(`Password must be less than ${SCHEMA_LIMITS.password.max} characters`)
  } else {
    score += password.length > 12 ? 2 : 1
  }

  // Complexity checks
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letters')
  } else {
    score++
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letters')
  } else {
    score++
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain numbers')
  } else {
    score++
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.push('Password must contain special characters')
  } else {
    score += 2
  }

  // Common password check
  const commonPasswords = ['password', '12345678', 'qwerty', 'abc123', 'password123']
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    errors.push('Password is too common')
    score = Math.max(0, score - 3)
  }

  return {
    valid: errors.length === 0,
    errors,
    score: Math.min(10, score)
  }
}

export async function canRequestPasswordReset(email: string): Promise<boolean> {
  // Check if user has requested too many resets recently
  const recentRequests = await db.user.count({
    where: {
      email,
      resetPasswordToken: { not: null },
      resetPasswordExpires: { gte: new Date(Date.now() - 3600000) } // 1 hour
    }
  })
  
  return recentRequests < 3 // Max 3 requests per hour
}

// ============ ENCRYPTION ============
export function encrypt(text: string): string {
  const algorithm = 'aes-256-gcm'
  const key = Buffer.from(process.env.ENCRYPTION_KEY || generateSecureToken(32), 'hex')
  const iv = crypto.randomBytes(16)
  
  const cipher = crypto.createCipheriv(algorithm, key, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
}

export function decrypt(encryptedText: string): string {
  const algorithm = 'aes-256-gcm'
  const key = Buffer.from(process.env.ENCRYPTION_KEY || generateSecureToken(32), 'hex')
  
  const parts = encryptedText.split(':')
  const iv = Buffer.from(parts[0], 'hex')
  const authTag = Buffer.from(parts[1], 'hex')
  const encrypted = parts[2]
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv)
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

// ============ TWO-FACTOR AUTHENTICATION ============
export const twoFactorAuth = {
  generateSecret(email: string): {
    secret: string
    qrCode: Promise<string>
    backupCodes: string[]
  } {
    const secret = speakeasy.generateSecret({
      name: `Sparkle Universe (${email})`,
      issuer: 'Sparkle Universe',
      length: 32
    })

    const backupCodes = Array.from({ length: 10 }, () => 
      crypto.randomBytes(4).toString('hex').toUpperCase()
    )

    const qrCode = QRCode.toDataURL(secret.otpauth_url!)

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
      window: 2 // Allow 2 time windows for clock skew
    })
  },

  generateBackupCodes(): string[] {
    return Array.from({ length: 10 }, () => 
      crypto.randomBytes(4).toString('hex').toUpperCase()
    )
  }
}

// ============ SECURITY TRACKING ============
export async function trackLoginAttempt(
  userId: string,
  success: boolean,
  ipAddress: string,
  userAgent?: string,
  reason?: string
): Promise<void> {
  try {
    await db.loginHistory.create({
      data: {
        userId,
        ipAddress,
        userAgent: userAgent || 'unknown',
        success,
        reason,
        timestamp: new Date()
      }
    })

    if (!success) {
      // Update failed login count
      await db.user.update({
        where: { id: userId },
        data: {
          failedLoginAttempts: { increment: 1 },
          lastFailedLoginAt: new Date()
        }
      })

      // Check if we should lock the account
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { failedLoginAttempts: true }
      })

      if (user && user.failedLoginAttempts >= 5) {
        await db.user.update({
          where: { id: userId },
          data: {
            accountLockedUntil: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
          }
        })
      }
    } else {
      // Reset failed attempts on successful login
      await db.user.update({
        where: { id: userId },
        data: {
          failedLoginAttempts: 0,
          lastFailedLoginAt: null
        }
      })
    }
  } catch (error) {
    console.error('Failed to track login attempt:', error)
  }
}

export async function createSecurityAlert(data: {
  userId: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  metadata?: any
}): Promise<void> {
  try {
    await db.securityAlert.create({
      data: {
        userId: data.userId,
        type: data.type,
        severity: data.severity,
        message: data.message,
        metadata: data.metadata || {},
        resolved: false,
        createdAt: new Date()
      }
    })

    // Send notification to user if high or critical
    if (data.severity === 'high' || data.severity === 'critical') {
      await db.notification.create({
        data: {
          userId: data.userId,
          type: 'SYSTEM',
          title: 'Security Alert',
          message: data.message,
          priority: 3,
          createdAt: new Date()
        }
      })
    }
  } catch (error) {
    console.error('Failed to create security alert:', error)
  }
}

// ============ VALIDATION ============
export function validateField(field: string, value: any): {
  valid: boolean
  error?: string
} {
  switch (field) {
    case 'email':
      return {
        valid: isValidEmail(value),
        error: !isValidEmail(value) ? 'Invalid email format' : undefined
      }
    
    case 'username':
      return {
        valid: isValidUsername(value),
        error: !isValidUsername(value) ? 'Username must be 3-30 alphanumeric characters' : undefined
      }
    
    case 'bio':
      return {
        valid: value.length <= SCHEMA_LIMITS.bio.max,
        error: value.length > SCHEMA_LIMITS.bio.max ? `Bio must be less than ${SCHEMA_LIMITS.bio.max} characters` : undefined
      }
    
    default:
      return { valid: true }
  }
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= SCHEMA_LIMITS.email.max
}

export function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/
  return usernameRegex.test(username)
}

// ============ CSRF PROTECTION ============
export function generateCSRFToken(): string {
  return generateSecureToken(32)
}

export function validateCSRFToken(token: string, sessionToken: string): boolean {
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(sessionToken)
  )
}

// ============ RATE LIMITING ============
export function getRateLimitKey(identifier: string, action: string): string {
  const window = Math.floor(Date.now() / 60000) // 1-minute windows
  return `rate:${action}:${identifier}:${window}`
}

// ============ IP & REQUEST UTILITIES ============
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }
  
  return '127.0.0.1'
}

// ============ DATA MASKING ============
export function maskSensitiveData(data: any): any {
  const sensitiveFields = [
    'password', 'hashedPassword', 'token', 'secret', 'apiKey', 
    'email', 'phoneNumber', 'creditCard', 'ssn', 'twoFactorSecret'
  ]
  
  if (typeof data !== 'object' || data === null) {
    return data
  }
  
  const masked = Array.isArray(data) ? [...data] : { ...data }
  
  for (const key in masked) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      if (typeof masked[key] === 'string') {
        masked[key] = masked[key].length > 4 
          ? masked[key].substring(0, 2) + '***' + masked[key].substring(masked[key].length - 2)
          : '***'
      } else {
        masked[key] = '***REDACTED***'
      }
    } else if (typeof masked[key] === 'object' && masked[key] !== null) {
      masked[key] = maskSensitiveData(masked[key])
    }
  }
  
  return masked
}

// ============ EXPORT ALL ============
export default {
  // HTML
  sanitizeHtml,
  
  // Tokens
  generateSecureToken,
  generateShortCode,
  generateVerificationCode,
  generateUniqueCode,
  generateCorrelationId,
  generateRequestId,
  
  // Passwords
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  canRequestPasswordReset,
  
  // Encryption
  encrypt,
  decrypt,
  
  // 2FA
  twoFactorAuth,
  
  // Tracking
  trackLoginAttempt,
  createSecurityAlert,
  
  // Validation
  validateField,
  isValidEmail,
  isValidUsername,
  
  // CSRF
  generateCSRFToken,
  validateCSRFToken,
  
  // Rate Limiting
  getRateLimitKey,
  
  // Utilities
  getClientIp,
  maskSensitiveData,
  
  // Constants
  SCHEMA_LIMITS,
}
