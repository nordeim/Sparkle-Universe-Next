// src/server/services/youtube.service.ts
import { google, youtube_v3 } from 'googleapis'
import { db } from '@/lib/db'
import { CacheService } from './cache.service'
import { z } from 'zod'

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
  private quotaLimit = 10000 // Daily quota limit
  private quotaCost = {
    search: 100,
    videos: 1,
    channels: 1,
    playlists: 1,
  }

  constructor() {
    this.youtube = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY,
    })
    this.cacheService = new CacheService()
  }

  // Get video details
  async getVideoDetails(videoId: string): Promise<VideoDetails | null> {
    // Validate video ID
    if (!this.isValidVideoId(videoId)) {
      throw new Error('Invalid YouTube video ID')
    }

    // Check cache
    const cacheKey = `youtube:video:${videoId}`
    const cached = await this.cacheService.get<VideoDetails>(cacheKey)
    if (cached) return cached

    try {
      // Check quota
      if (!await this.checkQuota(this.quotaCost.videos)) {
        throw new Error('YouTube API quota exceeded')
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
      const dbVideo = await db.youtubeVideo.findUnique({
        where: { videoId },
      })

      if (dbVideo) {
        return {
          id: dbVideo.videoId,
          title: dbVideo.title || '',
          description: dbVideo.description || '',
          thumbnail: dbVideo.thumbnailUrl || '',
          thumbnailHd: dbVideo.thumbnailUrlHd,
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

      throw error
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
        throw new Error('YouTube API quota exceeded')
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
      
      // Try to get from database as fallback
      const dbChannel = await db.youtubeChannel.findUnique({
        where: { channelId },
      })

      if (dbChannel) {
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
        throw new Error('YouTube API quota exceeded')
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

  // Get video embed HTML
  async getVideoEmbedHtml(videoId: string, options: {
    width?: number
    height?: number
    autoplay?: boolean
    controls?: boolean
    modestbranding?: boolean
    rel?: boolean
  } = {}): Promise<string> {
    const {
      width = 560,
      height = 315,
      autoplay = false,
      controls = true,
      modestbranding = true,
      rel = false,
    } = options

    const params = new URLSearchParams({
      autoplay: autoplay ? '1' : '0',
      controls: controls ? '1' : '0',
      modestbranding: modestbranding ? '1' : '0',
      rel: rel ? '1' : '0',
    })

    return `<iframe width="${width}" height="${height}" src="https://www.youtube.com/embed/${videoId}?${params}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
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

  // Database storage
  private async storeVideoData(video: VideoDetails) {
    await db.youtubeVideo.upsert({
      where: { videoId: video.id },
      update: {
        title: video.title,
        description: video.description,
        thumbnailUrl: video.thumbnail,
        thumbnailUrlHd: video.thumbnailHd,
        duration: video.duration,
        durationFormatted: video.durationFormatted,
        viewCount: video.viewCount,
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
        viewCount: video.viewCount,
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
    await db.youtubeChannel.upsert({
      where: { channelId: channel.id },
      update: {
        channelTitle: channel.title,
        channelDescription: channel.description,
        channelHandle: channel.customUrl,
        thumbnailUrl: channel.thumbnail,
        bannerUrl: channel.bannerUrl,
        subscriberCount: channel.subscriberCount,
        videoCount: channel.videoCount,
        viewCount: channel.viewCount,
        lastSyncedAt: new Date(),
      },
      create: {
        channelId: channel.id,
        channelTitle: channel.title,
        channelDescription: channel.description,
        channelHandle: channel.customUrl,
        thumbnailUrl: channel.thumbnail,
        bannerUrl: channel.bannerUrl,
        subscriberCount: channel.subscriberCount,
        videoCount: channel.videoCount,
        viewCount: channel.viewCount,
        lastSyncedAt: new Date(),
      },
    })
  }

  // Quota management
  private async checkQuota(cost: number): Promise<boolean> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const quota = await db.youTubeApiQuota.findUnique({
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

    await db.youTubeApiQuota.upsert({
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

    const quota = await db.youTubeApiQuota.findUnique({
      where: { date: today },
    })

    if (!quota) {
      return this.quotaLimit
    }

    return Math.max(0, quota.quotaLimit - quota.unitsUsed)
  }
}
