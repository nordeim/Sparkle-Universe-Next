// src/server/api/routers/search.ts
import { z } from 'zod'
import { 
  createTRPCRouter, 
  publicProcedure,
  protectedProcedure 
} from '@/server/api/trpc'
import { SearchService } from '@/server/services/search.service'

export const searchRouter = createTRPCRouter({
  // Global search
  search: publicProcedure
    .input(z.object({
      query: z.string().min(1).max(100),
      type: z.enum(['all', 'posts', 'users', 'tags']).default('all'),
      limit: z.number().min(1).max(50).default(10),
      page: z.number().min(0).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const searchService = new SearchService(ctx.db)
      
      // Track search for analytics
      if (ctx.session?.user?.id) {
        await searchService.trackSearch({
          userId: ctx.session.user.id,
          query: input.query,
          searchType: input.type,
        })
      }
      
      return searchService.search(input)
    }),

  // Search posts with filters
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
        contentType: z.string().optional(),
        hasYoutubeVideo: z.boolean().optional(),
      }).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const searchService = new SearchService(ctx.db)
      return searchService.searchPosts(input.query, {
        page: input.page,
        hitsPerPage: input.limit,
        filters: input.filters,
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
      return searchService.searchUsers(input.query, {
        page: input.page,
        hitsPerPage: input.limit,
        filters: input.filters,
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
      return searchService.searchTags(input.query, {
        hitsPerPage: input.limit,
        filters: { featured: input.featured },
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

  // User's search history
  history: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(10),
    }))
    .query(async ({ ctx, input }) => {
      const searchService = new SearchService(ctx.db)
      return searchService.getUserSearchHistory(ctx.session.user.id, input.limit)
    }),

  // Clear search history
  clearHistory: protectedProcedure
    .mutation(async ({ ctx }) => {
      const searchService = new SearchService(ctx.db)
      return searchService.clearUserSearchHistory(ctx.session.user.id)
    }),

  // Index content (admin only)
  reindex: protectedProcedure
    .input(z.object({
      type: z.enum(['posts', 'users', 'tags', 'all']),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check admin permission
      if (ctx.session.user.role !== 'ADMIN' && ctx.session.user.role !== 'SYSTEM') {
        throw new Error('Unauthorized')
      }
      
      const searchService = new SearchService(ctx.db)
      return searchService.reindexContent(input.type)
    }),
})
