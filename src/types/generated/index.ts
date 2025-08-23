// Generated Type Exports
// Generated on 2025-08-23T15:20:33.845Z
// Auto-generated index file - DO NOT EDIT MANUALLY

export * from './enums'
export * from './models'
export * from './json-types'
export * from './validators'
export * from './api'
export * from './components'
export * from './utils'

// Re-export specific Prisma types for convenience
export type {
  User,
  Profile,
  Post,
  Comment,
  Group,
  Event,
  Message,
  Trade,
  Quest,
  Achievement,
  WatchParty,
  YoutubeChannel,
} from './models'

// Re-export commonly used enums
export {
  UserRole,
  UserStatus,
  NotificationType,
  ReactionType,
  ContentType,
  ContentStatus,
  BadgeRarity,
  QuestType,
  QuestStatus,
  SubscriptionTier,
} from './enums'

// Re-export validation schemas
export {
  UserCreateSchema,
  UserUpdateSchema,
  PostCreateSchema,
  CommentCreateSchema,
  validateInput,
} from './validators'

// Re-export JSON types
export {
  ThemePreference,
  NotificationSettings,
  PrivacySettings,
  PostContent,
  QuestRequirements,
  isThemePreference,
  isPostContent,
  isQuestRequirements,
} from './json-types'

// Type guard helpers
export const isUser = (obj: any): obj is import('./models').User => {
  return obj && typeof obj === 'object' && 'email' in obj && 'username' in obj
}

export const isPost = (obj: any): obj is import('./models').Post => {
  return obj && typeof obj === 'object' && 'title' in obj && 'content' in obj
}

export const isComment = (obj: any): obj is import('./models').Comment => {
  return obj && typeof obj === 'object' && 'content' in obj && 'postId' in obj
}
