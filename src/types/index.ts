// src/types/index.ts
import { User, Post, Comment, Notification } from '@prisma/client'

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasMore: boolean
}

export interface CursorPaginatedResponse<T> {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
}

// User types
export interface UserWithProfile extends User {
  profile: {
    displayName: string | null
    location: string | null
    website: string | null
    bannerImage: string | null
  } | null
}

export interface PublicUser {
  id: string
  username: string
  image: string | null
  bio: string | null
  verified: boolean
  level: number
  createdAt: Date
}

export interface UserStats {
  posts: number
  followers: number
  following: number
  likes: number
}

// Post types
export interface PostWithAuthor extends Post {
  author: PublicUser
  _count: {
    comments: number
    reactions: number
  }
}

export interface PostWithDetails extends PostWithAuthor {
  tags: Array<{
    tag: {
      id: string
      name: string
      slug: string
    }
  }>
  reactions: Array<{
    type: string
    userId: string
  }>
}

// Comment types
export interface CommentWithAuthor extends Comment {
  author: PublicUser
  _count: {
    reactions: number
    replies: number
  }
}

export interface CommentWithReplies extends CommentWithAuthor {
  replies: CommentWithAuthor[]
  reactions: Array<{
    type: string
    userId: string
  }>
}

// Notification types
export interface NotificationWithActor extends Notification {
  actor: PublicUser | null
}

// Form types
export interface LoginFormData {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterFormData {
  email: string
  username: string
  password: string
  confirmPassword: string
  agreeToTerms: boolean
}

export interface PostFormData {
  title: string
  content: string
  excerpt?: string
  coverImage?: string
  tags: string[]
  published: boolean
}

export interface ProfileFormData {
  displayName?: string
  bio?: string
  location?: string
  website?: string
  socialLinks?: {
    twitter?: string
    instagram?: string
    tiktok?: string
    discord?: string
    youtube?: string
  }
}

// Search types
export interface SearchFilters {
  query: string
  type?: 'posts' | 'users' | 'tags'
  sortBy?: 'relevance' | 'recent' | 'popular'
  timeRange?: 'day' | 'week' | 'month' | 'year' | 'all'
  tags?: string[]
}

// WebSocket event types
export interface SocketEvents {
  // Connection events
  connect: () => void
  disconnect: (reason: string) => void
  error: (error: Error) => void

  // User events
  userOnline: (userId: string) => void
  userOffline: (userId: string) => void
  userTyping: (data: { userId: string; channelId: string }) => void

  // Notification events
  notification: (notification: NotificationWithActor) => void

  // Real-time updates
  postUpdate: (post: PostWithAuthor) => void
  commentUpdate: (comment: CommentWithAuthor) => void
  reactionUpdate: (data: { 
    entityType: 'post' | 'comment'
    entityId: string
    reactions: Record<string, number>
  }) => void
}

// Error types
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400,
    public isOperational: boolean = true
  ) {
    super(message)
    this.name = 'AppError'
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public fields?: Record<string, string>) {
    super(message, 'VALIDATION_ERROR', 400)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403)
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404)
    this.name = 'NotFoundError'
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter: number) {
    super('Too many requests', 'RATE_LIMIT_ERROR', 429)
    this.name = 'RateLimitError'
  }
}

// Utility types
export type Nullable<T> = T | null
export type Optional<T> = T | undefined
export type Maybe<T> = T | null | undefined

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
  Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
  }[Keys]

export type RequireOnlyOne<T, Keys extends keyof T = keyof T> =
  Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?:
      Required<Pick<T, K>> &
      Partial<Record<Exclude<Keys, K>, undefined>>
  }[Keys]
