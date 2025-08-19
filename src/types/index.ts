// src/types/index.ts
import type { 
  User, 
  Post, 
  Comment, 
  Notification,
  NotificationType,
  UserRole,
  Message,
  WatchPartyChat,
  Reaction,
  JsonValue
} from '@prisma/client'

// ============ SOCKET.IO EVENT TYPES ============
export interface ServerToClientEvents {
  // Connection events
  connect: () => void
  disconnect: (reason: string) => void
  connect_error: (error: Error) => void
  error: (error: { message: string; code?: string }) => void
  reconnect: (attemptNumber: number) => void
  
  // Notification events
  notification: (notification: {
    id: string
    type: NotificationType
    title: string
    message: string
    data: JsonValue
    priority: number
    userId: string
    actorId: string | null
    entityId: string | null
    entityType: string | null
    imageUrl: string | null
    actionUrl: string | null
    createdAt: Date
    read: boolean
    readAt: Date | null
    dismissed: boolean
    dismissedAt: Date | null
  }) => void
  
  // Post events
  'post:created': (post: any) => void
  'post:updated': (post: any) => void
  'post:deleted': (postId: string) => void
  'post:liked': (data: { postId: string; userId: string }) => void
  
  // Comment events
  'comment:created': (comment: any) => void
  'comment:updated': (comment: any) => void
  'comment:deleted': (commentId: string) => void
  'comment:typing': (data: { userId: string; postId: string; typing: boolean }) => void
  'comment.created': (comment: any) => void
  'comment.updated': (comment: any) => void
  'comment.deleted': (commentId: string) => void
  'comment.typing': (data: any) => void
  
  // User events
  'user:online': (userId: string) => void
  'user:offline': (userId: string) => void
  'user:typing': (data: { userId: string; channelId: string }) => void
  
  // Message events
  'message:received': (message: any) => void
  'message:read': (data: { messageId: string; userId: string }) => void
  
  // Watch party events
  'watchParty:sync': (data: any) => void
  'watchParty:message': (message: any) => void
  'watchParty:userJoined': (data: any) => void
  'watchParty:userLeft': (data: any) => void
  
  // Achievement events
  'achievement:unlocked': (achievement: any) => void
  'level:up': (data: { level: number; rewards: any }) => void
  
  // System events
  'system:maintenance': (data: { enabled: boolean; message?: string }) => void
  'system:announcement': (message: string) => void
  announcement: (message: string) => void
  
  // Admin events (for admin dashboard)
  'admin:newUser': (user: any) => void
  'admin:newPost': (post: any) => void
  'admin:alert': (alert: any) => void
  'admin:notification': (notification: any) => void
  
  // Moderation events
  'moderation:newReport': (report: any) => void
  'moderation:aiFlag': (flag: any) => void
  
  // Collaboration events
  'collab:cursor': (data: any) => void
  'collab:change': (data: any) => void
}

export interface ClientToServerEvents {
  // Room management
  'join:room': (room: string) => void
  'leave:room': (room: string) => void
  
  // Typing indicators
  'typing:start': (data: { channelId: string; channelType: string }) => void
  'typing:stop': (data: { channelId: string; channelType: string }) => void
  
  // Presence
  'presence:update': (data: { status: string; location?: string }) => void
  
  // Watch party
  'watchParty:join': (partyId: string) => void
  'watchParty:leave': (partyId: string) => void
  'watchParty:sync': (data: { position: number; playing: boolean }) => void
  'watchParty:chat': (message: string) => void
  
  // Subscriptions
  'subscribe:post': (postId: string) => void
  'unsubscribe:post': (postId: string) => void
  
  // Ping
  ping: () => void
}

// ============ SYSTEM EVENT TYPES ============
export interface SystemEvents {
  // User events
  'user:created': { user: User }
  'user:updated': { user: User; changes: Partial<User> }
  'user:deleted': { userId: string }
  'user:login': { userId: string; ipAddress: string }
  'user:logout': { userId: string }
  'user:levelUp': { userId: string; oldLevel: number; newLevel: number }
  
  // Content events
  'post:created': { post: Post }
  'post:updated': { post: Post }
  'post:deleted': { postId: string }
  'comment:created': { comment: Comment }
  'comment:updated': { comment: Comment }
  'comment:deleted': { commentId: string }
  
  // Security events
  'security:loginFailed': { userId: string; ipAddress: string }
  'security:accountLocked': { userId: string; reason: string }
  'security:suspiciousActivity': { userId: string; activity: string }
  
  // Email events (added for compatibility)
  'email:sent': { to: string; subject: string; template: string }
  
  // Upload events
  'file:uploaded': { userId: string; fileId: string; size: number }
  'upload:progress': { userId: string; fileId: string; progress: number }
  
  // Auth events
  'auth:2faEnabled': { userId: string }
  'auth:2faDisabled': { userId: string }
  'auth:passwordResetRequested': { userId: string; email: string }
  
  // Error event
  error: { message: string; code?: string; stack?: string }
}

// ============ API RESPONSE TYPES ============
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  code?: string
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
  totalCount?: number
}

// ============ USER TYPES ============
export interface UserWithProfile extends User {
  profile: {
    id: string
    displayName: string | null
    location: string | null
    website: string | null
    bannerImage: string | null
    bio: string | null
    socialLinks: JsonValue
    themePreference: JsonValue
    notificationSettings: JsonValue
    privacySettings: JsonValue
  } | null
  stats: {
    totalPosts: number
    totalComments: number
    totalFollowers: number
    totalFollowing: number
  } | null
  _count: {
    posts: number
    comments: number
    followers: number
    following: number
  }
}

export interface PublicUser {
  id: string
  username: string
  image: string | null
  bio: string | null
  verified: boolean
  role: UserRole
  level: number
  createdAt: Date
}

export interface UserStats {
  posts: number
  followers: number
  following: number
  likes: number
  comments: number
  reactions: number
  achievements: number
  level: number
  experience: number
  sparklePoints: number
  premiumPoints: number
}

// ============ POST TYPES ============
export interface PostWithAuthor extends Post {
  author: PublicUser
  _count: {
    comments: number
    reactions: number
    views?: number
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
    id: string
    type: string
    userId: string
    user?: PublicUser
  }>
  comments?: CommentWithAuthor[]
  stats?: {
    views: number
    shares: number
    bookmarks: number
  }
}

// ============ COMMENT TYPES ============
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
    user?: PublicUser
  }>
  parent?: CommentWithAuthor | null
}

// ============ NOTIFICATION TYPES ============
export interface NotificationWithActor extends Notification {
  actor: PublicUser | null
  relatedPost?: {
    id: string
    title: string
  } | null
  relatedComment?: {
    id: string
    content: string
  } | null
}

// ============ FORM TYPES ============
export interface LoginFormData {
  email: string
  password: string
  rememberMe?: boolean
  twoFactorCode?: string
}

export interface RegisterFormData {
  email: string
  username: string
  password: string
  confirmPassword: string
  agreeToTerms: boolean
  marketingConsent?: boolean
}

export interface PostFormData {
  title: string
  content: string
  excerpt?: string
  coverImage?: string
  tags: string[]
  published: boolean
  categoryId?: string
  seriesId?: string
  seriesOrder?: number
  youtubeVideoId?: string
  contentType?: string
}

export interface ProfileFormData {
  displayName?: string
  bio?: string
  location?: string
  website?: string
  bannerImage?: string
  socialLinks?: {
    twitter?: string
    instagram?: string
    tiktok?: string
    discord?: string
    youtube?: string
    twitch?: string
  }
  themePreference?: {
    mode: 'light' | 'dark' | 'auto'
    primaryColor?: string
    accentColor?: string
  }
  notificationSettings?: {
    email: boolean
    push: boolean
    inApp: boolean
  }
  privacySettings?: {
    profileVisibility: 'public' | 'private' | 'friends'
    showEmail: boolean
    showLocation: boolean
    allowMessages: boolean
  }
}

// ============ SEARCH TYPES ============
export interface SearchFilters {
  query: string
  type?: 'posts' | 'users' | 'tags' | 'comments' | 'all'
  sortBy?: 'relevance' | 'recent' | 'popular' | 'trending'
  timeRange?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all'
  tags?: string[]
  author?: string
  hasVideo?: boolean
  contentType?: string
  minEngagement?: number
}

// ============ ERROR TYPES ============
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
  constructor(public retryAfter: number) {
    super('Too many requests', 'RATE_LIMIT_ERROR', 429)
    this.name = 'RateLimitError'
  }
}

// ============ UTILITY TYPES ============
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

// Admin specific types
export interface AdminDashboardStats {
  users: {
    total: number
    new: number
    active: number
    suspended: number
  }
  content: {
    posts: number
    comments: number
    reactions: number
  }
  moderation: {
    pending: number
    resolved: number
    autoBlocked: number
  }
  system: {
    cpuUsage: number
    memoryUsage: number
    diskUsage: number
    activeConnections: number
  }
}

export interface ModerationQueueItem {
  id: string
  type: 'post' | 'comment' | 'user' | 'message'
  entityId: string
  reason: string
  reportCount: number
  priority: number
  status: 'pending' | 'reviewing' | 'resolved' | 'escalated'
  assignedTo?: string
  createdAt: Date
  content?: string
  author?: PublicUser
}

export type LogContext = Record<string, any>
