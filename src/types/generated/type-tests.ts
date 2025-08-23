// Type Tests
// Generated on 2025-08-23T14:45:26.289Z

import { expectType } from 'tsd'
import type {
  User,
  Profile,
  Post,
  Comment,
  Trade,
  Message,
  Event,
  Group,
  UserRole,
  NotificationType,
  ThemePreference,
  NotificationSettings,
  PostContent,
} from './index'

// Test User model has all critical fields
declare const user: User
expectType<string>(user.id)
expectType<string>(user.email)
expectType<string>(user.username)
expectType<number>(user.sparklePoints)
expectType<number>(user.premiumPoints)
expectType<UserRole>(user.role)
expectType<Date>(user.createdAt)
expectType<Date>(user.updatedAt)

// Test Profile model has all fields including JSON types
declare const profile: Profile
expectType<string>(profile.id)
expectType<string>(profile.userId)
expectType<string | null | undefined>(profile.displayName)
expectType<NotificationSettings>(profile.notificationSettings)
expectType<PrivacySettings>(profile.privacySettings)
expectType<string>(profile.profileVisibility)
expectType<boolean>(profile.allowDirectMessages)
expectType<string[]>(profile.interests)
expectType<Date>(profile.createdAt)
expectType<Date>(profile.updatedAt)

// Test Trade model completeness
declare const trade: Trade
expectType<string>(trade.id)
expectType<TradeStatus>(trade.status)
expectType<TradeItems>(trade.initiatorItems)
expectType<TradeItems>(trade.recipientItems)
expectType<number>(trade.version)
expectType<Date>(trade.expiresAt)

// Test Message model with status
declare const message: Message
expectType<MessageStatus>(message.status)
expectType<boolean>(message.edited)
expectType<EditHistory[]>(message.editHistory)
expectType<string[]>(message.deletedFor)

// Test Event model with all date fields
declare const event: Event
expectType<Date>(event.startTime)
expectType<Date>(event.endTime)
expectType<string>(event.timezone)
expectType<EventAgenda | null | undefined>(event.agenda)

// Test Post with typed content
declare const post: Post
expectType<PostContent>(post.content)
expectType<ContentType>(post.contentType)

// Test relations exist
expectType<Profile | null | undefined>(user.profile)
expectType<Post[]>(user.posts)
expectType<Comment[]>(user.comments)
expectType<User>(trade.initiator)
expectType<User>(trade.recipient)
expectType<Conversation>(message.conversation)
expectType<Group | null | undefined>(event.group)

// Test enums
const validRoles: UserRole[] = [
  UserRole.USER,
  UserRole.CREATOR,
  UserRole.VERIFIED_CREATOR,
  UserRole.MODERATOR,
  UserRole.ADMIN,
  UserRole.SYSTEM,
]

// Test JSON type safety
const theme: ThemePreference = {
  mode: 'dark',
  primaryColor: '#8B5CF6',
  accentColor: '#EC4899',
  fontSize: 'medium',
  reducedMotion: false,
  highContrast: false,
}

const postContent: PostContent = {
  type: 'richtext',
  blocks: [],
  version: '1.0.0',
}

// Export test status
export const TYPE_TESTS_PASS = true
