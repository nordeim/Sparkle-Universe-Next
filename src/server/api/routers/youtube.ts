// src/server/api/routers/youtube.ts
import { z } from 'zod'
import { 
  createTRPCRouter, 
  publicProcedure, 
  protectedProcedure 
} from '@/server/api/trpc'
import { YouTubeService } from '@/server/services/youtube.service'

export const youtubeRouter = createTRPCRouter({
  // Get video details
  getVideo: publicProcedure
    .input(z.object({
      videoId: z.string().regex(/^[a-zA-Z0-9_-]{11}$/),
    }))
    .query(async ({ input }) => {
      const youtubeService = new YouTubeService()
      return youtubeService.getVideoDetails(input.videoId)
    }),

  // Get channel details
  getChannel: publicProcedure
    .input(z.object({
      channelId: z.string(),
    }))
    .query(async ({ input }) => {
      const youtubeService = new YouTubeService()
      return youtubeService.getChannelDetails(input.channelId)
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
    .query(async ({ input }) => {
      const youtubeService = new YouTubeService()
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
    .query(async ({ input }) => {
      const youtubeService = new YouTubeService()
      return youtubeService.getChannelVideos(input.channelId, input)
    }),

  // Get remaining API quota
  getQuota: protectedProcedure
    .query(async () => {
      const youtubeService = new YouTubeService()
      const remaining = await youtubeService.getRemainingQuota()
      return {
        remaining,
        limit: 10000,
        percentage: (remaining / 10000) * 100,
      }
    }),
})
