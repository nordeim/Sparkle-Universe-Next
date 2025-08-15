// src/server/services/moderation.service.ts
import { PrismaClient } from '@prisma/client'

interface ModerationResult {
  shouldBlock: boolean
  requiresReview: boolean
  reasons: string[]
  score: number
}

export class ModerationService {
  constructor(private db: PrismaClient) {}

  async checkContent(content: string, type: 'post' | 'comment'): Promise<ModerationResult> {
    const result: ModerationResult = {
      shouldBlock: false,
      requiresReview: false,
      reasons: [],
      score: 0,
    }

    // Check against content filters
    const filters = await this.db.contentFilter.findMany({
      where: { isActive: true },
    })

    for (const filter of filters) {
      const regex = new RegExp(filter.pattern, 'gi')
      if (regex.test(content)) {
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

    // Check content length (spam detection)
    if (content.length > 10000) {
      result.requiresReview = true
      result.reasons.push('excessive length')
    }

    // Check for repeated characters (spam)
    const repeatedChars = /(.)\1{9,}/g
    if (repeatedChars.test(content)) {
      result.requiresReview = true
      result.reasons.push('repeated characters')
    }

    // Check for excessive caps
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length
    if (capsRatio > 0.7 && content.length > 10) {
      result.requiresReview = true
      result.reasons.push('excessive caps')
    }

    // Check for links (could be spam)
    const linkCount = (content.match(/https?:\/\//g) || []).length
    if (linkCount > 3) {
      result.requiresReview = true
      result.reasons.push('multiple links')
    }

    // TODO: Integrate with AI moderation service
    // const aiResult = await this.checkWithAI(content)
    // if (aiResult.score > 0.8) {
    //   result.shouldBlock = true
    //   result.reasons.push('AI flagged')
    // }

    return result
  }

  async reviewContent(entityId: string, entityType: string, reviewerId: string, decision: 'approve' | 'reject') {
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
        humanReviewRequired: false,
      },
    })

    // Update entity moderation status
    const table = entityType === 'post' ? this.db.post : this.db.comment
    await table.update({
      where: { id: entityId },
      data: {
        moderationStatus: decision === 'approve' ? 'APPROVED' : 'REJECTED',
      },
    })
  }
}
