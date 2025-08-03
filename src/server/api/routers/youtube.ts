// src/server/api/routers/youtube.ts
import { z } from 'zod'
import { 
  createTRPCRouter, 
  publicProcedure, 
  protectedProcedure 
} from '@/server/api/trpc'
import { YouTubeService } from '@/server/services/youtube.service'
import { WatchPartyService } from '@/server/services/watch-party.service'

export const youtubeRouter = createTRPCRouter({
  // Get video details
  getVideo: publicProcedure
    .input(z.object({
      videoId: z.string().regex(/^[a-zA-Z0-9_-]{11}$/),
    }))
    .query(async ({ ctx, input }) => {
      const youtubeService = new YouTubeService(ctx.db)
      return youtubeService.getVideoDetails(input.videoId)
    }),

  // Sync YouTube channel
  syncChannel: protectedProcedure
    .input(z.object({
      channelId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const youtubeService = new YouTubeService(ctx.db)
      return youtubeService.syncChannel(
        input.channelId,
        ctx.session.user.id
      )
    }),

  // Create watch party
  createWatchParty: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(200),
      description: z.string().optional(),
      youtubeVideoId: z.string().regex(/^[a-zA-Z0-9_-]{11}$/),
      scheduledStart: z.date(),
      maxParticipants: z.number().min(2).max(100).default(50),
      isPublic: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      const watchPartyService = new WatchPartyService(ctx.db)
      return watchPartyService.createWatchParty({
        ...input,
        hostId: ctx.session.user.id,
      })
    }),

  // Join watch party
  joinWatchParty: protectedProcedure
    .input(z.object({
      partyId: z.string().cuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const watchPartyService = new WatchPartyService(ctx.db)
      return watchPartyService.joinParty(
        input.partyId,
        ctx.session.user.id
      )
    }),

  // Get upcoming watch parties
  getUpcomingParties: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(10),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const watchPartyService = new WatchPartyService(ctx.db)
      return watchPartyService.getUpcomingParties(input)
    }),

  // Get trending videos
  getTrendingVideos: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(20).default(10),
    }))
    .query(async ({ ctx, input }) => {
      const youtubeService = new YouTubeService(ctx.db)
      return youtubeService.getTrendingVideos(input.limit)
    }),

  // Create video clip
  createClip: protectedProcedure
    .input(z.object({
      youtubeVideoId: z.string().regex(/^[a-zA-Z0-9_-]{11}$/),
      title: z.string().min(1).max(100),
      description: z.string().optional(),
      startTime: z.number().min(0),
      endTime: z.number().min(1),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const youtubeService = new YouTubeService(ctx.db)
      return youtubeService.createVideoClip({
        ...input,
        creatorId: ctx.session.user.id,
      })
    }),

  // Get video analytics
  getVideoAnalytics: publicProcedure
    .input(z.object({
      videoId: z.string().regex(/^[a-zA-Z0-9_-]{11}$/),
    }))
    .query(async ({ ctx, input }) => {
      const youtubeService = new YouTubeService(ctx.db)
      return youtubeService.getVideoAnalytics(input.videoId)
    }),
})
