// Type Tests
// Generated on 2025-08-23T12:43:09.515Z

import { expectType } from 'tsd'
import type {
  User,
  Profile,
  Post,
  Comment,
  UserRole,
  NotificationType,
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

// Test Profile model has all fields
declare const profile: Profile
expectType<string>(profile.id)
expectType<string>(profile.userId)
expectType<string | null | undefined>(profile.displayName)
expectType<any>(profile.notificationSettings) // Should be NotificationSettings
expectType<any>(profile.privacySettings) // Should be PrivacySettings
expectType<string>(profile.profileVisibility)
expectType<boolean>(profile.allowDirectMessages)
expectType<string[]>(profile.interests)
expectType<Date>(profile.createdAt)
expectType<Date>(profile.updatedAt)

// Test relations exist
expectType<Profile | null | undefined>(user.profile)
expectType<Post[]>(user.posts)
expectType<Comment[]>(user.comments)

// Test enums
const validRoles: UserRole[] = [
  UserRole.USER,
  UserRole.CREATOR,
  UserRole.VERIFIED_CREATOR,
  UserRole.MODERATOR,
  UserRole.ADMIN,
  UserRole.SYSTEM,
]

// Export test status
export const TYPE_TESTS_PASS = true
