// src/server/services/watch-party.service.ts
import { PrismaClient, EventStatus } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { NotificationService } from './notification.service'
import { generateSecureToken } from '@/lib/security'

export class WatchPartyService {
  private notificationService: NotificationService

  constructor(private db: PrismaClient) {
    this.notificationService = new NotificationService(db)
  }

  async createWatchParty(input: {
    title: string
    description?: string
    youtubeVideoId: string
    scheduledStart: Date
    maxParticipants: number
    isPublic: boolean
    hostId: string
  }) {
    // Generate unique party code
    const partyCode = generateSecureToken(6).toUpperCase()

    const watchParty = await this.db.watchParty.create({
      data: {
        ...input,
        partyCode,
        youtubeVideoUrl: `https://youtube.com/watch?v=${input.youtubeVideoId}`,
        currentParticipants: 1, // Host counts as participant
      },
      include: {
        host: {
          include: {
            profile: true,
          },
        },
        video: true,
      },
    })

    // Add host as participant
    await this.db.watchPartyParticipant.create({
      data: {
        partyId: watchParty.id,
        userId: input.hostId,
        role: 'host',
      },
    })

    // Notify followers if public
    if (input.isPublic) {
      const followers = await this.db.follow.findMany({
        where: { followingId: input.hostId },
        select: { followerId: true },
      })

      for (const follower of followers) {
        await this.notificationService.createNotification({
          type: 'WATCH_PARTY_INVITE',
          userId: follower.followerId,
          actorId: input.hostId,
          entityId: watchParty.id,
          entityType: 'watchParty',
          title: 'Watch Party Starting Soon',
          message: `is hosting "${watchParty.title}"`,
          actionUrl: `/watch-party/${watchParty.id}`,
        })
      }
    }

    return watchParty
  }

  async joinParty(partyId: string, userId: string) {
    const party = await this.db.watchParty.findUnique({
      where: { id: partyId },
      include: { participants: true },
    })

    if (!party) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Watch party not found',
      })
    }

    if (party.currentParticipants >= party.maxParticipants) {
      throw new TRPCError({
        code: 'RESOURCE_EXHAUSTED',
        message: 'Watch party is full',
      })
    }

    // Check if already participant
    const existing = party.participants.find(p => p.userId === userId)
    if (existing) {
      return existing
    }

    // Add participant
    const participant = await this.db.watchPartyParticipant.create({
      data: {
        partyId,
        userId,
        role: 'viewer',
      },
    })

    // Update participant count
    await this.db.watchParty.update({
      where: { id: partyId },
      data: { currentParticipants: { increment: 1 } },
    })

    return participant
  }

  async getUpcomingParties(params: {
    limit: number
    cursor?: string
  }) {
    const parties = await this.db.watchParty.findMany({
      where: {
        isPublic: true,
        scheduledStart: { gte: new Date() },
        cancelledAt: null,
      },
      take: params.limit + 1,
      cursor: params.cursor ? { id: params.cursor } : undefined,
      orderBy: { scheduledStart: 'asc' },
      include: {
        host: {
          include: {
            profile: true,
          },
        },
        video: true,
        _count: {
          select: {
            participants: true,
          },
        },
      },
    })

    let nextCursor: string | undefined = undefined
    if (parties.length > params.limit) {
      const nextItem = parties.pop()
      nextCursor = nextItem!.id
    }

    return {
      items: parties,
      nextCursor,
    }
  }
}
