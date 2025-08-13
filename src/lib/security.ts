// src/lib/security.ts
import crypto from 'crypto'
import DOMPurify from 'isomorphic-dompurify'
import bcrypt from 'bcryptjs'

// HTML sanitization for user-generated content
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li',
      'blockquote', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'img', 'video', 'iframe', // For embeds
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'width', 'height',
      'class', 'id', 'target', 'rel',
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):)|^\/(?!\/)/,
    ADD_TAGS: ['iframe'], // For YouTube embeds
    ADD_ATTR: ['allowfullscreen', 'frameborder'],
    FORBID_TAGS: ['script', 'style'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick'],
  })
}

// Generate secure random tokens
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

// Generate short codes (for things like party codes)
export function generateShortCode(length: number = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  const bytes = crypto.randomBytes(length)
  
  for (let i = 0; i < length; i++) {
    code += chars[bytes[i] % chars.length]
  }
  
  return code
}

// Hash passwords
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12')
  return bcrypt.hash(password, saltRounds)
}

// Verify passwords
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Encrypt sensitive data
export function encrypt(text: string): string {
  const algorithm = 'aes-256-gcm'
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex')
  const iv = crypto.randomBytes(16)
  
  const cipher = crypto.createCipheriv(algorithm, key, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
}

// Decrypt sensitive data
export function decrypt(encryptedText: string): string {
  const algorithm = 'aes-256-gcm'
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex')
  
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

// Generate CSRF tokens
export function generateCSRFToken(): string {
  return generateSecureToken(32)
}

// Validate CSRF tokens
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(sessionToken)
  )
}

// Rate limit key generator
export function getRateLimitKey(identifier: string, action: string): string {
  const window = Math.floor(Date.now() / 60000) // 1-minute windows
  return `rate:${action}:${identifier}:${window}`
}

// IP address extraction
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

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate username format
export function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/
  return usernameRegex.test(username)
}

// Mask sensitive data for logging
export function maskSensitiveData(data: any): any {
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'email']
  
  if (typeof data !== 'object' || data === null) {
    return data
  }
  
  const masked = { ...data }
  
  for (const field of sensitiveFields) {
    if (field in masked) {
      masked[field] = '***REDACTED***'
    }
  }
  
  return masked
}
