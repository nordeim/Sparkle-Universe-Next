// src/types/comment.ts
import type { 
  Comment, 
  User, 
  Profile, 
  Post, 
  ReactionType,
  ModerationStatus 
} from '@prisma/client'

/**
 * Edit history entry for comments
 */
export interface EditHistoryEntry {
  content: string
  editedAt: Date | string
  editorId?: string
  editorUsername?: string
}

/**
 * Reaction count by type
 */
export interface ReactionCounts {
  [ReactionType.LIKE]: number
  [ReactionType.LOVE]: number
  [ReactionType.FIRE]: number
  [ReactionType.SPARKLE]: number
  [ReactionType.MIND_BLOWN]: number
  [ReactionType.LAUGH]: number
  [ReactionType.CRY]: number
  [ReactionType.ANGRY]: number
  [ReactionType.CUSTOM]: number
  total: number
}

/**
 * User reaction state for a comment
 */
export interface UserReactionState {
  hasReacted: boolean
  reactionType: ReactionType | null
  reactionId?: string
}

/**
 * Extended comment with relations
 */
export interface CommentWithRelations extends Comment {
  author: (User & {
    profile: Profile | null
  }) | null
  post?: Pick<Post, 'id' | 'title' | 'slug' | 'authorId'>
  parent?: Comment & {
    author: Pick<User, 'id' | 'username'> | null
  }
  replies?: CommentWithRelations[]
  _count: {
    reactions: number
    replies: number
  }
  reactionCounts?: ReactionCounts
  userReaction?: UserReactionState
  isLiked?: boolean
  editHistory?: EditHistoryEntry[]
}

/**
 * Comment with reactions for display
 */
export interface CommentWithReactions {
  id: string
  content: string
  authorId: string | null
  authorName: string | null
  author: {
    id: string
    username: string
    image: string | null
    profile: any
  } | null
  reactionCounts: ReactionCounts
  userReaction: {
    hasReacted: boolean
    reactionType: ReactionType | null
  }
  _count: {
    reactions: number
    replies: number
  }
  replies?: CommentWithReactions[]
  createdAt: Date
  updatedAt: Date
  edited: boolean
  editedAt: Date | null
  pinned: boolean
  deleted: boolean
  version: number
  youtubeTimestamp?: number | null
  quotedTimestamp?: string | null
  parentId?: string | null
  postId: string
  moderationStatus: ModerationStatus
}

/**
 * Comment form data
 */
export interface CommentFormData {
  content: string
  parentId?: string
  youtubeTimestamp?: number
  quotedTimestamp?: string
  mentions?: string[]
}

/**
 * Comment creation input
 */
export interface CreateCommentInput extends CommentFormData {
  postId: string
}

/**
 * Comment update input
 */
export interface UpdateCommentInput {
  id: string
  content: string
  version?: number
}

/**
 * Comment reaction input
 */
export interface CommentReactionInput {
  commentId: string
  type: ReactionType
  remove?: boolean
}

/**
 * Comment list parameters
 */
export interface CommentListParams {
  postId: string
  limit?: number
  cursor?: string
  sortBy?: 'newest' | 'oldest' | 'popular'
  parentId?: string | null
  includeDeleted?: boolean
  moderationStatus?: ModerationStatus[]
  userId?: string
}

/**
 * Comment thread parameters
 */
export interface CommentThreadParams {
  commentId: string
  limit?: number
  cursor?: string
  depth?: number
  userId?: string
}

/**
 * Typing indicator data
 */
export interface TypingIndicator {
  userId: string
  username: string
  postId: string
  parentId?: string
  timestamp: number
}

/**
 * Comment moderation data
 */
export interface CommentModerationData {
  commentId: string
  status: ModerationStatus
  notes?: string
  reviewerId?: string
  reviewedAt?: Date
}

/**
 * Comment report data
 */
export interface CommentReportData {
  commentId: string
  reason: string
  description?: string
  evidence?: any
}

/**
 * Comment list response
 */
export interface CommentListResponse {
  items: CommentWithReactions[]
  nextCursor?: string
}

/**
 * Comment thread response
 */
export interface CommentThreadResponse {
  items: CommentWithReactions[]
  nextCursor?: string
}
