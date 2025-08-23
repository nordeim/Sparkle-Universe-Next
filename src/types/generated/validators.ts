// Runtime Validators using Zod
// Generated on 2025-08-23T14:45:26.285Z

import { z } from 'zod'

// User validation schemas
export const UserCreateSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/),
  password: z.string().min(8).max(100),
  role: z.enum(['USER', 'CREATOR']).optional().default('USER'),
})

export const UserUpdateSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  bio: z.string().max(500).optional(),
  image: z.string().url().optional(),
})

// Profile validation schemas  
export const ProfileUpdateSchema = z.object({
  displayName: z.string().max(50).optional(),
  location: z.string().max(100).optional(),
  website: z.string().url().optional(),
  pronouns: z.string().max(30).optional(),
  interests: z.array(z.string()).max(10).optional(),
  skills: z.array(z.string()).max(10).optional(),
})

// Post validation schemas
export const PostCreateSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.any(), // Should be PostContent type
  contentType: z.enum([
    'BLOG', 'LIVE_BLOG', 'POLL', 'VIDEO_REVIEW', 
    'FAN_ART', 'THEORY_THREAD', 'SERIES', 'TUTORIAL', 'NEWS'
  ]),
  categoryId: z.string().cuid().optional(),
  tags: z.array(z.string()).max(10).optional(),
  isDraft: z.boolean().optional().default(false),
  allowComments: z.boolean().optional().default(true),
})

// Comment validation schemas
export const CommentCreateSchema = z.object({
  content: z.string().min(1).max(5000),
  postId: z.string().cuid(),
  parentId: z.string().cuid().optional(),
  youtubeTimestamp: z.number().min(0).optional(),
})

// Message validation schemas
export const MessageCreateSchema = z.object({
  content: z.string().min(1).max(10000).optional(),
  encryptedContent: z.string().optional(),
  attachments: z.array(z.any()).optional(),
  messageType: z.enum(['text', 'image', 'video', 'audio', 'file', 'system']),
}).refine(
  data => data.content || data.encryptedContent,
  { message: 'Either content or encryptedContent must be provided' }
)

// Trade validation schemas
export const TradeCreateSchema = z.object({
  recipientId: z.string().cuid(),
  initiatorItems: z.array(z.object({
    itemId: z.string(),
    quantity: z.number().int().positive(),
  })),
  recipientItems: z.array(z.object({
    itemId: z.string(),
    quantity: z.number().int().positive(),
  })),
  message: z.string().max(500).optional(),
})

// Points validation
export const PointsTransferSchema = z.object({
  recipientId: z.string().cuid(),
  amount: z.number().int().positive(),
  currencyType: z.enum(['sparklePoints', 'premiumPoints']),
  message: z.string().max(200).optional(),
})

// Export type inference helpers
export type UserCreateInput = z.infer<typeof UserCreateSchema>
export type UserUpdateInput = z.infer<typeof UserUpdateSchema>
export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>
export type PostCreateInput = z.infer<typeof PostCreateSchema>
export type CommentCreateInput = z.infer<typeof CommentCreateSchema>
export type MessageCreateInput = z.infer<typeof MessageCreateSchema>
export type TradeCreateInput = z.infer<typeof TradeCreateSchema>
export type PointsTransferInput = z.infer<typeof PointsTransferSchema>

// Validation helper function
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  } else {
    return { success: false, errors: result.error }
  }
}
