// src/lib/validations/comment.ts
import { z } from 'zod'

export const createCommentSchema = z.object({
  content: z.string()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment must be less than 1000 characters'),
  postId: z.string().cuid(),
  parentId: z.string().cuid().optional(),
  youtubeTimestamp: z.number().int().min(0).optional(),
})

export const updateCommentSchema = z.object({
  id: z.string().cuid(),
  content: z.string()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment must be less than 1000 characters'),
})

export type CreateCommentInput = z.infer<typeof createCommentSchema>
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>
