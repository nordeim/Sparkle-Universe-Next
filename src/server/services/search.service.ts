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
