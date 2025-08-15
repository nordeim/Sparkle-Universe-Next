// src/server/services/watchparty.service.ts
import { PrismaClient, EventStatus } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { eventService } from './event.service'
import { NotificationService } from './notification.service'
import { v4 as uuidv4 } from 'uuid'

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
    maxParticipants?: number
    isPublic?: boolean
    requiresApproval?: boolean
    tags?: string[]
    hostId: string
  }) {
    // Validate video exists
    const video = await this.db.youtubeVideo.findUnique({
      where: { videoId: input.youtubeVideoId },
    })

    if (!video) {
      // Try to fetch from YouTube service
      // This would be imported from youtube.service.ts
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Video not found',
      })
    }

    // Generate party code
    const partyCode = this.generatePartyCode()

    // Create watch party
    const watchParty = await this.db.watchParty.create({
      data: {
        title: input.title,
        description: input.description,
        youtubeVideoId: input.youtubeVideoId,
        youtubeVideoUrl: `https://youtube.com/watch?v=${input.youtubeVideoId}`,
        scheduledStart: input.scheduledStart,
        maxParticipants: input.maxParticipants || 50,
        isPublic: input.isPublic ?? true,
        requiresApproval: input.requiresApproval ?? false,
        tags: input.tags || [],
        partyCode,
        hostId: input.hostId,
      },
      include: {
        host: {
          select: {
            id: true,
            username: true,
            image: true,
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

    // Create event
    await this.db.event.create({
      data: {
        title: `Watch Party: ${input.title}`,
        slug: `watch-party-${watchParty.id}`,
        description: input.description,
        type: 'WATCH_PARTY',
        status: EventStatus.SCHEDULED,
        hostId: input.hostId,
        isVirtual: true,
        virtualPlatform: 'YouTube',
        virtualLink: `/watch-party/${watchParty.id}`,
        startTime: input.scheduledStart,
        endTime: new Date(input.scheduledStart.getTime() + (video.duration || 7200) * 1000),
        maxAttendees: input.maxParticipants,
        isPublic: input.isPublic ?? true,
        requiresApproval: input.requiresApproval ?? false,
        tags: input.tags || [],
      },
    })

    return watchParty
  }

  async joinWatchParty(partyId: string, userId: string) {
    const party = await this.db.watchParty.findUnique({
      where: { id: partyId },
      include: {
        participants: {
          where: { userId },
        },
        _count: {
          select: { participants: true },
        },
      },
    })

    if (!party) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Watch party not found',
      })
    }

    if (party.endedAt) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Watch party has ended',
      })
    }

    if (party.cancelledAt) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Watch party was cancelled',
      })
    }

    // Check if already a participant
    if (party.participants.length > 0) {
      return party.participants[0]
    }

    // Check max participants
    if (party.maxParticipants && party._count.participants >= party.maxParticipants) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Watch party is full',
      })
    }

    // Check if approval required
    if (party.requiresApproval && party.hostId !== userId) {
      // Create pending participant
      const participant = await this.db.watchPartyParticipant.create({
        data: {
          partyId,
          userId,
          role: 'viewer',
          isActive: false, // Pending approval
        },
      })

      // Notify host
      await this.notificationService.createNotification({
        type: 'WATCH_PARTY_INVITE',
        userId: party.hostId,
        actorId: userId,
        entityId: partyId,
        entityType: 'watchParty',
        title: 'Watch party join request',
        message: 'requested to join your watch party',
      })

      return participant
    }

    // Create participant
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

    // Emit event
    eventService.emit('watchParty:userJoined', {
      partyId,
      userId,
    })

    return participant
  }

  async leaveWatchParty(partyId: string, userId: string) {
    const participant = await this.db.watchPartyParticipant.findFirst({
      where: { partyId, userId },
    })

    if (!participant) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Not a participant',
      })
    }

    // Update participant
    await this.db.watchPartyParticipant.update({
      where: { id: participant.id },
      data: {
        isActive: false,
        leftAt: new Date(),
      },
    })

    // Update participant count
    await this.db.watchParty.update({
      where: { id: partyId },
      data: { currentParticipants: { decrement: 1 } },
    })

    // Emit event
    eventService.emit('watchParty:userLeft', {
      partyId,
      userId,
    })

    return { success: true }
  }

  async startWatchParty(partyId: string, hostId: string) {
    const party = await this.db.watchParty.findUnique({
      where: { id: partyId },
    })

    if (!party) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Watch party not found',
      })
    }

    if (party.hostId !== hostId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only the host can start the party',
      })
    }

    if (party.actualStart) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Watch party already started',
      })
    }

    // Update party
    const updatedParty = await this.db.watchParty.update({
      where: { id: partyId },
      data: { actualStart: new Date() },
    })

    // Update event
    await this.db.event.updateMany({
      where: {
        virtualLink: `/watch-party/${partyId}`,
      },
      data: {
        status: EventStatus.LIVE,
      },
    })

    // Notify participants
    const participants = await this.db.watchPartyParticipant.findMany({
      where: { partyId, userId: { not: hostId } },
      select: { userId: true },
    })

    for (const participant of participants) {
      await this.notificationService.createNotification({
        type: 'WATCH_PARTY_INVITE',
        userId: participant.userId,
        actorId: hostId,
        entityId: partyId,
        entityType: 'watchParty',
        title: 'Watch party started',
        message: 'The watch party has started!',
        actionUrl: `/watch-party/${partyId}`,
      })
    }

    // Emit event
    eventService.emit('watchParty:started', {
      partyId,
    })

    return updatedParty
  }

  async endWatchParty(partyId: string, hostId: string) {
    const party = await this.db.watchParty.findUnique({
      where: { id: partyId },
    })

    if (!party) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Watch party not found',
      })
    }

    if (party.hostId !== hostId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only the host can end the party',
      })
    }

    // Update party
    const updatedParty = await this.db.watchParty.update({
      where: { id: partyId },
      data: { endedAt: new Date() },
    })

    // Update all active participants
    await this.db.watchPartyParticipant.updateMany({
      where: { partyId, isActive: true },
      data: {
        isActive: false,
        leftAt: new Date(),
      },
    })

    // Update event
    await this.db.event.updateMany({
      where: {
        virtualLink: `/watch-party/${partyId}`,
      },
      data: {
        status: EventStatus.ENDED,
      },
    })

    // Emit event
    eventService.emit('watchParty:ended', {
      partyId,
    })

    return updatedParty
  }

  async getWatchParty(partyId: string) {
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
          orderBy: { joinedAt: 'asc' },
        },
        _count: {
          select: {
            participants: true,
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

  async listWatchParties(params: {
    upcoming?: boolean
    live?: boolean
    ended?: boolean
    hostId?: string
    limit?: number
    cursor?: string
  }) {
    const where: any = {}

    if (params.upcoming) {
      where.scheduledStart = { gt: new Date() }
      where.actualStart = null
    }

    if (params.live) {
      where.actualStart = { not: null }
      where.endedAt = null
    }

    if (params.ended) {
      where.endedAt = { not: null }
    }

    if (params.hostId) {
      where.hostId = params.hostId
    }

    const watchParties = await this.db.watchParty.findMany({
      where,
      take: (params.limit || 20) + 1,
      cursor: params.cursor ? { id: params.cursor } : undefined,
      include: {
        host: {
          select: {
            id: true,
            username: true,
            image: true,
          },
        },
        video: {
          select: {
            title: true,
            thumbnailUrl: true,
            duration: true,
          },
        },
        _count: {
          select: {
            participants: true,
          },
        },
      },
      orderBy: { scheduledStart: 'desc' },
    })

    let nextCursor: string | undefined = undefined
    if (watchParties.length > (params.limit || 20)) {
      const nextItem = watchParties.pop()
      nextCursor = nextItem!.id
    }

    return {
      items: watchParties,
      nextCursor,
    }
  }

  private generatePartyCode(): string {
    return uuidv4().substring(0, 8).toUpperCase()
  }
}
