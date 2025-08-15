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
