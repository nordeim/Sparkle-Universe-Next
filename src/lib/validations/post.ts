// src/lib/validations/post.ts
import { z } from 'zod'

// Base post schema
const postBaseSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .transform(val => val.trim()),
  content: z.string()
    .min(10, 'Content must be at least 10 characters')
    .max(50000, 'Content must be less than 50,000 characters'),
  excerpt: z.string()
    .max(500, 'Excerpt must be less than 500 characters')
    .optional()
    .transform(val => val?.trim()),
  categoryId: z.string().cuid().optional(),
  youtubeVideoId: z.string()
    .regex(/^[a-zA-Z0-9_-]{11}$/, 'Invalid YouTube video ID')
    .optional(),
})

// Create post schema
export const createPostSchema = postBaseSchema.extend({
  tags: z.array(z.string()
    .min(1)
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Tags can only contain letters, numbers, hyphens, and underscores')
  )
    .max(5, 'Maximum 5 tags allowed')
    .optional()
    .default([]),
  seriesId: z.string().cuid().optional(),
  seriesOrder: z.number().int().positive().optional(),
  isDraft: z.boolean().optional().default(false),
})

// Update post schema
export const updatePostSchema = z.object({
  id: z.string().cuid(),
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .transform(val => val.trim())
    .optional(),
  content: z.string()
    .min(10, 'Content must be at least 10 characters')
    .max(50000, 'Content must be less than 50,000 characters')
    .optional(),
  excerpt: z.string()
    .max(500, 'Excerpt must be less than 500 characters')
    .optional()
    .transform(val => val?.trim()),
  tags: z.array(z.string()
    .min(1)
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Tags can only contain letters, numbers, hyphens, and underscores')
  )
    .max(5, 'Maximum 5 tags allowed')
    .optional(),
  categoryId: z.string().cuid().optional(),
  youtubeVideoId: z.string()
    .regex(/^[a-zA-Z0-9_-]{11}$/, 'Invalid YouTube video ID')
    .optional()
    .nullable(),
})

// Post filter schema
export const postFilterSchema = z.object({
  limit: z.number().int().min(1).max(100).default(10),
  cursor: z.string().optional(),
  authorId: z.string().cuid().optional(),
  categoryId: z.string().cuid().optional(),
  tag: z.string().optional(),
  featured: z.boolean().optional(),
  sortBy: z.enum(['latest', 'popular', 'trending']).optional().default('latest'),
})

// Series schema
export const createSeriesSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  coverImage: z.string().url().optional(),
})

// Types
export type CreatePostInput = z.infer<typeof createPostSchema>
export type UpdatePostInput = z.infer<typeof updatePostSchema>
export type PostFilterInput = z.infer<typeof postFilterSchema>
export type CreateSeriesInput = z.infer<typeof createSeriesSchema>

// YouTube validation helpers
export const extractYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^[a-zA-Z0-9_-]{11}$/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1] || match[0]
    }
  }

  return null
}

export const validateYouTubeUrl = (url: string): boolean => {
  return extractYouTubeVideoId(url) !== null
}
