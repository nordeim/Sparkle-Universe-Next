// src/services/email.service.ts
import nodemailer from 'nodemailer'
import { render } from '@react-email/render'
import { db } from '@/lib/db'
import { redis, redisHelpers } from '@/lib/redis'
import { logger } from '@/lib/monitoring'
import { eventEmitter } from '@/lib/events/event-emitter'
import { NotificationType } from '@prisma/client'
import * as templates from '@/emails/templates'

// Email configuration
const EMAIL_FROM = process.env.EMAIL_FROM || 'Sparkle Universe <noreply@sparkle-universe.com>'
const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || 'support@sparkle-universe.com'
const BATCH_SIZE = 50
const RATE_LIMIT_PER_HOUR = 1000

// Email provider configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
  secure: process.env.EMAIL_SERVER_PORT === '465',
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
})

// Backup transporter (e.g., SendGrid)
const backupTransporter = process.env.SENDGRID_API_KEY
  ? nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    })
  : null

export interface EmailOptions {
  to: string | string[]
  subject: string
  template: keyof typeof templates
  data: any
  from?: string
  replyTo?: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
  headers?: Record<string, string>
  priority?: 'high' | 'normal' | 'low'
  category?: string
  trackOpens?: boolean
  trackClicks?: boolean
}

export interface EmailResult {
  messageId: string
  accepted: string[]
  rejected: string[]
  response: string
}

export class EmailService {
  // Send single email
  static async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      // Check rate limit
      await this.checkRateLimit(options.to)

      // Render email template
      const { html, text } = await this.renderTemplate(options.template, options.data)

      // Prepare email
      const mailOptions = {
        from: options.from || EMAIL_FROM,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        replyTo: options.replyTo || EMAIL_REPLY_TO,
        subject: options.subject,
        html,
        text,
        attachments: options.attachments,
        headers: {
          ...options.headers,
          'X-Priority': options.priority || 'normal',
          'X-Category': options.category || 'transactional',
          'List-Unsubscribe': `<${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe>`,
        },
      }

      // Add tracking pixels if enabled
      if (options.trackOpens) {
        mailOptions.html = this.addTrackingPixel(mailOptions.html, options.to as string)
      }

      if (options.trackClicks) {
        mailOptions.html = this.addClickTracking(mailOptions.html, options.to as string)
      }

      // Send email
      let result: EmailResult
      try {
        const info = await transporter.sendMail(mailOptions)
        result = {
          messageId: info.messageId,
          accepted: info.accepted as string[],
          rejected: info.rejected as string[],
          response: info.response,
        }
      } catch (error) {
        // Try backup transporter
        if (backupTransporter) {
          logger.warn('Primary email provider failed, trying backup', error)
          const info = await backupTransporter.sendMail(mailOptions)
          result = {
            messageId: info.messageId,
            accepted: info.accepted as string[],
            rejected: info.rejected as string[],
            response: info.response,
          }
        } else {
          throw error
        }
      }

      // Log email sent
      await this.logEmailSent(options, result)

      // Update rate limit
      await this.updateRateLimit(options.to)

      logger.info('Email sent successfully', { 
        to: options.to, 
        subject: options.subject,
        messageId: result.messageId,
      })

      return result

    } catch (error) {
      logger.error('Failed to send email', error, { 
        to: options.to, 
        subject: options.subject 
      })
      throw error
    }
  }

  // Send bulk emails
  static async sendBulkEmails(
    recipients: string[],
    template: keyof typeof templates,
    baseData: any,
    options: Partial<EmailOptions> = {}
  ): Promise<{ sent: number; failed: number; errors: any[] }> {
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as any[],
    }

    // Process in batches
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE)
      
      await Promise.all(
        batch.map(async (recipient) => {
          try {
            await this.sendEmail({
              to: recipient,
              template,
              data: { ...baseData, email: recipient },
              ...options,
              subject: options.subject || 'Update from Sparkle Universe',
            })
            results.sent++
          } catch (error) {
            results.failed++
            results.errors.push({ recipient, error: (error as Error).message })
          }
        })
      )

      // Rate limit between batches
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    logger.info('Bulk email completed', results)
    return results
  }

  // Process email queue
  static async processEmailQueue(): Promise<void> {
    const queue = await db.notificationQueue.findMany({
      where: {
        channel: 'email',
        processedAt: null,
        attempts: { lt: 3 },
        scheduledFor: { lte: new Date() },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
      take: BATCH_SIZE,
    })

    for (const item of queue) {
      try {
        await this.processQueueItem(item)
      } catch (error) {
        logger.error('Failed to process email queue item', error, { 
          queueId: item.id 
        })
      }
    }
  }

  // Process single queue item
  private static async processQueueItem(item: any): Promise<void> {
    try {
      const { userId, type, payload } = item

      // Get user details
      const user = await db.user.findUnique({
        where: { id: userId },
        include: { 
          profile: true,
          notificationPrefs: true,
        },
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Check if user wants email notifications
      if (!user.notificationPrefs?.emailNotifications) {
        await db.notificationQueue.update({
          where: { id: item.id },
          data: { 
            processedAt: new Date(),
            error: 'User has disabled email notifications',
          },
        })
        return
      }

      // Select template based on notification type
      const template = this.getTemplateForNotificationType(type)
      const subject = this.getSubjectForNotificationType(type, payload)

      // Send email
      await this.sendEmail({
        to: user.email,
        subject,
        template,
        data: {
          user: {
            name: user.profile?.displayName || user.username,
            email: user.email,
          },
          notification: payload,
          unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications`,
        },
        category: type.toLowerCase(),
      })

      // Mark as processed
      await db.notificationQueue.update({
        where: { id: item.id },
        data: { 
          processedAt: new Date(),
          attempts: { increment: 1 },
        },
      })

    } catch (error) {
      // Update failure
      await db.notificationQueue.update({
        where: { id: item.id },
        data: {
          attempts: { increment: 1 },
          failedAt: new Date(),
          error: (error as Error).message,
        },
      })

      throw error
    }
  }

  // Render email template
  private static async renderTemplate(
    templateName: keyof typeof templates,
    data: any
  ): Promise<{ html: string; text: string }> {
    const Template = templates[templateName]
    
    if (!Template) {
      throw new Error(`Email template '${templateName}' not found`)
    }

    const html = render(Template(data))
    const text = this.htmlToText(html)

    return { html, text }
  }

  // Check rate limit
  private static async checkRateLimit(to: string | string[]): Promise<void> {
    const recipients = Array.isArray(to) ? to : [to]
    const key = `email_rate_limit:${new Date().getHours()}`
    
    const current = await redis.get(key)
    const count = current ? parseInt(current) : 0

    if (count + recipients.length > RATE_LIMIT_PER_HOUR) {
      throw new Error('Email rate limit exceeded')
    }
  }

  // Update rate limit
  private static async updateRateLimit(to: string | string[]): Promise<void> {
    const recipients = Array.isArray(to) ? to : [to]
    const key = `email_rate_limit:${new Date().getHours()}`
    
    await redis.incrby(key, recipients.length)
    await redis.expire(key, 3600) // Expire after 1 hour
  }

  // Log email sent
  private static async logEmailSent(
    options: EmailOptions,
    result: EmailResult
  ): Promise<void> {
    // Store in analytics
    eventEmitter.emit('email:sent', {
      to: options.to,
      subject: options.subject,
      template: options.template,
      category: options.category,
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected,
    })

    // Store recent emails for debugging
    const key = `recent_emails:${Array.isArray(options.to) ? options.to[0] : options.to}`
    await redis.lpush(key, JSON.stringify({
      subject: options.subject,
      template: options.template,
      messageId: result.messageId,
      sentAt: new Date(),
    }))
    await redis.ltrim(key, 0, 9) // Keep last 10 emails
    await redis.expire(key, 86400 * 7) // Expire after 7 days
  }

  // Get template for notification type
  private static getTemplateForNotificationType(
    type: NotificationType
  ): keyof typeof templates {
    const templateMap: Record<NotificationType, keyof typeof templates> = {
      [NotificationType.POST_LIKED]: 'PostLikedEmail',
      [NotificationType.POST_COMMENTED]: 'CommentNotificationEmail',
      [NotificationType.COMMENT_LIKED]: 'CommentLikedEmail',
      [NotificationType.USER_FOLLOWED]: 'NewFollowerEmail',
      [NotificationType.ACHIEVEMENT_UNLOCKED]: 'AchievementEmail',
      [NotificationType.LEVEL_UP]: 'LevelUpEmail',
      [NotificationType.MENTION]: 'MentionEmail',
      [NotificationType.SYSTEM]: 'SystemNotificationEmail',
      [NotificationType.GROUP_INVITE]: 'GroupInviteEmail',
      [NotificationType.GROUP_POST]: 'GroupPostEmail',
      [NotificationType.EVENT_REMINDER]: 'EventReminderEmail',
      [NotificationType.WATCH_PARTY_INVITE]: 'WatchPartyInviteEmail',
      [NotificationType.DIRECT_MESSAGE]: 'DirectMessageEmail',
      [NotificationType.YOUTUBE_PREMIERE]: 'YouTubePremiereEmail',
      [NotificationType.QUEST_COMPLETE]: 'QuestCompleteEmail',
      [NotificationType.TRADE_REQUEST]: 'TradeRequestEmail',
      [NotificationType.CONTENT_FEATURED]: 'ContentFeaturedEmail',
      [NotificationType.MILESTONE_REACHED]: 'MilestoneEmail',
    }

    return templateMap[type] || 'SystemNotificationEmail'
  }

  // Get subject for notification type
  private static getSubjectForNotificationType(
    type: NotificationType,
    payload: any
  ): string {
    const subjectMap: Record<NotificationType, string> = {
      [NotificationType.POST_LIKED]: `Someone liked your post!`,
      [NotificationType.POST_COMMENTED]: `New comment on your post`,
      [NotificationType.COMMENT_LIKED]: `Someone liked your comment!`,
      [NotificationType.USER_FOLLOWED]: `You have a new follower!`,
      [NotificationType.ACHIEVEMENT_UNLOCKED]: `Achievement Unlocked: ${payload.achievementName}!`,
      [NotificationType.LEVEL_UP]: `Congratulations! You've reached level ${payload.level}!`,
      [NotificationType.MENTION]: `${payload.mentionerName} mentioned you`,
      [NotificationType.SYSTEM]: payload.title || 'Important Update from Sparkle Universe',
      [NotificationType.GROUP_INVITE]: `You're invited to join ${payload.groupName}`,
      [NotificationType.GROUP_POST]: `New post in ${payload.groupName}`,
      [NotificationType.EVENT_REMINDER]: `Reminder: ${payload.eventName} is starting soon`,
      [NotificationType.WATCH_PARTY_INVITE]: `Join the watch party for ${payload.videoTitle}`,
      [NotificationType.DIRECT_MESSAGE]: `New message from ${payload.senderName}`,
      [NotificationType.YOUTUBE_PREMIERE]: `${payload.channelName} is premiering soon!`,
      [NotificationType.QUEST_COMPLETE]: `Quest Complete: ${payload.questName}!`,
      [NotificationType.TRADE_REQUEST]: `${payload.traderName} wants to trade with you`,
      [NotificationType.CONTENT_FEATURED]: `Your content has been featured!`,
      [NotificationType.MILESTONE_REACHED]: `Milestone Reached: ${payload.milestoneName}!`,
    }

    return subjectMap[type] || 'Update from Sparkle Universe'
  }

  // Convert HTML to plain text
  private static htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gs, '')
      .replace(/<script[^>]*>.*?<\/script>/gs, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  // Add tracking pixel
  private static addTrackingPixel(html: string, recipient: string): string {
    const trackingId = Buffer.from(`${recipient}:${Date.now()}`).toString('base64')
    const pixelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/email/track/open?id=${trackingId}`
    const pixel = `<img src="${pixelUrl}" width="1" height="1" alt="" />`
    
    return html.replace('</body>', `${pixel}</body>`)
  }

  // Add click tracking
  private static addClickTracking(html: string, recipient: string): string {
    const trackingId = Buffer.from(recipient).toString('base64')
    
    return html.replace(
      /href="(https?:\/\/[^"]+)"/g,
      (match, url) => {
        const trackedUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/email/track/click?url=${encodeURIComponent(url)}&id=${trackingId}`
        return `href="${trackedUrl}"`
      }
    )
  }

  // Send welcome email
  static async sendWelcomeEmail(userId: string): Promise<void> {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    })

    if (!user) return

    await this.sendEmail({
      to: user.email,
      subject: 'Welcome to Sparkle Universe! ✨',
      template: 'WelcomeEmail',
      data: {
        name: user.profile?.displayName || user.username,
        username: user.username,
        verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=...`,
        profileUrl: `${process.env.NEXT_PUBLIC_APP_URL}/profile/${user.username}`,
      },
      category: 'onboarding',
      priority: 'high',
    })
  }

  // Send password reset email
  static async sendPasswordResetEmail(
    email: string,
    resetToken: string
  ): Promise<void> {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`

    await this.sendEmail({
      to: email,
      subject: 'Reset Your Password - Sparkle Universe',
      template: 'PasswordResetEmail',
      data: {
        resetUrl,
        expiresIn: '1 hour',
      },
      category: 'security',
      priority: 'high',
    })
  }

  // Send verification code email
  static async sendVerificationEmail(
    email: string,
    code: string
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Verify Your Email - Sparkle Universe',
      template: 'VerificationEmail',
      data: {
        code,
        expiresIn: '10 minutes',
      },
      category: 'security',
      priority: 'high',
    })
  }

  // Send weekly digest
  static async sendWeeklyDigest(userId: string): Promise<void> {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    })

    if (!user) return

    // Get weekly stats
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const [posts, followers, achievements] = await Promise.all([
      db.post.findMany({
        where: {
          createdAt: { gte: weekAgo },
          author: { followers: { some: { followerId: userId } } },
        },
        take: 5,
        orderBy: { likes: 'desc' },
        include: { author: true },
      }),
      db.follow.count({
        where: {
          followingId: userId,
          createdAt: { gte: weekAgo },
        },
      }),
      db.userAchievement.count({
        where: {
          userId,
          unlockedAt: { gte: weekAgo },
        },
      }),
    ])

    await this.sendEmail({
      to: user.email,
      subject: 'Your Weekly Sparkle Universe Digest ✨',
      template: 'WeeklyDigestEmail',
      data: {
        name: user.profile?.displayName || user.username,
        posts,
        newFollowers: followers,
        achievementsUnlocked: achievements,
        week: weekAgo.toLocaleDateString(),
      },
      category: 'digest',
      trackOpens: true,
      trackClicks: true,
    })
  }
}
