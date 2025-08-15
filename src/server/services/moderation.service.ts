// src/server/services/moderation.service.ts
import { PrismaClient, ModerationStatus } from '@prisma/client'

interface ModerationResult {
  shouldBlock: boolean
  requiresReview: boolean
  confidence: number
  reasons?: string[]
}

export class ModerationService {
  private bannedWords: Set<string>
  private suspiciousPatterns: RegExp[]

  constructor(private db: PrismaClient) {
    // Initialize with basic word list (expand as needed)
    this.bannedWords = new Set([
      // Add banned words here
    ])

    this.suspiciousPatterns = [
      /\b(?:buy|sell|discount|free|click here|limited time)\b/gi,
      /\b(?:www\.|https?:\/\/)[^\s]+/gi, // URLs
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, // Emails
      /\b\d{3,}\s?\d{3,}\s?\d{4,}\b/g, // Phone numbers
    ]
  }

  async checkContent(content: string, type: 'post' | 'comment' | 'message'): Promise<ModerationResult> {
    const reasons: string[] = []
    let score = 0

    // Check for banned words
    const lowerContent = content.toLowerCase()
    for (const word of this.bannedWords) {
      if (lowerContent.includes(word)) {
        reasons.push(`Contains banned word: ${word}`)
        score += 10
      }
    }

    // Check for suspicious patterns
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(content)) {
        reasons.push('Contains suspicious pattern')
        score += 5
      }
    }

    // Check for excessive caps
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length
    if (capsRatio > 0.7 && content.length > 10) {
      reasons.push('Excessive capitalization')
      score += 3
    }

    // Check for repeated characters
    if (/(.)\1{5,}/g.test(content)) {
      reasons.push('Excessive character repetition')
      score += 2
    }

    // Check against content filters in database
    const filters = await this.db.contentFilter.findMany({
      where: { isActive: true },
    })

    for (const filter of filters) {
      if (filter.filterType === 'keyword' && content.includes(filter.pattern)) {
        reasons.push(`Matched filter: ${filter.category}`)
        score += filter.severity * 2
      } else if (filter.filterType === 'regex') {
        try {
          const regex = new RegExp(filter.pattern, 'gi')
          if (regex.test(content)) {
            reasons.push(`Matched filter: ${filter.category}`)
            score += filter.severity * 2
          }
        } catch (e) {
          // Invalid regex, skip
        }
      }
    }

    // Determine action based on score
    const shouldBlock = score >= 20
    const requiresReview = score >= 10 && score < 20
    const confidence = Math.min(score / 30, 1) // Normalize to 0-1

    // Log to AI moderation queue if needed
    if (requiresReview || shouldBlock) {
      await this.db.aiModerationQueue.create({
        data: {
          entityType: type,
          entityId: '', // Will be filled by caller
          content,
          aiScore: confidence,
          aiReasons: reasons,
          confidence,
          humanReviewRequired: requiresReview,
          autoActionTaken: shouldBlock ? 'blocked' : 'flagged',
          reviewPriority: shouldBlock ? 2 : 1,
        },
      })
    }

    return {
      shouldBlock,
      requiresReview,
      confidence,
      reasons: reasons.length > 0 ? reasons : undefined,
    }
  }

  async reviewContent(entityId: string, reviewerId: string, decision: 'approve' | 'reject' | 'escalate') {
    const queueItem = await this.db.aiModerationQueue.findFirst({
      where: {
        entityId,
        reviewedBy: null,
      },
    })

    if (!queueItem) {
      return { success: false, message: 'Item not found in moderation queue' }
    }

    await this.db.aiModerationQueue.update({
      where: { id: queueItem.id },
      data: {
        reviewedBy: reviewerId,
        reviewDecision: decision,
        reviewedAt: new Date(),
      },
    })

    // Update the content's moderation status
    const moderationStatus = 
      decision === 'approve' ? ModerationStatus.APPROVED :
      decision === 'reject' ? ModerationStatus.REJECTED :
      ModerationStatus.ESCALATED

    // Update based on entity type
    if (queueItem.entityType === 'post') {
      await this.db.post.update({
        where: { id: entityId },
        data: { moderationStatus },
      })
    } else if (queueItem.entityType === 'comment') {
      await this.db.comment.update({
        where: { id: entityId },
        data: { moderationStatus },
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

  async removeContentFilter(filterId: string) {
    return this.db.contentFilter.update({
      where: { id: filterId },
      data: { isActive: false },
    })
  }

  async getContentFilters() {
    return this.db.contentFilter.findMany({
      where: { isActive: true },
      orderBy: { severity: 'desc' },
    })
  }
}
