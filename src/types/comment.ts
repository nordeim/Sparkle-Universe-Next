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
  author: User & {
    profile: Profile | null
  }
  post?: Pick<Post, 'id' | 'title' | 'slug' | 'authorId'>
  parent?: Comment & {
    author: Pick<User, 'id' | 'username'>
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
}

/**
 * Comment reaction input
 */
export interface CommentReactionInput {
  commentId: string
  type: ReactionType
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
}

/**
 * Comment thread parameters
 */
export interface CommentThreadParams {
  commentId: string
  limit?: number
  cursor?: string
  depth?: number
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
