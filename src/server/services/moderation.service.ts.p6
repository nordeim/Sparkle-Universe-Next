// src/server/services/moderation.service.ts
import { PrismaClient, ModerationStatus } from '@prisma/client'

interface ModerationResult {
  shouldBlock: boolean
  requiresReview: boolean
  confidence: number
  reasons: string[]
  score: number
}

export class ModerationService {
  private bannedWords: Set<string>
  private suspiciousPatterns: RegExp[]

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

    // TODO: Integrate with AI moderation service
    // const aiResult = await this.checkWithAI(content)
    // if (aiResult.score > 0.8) {
    //   result.shouldBlock = true
    //   result.reasons.push('AI flagged')
    //   result.score += aiResult.score * 20
    // }

    return result
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

    return { success: true }
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

  async getModerrationQueue(params: {
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
}
