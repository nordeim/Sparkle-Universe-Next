// src/types/comment.ts
import { ReactionType } from '@prisma/client'

export interface EditHistoryEntry {
  content: string
  editedAt: string
  editorId: string
}

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
}
