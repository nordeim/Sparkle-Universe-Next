// src/server/services/search.service.ts
import { PrismaClient, Prisma } from '@prisma/client'
import { algoliasearch, SearchClient, SearchIndex } from 'algoliasearch'
import { CacheService, CacheType } from './cache.service'
import { ActivityService } from './activity.service'

interface SearchOptions {
  page?: number
  hitsPerPage?: number
  filters?: any
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

export class SearchService {
  private algoliaClient: SearchClient | null = null
  private postsIndex: SearchIndex | null = null
  private usersIndex: SearchIndex | null = null
  private tagsIndex: SearchIndex | null = null
  private cacheService: CacheService
  private activityService: ActivityService
  private useAlgolia: boolean

  constructor(private db: PrismaClient) {
    this.cacheService = new CacheService()
    this.activityService = new ActivityService(db)
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
  }

  async search(params: {
    query: string
    type: 'all' | 'posts' | 'users' | 'tags'
    limit: number
    page?: number
  }) {
    const { query, type, limit, page = 0 } = params
    const results: any = {}

    // Track search in SearchHistory
    await this.trackSearch({
      query,
      searchType: type,
    })

    if (type === 'all' || type === 'posts') {
      results.posts = await this.searchPosts(query, { 
        page, 
        hitsPerPage: limit 
      })
    }

    if (type === 'all' || type === 'users') {
      results.users = await this.searchUsers(query, { 
        page, 
        hitsPerPage: limit 
      })
    }

    if (type === 'all' || type === 'tags') {
      results.tags = await this.searchTags(query, { 
        page, 
        hitsPerPage: limit 
      })
    }

    return results
  }

  async searchPosts(
    query: string, 
    options: SearchOptions & { filters?: any } = {}
  ): Promise<SearchResult> {
    // Check cache
    const cacheKey = `search:posts:${query}:${JSON.stringify(options)}`
    const cached = await this.cacheService.get<SearchResult>(cacheKey)
    if (cached) return cached

    let result: SearchResult

    if (this.useAlgolia && this.postsIndex) {
      // Build Algolia filters
      const algoliaFilters: string[] = []
      
      if (options.filters?.authorId) {
        algoliaFilters.push(`author.id:"${options.filters.authorId}"`)
      }
      if (options.filters?.category) {
        algoliaFilters.push(`category:"${options.filters.category}"`)
      }
      if (options.filters?.featured !== undefined) {
        algoliaFilters.push(`featured:${options.filters.featured}`)
      }
      if (options.filters?.contentType) {
        algoliaFilters.push(`contentType:"${options.filters.contentType}"`)
      }
      if (options.filters?.hasYoutubeVideo !== undefined) {
        algoliaFilters.push(`hasYoutubeVideo:${options.filters.hasYoutubeVideo}`)
      }

      // Use Algolia
      result = await this.searchWithAlgolia(
        this.postsIndex,
        query,
        {
          ...options,
          filters: algoliaFilters.join(' AND ')
        }
      )
    } else {
      // Fallback to database
      result = await this.searchPostsInDatabase(query, options)
    }

    // Update SearchIndex
    await this.updateSearchIndex('posts', query, result.nbHits)

    // Cache for 5 minutes
    await this.cacheService.set(cacheKey, result, 300)

    return result
  }

  async searchUsers(
    query: string, 
    options: SearchOptions & { filters?: any } = {}
  ): Promise<SearchResult> {
    // Check cache
    const cacheKey = `search:users:${query}:${JSON.stringify(options)}`
    const cached = await this.cacheService.get<SearchResult>(cacheKey)
    if (cached) return cached

    let result: SearchResult

    if (this.useAlgolia && this.usersIndex) {
      // Build Algolia filters
      const algoliaFilters: string[] = []
      
      if (options.filters?.verified !== undefined) {
        algoliaFilters.push(`verified:${options.filters.verified}`)
      }
      if (options.filters?.role) {
        algoliaFilters.push(`role:"${options.filters.role}"`)
      }

      result = await this.searchWithAlgolia(
        this.usersIndex,
        query,
        {
          ...options,
          filters: algoliaFilters.join(' AND ')
        }
      )
    } else {
      result = await this.searchUsersInDatabase(query, options)
    }

    // Update SearchIndex
    await this.updateSearchIndex('users', query, result.nbHits)

    // Cache for 5 minutes
    await this.cacheService.set(cacheKey, result, 300)

    return result
  }

  async searchTags(
    query: string, 
    options: SearchOptions & { filters?: any } = {}
  ): Promise<SearchResult> {
    if (this.useAlgolia && this.tagsIndex) {
      const algoliaFilters: string[] = []
      
      if (options.filters?.featured !== undefined) {
        algoliaFilters.push(`featured:${options.filters.featured}`)
      }

      return this.searchWithAlgolia(
        this.tagsIndex,
        query,
        {
          ...options,
          filters: algoliaFilters.join(' AND ')
        }
      )
    }

    return this.searchTagsInDatabase(query, options)
  }

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

  async getSuggestions(query: string, limit: number) {
    const cacheKey = `suggestions:${query}`
    const cached = await this.cacheService.get<string[]>(cacheKey)
    if (cached) return cached

    // Get from SearchHistory
    const suggestions = await this.db.searchHistory.findMany({
      where: {
        query: {
          startsWith: query,
          mode: 'insensitive',
        },
      },
      select: {
        query: true,
      },
      distinct: ['query'],
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })

    const terms = suggestions.map(s => s.query)
    await this.cacheService.set(cacheKey, terms, 300) // Cache for 5 minutes

    return terms
  }

  async getTrendingSearches() {
    const cacheKey = 'trending:searches'
    const cached = await this.cacheService.get(cacheKey, CacheType.TRENDING)
    if (cached) return cached

    // Get from SearchHistory
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    
    const trending = await this.db.searchHistory.groupBy({
      by: ['query'],
      where: {
        createdAt: {
          gte: oneHourAgo,
        },
      },
      _count: {
        query: true,
      },
      orderBy: {
        _count: {
          query: 'desc',
        },
      },
      take: 10,
    })

    const result = trending.map(t => ({
      term: t.query,
      count: t._count.query,
    }))

    await this.cacheService.set(cacheKey, result, 900, CacheType.TRENDING)
    return result
  }

  async getUserSearchHistory(userId: string, limit: number) {
    return this.db.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  async clearUserSearchHistory(userId: string) {
    await this.db.searchHistory.deleteMany({
      where: { userId },
    })
    return { success: true }
  }

  async trackSearch(params: {
    userId?: string
    query: string
    searchType?: string
  }) {
    await this.db.searchHistory.create({
      data: {
        userId: params.userId,
        query: params.query,
        searchType: params.searchType,
        resultCount: 0, // Will be updated later
      },
    })
  }

  private async updateSearchIndex(
    entityType: string,
    query: string,
    resultCount: number
  ) {
    // Update or create SearchIndex entry
    await this.db.searchIndex.upsert({
      where: {
        entityType_entityId: {
          entityType: 'query',
          entityId: query,
        },
      },
      create: {
        entityType: 'query',
        entityId: query,
        searchableText: query,
        metadata: {
          count: 1,
          lastSearched: new Date(),
          resultCount,
        },
      },
      update: {
        metadata: {
          count: { increment: 1 },
          lastSearched: new Date(),
          resultCount,
        },
      },
    })
  }

  async indexPost(post: any) {
    // Index in SearchIndex table
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
        searchableText: `${post.title} ${post.excerpt || ''} ${this.stripHtml(post.content || '')}`,
        title: post.title,
        description: post.excerpt,
        tags: post.tags?.map((t: any) => t.tag.name) || [],
        metadata: {
          slug: post.slug,
          authorId: post.authorId,
          categoryId: post.categoryId,
        },
      },
      update: {
        searchableText: `${post.title} ${post.excerpt || ''} ${this.stripHtml(post.content || '')}`,
        title: post.title,
        description: post.excerpt,
        tags: post.tags?.map((t: any) => t.tag.name) || [],
        lastIndexedAt: new Date(),
      },
    })

    // Index in Algolia if available
    if (this.useAlgolia && this.postsIndex) {
      await this.postsIndex.saveObjects([{
        objectID: post.id,
        title: post.title,
        content: this.stripHtml(post.content || ''),
        excerpt: post.excerpt || '',
        slug: post.slug,
        author: post.author,
        tags: post.tags?.map((t: any) => t.tag.name) || [],
        category: post.category?.name,
        featured: post.featured,
        published: post.published,
        contentType: post.contentType,
        hasYoutubeVideo: !!post.youtubeVideoId,
        publishedAt: post.publishedAt?.getTime(),
      }])
    }
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

    if (this.useAlgolia && this.postsIndex) {
      await this.postsIndex.deleteObjects([postId])
    }
  }

  async reindexContent(type: 'posts' | 'users' | 'tags' | 'all') {
    const results = {
      posts: 0,
      users: 0,
      tags: 0,
    }

    if (type === 'all' || type === 'posts') {
      const posts = await this.db.post.findMany({
        where: { published: true },
        include: {
          author: true,
          category: true,
          tags: {
            include: { tag: true },
          },
        },
      })

      for (const post of posts) {
        await this.indexPost(post)
        results.posts++
      }
    }

    if (type === 'all' || type === 'users') {
      const users = await this.db.user.findMany({
        where: { status: 'ACTIVE' },
        include: {
          profile: true,
        },
      })

      for (const user of users) {
        await this.indexUser(user)
        results.users++
      }
    }

    if (type === 'all' || type === 'tags') {
      const tags = await this.db.tag.findMany()
      
      for (const tag of tags) {
        await this.indexTag(tag)
        results.tags++
      }
    }

    return results
  }

  private async indexUser(user: any) {
    await this.db.searchIndex.upsert({
      where: {
        entityType_entityId: {
          entityType: 'user',
          entityId: user.id,
        },
      },
      create: {
        entityType: 'user',
        entityId: user.id,
        searchableText: `${user.username} ${user.bio || ''} ${user.profile?.displayName || ''}`,
        title: user.username,
        description: user.bio,
        metadata: {
          verified: user.verified,
          role: user.role,
        },
      },
      update: {
        searchableText: `${user.username} ${user.bio || ''} ${user.profile?.displayName || ''}`,
        title: user.username,
        description: user.bio,
        lastIndexedAt: new Date(),
      },
    })

    if (this.useAlgolia && this.usersIndex) {
      await this.usersIndex.saveObjects([{
        objectID: user.id,
        username: user.username,
        displayName: user.profile?.displayName,
        bio: user.bio,
        verified: user.verified,
        role: user.role,
        interests: user.profile?.interests || [],
        skills: user.profile?.skills || [],
      }])
    }
  }

  private async indexTag(tag: any) {
    await this.db.searchIndex.upsert({
      where: {
        entityType_entityId: {
          entityType: 'tag',
          entityId: tag.id,
        },
      },
      create: {
        entityType: 'tag',
        entityId: tag.id,
        searchableText: `${tag.name} ${tag.description || ''}`,
        title: tag.name,
        description: tag.description,
        metadata: {
          slug: tag.slug,
          featured: tag.featured,
        },
      },
      update: {
        searchableText: `${tag.name} ${tag.description || ''}`,
        title: tag.name,
        description: tag.description,
        lastIndexedAt: new Date(),
      },
    })

    if (this.useAlgolia && this.tagsIndex) {
      await this.tagsIndex.saveObjects([{
        objectID: tag.id,
        name: tag.name,
        slug: tag.slug,
        description: tag.description,
        postCount: tag.postCount,
        featured: tag.featured,
      }])
    }
  }

  private async searchWithAlgolia(
    index: SearchIndex,
    query: string,
    options: SearchOptions
  ): Promise<SearchResult> {
    const result = await index.search(query, options)
    
    return {
      hits: result.hits,
      nbHits: result.nbHits,
      page: result.page,
      nbPages: result.nbPages,
      hitsPerPage: result.hitsPerPage,
      facets: result.facets,
      processingTimeMS: result.processingTimeMS,
      query: result.query,
    }
  }

  private async searchPostsInDatabase(
    query: string, 
    options: SearchOptions & { filters?: any }
  ): Promise<SearchResult> {
    const startTime = Date.now()
    const page = options.page || 0
    const hitsPerPage = options.hitsPerPage || 20
    const offset = page * hitsPerPage

    // Build where clause
    const where: Prisma.PostWhereInput = {
      published: true,
      deleted: false,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { excerpt: { contains: query, mode: 'insensitive' } },
      ],
    }

    // Apply filters
    if (options.filters?.authorId) {
      where.authorId = options.filters.authorId
    }
    if (options.filters?.category) {
      where.category = {
        name: options.filters.category,
      }
    }
    if (options.filters?.featured !== undefined) {
      where.featured = options.filters.featured
    }
    if (options.filters?.contentType) {
      where.contentType = options.filters.contentType
    }
    if (options.filters?.hasYoutubeVideo !== undefined) {
      if (options.filters.hasYoutubeVideo) {
        where.youtubeVideoId = { not: null }
      } else {
        where.youtubeVideoId = null
      }
    }

    const [posts, totalCount] = await Promise.all([
      this.db.post.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              image: true,
            },
          },
          category: true,
          tags: {
            include: { tag: true },
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
          { publishedAt: 'desc' },
        ],
        skip: offset,
        take: hitsPerPage,
      }),
      this.db.post.count({ where }),
    ])

    const hits = posts.map(post => ({
      objectID: post.id,
      title: post.title,
      excerpt: post.excerpt || '',
      slug: post.slug,
      author: post.author,
      tags: post.tags.map(t => t.tag.name),
      category: post.category?.name,
      featured: post.featured,
      published: post.published,
      publishedAt: post.publishedAt?.getTime(),
      views: post.stats?.viewCount || 0,
      likes: post._count.reactions,
      comments: post._count.comments,
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
    options: SearchOptions & { filters?: any }
  ): Promise<SearchResult> {
    const startTime = Date.now()
    const page = options.page || 0
    const hitsPerPage = options.hitsPerPage || 20
    const offset = page * hitsPerPage

    // Build where clause
    const where: Prisma.UserWhereInput = {
      status: 'ACTIVE',
      OR: [
        { username: { contains: query, mode: 'insensitive' } },
        { bio: { contains: query, mode: 'insensitive' } },
      ],
    }

    // Apply filters
    if (options.filters?.verified !== undefined) {
      where.verified = options.filters.verified
    }
    if (options.filters?.role) {
      where.role = options.filters.role
    }

    const [users, totalCount] = await Promise.all([
      this.db.user.findMany({
        where,
        include: {
          profile: true,
          _count: {
            select: {
              followers: true,
              posts: true,
            },
          },
        },
        orderBy: [
          { verified: 'desc' },
          { level: 'desc' },
        ],
        skip: offset,
        take: hitsPerPage,
      }),
      this.db.user.count({ where }),
    ])

    const hits = users.map(user => ({
      objectID: user.id,
      username: user.username,
      displayName: user.profile?.displayName,
      bio: user.bio,
      verified: user.verified,
      role: user.role,
      followers: user._count.followers,
      posts: user._count.posts,
      level: user.level,
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
    options: SearchOptions & { filters?: any }
  ): Promise<SearchResult> {
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

    // Apply filters
    if (options.filters?.featured !== undefined) {
      where.featured = options.filters.featured
    }

    const [tags, totalCount] = await Promise.all([
      this.db.tag.findMany({
        where,
        orderBy: [
          { featured: 'desc' },
          { postCount: 'desc' },
        ],
        skip: offset,
        take: hitsPerPage,
      }),
      this.db.tag.count({ where }),
    ])

    const hits = tags.map(tag => ({
      objectID: tag.id,
      name: tag.name,
      slug: tag.slug,
      description: tag.description,
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

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
  }
}
