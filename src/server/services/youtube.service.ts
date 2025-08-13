// src/server/services/youtube.service.ts
import { PrismaClient } from '@prisma/client'
import { google, youtube_v3 } from 'googleapis'
import { TRPCError } from '@trpc/server'
import { CacheService, CacheType } from './cache.service'
import { ActivityService } from './activity.service'

export class YouTubeService {
  private cacheService: CacheService
  private activityService: ActivityService
  private youtube: youtube_v3.Youtube
  private apiKey: string

  constructor(private db: PrismaClient) {
    this.cacheService = new CacheService()
    this.activityService = new ActivityService(db)
    this.apiKey = process.env.YOUTUBE_API_KEY!
    
    this.youtube = google.youtube({
      version: 'v3',
      auth: this.apiKey,
    })
  }

  async getVideoDetails(videoId: string) {
    // Check cache first
    const cacheKey = `youtube:video:${videoId}`
    const cached = await this.cacheService.get(cacheKey)
    if (cached) return cached

    try {
      // Check API quota
      await this.checkApiQuota()

      // Fetch from YouTube API
      const response = await this.youtube.videos.list({
        part: ['snippet', 'statistics', 'contentDetails'],
        id: [videoId],
      })

      if (!response.data.items || response.data.items.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Video not found',
        })
      }

      const video = response.data.items[0]
      const videoData = {
        id: video.id!,
        title: video.snippet?.title || '',
        description: video.snippet?.description || '',
        channelId: video.snippet?.channelId || '',
        channelTitle: video.snippet?.channelTitle || '',
        thumbnailUrl: video.snippet?.thumbnails?.high?.url || '',
        duration: this.parseDuration(video.contentDetails?.duration),
        viewCount: parseInt(video.statistics?.viewCount || '0'),
        likeCount: parseInt(video.statistics?.likeCount || '0'),
        commentCount: parseInt(video.statistics?.commentCount || '0'),
        publishedAt: video.snippet?.publishedAt,
        tags: video.snippet?.tags || [],
      }

      // Store in database
      await this.db.youtubeVideo.upsert({
        where: { videoId },
        create: {
          videoId,
          channelId: videoData.channelId,
          title: videoData.title,
          description: videoData.description,
          thumbnailUrl: videoData.thumbnailUrl,
          duration: videoData.duration,
          viewCount: BigInt(videoData.viewCount),
          likeCount: videoData.likeCount,
          commentCount: videoData.commentCount,
          publishedAt: videoData.publishedAt ? new Date(videoData.publishedAt) : undefined,
          metadata: video as any,
        },
        update: {
          title: videoData.title,
          viewCount: BigInt(videoData.viewCount),
          likeCount: videoData.likeCount,
          commentCount: videoData.commentCount,
          lastSyncedAt: new Date(),
          metadata: video as any,
        },
      })

      // Update API quota usage
      await this.incrementApiQuota(1)

      // Cache for 1 hour
      await this.cacheService.set(cacheKey, videoData, 3600)

      return videoData
    } catch (error) {
      console.error('Failed to fetch YouTube video:', error)
      
      // Try to get from database if API fails
      const dbVideo = await this.db.youtubeVideo.findUnique({
        where: { videoId },
      })
      
      if (dbVideo) {
        return {
          id: dbVideo.videoId,
          title: dbVideo.title || '',
          description: dbVideo.description || '',
          channelId: dbVideo.channelId,
          channelTitle: dbVideo.channelTitle || '',
          thumbnailUrl: dbVideo.thumbnailUrl || '',
          duration: dbVideo.duration,
          viewCount: Number(dbVideo.viewCount),
          likeCount: dbVideo.likeCount,
          commentCount: dbVideo.commentCount,
          publishedAt: dbVideo.publishedAt?.toISOString(),
        }
      }
      
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch video details',
      })
    }
  }

  async syncChannel(channelId: string, userId: string) {
    try {
      // Check API quota
      await this.checkApiQuota()

      // Fetch channel data
      const response = await this.youtube.channels.list({
        part: ['snippet', 'statistics', 'contentDetails'],
        id: [channelId],
      })

      if (!response.data.items || response.data.items.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Channel not found',
        })
      }

      const channel = response.data.items[0]
      
      // Store channel data
      const dbChannel = await this.db.youtubeChannel.upsert({
        where: { channelId },
        create: {
          channelId,
          userId,
          channelTitle: channel.snippet?.title || '',
          channelHandle: channel.snippet?.customUrl || null,
          channelDescription: channel.snippet?.description || null,
          thumbnailUrl: channel.snippet?.thumbnails?.high?.url || null,
          subscriberCount: BigInt(channel.statistics?.subscriberCount || '0'),
          viewCount: BigInt(channel.statistics?.viewCount || '0'),
          videoCount: parseInt(channel.statistics?.videoCount || '0'),
          channelData: channel as any,
          lastSyncedAt: new Date(),
        },
        update: {
          channelTitle: channel.snippet?.title || '',
          subscriberCount: BigInt(channel.statistics?.subscriberCount || '0'),
          viewCount: BigInt(channel.statistics?.viewCount || '0'),
          videoCount: parseInt(channel.statistics?.videoCount || '0'),
          channelData: channel as any,
          lastSyncedAt: new Date(),
        },
      })

      // Update user profile with channel
      await this.db.profile.update({
        where: { userId },
        data: {
          youtubeChannelId: channelId,
          youtubeChannelUrl: `https://youtube.com/channel/${channelId}`,
        },
      })

      // Update API quota
      await this.incrementApiQuota(1)

      // Track activity
      await this.activityService.trackActivity({
        userId,
        action: 'youtube.channel.synced',
        entityType: 'channel',
        entityId: channelId,
        entityData: {
          channelTitle: channel.snippet?.title,
          subscriberCount: channel.statistics?.subscriberCount,
        },
      })

      return dbChannel
    } catch (error) {
      console.error('Failed to sync YouTube channel:', error)
      throw error
    }
  }

  async createVideoClip(input: {
    youtubeVideoId: string
    title: string
    description?: string
    startTime: number
    endTime: number
    creatorId: string
    tags?: string[]
  }) {
    // Validate times
    if (input.endTime <= input.startTime) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'End time must be after start time',
      })
    }

    const duration = input.endTime - input.startTime
    if (duration > 300) { // 5 minutes max
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Clips cannot be longer than 5 minutes',
      })
    }

    // Get video details
    const video = await this.getVideoDetails(input.youtubeVideoId)

    // Create clip
    const clip = await this.db.videoClip.create({
      data: {
        youtubeVideoId: input.youtubeVideoId,
        creatorId: input.creatorId,
        title: input.title,
        description: input.description,
        startTime: input.startTime,
        endTime: input.endTime,
        duration,
        thumbnailUrl: video.thumbnailUrl,
        tags: input.tags || [],
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            image: true,
          },
        },
      },
    })

    // Track activity
    await this.activityService.trackActivity({
      userId: input.creatorId,
      action: 'clip.created',
      entityType: 'clip',
      entityId: clip.id,
      entityData: {
        title: clip.title,
        videoId: input.youtubeVideoId,
      },
    })

    return clip
  }

  async getTrendingVideos(limit: number) {
    const cacheKey = `youtube:trending:${limit}`
    const cached = await this.cacheService.get(cacheKey, CacheType.TRENDING)
    if (cached) return cached

    // Get videos that have been shared/discussed recently
    const videos = await this.db.youtubeVideo.findMany({
      orderBy: [
        { viewCount: 'desc' },
        { publishedAt: 'desc' },
      ],
      take: limit,
      include: {
        _count: {
          select: {
            watchParties: true,
            clips: true,
          },
        },
      },
    })

    // Transform BigInt to number for JSON serialization
    const transformed = videos.map(v => ({
      ...v,
      viewCount: Number(v.viewCount),
      subscriberCount: v.subscriberCount ? Number(v.subscriberCount) : 0,
    }))

    await this.cacheService.set(cacheKey, transformed, undefined, CacheType.TRENDING)
    return transformed
  }

  async getVideoAnalytics(videoId: string) {
    const analytics = await this.db.videoAnalytics.findUnique({
      where: { videoId },
      include: {
        video: true,
      },
    })

    if (!analytics) {
      // Create default analytics
      return this.db.videoAnalytics.create({
        data: { 
          videoId,
          totalWatchTime: 0,
          uniqueViewers: 0,
          engagementRate: 0,
          averageWatchPercent: 0,
        },
        include: { video: true },
      })
    }

    return analytics
  }

  private parseDuration(duration?: string | null): number {
    if (!duration) return 0

    // Parse ISO 8601 duration (PT1H2M3S)
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return 0

    const hours = parseInt(match[1] || '0')
    const minutes = parseInt(match[2] || '0')
    const seconds = parseInt(match[3] || '0')

    return hours * 3600 + minutes * 60 + seconds
  }

  private async checkApiQuota() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const quota = await this.db.youTubeApiQuota.findUnique({
      where: { date: today },
    })

    const quotaLimit = parseInt(process.env.YOUTUBE_QUOTA_LIMIT || '10000')

    if (quota && quota.unitsUsed >= quotaLimit) {
      throw new TRPCError({
        code: 'RESOURCE_EXHAUSTED',
        message: 'YouTube API quota exceeded for today',
      })
    }

    return quota
  }

  private async incrementApiQuota(units: number) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const quotaLimit = parseInt(process.env.YOUTUBE_QUOTA_LIMIT || '10000')

    await this.db.youTubeApiQuota.upsert({
      where: { date: today },
      create: {
        date: today,
        unitsUsed: units,
        quotaLimit,
        readRequests: 1,
        writeRequests: 0,
        resetAt: tomorrow,
      },
      update: {
        unitsUsed: { increment: units },
        readRequests: { increment: 1 },
      },
    })
  }
}
