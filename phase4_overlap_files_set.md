# src/hooks/use-socket.ts
```ts
// src/hooks/use-socket.ts
'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './use-auth'
import { toast } from './use-toast'

interface UseSocketOptions {
  autoConnect?: boolean
  reconnection?: boolean
  reconnectionAttempts?: number
  reconnectionDelay?: number
}

interface SocketState {
  isConnected: boolean
  isConnecting: boolean
  error: Error | null
  latency: number
}

export function useSocket(options: UseSocketOptions = {}) {
  const {
    autoConnect = true,
    reconnection = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000,
  } = options

  const { user, isAuthenticated } = useAuth()
  const [state, setState] = useState<SocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    latency: 0,
  })

  const socketRef = useRef<Socket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const eventHandlersRef = useRef<Map<string, Set<Function>>>(new Map())

  // Initialize socket connection
  const connect = useCallback(() => {
    if (!isAuthenticated || socketRef.current?.connected) {
      return
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }))

    const socket = io(process.env.NEXT_PUBLIC_WS_URL || '', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection,
      reconnectionAttempts,
      reconnectionDelay,
      timeout: 10000,
      auth: {
        sessionId: user?.id,
      },
    })

    // Connection event handlers
    socket.on('connect', () => {
      console.log('WebSocket connected:', socket.id)
      setState(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        error: null,
      }))

      // Start latency monitoring
      startLatencyCheck()
    })

    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason)
      setState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
      }))

      stopLatencyCheck()

      // Handle reconnection for specific disconnect reasons
      if (reason === 'io server disconnect') {
        // Server disconnected us, try to reconnect
        attemptReconnect()
      }
    })

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error.message)
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error,
      }))

      if (error.message === 'Authentication required') {
        toast({
          title: 'Authentication Error',
          description: 'Please log in to continue',
          variant: 'destructive',
        })
      }
    })

    socket.on('error', (error: any) => {
      console.error('WebSocket error:', error)
      
      if (error.message) {
        toast({
          title: 'Connection Error',
          description: error.message,
          variant: 'destructive',
        })
      }
    })

    socket.on('reconnect', (attemptNumber) => {
      console.log('WebSocket reconnected after', attemptNumber, 'attempts')
      toast({
        title: 'Reconnected',
        description: 'Connection restored',
      })
    })

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('WebSocket reconnection attempt', attemptNumber)
      setState(prev => ({ ...prev, isConnecting: true }))
    })

    socket.on('reconnect_failed', () => {
      console.error('WebSocket reconnection failed')
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: new Error('Failed to reconnect'),
      }))
      
      toast({
        title: 'Connection Failed',
        description: 'Unable to establish connection. Please refresh the page.',
        variant: 'destructive',
      })
    })

    // Reattach existing event handlers
    eventHandlersRef.current.forEach((handlers, event) => {
      handlers.forEach(handler => {
        socket.on(event as any, handler as any)
      })
    })

    socketRef.current = socket
  }, [isAuthenticated, user?.id, reconnection, reconnectionAttempts, reconnectionDelay])

  // Disconnect socket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
      stopLatencyCheck()
    }
  }, [])

  // Emit event
  const emit = useCallback((event: string, ...args: any[]) => {
    if (!socketRef.current?.connected) {
      console.warn('Socket not connected, queuing event:', event)
      // Queue events to be sent when connected
      socketRef.current?.once('connect', () => {
        socketRef.current?.emit(event as any, ...args)
      })
      return
    }

    socketRef.current.emit(event as any, ...args)
  }, [])

  // Subscribe to event
  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    // Store handler reference
    if (!eventHandlersRef.current.has(event)) {
      eventHandlersRef.current.set(event, new Set())
    }
    eventHandlersRef.current.get(event)!.add(handler)

    // Attach to socket if connected
    if (socketRef.current) {
      socketRef.current.on(event as any, handler)
    }

    // Return cleanup function
    return () => {
      eventHandlersRef.current.get(event)?.delete(handler)
      socketRef.current?.off(event as any, handler)
    }
  }, [])

  // Subscribe to event (once)
  const once = useCallback((event: string, handler: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.once(event as any, handler)
    }
  }, [])

  // Remove event listener
  const off = useCallback((event: string, handler?: (...args: any[]) => void) => {
    if (handler) {
      eventHandlersRef.current.get(event)?.delete(handler)
      socketRef.current?.off(event as any, handler)
    } else {
      eventHandlersRef.current.delete(event)
      socketRef.current?.removeAllListeners(event)
    }
  }, [])

  // Join room
  const joinRoom = useCallback((room: string) => {
    emit('join:room', room)
  }, [emit])

  // Leave room
  const leaveRoom = useCallback((room: string) => {
    emit('leave:room', room)
  }, [emit])

  // Update presence
  const updatePresence = useCallback((status: 'online' | 'away' | 'busy') => {
    emit('presence:update', status)
  }, [emit])

  // Reconnection logic
  const attemptReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      if (!socketRef.current?.connected && isAuthenticated) {
        console.log('Attempting to reconnect...')
        connect()
      }
    }, reconnectionDelay)
  }, [connect, isAuthenticated, reconnectionDelay])

  // Latency monitoring
  const startLatencyCheck = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
    }

    pingIntervalRef.current = setInterval(() => {
      if (socketRef.current?.connected) {
        const start = Date.now()
        
        socketRef.current.emit('ping', () => {
          const latency = Date.now() - start
          setState(prev => ({ ...prev, latency }))
        })
      }
    }, 5000) // Check every 5 seconds
  }, [])

  const stopLatencyCheck = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
      pingIntervalRef.current = null
    }
  }, [])

  // Auto-connect when authenticated
  useEffect(() => {
    if (autoConnect && isAuthenticated) {
      connect()
    }

    return () => {
      disconnect()
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [autoConnect, isAuthenticated, connect, disconnect])

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, update presence to away
        updatePresence('away')
      } else {
        // Page is visible, update presence to online
        updatePresence('online')
        
        // Reconnect if disconnected
        if (!socketRef.current?.connected && isAuthenticated) {
          attemptReconnect()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [updatePresence, attemptReconnect, isAuthenticated])

  return {
    // State
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    error: state.error,
    latency: state.latency,
    
    // Methods
    connect,
    disconnect,
    emit,
    on,
    once,
    off,
    joinRoom,
    leaveRoom,
    updatePresence,
    
    // Socket instance (for advanced usage)
    socket: socketRef.current,
  }
}

// Singleton hook for app-wide socket
let globalSocket: ReturnType<typeof useSocket> | null = null

export function useGlobalSocket() {
  if (!globalSocket) {
    globalSocket = useSocket({ autoConnect: true })
  }
  return globalSocket
}

```

# src/server/api/routers/search.ts
```ts
// src/server/api/routers/search.ts
import { z } from 'zod'
import { 
  createTRPCRouter, 
  publicProcedure 
} from '@/server/api/trpc'
import { SearchService } from '@/server/services/search.service'

export const searchRouter = createTRPCRouter({
  // Search posts
  posts: publicProcedure
    .input(z.object({
      query: z.string().min(1),
      page: z.number().min(0).optional(),
      limit: z.number().min(1).max(100).optional(),
      filters: z.object({
        tags: z.array(z.string()).optional(),
        authorId: z.string().optional(),
        authorUsername: z.string().optional(),
        category: z.string().optional(),
        featured: z.boolean().optional(),
      }).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const searchService = new SearchService(ctx.db)
      
      // Build Algolia filters
      const filters: string[] = []
      if (input.filters?.authorId) {
        filters.push(`author.id:"${input.filters.authorId}"`)
      }
      if (input.filters?.authorUsername) {
        filters.push(`author.username:"${input.filters.authorUsername}"`)
      }
      if (input.filters?.category) {
        filters.push(`category:"${input.filters.category}"`)
      }
      if (input.filters?.featured !== undefined) {
        filters.push(`featured:${input.filters.featured}`)
      }

      const facetFilters: string[][] = []
      if (input.filters?.tags && input.filters.tags.length > 0) {
        facetFilters.push(input.filters.tags.map(tag => `tags:${tag}`))
      }

      return searchService.searchPosts(input.query, {
        page: input.page,
        hitsPerPage: input.limit,
        filters: filters.join(' AND '),
        facetFilters,
        facets: ['tags', 'category', 'author.username'],
      })
    }),

  // Search users
  users: publicProcedure
    .input(z.object({
      query: z.string().min(1),
      page: z.number().min(0).optional(),
      limit: z.number().min(1).max(100).optional(),
      filters: z.object({
        verified: z.boolean().optional(),
        role: z.string().optional(),
        interests: z.array(z.string()).optional(),
        skills: z.array(z.string()).optional(),
      }).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const searchService = new SearchService(ctx.db)
      
      // Build filters
      const filters: string[] = []
      if (input.filters?.verified !== undefined) {
        filters.push(`verified:${input.filters.verified}`)
      }
      if (input.filters?.role) {
        filters.push(`role:"${input.filters.role}"`)
      }

      const facetFilters: string[][] = []
      if (input.filters?.interests && input.filters.interests.length > 0) {
        facetFilters.push(input.filters.interests.map(interest => `interests:${interest}`))
      }
      if (input.filters?.skills && input.filters.skills.length > 0) {
        facetFilters.push(input.filters.skills.map(skill => `skills:${skill}`))
      }

      return searchService.searchUsers(input.query, {
        page: input.page,
        hitsPerPage: input.limit,
        filters: filters.join(' AND '),
        facetFilters,
        facets: ['verified', 'role', 'interests', 'skills'],
      })
    }),

  // Search tags
  tags: publicProcedure
    .input(z.object({
      query: z.string().min(1),
      limit: z.number().min(1).max(100).optional(),
      featured: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const searchService = new SearchService(ctx.db)
      
      const filters: string[] = []
      if (input.featured !== undefined) {
        filters.push(`featured:${input.featured}`)
      }

      return searchService.searchTags(input.query, {
        hitsPerPage: input.limit,
        filters: filters.join(' AND '),
      })
    }),

  // Multi-index search
  all: publicProcedure
    .input(z.object({
      query: z.string().min(1),
      postsLimit: z.number().min(1).max(20).optional(),
      usersLimit: z.number().min(1).max(20).optional(),
      tagsLimit: z.number().min(1).max(20).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const searchService = new SearchService(ctx.db)
      return searchService.searchAll(input.query, {
        postsLimit: input.postsLimit,
        usersLimit: input.usersLimit,
        tagsLimit: input.tagsLimit,
      })
    }),
})

```

# src/server/api/routers/youtube.ts
```ts
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

```

# src/server/services/search.service.ts
```ts
// src/server/services/search.service.ts
import { PrismaClient, Prisma } from '@prisma/client'
import algoliasearch, { SearchClient, SearchIndex } from 'algoliasearch'
import { CacheService } from './cache.service'

interface SearchOptions {
  page?: number
  hitsPerPage?: number
  filters?: string
  facets?: string[]
  facetFilters?: string[][]
  numericFilters?: string[]
  attributesToRetrieve?: string[]
  attributesToHighlight?: string[]
  highlightPreTag?: string
  highlightPostTag?: string
}

interface SearchResult<T = any> {
  hits: T[]
  nbHits: number
  page: number
  nbPages: number
  hitsPerPage: number
  facets?: Record<string, Record<string, number>>
  processingTimeMS: number
  query: string
}

interface IndexablePost {
  objectID: string
  title: string
  content: string
  excerpt: string
  slug: string
  author: {
    id: string
    username: string
    image?: string
  }
  tags: string[]
  category?: string
  featured: boolean
  published: boolean
  publishedAt?: number
  views: number
  likes: number
  comments: number
  readingTime: number
  youtubeVideoId?: string
  _searchableContent?: string
}

interface IndexableUser {
  objectID: string
  username: string
  displayName?: string
  bio?: string
  verified: boolean
  role: string
  followers: number
  posts: number
  level: number
  interests: string[]
  skills: string[]
  createdAt: number
}

interface IndexableTag {
  objectID: string
  name: string
  slug: string
  description?: string
  postCount: number
  featured: boolean
}

export class SearchService {
  private algoliaClient: SearchClient | null = null
  private postsIndex: SearchIndex | null = null
  private usersIndex: SearchIndex | null = null
  private tagsIndex: SearchIndex | null = null
  private cacheService: CacheService
  private useAlgolia: boolean

  constructor(private db: PrismaClient) {
    this.cacheService = new CacheService()
    this.useAlgolia = !!(process.env.ALGOLIA_APP_ID && process.env.ALGOLIA_ADMIN_KEY)
    
    if (this.useAlgolia) {
      this.initializeAlgolia()
    }
  }

  private initializeAlgolia() {
    this.algoliaClient = algoliasearch(
      process.env.ALGOLIA_APP_ID!,
      process.env.ALGOLIA_ADMIN_KEY!
    )

    this.postsIndex = this.algoliaClient.initIndex('posts')
    this.usersIndex = this.algoliaClient.initIndex('users')
    this.tagsIndex = this.algoliaClient.initIndex('tags')

    // Configure indices
    this.configureIndices()
  }

  private async configureIndices() {
    // Posts index configuration
    await this.postsIndex?.setSettings({
      searchableAttributes: [
        'unordered(title)',
        'unordered(content)',
        'excerpt',
        'tags',
        'author.username',
        'category',
      ],
      attributesForFaceting: [
        'searchable(tags)',
        'searchable(author.username)',
        'filterOnly(author.id)',
        'category',
        'featured',
        'published',
      ],
      customRanking: [
        'desc(featured)',
        'desc(likes)',
        'desc(views)',
        'desc(publishedAt)',
      ],
      attributesToSnippet: [
        'content:50',
        'excerpt:30',
      ],
      snippetEllipsisText: '...',
      highlightPreTag: '<mark class="search-highlight">',
      highlightPostTag: '</mark>',
      hitsPerPage: 20,
      paginationLimitedTo: 1000,
      attributesToRetrieve: [
        'objectID',
        'title',
        'excerpt',
        'slug',
        'author',
        'tags',
        'category',
        'publishedAt',
        'views',
        'likes',
        'comments',
        'readingTime',
        'youtubeVideoId',
      ],
    })

    // Users index configuration
    await this.usersIndex?.setSettings({
      searchableAttributes: [
        'unordered(username)',
        'unordered(displayName)',
        'bio',
        'interests',
        'skills',
      ],
      attributesForFaceting: [
        'verified',
        'role',
        'searchable(interests)',
        'searchable(skills)',
      ],
      customRanking: [
        'desc(verified)',
        'desc(followers)',
        'desc(level)',
        'desc(posts)',
      ],
      attributesToSnippet: [
        'bio:30',
      ],
      hitsPerPage: 20,
    })

    // Tags index configuration
    await this.tagsIndex?.setSettings({
      searchableAttributes: [
        'unordered(name)',
        'description',
      ],
      attributesForFaceting: [
        'featured',
      ],
      customRanking: [
        'desc(featured)',
        'desc(postCount)',
      ],
      hitsPerPage: 50,
    })
  }

  // Index a post
  async indexPost(post: any) {
    if (!this.useAlgolia || !this.postsIndex) return

    const indexablePost: IndexablePost = {
      objectID: post.id,
      title: post.title,
      content: this.stripHtml(post.content || ''),
      excerpt: post.excerpt || '',
      slug: post.slug,
      author: {
        id: post.author.id,
        username: post.author.username,
        image: post.author.image,
      },
      tags: post.tags?.map((t: any) => t.name) || [],
      category: post.category?.name,
      featured: post.featured || false,
      published: post.published || false,
      publishedAt: post.publishedAt?.getTime(),
      views: post.stats?.viewCount || 0,
      likes: post._count?.reactions || 0,
      comments: post._count?.comments || 0,
      readingTime: post.readingTime || 0,
      youtubeVideoId: post.youtubeVideoId,
      _searchableContent: `${post.title} ${post.excerpt || ''} ${this.stripHtml(post.content || '')}`.toLowerCase(),
    }

    try {
      await this.postsIndex.saveObject(indexablePost)
    } catch (error) {
      console.error('Failed to index post:', error)
    }
  }

  // Index a user
  async indexUser(user: any) {
    if (!this.useAlgolia || !this.usersIndex) return

    const indexableUser: IndexableUser = {
      objectID: user.id,
      username: user.username,
      displayName: user.profile?.displayName,
      bio: user.bio,
      verified: user.verified || false,
      role: user.role,
      followers: user._count?.followers || 0,
      posts: user._count?.posts || 0,
      level: user.level || 1,
      interests: user.profile?.interests || [],
      skills: user.profile?.skills || [],
      createdAt: user.createdAt.getTime(),
    }

    try {
      await this.usersIndex.saveObject(indexableUser)
    } catch (error) {
      console.error('Failed to index user:', error)
    }
  }

  // Index a tag
  async indexTag(tag: any) {
    if (!this.useAlgolia || !this.tagsIndex) return

    const indexableTag: IndexableTag = {
      objectID: tag.id,
      name: tag.name,
      slug: tag.slug,
      description: tag.description,
      postCount: tag.postCount || 0,
      featured: tag.featured || false,
    }

    try {
      await this.tagsIndex.saveObject(indexableTag)
    } catch (error) {
      console.error('Failed to index tag:', error)
    }
  }

  // Search posts
  async searchPosts(
    query: string, 
    options: SearchOptions = {}
  ): Promise<SearchResult<IndexablePost>> {
    // Try cache first
    const cacheKey = `search:posts:${query}:${JSON.stringify(options)}`
    const cached = await this.cacheService.get<SearchResult<IndexablePost>>(cacheKey)
    if (cached) return cached

    let result: SearchResult<IndexablePost>

    if (this.useAlgolia && this.postsIndex) {
      // Use Algolia
      const searchResult = await this.postsIndex.search<IndexablePost>(query, {
        page: options.page || 0,
        hitsPerPage: options.hitsPerPage || 20,
        filters: options.filters,
        facets: options.facets,
        facetFilters: options.facetFilters,
        numericFilters: options.numericFilters,
        attributesToRetrieve: options.attributesToRetrieve,
        attributesToHighlight: options.attributesToHighlight,
        highlightPreTag: options.highlightPreTag || '<mark>',
        highlightPostTag: options.highlightPostTag || '</mark>',
      })

      result = {
        hits: searchResult.hits,
        nbHits: searchResult.nbHits,
        page: searchResult.page,
        nbPages: searchResult.nbPages,
        hitsPerPage: searchResult.hitsPerPage,
        facets: searchResult.facets,
        processingTimeMS: searchResult.processingTimeMS,
        query: searchResult.query,
      }
    } else {
      // Fallback to database search
      result = await this.searchPostsInDatabase(query, options)
    }

    // Cache for 5 minutes
    await this.cacheService.set(cacheKey, result, 300)

    return result
  }

  // Search users
  async searchUsers(
    query: string, 
    options: SearchOptions = {}
  ): Promise<SearchResult<IndexableUser>> {
    // Try cache first
    const cacheKey = `search:users:${query}:${JSON.stringify(options)}`
    const cached = await this.cacheService.get<SearchResult<IndexableUser>>(cacheKey)
    if (cached) return cached

    let result: SearchResult<IndexableUser>

    if (this.useAlgolia && this.usersIndex) {
      // Use Algolia
      const searchResult = await this.usersIndex.search<IndexableUser>(query, {
        page: options.page || 0,
        hitsPerPage: options.hitsPerPage || 20,
        filters: options.filters,
        facets: options.facets,
        facetFilters: options.facetFilters,
        attributesToRetrieve: options.attributesToRetrieve,
        attributesToHighlight: options.attributesToHighlight,
      })

      result = {
        hits: searchResult.hits,
        nbHits: searchResult.nbHits,
        page: searchResult.page,
        nbPages: searchResult.nbPages,
        hitsPerPage: searchResult.hitsPerPage,
        facets: searchResult.facets,
        processingTimeMS: searchResult.processingTimeMS,
        query: searchResult.query,
      }
    } else {
      // Fallback to database search
      result = await this.searchUsersInDatabase(query, options)
    }

    // Cache for 5 minutes
    await this.cacheService.set(cacheKey, result, 300)

    return result
  }

  // Search tags
  async searchTags(
    query: string, 
    options: SearchOptions = {}
  ): Promise<SearchResult<IndexableTag>> {
    if (this.useAlgolia && this.tagsIndex) {
      const searchResult = await this.tagsIndex.search<IndexableTag>(query, {
        page: options.page || 0,
        hitsPerPage: options.hitsPerPage || 50,
        filters: options.filters,
      })

      return {
        hits: searchResult.hits,
        nbHits: searchResult.nbHits,
        page: searchResult.page,
        nbPages: searchResult.nbPages,
        hitsPerPage: searchResult.hitsPerPage,
        processingTimeMS: searchResult.processingTimeMS,
        query: searchResult.query,
      }
    }

    // Fallback to database search
    return this.searchTagsInDatabase(query, options)
  }

  // Multi-index search
  async searchAll(query: string, options: {
    postsLimit?: number
    usersLimit?: number
    tagsLimit?: number
  } = {}) {
    const {
      postsLimit = 5,
      usersLimit = 5,
      tagsLimit = 10,
    } = options

    const [posts, users, tags] = await Promise.all([
      this.searchPosts(query, { hitsPerPage: postsLimit }),
      this.searchUsers(query, { hitsPerPage: usersLimit }),
      this.searchTags(query, { hitsPerPage: tagsLimit }),
    ])

    return {
      posts: posts.hits,
      users: users.hits,
      tags: tags.hits,
      totalResults: posts.nbHits + users.nbHits + tags.nbHits,
    }
  }

  // Delete from index
  async deletePost(postId: string) {
    if (this.useAlgolia && this.postsIndex) {
      await this.postsIndex.deleteObject(postId)
    }
  }

  async deleteUser(userId: string) {
    if (this.useAlgolia && this.usersIndex) {
      await this.usersIndex.deleteObject(userId)
    }
  }

  async deleteTag(tagId: string) {
    if (this.useAlgolia && this.tagsIndex) {
      await this.tagsIndex.deleteObject(tagId)
    }
  }

  // Database fallback search methods
  private async searchPostsInDatabase(
    query: string, 
    options: SearchOptions
  ): Promise<SearchResult<IndexablePost>> {
    const startTime = Date.now()
    const page = options.page || 0
    const hitsPerPage = options.hitsPerPage || 20
    const offset = page * hitsPerPage

    // Build where clause
    const where: Prisma.PostWhereInput = {
      published: true,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } },
        { excerpt: { contains: query, mode: 'insensitive' } },
        { tags: { some: { name: { contains: query, mode: 'insensitive' } } } },
        { author: { username: { contains: query, mode: 'insensitive' } } },
      ],
    }

    // Get total count
    const totalCount = await this.db.post.count({ where })

    // Get posts
    const posts = await this.db.post.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            image: true,
          },
        },
        category: {
          select: {
            name: true,
          },
        },
        tags: {
          select: {
            name: true,
          },
        },
        stats: true,
        _count: {
          select: {
            comments: true,
            reactions: true,
          },
        },
      },
      orderBy: [
        { featured: 'desc' },
        { stats: { viewCount: 'desc' } },
        { publishedAt: 'desc' },
      ],
      skip: offset,
      take: hitsPerPage,
    })

    // Transform to search result format
    const hits: IndexablePost[] = posts.map(post => ({
      objectID: post.id,
      title: post.title,
      content: this.stripHtml(post.content || ''),
      excerpt: post.excerpt || '',
      slug: post.slug,
      author: {
        id: post.author.id,
        username: post.author.username,
        image: post.author.image || undefined,
      },
      tags: post.tags.map(t => t.name),
      category: post.category?.name,
      featured: post.featured,
      published: post.published,
      publishedAt: post.publishedAt?.getTime(),
      views: post.stats?.viewCount || 0,
      likes: post._count.reactions,
      comments: post._count.comments,
      readingTime: post.readingTime || 0,
      youtubeVideoId: post.youtubeVideoId || undefined,
    }))

    return {
      hits,
      nbHits: totalCount,
      page,
      nbPages: Math.ceil(totalCount / hitsPerPage),
      hitsPerPage,
      processingTimeMS: Date.now() - startTime,
      query,
    }
  }

  private async searchUsersInDatabase(
    query: string, 
    options: SearchOptions
  ): Promise<SearchResult<IndexableUser>> {
    const startTime = Date.now()
    const page = options.page || 0
    const hitsPerPage = options.hitsPerPage || 20
    const offset = page * hitsPerPage

    // Build where clause
    const where: Prisma.UserWhereInput = {
      OR: [
        { username: { contains: query, mode: 'insensitive' } },
        { bio: { contains: query, mode: 'insensitive' } },
        { profile: { displayName: { contains: query, mode: 'insensitive' } } },
        { profile: { interests: { hasSome: [query] } } },
        { profile: { skills: { hasSome: [query] } } },
      ],
    }

    // Get total count
    const totalCount = await this.db.user.count({ where })

    // Get users
    const users = await this.db.user.findMany({
      where,
      include: {
        profile: {
          select: {
            displayName: true,
            interests: true,
            skills: true,
          },
        },
        _count: {
          select: {
            followers: true,
            posts: true,
          },
        },
      },
      orderBy: [
        { verified: 'desc' },
        { followers: { _count: 'desc' } },
        { level: 'desc' },
      ],
      skip: offset,
      take: hitsPerPage,
    })

    // Transform to search result format
    const hits: IndexableUser[] = users.map(user => ({
      objectID: user.id,
      username: user.username,
      displayName: user.profile?.displayName,
      bio: user.bio || undefined,
      verified: user.verified,
      role: user.role,
      followers: user._count.followers,
      posts: user._count.posts,
      level: user.level,
      interests: user.profile?.interests || [],
      skills: user.profile?.skills || [],
      createdAt: user.createdAt.getTime(),
    }))

    return {
      hits,
      nbHits: totalCount,
      page,
      nbPages: Math.ceil(totalCount / hitsPerPage),
      hitsPerPage,
      processingTimeMS: Date.now() - startTime,
      query,
    }
  }

  private async searchTagsInDatabase(
    query: string, 
    options: SearchOptions
  ): Promise<SearchResult<IndexableTag>> {
    const startTime = Date.now()
    const page = options.page || 0
    const hitsPerPage = options.hitsPerPage || 50
    const offset = page * hitsPerPage

    // Build where clause
    const where: Prisma.TagWhereInput = {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    }

    // Get total count
    const totalCount = await this.db.tag.count({ where })

    // Get tags
    const tags = await this.db.tag.findMany({
      where,
      orderBy: [
        { featured: 'desc' },
        { postCount: 'desc' },
      ],
      skip: offset,
      take: hitsPerPage,
    })

    // Transform to search result format
    const hits: IndexableTag[] = tags.map(tag => ({
      objectID: tag.id,
      name: tag.name,
      slug: tag.slug,
      description: tag.description || undefined,
      postCount: tag.postCount,
      featured: tag.featured,
    }))

    return {
      hits,
      nbHits: totalCount,
      page,
      nbPages: Math.ceil(totalCount / hitsPerPage),
      hitsPerPage,
      processingTimeMS: Date.now() - startTime,
      query,
    }
  }

  // Helper methods
  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
  }

  // Reindex all data (for maintenance)
  async reindexAll() {
    if (!this.useAlgolia) {
      console.log('Algolia not configured, skipping reindex')
      return
    }

    console.log('Starting full reindex...')

    // Clear indices
    await Promise.all([
      this.postsIndex?.clearObjects(),
      this.usersIndex?.clearObjects(),
      this.tagsIndex?.clearObjects(),
    ])

    // Reindex posts
    let postCursor: string | undefined
    let postCount = 0

    while (true) {
      const posts = await this.db.post.findMany({
        where: { published: true },
        include: {
          author: true,
          category: true,
          tags: true,
          stats: true,
          _count: {
            select: {
              comments: true,
              reactions: true,
            },
          },
        },
        take: 100,
        cursor: postCursor ? { id: postCursor } : undefined,
        orderBy: { createdAt: 'asc' },
      })

      if (posts.length === 0) break

      for (const post of posts) {
        await this.indexPost(post)
        postCount++
      }

      postCursor = posts[posts.length - 1].id
      console.log(`Indexed ${postCount} posts...`)
    }

    // Reindex users
    let userCursor: string | undefined
    let userCount = 0

    while (true) {
      const users = await this.db.user.findMany({
        where: { status: 'ACTIVE' },
        include: {
          profile: true,
          _count: {
            select: {
              followers: true,
              posts: true,
            },
          },
        },
        take: 100,
        cursor: userCursor ? { id: userCursor } : undefined,
        orderBy: { createdAt: 'asc' },
      })

      if (users.length === 0) break

      for (const user of users) {
        await this.indexUser(user)
        userCount++
      }

      userCursor = users[users.length - 1].id
      console.log(`Indexed ${userCount} users...`)
    }

    // Reindex tags
    const tags = await this.db.tag.findMany()
    for (const tag of tags) {
      await this.indexTag(tag)
    }

    console.log(`Reindex complete: ${postCount} posts, ${userCount} users, ${tags.length} tags`)
  }
}

```

# src/server/services/youtube.service.ts
```ts
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

```

