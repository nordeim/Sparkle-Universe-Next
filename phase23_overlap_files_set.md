# original Phase 1-3: src/hooks/use-socket.ts
```ts
// src/hooks/use-socket.ts
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useSession } from 'next-auth/react'
import { useQueryClient } from '@tanstack/react-query'
import { logger } from '@/lib/monitoring'
import type { 
  ServerToClientEvents, 
  ClientToServerEvents 
} from '@/lib/socket/socket-server'

type SocketInstance = Socket<ServerToClientEvents, ClientToServerEvents>

interface UseSocketOptions {
  autoConnect?: boolean
  reconnection?: boolean
  reconnectionAttempts?: number
  reconnectionDelay?: number
}

export function useSocket(options: UseSocketOptions = {}) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const socketRef = useRef<SocketInstance | null>(null)

  const {
    autoConnect = true,
    reconnection = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000,
  } = options

  // Initialize socket connection
  useEffect(() => {
    if (!session?.user || !autoConnect) return

    const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000', {
      auth: {
        token: session.user.id, // In production, use proper session token
      },
      transports: ['websocket', 'polling'],
      reconnection,
      reconnectionAttempts,
      reconnectionDelay,
    }) as SocketInstance

    socketRef.current = socket

    // Connection event handlers
    socket.on('connect', () => {
      logger.info('Socket connected', { socketId: socket.id })
      setIsConnected(true)
      setIsConnecting(false)
    })

    socket.on('disconnect', (reason) => {
      logger.info('Socket disconnected', { reason })
      setIsConnected(false)
      setIsConnecting(false)
    })

    socket.on('connect_error', (error) => {
      logger.error('Socket connection error:', error)
      setIsConnecting(false)
    })

    socket.on('error', ({ message, code }) => {
      logger.error('Socket error:', { message, code })
    })

    // Set up global event handlers
    setupGlobalHandlers(socket, queryClient)

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [session, autoConnect, reconnection, reconnectionAttempts, reconnectionDelay, queryClient])

  // Emit event helper
  const emit = useCallback(<K extends keyof ClientToServerEvents>(
    event: K,
    ...args: Parameters<ClientToServerEvents[K]>
  ) => {
    if (!socketRef.current?.connected) {
      logger.warn('Socket not connected, cannot emit event', { event })
      return
    }
    socketRef.current.emit(event, ...args)
  }, [])

  // Subscribe to event helper
  const on = useCallback(<K extends keyof ServerToClientEvents>(
    event: K,
    handler: ServerToClientEvents[K]
  ) => {
    if (!socketRef.current) {
      logger.warn('Socket not initialized')
      return () => {}
    }

    socketRef.current.on(event, handler)

    // Return cleanup function
    return () => {
      socketRef.current?.off(event, handler)
    }
  }, [])

  // One-time event listener
  const once = useCallback(<K extends keyof ServerToClientEvents>(
    event: K,
    handler: ServerToClientEvents[K]
  ) => {
    if (!socketRef.current) {
      logger.warn('Socket not initialized')
      return () => {}
    }

    socketRef.current.once(event, handler)

    // Return cleanup function
    return () => {
      socketRef.current?.off(event, handler)
    }
  }, [])

  // Remove event listener
  const off = useCallback(<K extends keyof ServerToClientEvents>(
    event: K,
    handler?: ServerToClientEvents[K]
  ) => {
    if (!socketRef.current) return
    
    if (handler) {
      socketRef.current.off(event, handler)
    } else {
      socketRef.current.off(event)
    }
  }, [])

  // Manual connect/disconnect
  const connect = useCallback(() => {
    if (!socketRef.current || socketRef.current.connected) return
    setIsConnecting(true)
    socketRef.current.connect()
  }, [])

  const disconnect = useCallback(() => {
    if (!socketRef.current || !socketRef.current.connected) return
    socketRef.current.disconnect()
  }, [])

  return {
    socket: socketRef.current,
    isConnected,
    isConnecting,
    emit,
    on,
    once,
    off,
    connect,
    disconnect,
  }
}

// Global event handlers that update React Query cache
function setupGlobalHandlers(socket: SocketInstance, queryClient: ReturnType<typeof useQueryClient>) {
  // Notification handlers
  socket.on('notification', (notification) => {
    // Update notifications query
    queryClient.setQueryData(['notifications'], (old: any) => {
      if (!old) return { items: [notification], nextCursor: null, hasMore: false }
      return {
        ...old,
        items: [notification, ...old.items],
      }
    })

    // Show toast notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icon-192x192.png',
      })
    }
  })

  socket.on('unreadCountUpdate', (count) => {
    queryClient.setQueryData(['notifications', 'unreadCount'], count)
  })

  // Post updates
  socket.on('postUpdated', (post) => {
    queryClient.setQueryData(['post', post.id], post)
    
    // Update in lists
    queryClient.setQueriesData(
      { queryKey: ['posts'], exact: false },
      (old: any) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages?.map((page: any) => ({
            ...page,
            items: page.items.map((item: any) =>
              item.id === post.id ? post : item
            ),
          })),
        }
      }
    )
  })

  // Comment updates
  socket.on('commentCreated', (comment) => {
    queryClient.setQueryData(
      ['comments', comment.postId],
      (old: any) => {
        if (!old) return { items: [comment], nextCursor: null, hasMore: false }
        return {
          ...old,
          items: [comment, ...old.items],
        }
      }
    )
  })

  // Reaction updates
  socket.on('reactionAdded', ({ entityType, entityId, counts }) => {
    const queryKey = entityType === 'post' 
      ? ['post', entityId] 
      : ['comment', entityId]
    
    queryClient.setQueryData(queryKey, (old: any) => {
      if (!old) return old
      return {
        ...old,
        reactionCounts: counts,
      }
    })
  })
}

// Specialized hooks for specific features
export function usePresence() {
  const { emit, on, off } = useSocket()
  
  const updatePresence = useCallback((status: string, location?: string) => {
    emit('updatePresence', { status, location })
  }, [emit])

  useEffect(() => {
    const interval = setInterval(() => {
      updatePresence('online')
    }, 4 * 60 * 1000) // Send heartbeat every 4 minutes

    return () => clearInterval(interval)
  }, [updatePresence])

  return { updatePresence }
}

export function useTypingIndicator(channelId: string, channelType: string = 'conversation') {
  const { emit, on, off } = useSocket()
  const [typingUsers, setTypingUsers] = useState<Map<string, { username: string }>>(new Map())
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const handleUserTyping = ({ userId, username }: any) => {
      setTypingUsers(prev => new Map(prev).set(userId, { username }))
    }

    const handleUserStoppedTyping = ({ userId }: any) => {
      setTypingUsers(prev => {
        const updated = new Map(prev)
        updated.delete(userId)
        return updated
      })
    }

    const unsubscribeTyping = on('userTyping', handleUserTyping)
    const unsubscribeStoppedTyping = on('userStoppedTyping', handleUserStoppedTyping)

    return () => {
      unsubscribeTyping()
      unsubscribeStoppedTyping()
    }
  }, [on, channelId])

  const startTyping = useCallback(() => {
    emit('startTyping', { channelId, channelType })

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Auto-stop after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      emit('stopTyping', { channelId, channelType })
    }, 3000)
  }, [emit, channelId, channelType])

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    emit('stopTyping', { channelId, channelType })
  }, [emit, channelId, channelType])

  return {
    typingUsers: Array.from(typingUsers.values()),
    startTyping,
    stopTyping,
  }
}

export function useRealtimePost(postId: string) {
  const { emit, on, off, isConnected } = useSocket()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!isConnected) return

    // Subscribe to post updates
    emit('subscribeToPost', postId)

    // Set up specific handlers for this post
    const handleReaction = (data: any) => {
      if (data.entityType === 'post' && data.entityId === postId) {
        queryClient.setQueryData(['post', postId, 'reactions'], data.counts)
      }
    }

    const unsubscribe = on('reactionAdded', handleReaction)

    return () => {
      emit('unsubscribeFromPost', postId)
      unsubscribe()
    }
  }, [postId, isConnected, emit, on, queryClient])
}

```

# original Phase 1-3: src/server/api/routers/search.ts
```ts
// src/server/api/routers/search.ts
import { z } from 'zod'
import { 
  createTRPCRouter, 
  publicProcedure 
} from '@/server/api/trpc'
import { SearchService } from '@/server/services/search.service'

export const searchRouter = createTRPCRouter({
  // Global search
  search: publicProcedure
    .input(z.object({
      query: z.string().min(1).max(100),
      type: z.enum(['all', 'posts', 'users', 'tags']).default('all'),
      limit: z.number().min(1).max(50).default(10),
    }))
    .query(async ({ ctx, input }) => {
      const searchService = new SearchService(ctx.db)
      return searchService.search(input)
    }),

  // Search suggestions
  suggestions: publicProcedure
    .input(z.object({
      query: z.string().min(1).max(50),
      limit: z.number().min(1).max(10).default(5),
    }))
    .query(async ({ ctx, input }) => {
      const searchService = new SearchService(ctx.db)
      return searchService.getSuggestions(input.query, input.limit)
    }),

  // Trending searches
  trending: publicProcedure
    .query(async ({ ctx }) => {
      const searchService = new SearchService(ctx.db)
      return searchService.getTrendingSearches()
    }),
})

```

# original Phase 1-3: src/server/api/routers/youtube.ts
```ts
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

```

# original Phase 1-3: src/server/services/search.service.ts
```ts
// src/server/services/search.service.ts
import { PrismaClient, Prisma } from '@prisma/client'
import { CacheService, CacheType } from './cache.service'

export class SearchService {
  private cacheService: CacheService

  constructor(private db: PrismaClient) {
    this.cacheService = new CacheService()
  }

  async search(params: {
    query: string
    type: 'all' | 'posts' | 'users' | 'tags'
    limit: number
  }) {
    const { query, type, limit } = params
    const results: any = {}

    // Normalize query for PostgreSQL full-text search
    const searchQuery = query.trim().toLowerCase()
    const tsQuery = searchQuery.split(' ').join(' & ')

    if (type === 'all' || type === 'posts') {
      results.posts = await this.searchPosts(searchQuery, tsQuery, limit)
    }

    if (type === 'all' || type === 'users') {
      results.users = await this.searchUsers(searchQuery, limit)
    }

    if (type === 'all' || type === 'tags') {
      results.tags = await this.searchTags(searchQuery, limit)
    }

    // Track search query for trending
    await this.trackSearchQuery(query)

    return results
  }

  private async searchPosts(query: string, tsQuery: string, limit: number) {
    // Use PostgreSQL full-text search with GIN indexes
    const posts = await this.db.$queryRaw<any[]>`
      SELECT 
        p.id,
        p.title,
        p.excerpt,
        p.slug,
        p."authorId",
        p."createdAt",
        ts_rank(
          to_tsvector('english', p.title || ' ' || COALESCE(p.excerpt, '')),
          to_tsquery('english', ${tsQuery})
        ) as rank
      FROM posts p
      WHERE 
        p.published = true
        AND p.deleted = false
        AND (
          to_tsvector('english', p.title || ' ' || COALESCE(p.excerpt, '')) 
          @@ to_tsquery('english', ${tsQuery})
          OR p.title ILIKE ${`%${query}%`}
        )
      ORDER BY rank DESC, p."createdAt" DESC
      LIMIT ${limit}
    `

    // Enrich with author data
    const authorIds = posts.map(p => p.authorId)
    const authors = await this.db.user.findMany({
      where: { id: { in: authorIds } },
      select: {
        id: true,
        username: true,
        image: true,
      },
    })

    const authorMap = new Map(authors.map(a => [a.id, a]))

    return posts.map(post => ({
      ...post,
      author: authorMap.get(post.authorId),
    }))
  }

  private async searchUsers(query: string, limit: number) {
    // Use trigram similarity for user search (requires pg_trgm extension)
    const users = await this.db.$queryRaw<any[]>`
      SELECT 
        u.id,
        u.username,
        u.bio,
        u.image,
        similarity(u.username, ${query}) as username_similarity,
        similarity(COALESCE(u.bio, ''), ${query}) as bio_similarity
      FROM users u
      WHERE 
        u.status = 'ACTIVE'
        AND (
          u.username ILIKE ${`%${query}%`}
          OR u.bio ILIKE ${`%${query}%`}
          OR similarity(u.username, ${query}) > 0.3
        )
      ORDER BY 
        username_similarity DESC,
        bio_similarity DESC
      LIMIT ${limit}
    `

    return users
  }

  private async searchTags(query: string, limit: number) {
    return this.db.tag.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            posts: true,
          },
        },
      },
      orderBy: {
        posts: {
          _count: 'desc',
        },
      },
      take: limit,
    })
  }

  async getSuggestions(query: string, limit: number) {
    const cacheKey = `suggestions:${query}`
    const cached = await this.cacheService.get<string[]>(cacheKey)
    if (cached) return cached

    // Get search history and popular searches
    const suggestions = await this.db.$queryRaw<Array<{term: string}>>`
      SELECT DISTINCT term
      FROM search_queries
      WHERE term ILIKE ${`${query}%`}
      ORDER BY search_count DESC
      LIMIT ${limit}
    `

    const terms = suggestions.map(s => s.term)
    await this.cacheService.set(cacheKey, terms, 300) // Cache for 5 minutes

    return terms
  }

  async getTrendingSearches() {
    const cacheKey = 'trending:searches'
    const cached = await this.cacheService.get(cacheKey, CacheType.TRENDING)
    if (cached) return cached

    const trending = await this.db.$queryRaw<Array<{term: string, count: number}>>`
      SELECT term, search_count as count
      FROM search_queries
      WHERE created_at > NOW() - INTERVAL '24 hours'
      ORDER BY search_count DESC
      LIMIT 10
    `

    await this.cacheService.set(cacheKey, trending, 900, CacheType.TRENDING)
    return trending
  }

  async indexPost(post: any) {
    // Create/update search index entry
    const searchableText = `${post.title} ${post.excerpt || ''} ${post.content || ''}`
      .replace(/<[^>]*>/g, '') // Strip HTML
      .substring(0, 10000) // Limit length

    await this.db.searchIndex.upsert({
      where: {
        entityType_entityId: {
          entityType: 'post',
          entityId: post.id,
        },
      },
      create: {
        entityType: 'post',
        entityId: post.id,
        searchableText,
        metadata: {
          title: post.title,
          slug: post.slug,
          authorId: post.authorId,
        },
      },
      update: {
        searchableText,
        metadata: {
          title: post.title,
          slug: post.slug,
          authorId: post.authorId,
        },
      },
    })
  }

  async deletePost(postId: string) {
    await this.db.searchIndex.delete({
      where: {
        entityType_entityId: {
          entityType: 'post',
          entityId: postId,
        },
      },
    })
  }

  private async trackSearchQuery(query: string) {
    // Track search queries for analytics and suggestions
    await this.db.$executeRaw`
      INSERT INTO search_queries (term, search_count)
      VALUES (${query}, 1)
      ON CONFLICT (term)
      DO UPDATE SET 
        search_count = search_queries.search_count + 1,
        last_searched = NOW()
    `
  }
}

```

# original Phase 1-3: src/server/services/youtube.service.ts
```ts
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

```

