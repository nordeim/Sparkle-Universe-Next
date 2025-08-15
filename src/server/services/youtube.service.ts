// src/server/services/youtube.service.ts
import { google, youtube_v3 } from 'googleapis'
import { PrismaClient } from '@prisma/client'
import { CacheService, CacheType } from './cache.service'
import { ActivityService } from './activity.service'
import { TRPCError } from '@trpc/server'

// YouTube API response types
interface VideoDetails {
  id: string
  title: string
  description: string
  thumbnail: string
  thumbnailHd?: string
  channelId: string
  channelTitle: string
  duration: number // in seconds
  durationFormatted: string
  viewCount: number
  likeCount: number
  commentCount: number
  publishedAt: string
  tags: string[]
  categoryId?: string
  liveBroadcast: boolean
  premiereDate?: string
  embedHtml?: string
}

interface ChannelDetails {
  id: string
  title: string
  description: string
  customUrl?: string
  thumbnail: string
  bannerUrl?: string
  subscriberCount: number
  videoCount: number
  viewCount: number
  createdAt: string
  country?: string
}

interface SearchResult {
  id: string
  title: string
  description: string
  thumbnail: string
  channelId: string
  channelTitle: string
  publishedAt: string
  duration?: number
  viewCount?: number
}

export class YouTubeService {
  private youtube: youtube_v3.Youtube
  private cacheService: CacheService
  private activityService: ActivityService
  private quotaLimit = 10000 // Daily quota limit
  private quotaCost = {
    search: 100,
    videos: 1,
    channels: 1,
    playlists: 1,
  }

  constructor(private db: PrismaClient) {
    this.youtube = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY,
    })
    this.cacheService = new CacheService()
    this.activityService = new ActivityService(db)
  }

  // Get video details
  async getVideoDetails(videoId: string): Promise<VideoDetails | null> {
    // Validate video ID
    if (!this.isValidVideoId(videoId)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid YouTube video ID',
      })
    }

    // Check cache
    const cacheKey = `youtube:video:${videoId}`
    const cached = await this.cacheService.get<VideoDetails>(cacheKey)
    if (cached) return cached

    try {
      // Check quota
      if (!await this.checkQuota(this.quotaCost.videos)) {
        // Try to get from database instead
        return this.getVideoFromDatabase(videoId)
      }

      const response = await this.youtube.videos.list({
        part: ['snippet', 'statistics', 'contentDetails', 'liveStreamingDetails'],
        id: [videoId],
      })

      const video = response.data.items?.[0]
      if (!video) {
        return null
      }

      const details: VideoDetails = {
        id: video.id!,
        title: video.snippet?.title || '',
        description: video.snippet?.description || '',
        thumbnail: this.getBestThumbnail(video.snippet?.thumbnails),
        thumbnailHd: video.snippet?.thumbnails?.maxres?.url || video.snippet?.thumbnails?.high?.url,
        channelId: video.snippet?.channelId || '',
        channelTitle: video.snippet?.channelTitle || '',
        duration: this.parseDuration(video.contentDetails?.duration),
        durationFormatted: this.formatDuration(video.contentDetails?.duration),
        viewCount: parseInt(video.statistics?.viewCount || '0'),
        likeCount: parseInt(video.statistics?.likeCount || '0'),
        commentCount: parseInt(video.statistics?.commentCount || '0'),
        publishedAt: video.snippet?.publishedAt || '',
        tags: video.snippet?.tags || [],
        categoryId: video.snippet?.categoryId,
        liveBroadcast: video.snippet?.liveBroadcastContent !== 'none',
        premiereDate: video.liveStreamingDetails?.scheduledStartTime,
      }

      // Cache for 1 hour
      await this.cacheService.set(cacheKey, details, 3600)

      // Store in database
      await this.storeVideoData(details)

      // Update quota usage
      await this.updateQuotaUsage(this.quotaCost.videos)

      return details
    } catch (error) {
      console.error('YouTube API error:', error)
      
      // Try to get from database as fallback
      return this.getVideoFromDatabase(videoId)
    }
  }

  // Get channel details
  async getChannelDetails(channelId: string): Promise<ChannelDetails | null> {
    // Check cache
    const cacheKey = `youtube:channel:${channelId}`
    const cached = await this.cacheService.get<ChannelDetails>(cacheKey)
    if (cached) return cached

    try {
      // Check quota
      if (!await this.checkQuota(this.quotaCost.channels)) {
        return this.getChannelFromDatabase(channelId)
      }

      const response = await this.youtube.channels.list({
        part: ['snippet', 'statistics', 'brandingSettings'],
        id: [channelId],
      })

      const channel = response.data.items?.[0]
      if (!channel) {
        return null
      }

      const details: ChannelDetails = {
        id: channel.id!,
        title: channel.snippet?.title || '',
        description: channel.snippet?.description || '',
        customUrl: channel.snippet?.customUrl,
        thumbnail: this.getBestThumbnail(channel.snippet?.thumbnails),
        bannerUrl: channel.brandingSettings?.image?.bannerExternalUrl,
        subscriberCount: parseInt(channel.statistics?.subscriberCount || '0'),
        videoCount: parseInt(channel.statistics?.videoCount || '0'),
        viewCount: parseInt(channel.statistics?.viewCount || '0'),
        createdAt: channel.snippet?.publishedAt || '',
        country: channel.snippet?.country,
      }

      // Cache for 24 hours
      await this.cacheService.set(cacheKey, details, 86400)

      // Store in database
      await this.storeChannelData(details)

      // Update quota usage
      await this.updateQuotaUsage(this.quotaCost.channels)

      return details
    } catch (error) {
      console.error('YouTube API error:', error)
      return this.getChannelFromDatabase(channelId)
    }
  }

  // Sync YouTube channel
  async syncChannel(channelId: string, userId: string) {
    try {
      const channel = await this.getChannelDetails(channelId)
      
      if (!channel) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Channel not found',
        })
      }

      // Update user profile with channel
      await this.db.profile.update({
        where: { userId },
        data: {
          youtubeChannelId: channelId,
          youtubeChannelUrl: `https://youtube.com/channel/${channelId}`,
          youtubeChannelData: channel as any,
        },
      })

      // Track activity
      await this.activityService.trackActivity({
        userId,
        action: 'youtube.channel.synced',
        entityType: 'channel',
        entityId: channelId,
        entityData: {
          channelTitle: channel.title,
          subscriberCount: channel.subscriberCount,
        },
      })

      return channel
    } catch (error) {
      console.error('Failed to sync YouTube channel:', error)
      throw error
    }
  }

  // Search videos
  async searchVideos(query: string, options: {
    maxResults?: number
    order?: 'relevance' | 'date' | 'viewCount' | 'rating'
    channelId?: string
    type?: 'video' | 'channel' | 'playlist'
    videoDuration?: 'short' | 'medium' | 'long'
    pageToken?: string
  } = {}): Promise<{
    items: SearchResult[]
    nextPageToken?: string
    totalResults: number
  }> {
    const {
      maxResults = 10,
      order = 'relevance',
      channelId,
      type = 'video',
      videoDuration,
      pageToken,
    } = options

    // Check cache for first page
    if (!pageToken) {
      const cacheKey = `youtube:search:${query}:${JSON.stringify(options)}`
      const cached = await this.cacheService.get(cacheKey)
      if (cached) return cached as any
    }

    try {
      // Check quota
      if (!await this.checkQuota(this.quotaCost.search)) {
        throw new TRPCError({
          code: 'RESOURCE_EXHAUSTED',
          message: 'YouTube API quota exceeded',
        })
      }

      const searchParams: any = {
        part: ['snippet'],
        q: query,
        type: [type],
        maxResults,
        order,
        pageToken,
      }

      if (channelId) {
        searchParams.channelId = channelId
      }

      if (videoDuration && type === 'video') {
        searchParams.videoDuration = videoDuration
      }

      const response = await this.youtube.search.list(searchParams)

      const items: SearchResult[] = (response.data.items || []).map(item => ({
        id: type === 'video' ? item.id?.videoId! : item.id?.channelId!,
        title: item.snippet?.title || '',
        description: item.snippet?.description || '',
        thumbnail: this.getBestThumbnail(item.snippet?.thumbnails),
        channelId: item.snippet?.channelId || '',
        channelTitle: item.snippet?.channelTitle || '',
        publishedAt: item.snippet?.publishedAt || '',
      }))

      // Get additional details for videos
      if (type === 'video' && items.length > 0) {
        const videoIds = items.map(item => item.id)
        const videoDetails = await this.getMultipleVideoDetails(videoIds)
        
        items.forEach((item, index) => {
          const details = videoDetails.find(v => v.id === item.id)
          if (details) {
            item.duration = details.duration
            item.viewCount = details.viewCount
          }
        })
      }

      const result = {
        items,
        nextPageToken: response.data.nextPageToken,
        totalResults: response.data.pageInfo?.totalResults || 0,
      }

      // Cache first page for 30 minutes
      if (!pageToken) {
        const cacheKey = `youtube:search:${query}:${JSON.stringify(options)}`
        await this.cacheService.set(cacheKey, result, 1800)
      }

      // Update quota usage
      await this.updateQuotaUsage(this.quotaCost.search)

      return result
    } catch (error) {
      console.error('YouTube search error:', error)
      throw error
    }
  }

  // Get channel videos
  async getChannelVideos(channelId: string, options: {
    maxResults?: number
    order?: 'date' | 'viewCount'
    pageToken?: string
  } = {}): Promise<{
    items: SearchResult[]
    nextPageToken?: string
  }> {
    return this.searchVideos('', {
      ...options,
      channelId,
      type: 'video',
    })
  }

  // Create video clip
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
    
    if (!video) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Video not found',
      })
    }

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
        thumbnailUrl: video.thumbnail,
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
        duration,
      },
    })

    // Update video analytics
    await this.updateVideoAnalytics(input.youtubeVideoId, input.creatorId, {
      engagementType: 'clip',
    })

    return clip
  }

  // Get video clips
  async getVideoClips(videoId: string, options: {
    limit?: number
    cursor?: string
  }) {
    const clips = await this.db.videoClip.findMany({
      where: { youtubeVideoId: videoId },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            image: true,
          },
        },
      },
      orderBy: [
        { featured: 'desc' },
        { viewCount: 'desc' },
        { createdAt: 'desc' },
      ],
      take: options.limit || 10,
      cursor: options.cursor ? { id: options.cursor } : undefined,
    })

    return {
      items: clips,
      nextCursor: clips.length === (options.limit || 10) 
        ? clips[clips.length - 1].id 
        : undefined,
    }
  }

  // Get user's clips
  async getUserClips(userId: string, options: {
    limit?: number
    cursor?: string
  }) {
    const clips = await this.db.videoClip.findMany({
      where: { creatorId: userId },
      include: {
        video: true,
      },
      orderBy: { createdAt: 'desc' },
      take: options.limit || 10,
      cursor: options.cursor ? { id: options.cursor } : undefined,
    })

    return {
      items: clips,
      nextCursor: clips.length === (options.limit || 10) 
        ? clips[clips.length - 1].id 
        : undefined,
    }
  }

  // Get trending videos
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
        analytics: true,
      },
    })

    // Transform BigInt to number for JSON serialization
    const transformed = videos.map(v => ({
      ...v,
      viewCount: Number(v.viewCount),
      subscriberCount: v.subscriberCount ? Number(v.subscriberCount) : 0,
      engagementScore: v.analytics?.engagementRate || 0,
      watchPartyCount: v._count.watchParties,
      clipCount: v._count.clips,
    }))

    await this.cacheService.set(cacheKey, transformed, 3600, CacheType.TRENDING)
    return transformed
  }

  // Get video analytics
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
          watchTime: BigInt(0),
          avgWatchTime: 0,
          completionRate: 0,
          engagementRate: 0,
          clipCount: 0,
          shareCount: 0,
          discussionCount: 0,
        },
        include: { video: true },
      })
    }

    return {
      ...analytics,
      watchTime: Number(analytics.watchTime),
    }
  }

  // Update video analytics
  async updateVideoAnalytics(
    videoId: string, 
    userId: string,
    data: {
      watchTime?: number
      engagementType?: 'view' | 'clip' | 'share' | 'discussion'
    }
  ) {
    // Ensure video exists in database
    await this.ensureVideoInDatabase(videoId)

    // Update analytics
    const analytics = await this.db.videoAnalytics.upsert({
      where: { videoId },
      create: {
        videoId,
        watchTime: BigInt(data.watchTime || 0),
        clipCount: data.engagementType === 'clip' ? 1 : 0,
        shareCount: data.engagementType === 'share' ? 1 : 0,
        discussionCount: data.engagementType === 'discussion' ? 1 : 0,
      },
      update: {
        watchTime: data.watchTime 
          ? { increment: BigInt(data.watchTime) }
          : undefined,
        clipCount: data.engagementType === 'clip' 
          ? { increment: 1 }
          : undefined,
        shareCount: data.engagementType === 'share'
          ? { increment: 1 }
          : undefined,
        discussionCount: data.engagementType === 'discussion'
          ? { increment: 1 }
          : undefined,
      },
    })

    // Track activity
    await this.activityService.trackActivity({
      userId,
      action: `video.${data.engagementType || 'view'}`,
      entityType: 'video',
      entityId: videoId,
      metadata: data,
    })

    return analytics
  }

  // Helper methods
  private isValidVideoId(videoId: string): boolean {
    return /^[a-zA-Z0-9_-]{11}$/.test(videoId)
  }

  private getBestThumbnail(thumbnails: any): string {
    if (!thumbnails) return ''
    
    return thumbnails.maxres?.url ||
           thumbnails.high?.url ||
           thumbnails.medium?.url ||
           thumbnails.default?.url ||
           ''
  }

  private parseDuration(duration?: string): number {
    if (!duration) return 0

    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return 0

    const hours = parseInt(match[1] || '0')
    const minutes = parseInt(match[2] || '0')
    const seconds = parseInt(match[3] || '0')

    return hours * 3600 + minutes * 60 + seconds
  }

  private formatDuration(duration?: string): string {
    const seconds = this.parseDuration(duration)
    
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  // Get multiple video details (batch request)
  private async getMultipleVideoDetails(videoIds: string[]): Promise<VideoDetails[]> {
    if (videoIds.length === 0) return []

    // Check quota
    if (!await this.checkQuota(this.quotaCost.videos)) {
      return []
    }

    try {
      const response = await this.youtube.videos.list({
        part: ['snippet', 'statistics', 'contentDetails'],
        id: videoIds,
        maxResults: 50,
      })

      return (response.data.items || []).map(video => ({
        id: video.id!,
        title: video.snippet?.title || '',
        description: video.snippet?.description || '',
        thumbnail: this.getBestThumbnail(video.snippet?.thumbnails),
        thumbnailHd: video.snippet?.thumbnails?.maxres?.url || video.snippet?.thumbnails?.high?.url,
        channelId: video.snippet?.channelId || '',
        channelTitle: video.snippet?.channelTitle || '',
        duration: this.parseDuration(video.contentDetails?.duration),
        durationFormatted: this.formatDuration(video.contentDetails?.duration),
        viewCount: parseInt(video.statistics?.viewCount || '0'),
        likeCount: parseInt(video.statistics?.likeCount || '0'),
        commentCount: parseInt(video.statistics?.commentCount || '0'),
        publishedAt: video.snippet?.publishedAt || '',
        tags: video.snippet?.tags || [],
        categoryId: video.snippet?.categoryId,
        liveBroadcast: video.snippet?.liveBroadcastContent !== 'none',
      }))
    } catch (error) {
      console.error('Failed to get video details:', error)
      return []
    }
  }

  // Database methods
  private async storeVideoData(video: VideoDetails) {
    await this.db.youtubeVideo.upsert({
      where: { videoId: video.id },
      update: {
        title: video.title,
        description: video.description,
        thumbnailUrl: video.thumbnail,
        thumbnailUrlHd: video.thumbnailHd,
        duration: video.duration,
        durationFormatted: video.durationFormatted,
        viewCount: BigInt(video.viewCount),
        likeCount: video.likeCount,
        commentCount: video.commentCount,
        tags: video.tags,
        categoryId: video.categoryId,
        liveBroadcast: video.liveBroadcast,
        premiereDate: video.premiereDate ? new Date(video.premiereDate) : null,
        publishedAt: new Date(video.publishedAt),
        lastSyncedAt: new Date(),
      },
      create: {
        videoId: video.id,
        channelId: video.channelId,
        title: video.title,
        description: video.description,
        thumbnailUrl: video.thumbnail,
        thumbnailUrlHd: video.thumbnailHd,
        duration: video.duration,
        durationFormatted: video.durationFormatted,
        viewCount: BigInt(video.viewCount),
        likeCount: video.likeCount,
        commentCount: video.commentCount,
        tags: video.tags,
        categoryId: video.categoryId,
        liveBroadcast: video.liveBroadcast,
        premiereDate: video.premiereDate ? new Date(video.premiereDate) : null,
        publishedAt: new Date(video.publishedAt),
        lastSyncedAt: new Date(),
      },
    })
  }

  private async storeChannelData(channel: ChannelDetails) {
    await this.db.youtubeChannel.upsert({
      where: { channelId: channel.id },
      update: {
        channelTitle: channel.title,
        channelDescription: channel.description,
        channelHandle: channel.customUrl,
        thumbnailUrl: channel.thumbnail,
        bannerUrl: channel.bannerUrl,
        subscriberCount: BigInt(channel.subscriberCount),
        videoCount: channel.videoCount,
        viewCount: BigInt(channel.viewCount),
        lastSyncedAt: new Date(),
      },
      create: {
        channelId: channel.id,
        channelTitle: channel.title,
        channelDescription: channel.description,
        channelHandle: channel.customUrl,
        thumbnailUrl: channel.thumbnail,
        bannerUrl: channel.bannerUrl,
        subscriberCount: BigInt(channel.subscriberCount),
        videoCount: channel.videoCount,
        viewCount: BigInt(channel.viewCount),
        lastSyncedAt: new Date(),
      },
    })
  }

  private async getVideoFromDatabase(videoId: string): Promise<VideoDetails | null> {
    const dbVideo = await this.db.youtubeVideo.findUnique({
      where: { videoId },
    })

    if (!dbVideo) return null

    return {
      id: dbVideo.videoId,
      title: dbVideo.title || '',
      description: dbVideo.description || '',
      thumbnail: dbVideo.thumbnailUrl || '',
      thumbnailHd: dbVideo.thumbnailUrlHd || undefined,
      channelId: dbVideo.channelId,
      channelTitle: '',
      duration: dbVideo.duration || 0,
      durationFormatted: dbVideo.durationFormatted || '',
      viewCount: Number(dbVideo.viewCount),
      likeCount: dbVideo.likeCount,
      commentCount: dbVideo.commentCount,
      publishedAt: dbVideo.publishedAt?.toISOString() || '',
      tags: dbVideo.tags,
      categoryId: dbVideo.categoryId || undefined,
      liveBroadcast: dbVideo.liveBroadcast,
      premiereDate: dbVideo.premiereDate?.toISOString(),
    }
  }

  private async getChannelFromDatabase(channelId: string): Promise<ChannelDetails | null> {
    const dbChannel = await this.db.youtubeChannel.findUnique({
      where: { channelId },
    })

    if (!dbChannel) return null

    return {
      id: dbChannel.channelId,
      title: dbChannel.channelTitle || '',
      description: dbChannel.channelDescription || '',
      customUrl: dbChannel.channelHandle || undefined,
      thumbnail: dbChannel.thumbnailUrl || '',
      bannerUrl: dbChannel.bannerUrl || undefined,
      subscriberCount: Number(dbChannel.subscriberCount),
      videoCount: dbChannel.videoCount,
      viewCount: Number(dbChannel.viewCount),
      createdAt: dbChannel.createdAt.toISOString(),
    }
  }

  private async ensureVideoInDatabase(videoId: string) {
    const exists = await this.db.youtubeVideo.findUnique({
      where: { videoId },
      select: { videoId: true },
    })

    if (!exists) {
      // Try to fetch and store video details
      await this.getVideoDetails(videoId)
    }
  }

  // Quota management
  private async checkQuota(cost: number): Promise<boolean> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const quota = await this.db.youTubeApiQuota.findUnique({
      where: { date: today },
    })

    if (!quota) {
      return true // First request of the day
    }

    return (quota.unitsUsed + cost) <= quota.quotaLimit
  }

  private async updateQuotaUsage(cost: number) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    await this.db.youTubeApiQuota.upsert({
      where: { date: today },
      update: {
        unitsUsed: { increment: cost },
        readRequests: { increment: 1 },
      },
      create: {
        date: today,
        unitsUsed: cost,
        quotaLimit: this.quotaLimit,
        readRequests: 1,
        resetAt: tomorrow,
      },
    })
  }

  // Public quota check
  async getRemainingQuota(): Promise<number> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const quota = await this.db.youTubeApiQuota.findUnique({
      where: { date: today },
    })

    if (!quota) {
      return this.quotaLimit
    }

    return Math.max(0, quota.quotaLimit - quota.unitsUsed)
  }
}

// src/server/services/watch-party.service.ts
import { PrismaClient } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { generateUniqueCode } from '@/lib/utils'

export class WatchPartyService {
  constructor(private db: PrismaClient) {}

  async createWatchParty(input: {
    title: string
    description?: string
    youtubeVideoId: string
    scheduledStart: Date
    maxParticipants: number
    isPublic: boolean
    requiresApproval: boolean
    chatEnabled: boolean
    syncPlayback: boolean
    tags?: string[]
    hostId: string
  }) {
    // Generate unique party code
    const partyCode = await this.generatePartyCode()

    const party = await this.db.watchParty.create({
      data: {
        ...input,
        partyCode,
        currentParticipants: 0,
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
        partyId: party.id,
        userId: input.hostId,
        role: 'host',
      },
    })

    return party
  }

  async joinParty(partyId: string, userId: string) {
    const party = await this.db.watchParty.findUnique({
      where: { id: partyId },
      include: {
        participants: {
          where: { userId },
        },
      },
    })

    if (!party) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Watch party not found',
      })
    }

    if (party.participants.length > 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Already in this watch party',
      })
    }

    if (party.currentParticipants >= party.maxParticipants) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Watch party is full',
      })
    }

    if (party.requiresApproval) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'This watch party requires approval to join',
      })
    }

    // Add participant
    await this.db.watchPartyParticipant.create({
      data: {
        partyId,
        userId,
        role: 'viewer',
      },
    })

    // Update participant count
    await this.db.watchParty.update({
      where: { id: partyId },
      data: {
        currentParticipants: { increment: 1 },
      },
    })

    return { success: true }
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

    // Update participant status
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

  async getUpcomingParties(input: {
    limit: number
    cursor?: string
    onlyPublic: boolean
  }) {
    const now = new Date()

    const parties = await this.db.watchParty.findMany({
      where: {
        isPublic: input.onlyPublic ? true : undefined,
        scheduledStart: {
          gte: now,
        },
        deleted: false,
        cancelledAt: null,
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
        _count: {
          select: {
            participants: true,
          },
        },
      },
      orderBy: {
        scheduledStart: 'asc',
      },
      take: input.limit,
      cursor: input.cursor ? { id: input.cursor } : undefined,
    })

    return {
      items: parties,
      nextCursor: parties.length === input.limit 
        ? parties[parties.length - 1].id 
        : undefined,
    }
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

  private async generatePartyCode(): Promise<string> {
    let code: string
    let attempts = 0
    const maxAttempts = 10

    do {
      code = generateUniqueCode(8)
      const existing = await this.db.watchParty.findUnique({
        where: { partyCode: code },
      })
      
      if (!existing) {
        return code
      }
      
      attempts++
    } while (attempts < maxAttempts)

    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to generate unique party code',
    })
  }
}
