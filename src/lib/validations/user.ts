// src/lib/validations/user.ts
import { z } from 'zod'

// Username validation
const usernameSchema = z.string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be less than 30 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')

// Profile update schema
export const updateProfileSchema = z.object({
  username: usernameSchema.optional(),
  bio: z.string()
    .max(500, 'Bio must be less than 500 characters')
    .optional(),
  image: z.string().url('Invalid image URL').optional().nullable(),
  displayName: z.string()
    .max(50, 'Display name must be less than 50 characters')
    .optional(),
  location: z.string()
    .max(100, 'Location must be less than 100 characters')
    .optional(),
  website: z.string()
    .url('Invalid website URL')
    .optional()
    .nullable(),
  twitterUsername: z.string()
    .max(15, 'Invalid Twitter username')
    .regex(/^[A-Za-z0-9_]*$/, 'Invalid Twitter username')
    .optional()
    .nullable(),
  instagramUsername: z.string()
    .max(30, 'Invalid Instagram username')
    .regex(/^[A-Za-z0-9_.]*$/, 'Invalid Instagram username')
    .optional()
    .nullable(),
  tiktokUsername: z.string()
    .max(24, 'Invalid TikTok username')
    .regex(/^[A-Za-z0-9_.]*$/, 'Invalid TikTok username')
    .optional()
    .nullable(),
  discordUsername: z.string()
    .max(32, 'Invalid Discord username')
    .optional()
    .nullable(),
  youtubeChannelId: z.string()
    .regex(/^UC[A-Za-z0-9_-]{22}$/, 'Invalid YouTube channel ID')
    .optional()
    .nullable(),
  interests: z.array(z.string()).max(10, 'Maximum 10 interests allowed').optional(),
  skills: z.array(z.string()).max(10, 'Maximum 10 skills allowed').optional(),
  pronouns: z.string().max(20, 'Pronouns must be less than 20 characters').optional(),
})

// User preferences schema
export const userPreferencesSchema = z.object({
  language: z.string().length(2, 'Invalid language code').optional(),
  timezone: z.string().optional(),
  theme: z.object({
    mode: z.enum(['light', 'dark', 'system']).optional(),
    primaryColor: z.string().optional(),
    fontFamily: z.string().optional(),
  }).optional(),
  notifications: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    sms: z.boolean().optional(),
  }).optional(),
  privacy: z.object({
    profileVisibility: z.enum(['public', 'followers', 'private']).optional(),
    showEmail: z.boolean().optional(),
    showStats: z.boolean().optional(),
    allowMessages: z.enum(['everyone', 'followers', 'none']).optional(),
  }).optional(),
  notificationPrefs: z.object({
    postLikes: z.boolean().optional(),
    postComments: z.boolean().optional(),
    newFollowers: z.boolean().optional(),
    mentions: z.boolean().optional(),
    directMessages: z.boolean().optional(),
    groupInvites: z.boolean().optional(),
    eventReminders: z.boolean().optional(),
    marketingEmails: z.boolean().optional(),
    weeklyDigest: z.boolean().optional(),
  }).optional(),
})

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: usernameSchema,
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  token: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

// Types
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type UserPreferencesInput = z.infer<typeof userPreferencesSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
