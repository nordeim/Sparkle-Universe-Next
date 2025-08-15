// src/server/api/routers/youtube.ts
import { z } from 'zod'
import { 
  createTRPCRouter, 
  publicProcedure, 
  protectedProcedure 
} from '@/server/api/trpc'
import { YouTubeService } from '@/server/services/youtube.service'
import { WatchPartyService } from '@/server/services/watch-party.service'
import { TRPCError } from '@trpc/server'

export const youtubeRouter = createTRPCRouter({
  // Get video details
  getVideo: publicProcedure
    .input(z.object({
      videoId: z.string().regex(/^[a-zA-Z0-9_-]{11}$/),
      includeAnalytics: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const youtubeService = new YouTubeService(ctx.db)
      const video = await youtubeService.getVideoDetails(input.videoId)
      
      if (input.includeAnalytics) {
        const analytics = await youtubeService.getVideoAnalytics(input.videoId)
        return { ...video, analytics }
      }
      
      return video
    }),

  // Get channel details
  getChannel: publicProcedure
    .input(z.object({
      channelId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const youtubeService = new YouTubeService(ctx.db)
      return youtubeService.getChannelDetails(input.channelId)
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

  // Search videos
  searchVideos: publicProcedure
    .input(z.object({
      query: z.string().min(1),
      maxResults: z.number().min(1).max(50).optional(),
      order: z.enum(['relevance', 'date', 'viewCount', 'rating']).optional(),
      channelId: z.string().optional(),
      videoDuration: z.enum(['short', 'medium', 'long']).optional(),
      pageToken: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const youtubeService = new YouTubeService(ctx.db)
      return youtubeService.searchVideos(input.query, input)
    }),

  // Get channel videos
  getChannelVideos: publicProcedure
    .input(z.object({
      channelId: z.string(),
      maxResults: z.number().min(1).max(50).optional(),
      order: z.enum(['date', 'viewCount']).optional(),
      pageToken: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const youtubeService = new YouTubeService(ctx.db)
      return youtubeService.getChannelVideos(input.channelId, input)
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
      requiresApproval: z.boolean().default(false),
      chatEnabled: z.boolean().default(true),
      syncPlayback: z.boolean().default(true),
      tags: z.array(z.string()).optional(),
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

  // Leave watch party
  leaveWatchParty: protectedProcedure
    .input(z.object({
      partyId: z.string().cuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const watchPartyService = new WatchPartyService(ctx.db)
      return watchPartyService.leaveParty(
        input.partyId,
        ctx.session.user.id
      )
    }),

  // Get watch party details
  getWatchParty: publicProcedure
    .input(z.object({
      partyId: z.string().cuid(),
    }))
    .query(async ({ ctx, input }) => {
      const watchPartyService = new WatchPartyService(ctx.db)
      return watchPartyService.getPartyDetails(input.partyId)
    }),

  // Get upcoming watch parties
  getUpcomingParties: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(10),
      cursor: z.string().optional(),
      onlyPublic: z.boolean().default(true),
    }))
    .query(async ({ ctx, input }) => {
      const watchPartyService = new WatchPartyService(ctx.db)
      return watchPartyService.getUpcomingParties(input)
    }),

  // Get user's watch parties
  getUserParties: protectedProcedure
    .input(z.object({
      userId: z.string().optional(),
      includeEnded: z.boolean().default(false),
      limit: z.number().min(1).max(50).default(10),
    }))
    .query(async ({ ctx, input }) => {
      const userId = input.userId || ctx.session.user.id
      const watchPartyService = new WatchPartyService(ctx.db)
      return watchPartyService.getUserParties(userId, input)
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

  // Get video clips
  getVideoClips: publicProcedure
    .input(z.object({
      videoId: z.string().regex(/^[a-zA-Z0-9_-]{11}$/),
      limit: z.number().min(1).max(50).default(10),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const youtubeService = new YouTubeService(ctx.db)
      return youtubeService.getVideoClips(input.videoId, input)
    }),

  // Get user's clips
  getUserClips: publicProcedure
    .input(z.object({
      userId: z.string(),
      limit: z.number().min(1).max(50).default(10),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const youtubeService = new YouTubeService(ctx.db)
      return youtubeService.getUserClips(input.userId, input)
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

  // Get video analytics
  getVideoAnalytics: publicProcedure
    .input(z.object({
      videoId: z.string().regex(/^[a-zA-Z0-9_-]{11}$/),
    }))
    .query(async ({ ctx, input }) => {
      const youtubeService = new YouTubeService(ctx.db)
      return youtubeService.getVideoAnalytics(input.videoId)
    }),

  // Update video analytics
  updateVideoAnalytics: protectedProcedure
    .input(z.object({
      videoId: z.string().regex(/^[a-zA-Z0-9_-]{11}$/),
      watchTime: z.number().optional(),
      engagementType: z.enum(['view', 'clip', 'share', 'discussion']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const youtubeService = new YouTubeService(ctx.db)
      return youtubeService.updateVideoAnalytics(
        input.videoId,
        ctx.session.user.id,
        input
      )
    }),

  // Get remaining API quota
  getQuota: protectedProcedure
    .query(async ({ ctx }) => {
      const youtubeService = new YouTubeService(ctx.db)
      const remaining = await youtubeService.getRemainingQuota()
      return {
        remaining,
        limit: 10000,
        percentage: (remaining / 10000) * 100,
      }
    }),
})
