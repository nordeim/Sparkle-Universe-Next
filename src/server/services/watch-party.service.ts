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
    const partyCode = generateSecureToken(6).toUpperCase()

    const watchParty = await this.db.watchParty.create({
      data: {
        ...input,
        partyCode,
        youtubeVideoUrl: `https://youtube.com/watch?v=${input.youtubeVideoId}`,
        currentParticipants: 1,
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

    await this.db.watchPartyParticipant.create({
      data: {
        partyId: watchParty.id,
        userId: input.hostId,
        role: 'host',
      },
    })

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

    const existing = party.participants.find(p => p.userId === userId)
    if (existing) {
      return existing
    }

    const participant = await this.db.watchPartyParticipant.create({
      data: {
        partyId,
        userId,
        role: 'viewer',
      },
    })

    await this.db.watchParty.update({
      where: { id: partyId },
      data: { currentParticipants: { increment: 1 } },
    })

    return participant
  }

  async leaveParty(partyId: string, userId: string) {
    const participant = await this.db.watchPartyParticipant.findFirst({
      where: {
        partyId,
        userId,
        isActive: true,
      },
    })

    if (!participant) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Not in this watch party',
      })
    }

    await this.db.watchPartyParticipant.update({
      where: { id: participant.id },
      data: {
        isActive: false,
        leftAt: new Date(),
      },
    })

    await this.db.watchParty.update({
      where: { id: partyId },
      data: {
        currentParticipants: { decrement: 1 },
      },
    })

    return { success: true }
  }

  async getPartyDetails(partyId: string) {
    const party = await this.db.watchParty.findUnique({
      where: { id: partyId },
      include: {
        host: {
          select: {
            id: true,
            username: true,
            image: true,
          },
        },
        video: true,
        participants: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: {
            chat: true,
          },
        },
      },
    })

    if (!party) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Watch party not found',
      })
    }

    return party
  }

  async getUserParties(userId: string, input: {
    includeEnded: boolean
    limit: number
  }) {
    const where: any = {
      OR: [
        { hostId: userId },
        {
          participants: {
            some: {
              userId,
            },
          },
        },
      ],
      deleted: false,
    }

    if (!input.includeEnded) {
      where.endedAt = null
    }

    const parties = await this.db.watchParty.findMany({
      where,
      include: {
        host: {
          select: {
            id: true,
            username: true,
            image: true,
          },
        },
        video: true,
        _count: {
          select: {
            participants: true,
          },
        },
      },
      orderBy: {
        scheduledStart: 'desc',
      },
      take: input.limit,
    })

    return parties
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
