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
