// src/server/services/moderation.service.ts
import { PrismaClient, ModerationStatus, Prisma } from '@prisma/client'
import { TRPCError } from '@trpc/server'

interface ModerationResult {
  shouldBlock: boolean
  requiresReview: boolean
  confidence: number
  reasons: string[]
  score: number
}

interface AISettings {
  enabled: boolean
  provider: 'openai' | 'perspective' | 'custom'
  apiKey?: string
  threshold: {
    autoBlock: number
    autoApprove: number
    review: number
  }
  categories: {
    toxicity: boolean
    spam: boolean
    nsfw: boolean
    harassment: boolean
    misinformation: boolean
  }
}

interface ModerationAction {
  action: 'approve' | 'reject' | 'escalate' | 'shadow_ban'
  reason?: string
  note?: string
  duration?: number // For temporary bans
}

export class ModerationService {
  private bannedWords: Set<string>
  private suspiciousPatterns: RegExp[]
  private aiSettings: AISettings

  constructor(private db: PrismaClient) {
    // Initialize with basic word list (expand as needed)
    this.bannedWords = new Set([
      // Add banned words here
      // These would typically be loaded from database or config
    ])

    this.suspiciousPatterns = [
      /\b(?:buy|sell|discount|free|click here|limited time)\b/gi,
      /\b(?:www\.|https?:\/\/)[^\s]+/gi, // URLs
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, // Emails
      /\b\d{3,}\s?\d{3,}\s?\d{4,}\b/g, // Phone numbers
    ]

    // Default AI settings
    this.aiSettings = {
      enabled: false,
      provider: 'openai',
      threshold: {
        autoBlock: 0.9,
        autoApprove: 0.1,
        review: 0.5,
      },
      categories: {
        toxicity: true,
        spam: true,
        nsfw: true,
        harassment: true,
        misinformation: false,
      },
    }

    // Load AI settings from database on initialization
    this.loadAISettings()
  }

  private async loadAISettings() {
    try {
      const settings = await this.db.siteSetting.findFirst({
        where: { key: 'ai_moderation_settings' },
      })
      
      if (settings && settings.value) {
        this.aiSettings = {
          ...this.aiSettings,
          ...(typeof settings.value === 'object' ? settings.value : JSON.parse(settings.value as string)),
        }
      }
    } catch (error) {
      console.error('Failed to load AI settings:', error)
    }
  }

  async checkContent(content: string, type: 'post' | 'comment' | 'message' = 'comment'): Promise<ModerationResult> {
    const result: ModerationResult = {
      shouldBlock: false,
      requiresReview: false,
      reasons: [],
      score: 0,
      confidence: 0,
    }

    // Check against content filters in database
    const filters = await this.db.contentFilter.findMany({
      where: { isActive: true },
    })

    for (const filter of filters) {
      let matched = false

      if (filter.filterType === 'keyword') {
        if (content.toLowerCase().includes(filter.pattern.toLowerCase())) {
          matched = true
        }
      } else if (filter.filterType === 'regex') {
        try {
          const regex = new RegExp(filter.pattern, 'gi')
          if (regex.test(content)) {
            matched = true
          }
        } catch (e) {
          // Invalid regex, skip
          console.error(`Invalid regex in filter ${filter.id}: ${filter.pattern}`)
        }
      }

      if (matched) {
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

    // Check for banned words
    const lowerContent = content.toLowerCase()
    for (const word of this.bannedWords) {
      if (lowerContent.includes(word)) {
        result.reasons.push(`Contains banned word`)
        result.score += 10
      }
    }

    // Check for suspicious patterns
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(content)) {
        result.reasons.push('Contains suspicious pattern')
        result.score += 5
      }
    }

    // Check content length (spam detection)
    if (content.length > 10000) {
      result.requiresReview = true
      result.reasons.push('excessive length')
      result.score += 5
    }

    // Check for repeated characters (spam)
    const repeatedChars = /(.)\1{9,}/g
    if (repeatedChars.test(content)) {
      result.requiresReview = true
      result.reasons.push('repeated characters')
      result.score += 3
    }

    // Check for excessive caps
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length
    if (capsRatio > 0.7 && content.length > 10) {
      result.requiresReview = true
      result.reasons.push('excessive caps')
      result.score += 3
    }

    // Check for multiple links (could be spam)
    const linkCount = (content.match(/https?:\/\//g) || []).length
    if (linkCount > 3) {
      result.requiresReview = true
      result.reasons.push('multiple links')
      result.score += linkCount * 2
    }

    // Determine action based on score
    if (result.score >= 20) {
      result.shouldBlock = true
    } else if (result.score >= 10) {
      result.requiresReview = true
    }

    // Calculate confidence
    result.confidence = Math.min(result.score / 30, 1) // Normalize to 0-1

    // Log to AI moderation queue if needed
    if (result.requiresReview || result.shouldBlock) {
      await this.db.aiModerationQueue.create({
        data: {
          entityType: type,
          entityId: '', // Will be filled by caller
          content,
          aiScore: result.confidence,
          aiReasons: result.reasons,
          confidence: result.confidence,
          humanReviewRequired: result.requiresReview,
          autoActionTaken: result.shouldBlock ? 'blocked' : 'flagged',
          reviewPriority: result.shouldBlock ? 2 : 1,
        },
      })
    }

    // AI moderation if enabled
    if (this.aiSettings.enabled) {
      const aiResult = await this.checkWithAI(content)
      if (aiResult.score > this.aiSettings.threshold.autoBlock) {
        result.shouldBlock = true
        result.reasons.push('AI flagged as harmful')
        result.score += aiResult.score * 20
      } else if (aiResult.score > this.aiSettings.threshold.review) {
        result.requiresReview = true
        result.reasons.push('AI flagged for review')
        result.score += aiResult.score * 10
      }
      result.confidence = Math.max(result.confidence, aiResult.confidence)
    }

    return result
  }

  private async checkWithAI(content: string): Promise<{ score: number; confidence: number; categories?: any }> {
    // Stub for AI integration - would connect to OpenAI, Perspective API, etc.
    // This is where you'd integrate with your AI provider
    return {
      score: 0,
      confidence: 0,
      categories: {},
    }
  }

  async reviewContent(
    entityId: string, 
    entityType: string, 
    reviewerId: string, 
    decision: 'approve' | 'reject' | 'escalate'
  ) {
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
        humanReviewRequired: decision === 'escalate',
      },
    })

    // Update entity moderation status
    const moderationStatus = 
      decision === 'approve' ? ModerationStatus.APPROVED :
      decision === 'reject' ? ModerationStatus.REJECTED :
      ModerationStatus.ESCALATED

    if (entityType === 'post') {
      await this.db.post.update({
        where: { id: entityId },
        data: { moderationStatus },
      })
    } else if (entityType === 'comment') {
      await this.db.comment.update({
        where: { id: entityId },
        data: { moderationStatus },
      })
    } else if (entityType === 'message') {
      await this.db.message.update({
        where: { id: entityId },
        data: { status: 'DELETED' },
      })
    }

    // Create moderation action log
    await this.db.moderationAction.create({
      data: {
        moderatorId: reviewerId,
        targetId: entityId,
        targetType: entityType,
        action: decision.toUpperCase(),
        reason: `Manual review: ${decision}`,
      },
    })

    return { success: true }
  }

  async moderateContent(
    contentId: string,
    contentType: 'post' | 'comment' | 'message',
    moderatorId: string,
    action: ModerationAction
  ) {
    // Validate content exists
    let content: any
    if (contentType === 'post') {
      content = await this.db.post.findUnique({ where: { id: contentId } })
    } else if (contentType === 'comment') {
      content = await this.db.comment.findUnique({ where: { id: contentId } })
    } else if (contentType === 'message') {
      content = await this.db.message.findUnique({ where: { id: contentId } })
    }

    if (!content) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `${contentType} not found`,
      })
    }

    // Apply moderation action
    const moderationStatus = 
      action.action === 'approve' ? ModerationStatus.APPROVED :
      action.action === 'reject' ? ModerationStatus.REJECTED :
      action.action === 'shadow_ban' ? ModerationStatus.SHADOW_BANNED :
      ModerationStatus.ESCALATED

    // Update content status
    if (contentType === 'post') {
      await this.db.post.update({
        where: { id: contentId },
        data: {
          moderationStatus,
          deleted: action.action === 'reject',
          deletedAt: action.action === 'reject' ? new Date() : null,
          deletedBy: action.action === 'reject' ? moderatorId : null,
        },
      })
    } else if (contentType === 'comment') {
      await this.db.comment.update({
        where: { id: contentId },
        data: {
          moderationStatus,
          deleted: action.action === 'reject',
          deletedAt: action.action === 'reject' ? new Date() : null,
          deletedBy: action.action === 'reject' ? moderatorId : null,
        },
      })
    } else if (contentType === 'message') {
      await this.db.message.update({
        where: { id: contentId },
        data: {
          status: action.action === 'reject' ? 'DELETED' : 'SENT',
        },
      })
    }

    // Log moderation action
    await this.db.moderationAction.create({
      data: {
        moderatorId,
        targetId: contentId,
        targetType: contentType,
        action: action.action.toUpperCase(),
        reason: action.reason || `Moderated by ${moderatorId}`,
        notes: action.note,
      },
    })

    // Update AI moderation queue if exists
    await this.db.aiModerationQueue.updateMany({
      where: {
        entityId: contentId,
        entityType: contentType,
      },
      data: {
        reviewedBy: moderatorId,
        reviewDecision: action.action,
        reviewedAt: new Date(),
        humanReviewRequired: false,
      },
    })

    return { success: true, action: action.action }
  }

  async bulkModerate(
    contentIds: string[],
    contentType: 'post' | 'comment' | 'message',
    moderatorId: string,
    action: ModerationAction
  ) {
    const results = []
    
    for (const contentId of contentIds) {
      try {
        const result = await this.moderateContent(contentId, contentType, moderatorId, action)
        results.push({ id: contentId, ...result })
      } catch (error) {
        results.push({ 
          id: contentId, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }
    
    return results
  }

  async addContentFilter(params: {
    filterType: string
    pattern: string
    action: string
    severity: number
    category?: string
    createdBy: string
  }) {
    return this.db.contentFilter.create({
      data: params,
    })
  }

  async updateContentFilter(filterId: string, updates: any) {
    return this.db.contentFilter.update({
      where: { id: filterId },
      data: updates,
    })
  }

  async removeContentFilter(filterId: string) {
    return this.db.contentFilter.update({
      where: { id: filterId },
      data: { isActive: false },
    })
  }

  async getContentFilters(isActive?: boolean) {
    const where = isActive !== undefined ? { isActive } : {}
    
    return this.db.contentFilter.findMany({
      where,
      orderBy: [
        { severity: 'desc' },
        { hitCount: 'desc' },
      ],
    })
  }

  // Fixed typo: getModerrationQueue -> getModerationQueue
  async getModerationQueue(params: {
    limit?: number
    cursor?: string
    entityType?: string
    reviewPriority?: number
  }) {
    const { limit = 20, cursor, entityType, reviewPriority } = params

    const where: any = {
      humanReviewRequired: true,
      reviewedBy: null,
    }

    if (entityType) {
      where.entityType = entityType
    }

    if (reviewPriority !== undefined) {
      where.reviewPriority = reviewPriority
    }

    const items = await this.db.aiModerationQueue.findMany({
      where,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: [
        { reviewPriority: 'desc' },
        { createdAt: 'asc' },
      ],
    })

    let nextCursor: string | undefined = undefined
    if (items.length > limit) {
      const nextItem = items.pop()
      nextCursor = nextItem!.id
    }

    return {
      items,
      nextCursor,
    }
  }

  async getModerationStats() {
    const [
      pendingCount,
      reviewedToday,
      autoBlockedToday,
      averageReviewTime,
    ] = await Promise.all([
      this.db.aiModerationQueue.count({
        where: {
          humanReviewRequired: true,
          reviewedBy: null,
        },
      }),
      this.db.aiModerationQueue.count({
        where: {
          reviewedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      this.db.aiModerationQueue.count({
        where: {
          autoActionTaken: 'blocked',
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      this.db.$queryRaw<[{ avg: number }]>`
        SELECT AVG(EXTRACT(EPOCH FROM ("reviewedAt" - "createdAt"))) as avg
        FROM "ai_moderation_queue"
        WHERE "reviewedAt" IS NOT NULL
        AND "createdAt" >= NOW() - INTERVAL '7 days'
      `.then(result => result[0]?.avg || 0),
    ])

    return {
      pendingCount,
      reviewedToday,
      autoBlockedToday,
      averageReviewTime: Math.round(averageReviewTime),
    }
  }

  async getAISettings(): Promise<AISettings> {
    return this.aiSettings
  }

  async updateAISettings(settings: Partial<AISettings>, updatedBy: string): Promise<AISettings> {
    this.aiSettings = {
      ...this.aiSettings,
      ...settings,
    }

    // Save to database
    await this.db.siteSetting.upsert({
      where: { key: 'ai_moderation_settings' },
      create: {
        key: 'ai_moderation_settings',
        value: this.aiSettings as any,
        description: 'AI moderation configuration',
        createdBy: updatedBy,
        updatedBy,
      },
      update: {
        value: this.aiSettings as any,
        updatedBy,
        updatedAt: new Date(),
      },
    })

    return this.aiSettings
  }
}
