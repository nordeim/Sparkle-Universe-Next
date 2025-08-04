-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('USER', 'MODERATOR', 'ADMIN', 'CREATOR', 'VERIFIED_CREATOR', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'BANNED', 'DELETED');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('POST_LIKED', 'POST_COMMENTED', 'COMMENT_LIKED', 'USER_FOLLOWED', 'ACHIEVEMENT_UNLOCKED', 'LEVEL_UP', 'MENTION', 'SYSTEM', 'GROUP_INVITE', 'GROUP_POST', 'EVENT_REMINDER', 'WATCH_PARTY_INVITE', 'DIRECT_MESSAGE', 'YOUTUBE_PREMIERE', 'QUEST_COMPLETE', 'TRADE_REQUEST', 'CONTENT_FEATURED', 'MILESTONE_REACHED');

-- CreateEnum
CREATE TYPE "public"."ReactionType" AS ENUM ('LIKE', 'LOVE', 'FIRE', 'SPARKLE', 'MIND_BLOWN', 'LAUGH', 'CRY', 'ANGRY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."ReportReason" AS ENUM ('SPAM', 'INAPPROPRIATE', 'HARASSMENT', 'MISINFORMATION', 'COPYRIGHT', 'NSFW', 'HATE_SPEECH', 'SELF_HARM', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ESCALATED', 'AUTO_APPROVED', 'SHADOW_BANNED', 'UNDER_REVIEW');

-- CreateEnum
CREATE TYPE "public"."ContentType" AS ENUM ('BLOG', 'LIVE_BLOG', 'POLL', 'VIDEO_REVIEW', 'FAN_ART', 'THEORY_THREAD', 'SERIES', 'TUTORIAL', 'NEWS');

-- CreateEnum
CREATE TYPE "public"."ContentStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED', 'DELETED');

-- CreateEnum
CREATE TYPE "public"."BadgeRarity" AS ENUM ('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC', 'LIMITED_EDITION', 'SEASONAL');

-- CreateEnum
CREATE TYPE "public"."QuestType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'SPECIAL', 'ACHIEVEMENT', 'SEASONAL', 'COMMUNITY', 'CREATOR');

-- CreateEnum
CREATE TYPE "public"."QuestStatus" AS ENUM ('AVAILABLE', 'IN_PROGRESS', 'COMPLETED', 'CLAIMED', 'EXPIRED', 'LOCKED');

-- CreateEnum
CREATE TYPE "public"."TradeStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED', 'COMPLETED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "public"."MessageStatus" AS ENUM ('SENT', 'DELIVERED', 'READ', 'DELETED');

-- CreateEnum
CREATE TYPE "public"."EventType" AS ENUM ('WATCH_PARTY', 'COMMUNITY_MEETUP', 'CONTEST', 'PREMIERE', 'AMA', 'SPECIAL', 'TOURNAMENT', 'WORKSHOP');

-- CreateEnum
CREATE TYPE "public"."EventStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."GroupVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'INVITE_ONLY', 'HIDDEN');

-- CreateEnum
CREATE TYPE "public"."GroupMemberRole" AS ENUM ('MEMBER', 'MODERATOR', 'ADMIN', 'OWNER');

-- CreateEnum
CREATE TYPE "public"."CacheType" AS ENUM ('USER_PROFILE', 'POST_CONTENT', 'FEED', 'TRENDING', 'LEADERBOARD', 'STATS');

-- CreateEnum
CREATE TYPE "public"."AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'PERMISSION_CHANGE', 'MODERATION_ACTION', 'SYSTEM_ACTION');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."SubscriptionTier" AS ENUM ('FREE', 'SPARKLE_FAN', 'SPARKLE_CREATOR', 'SPARKLE_LEGEND');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "hashedPassword" TEXT,
    "emailVerified" TIMESTAMP(3),
    "phoneNumber" TEXT,
    "phoneVerified" TIMESTAMP(3),
    "image" TEXT,
    "bio" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'USER',
    "status" "public"."UserStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "banned" BOOLEAN NOT NULL DEFAULT false,
    "banReason" TEXT,
    "banExpiresAt" TIMESTAMP(3),
    "experience" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "sparklePoints" INTEGER NOT NULL DEFAULT 0,
    "premiumPoints" INTEGER NOT NULL DEFAULT 0,
    "reputationScore" INTEGER NOT NULL DEFAULT 0,
    "lastSeenAt" TIMESTAMP(3),
    "onlineStatus" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "creatorRevenueShare" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "totalRevenueEarned" BIGINT NOT NULL DEFAULT 0,
    "lastPayoutDate" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_stats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalPosts" INTEGER NOT NULL DEFAULT 0,
    "totalComments" INTEGER NOT NULL DEFAULT 0,
    "totalLikesReceived" INTEGER NOT NULL DEFAULT 0,
    "totalLikesGiven" INTEGER NOT NULL DEFAULT 0,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "totalFollowers" INTEGER NOT NULL DEFAULT 0,
    "totalFollowing" INTEGER NOT NULL DEFAULT 0,
    "totalWatchTime" BIGINT NOT NULL DEFAULT 0,
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActivityAt" TIMESTAMP(3),
    "profileViews" INTEGER NOT NULL DEFAULT 0,
    "engagementRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contentQualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_balances" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sparklePoints" INTEGER NOT NULL DEFAULT 0,
    "premiumPoints" INTEGER NOT NULL DEFAULT 0,
    "frozenPoints" INTEGER NOT NULL DEFAULT 0,
    "lifetimeEarned" INTEGER NOT NULL DEFAULT 0,
    "lifetimeSpent" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,
    "lastTransactionAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tier" "public"."SubscriptionTier" NOT NULL DEFAULT 'FREE',
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "stripeCustomerId" TEXT,
    "stripeSubId" TEXT,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT,
    "location" TEXT,
    "website" TEXT,
    "twitterUsername" TEXT,
    "instagramUsername" TEXT,
    "tiktokUsername" TEXT,
    "discordUsername" TEXT,
    "youtubeChannelId" TEXT,
    "youtubeChannelUrl" TEXT,
    "youtubeChannelData" JSONB,
    "bannerImage" TEXT,
    "themePreference" JSONB,
    "notificationSettings" JSONB NOT NULL DEFAULT '{}',
    "privacySettings" JSONB NOT NULL DEFAULT '{}',
    "featuredBadges" TEXT[],
    "showcasedPosts" TEXT[],
    "customCss" TEXT,
    "customHtml" TEXT,
    "socialLinks" JSONB,
    "interests" TEXT[],
    "skills" TEXT[],
    "pronouns" TEXT,
    "birthdate" TIMESTAMP(3),
    "joinedCommunityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "profileCompleted" BOOLEAN NOT NULL DEFAULT false,
    "profileCompleteness" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refreshToken" TEXT,
    "accessToken" TEXT,
    "expiresAt" BIGINT,
    "tokenType" TEXT,
    "scope" TEXT,
    "idToken" TEXT,
    "sessionState" TEXT,
    "oauthTokenSecret" TEXT,
    "oauthToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."login_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "location" TEXT,
    "success" BOOLEAN NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."security_alerts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."api_keys" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "permissions" TEXT[],
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."webhooks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "lastTriggered" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."blocks" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "smsNotifications" BOOLEAN NOT NULL DEFAULT false,
    "postLikes" BOOLEAN NOT NULL DEFAULT true,
    "postComments" BOOLEAN NOT NULL DEFAULT true,
    "newFollowers" BOOLEAN NOT NULL DEFAULT true,
    "mentions" BOOLEAN NOT NULL DEFAULT true,
    "directMessages" BOOLEAN NOT NULL DEFAULT true,
    "groupInvites" BOOLEAN NOT NULL DEFAULT true,
    "eventReminders" BOOLEAN NOT NULL DEFAULT true,
    "marketingEmails" BOOLEAN NOT NULL DEFAULT false,
    "weeklyDigest" BOOLEAN NOT NULL DEFAULT true,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."referrals" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredUserId" TEXT,
    "referralCode" TEXT NOT NULL,
    "referredEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rewardClaimed" BOOLEAN NOT NULL DEFAULT false,
    "rewardAmount" INTEGER NOT NULL DEFAULT 100,
    "expiresAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "parentId" TEXT,
    "postCount" INTEGER NOT NULL DEFAULT 0,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."posts" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "content" JSONB NOT NULL,
    "contentType" "public"."ContentType" NOT NULL DEFAULT 'BLOG',
    "contentStatus" "public"."ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "excerpt" TEXT,
    "coverImage" TEXT,
    "coverImageAlt" TEXT,
    "authorId" TEXT NOT NULL,
    "categoryId" TEXT,
    "seriesId" TEXT,
    "seriesOrder" INTEGER,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "editorsPick" BOOLEAN NOT NULL DEFAULT false,
    "sponsoredContent" BOOLEAN NOT NULL DEFAULT false,
    "sponsorInfo" JSONB,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "pinnedUntil" TIMESTAMP(3),
    "isDraft" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "parentVersionId" TEXT,
    "collaborators" TEXT[],
    "youtubeVideoId" TEXT,
    "youtubeVideoData" JSONB,
    "views" INTEGER NOT NULL DEFAULT 0,
    "uniqueViews" INTEGER NOT NULL DEFAULT 0,
    "readingTime" INTEGER,
    "wordCount" INTEGER,
    "metaTitle" VARCHAR(160),
    "metaDescription" VARCHAR(320),
    "metaKeywords" TEXT[],
    "ogImage" TEXT,
    "canonicalUrl" TEXT,
    "customSlug" BOOLEAN NOT NULL DEFAULT false,
    "allowComments" BOOLEAN NOT NULL DEFAULT true,
    "moderationStatus" "public"."ModerationStatus" NOT NULL DEFAULT 'PENDING',
    "moderationNotes" TEXT,
    "scheduledPublishAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "lastEditedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "aiModel" TEXT,
    "aiPrompt" TEXT,
    "aiRevisionCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."scheduled_actions" (
    "id" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "parameters" JSONB NOT NULL,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "lastAttempt" TIMESTAMP(3),
    "nextRetry" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."recurring_schedules" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "recurrenceRule" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "lastRun" TIMESTAMP(3),
    "nextRun" TIMESTAMP(3) NOT NULL,
    "parameters" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recurring_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."publish_queue" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "publish_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."post_stats" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "uniqueViewCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "loveCount" INTEGER NOT NULL DEFAULT 0,
    "fireCount" INTEGER NOT NULL DEFAULT 0,
    "totalReactionCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "bookmarkCount" INTEGER NOT NULL DEFAULT 0,
    "avgReadTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bounceRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "engagementRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastCalculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "post_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."post_revisions" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "editorId" TEXT NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "content" JSONB NOT NULL,
    "changeNote" TEXT,
    "version" INTEGER NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."post_relations" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "relatedPostId" TEXT NOT NULL,
    "relationType" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."post_series" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "authorId" TEXT NOT NULL,
    "coverImage" TEXT,
    "bannerImage" TEXT,
    "totalParts" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "post_series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "postCount" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT,
    "synonyms" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."post_tags" (
    "postId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "addedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_tags_pkey" PRIMARY KEY ("postId","tagId")
);

-- CreateTable
CREATE TABLE "public"."comments" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "parentId" TEXT,
    "youtubeTimestamp" INTEGER,
    "quotedTimestamp" TEXT,
    "edited" BOOLEAN NOT NULL DEFAULT false,
    "editedAt" TIMESTAMP(3),
    "editHistory" JSONB[],
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "moderationStatus" "public"."ModerationStatus" NOT NULL DEFAULT 'AUTO_APPROVED',
    "moderationNotes" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reactions" (
    "id" TEXT NOT NULL,
    "type" "public"."ReactionType" NOT NULL,
    "postId" TEXT,
    "commentId" TEXT,
    "userId" TEXT NOT NULL,
    "customEmoji" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."mentions" (
    "id" TEXT NOT NULL,
    "mentionerId" TEXT NOT NULL,
    "mentionedId" TEXT NOT NULL,
    "postId" TEXT,
    "commentId" TEXT,
    "context" TEXT,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mentions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bookmarks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "folderId" TEXT,
    "notes" TEXT,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bookmark_folders" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookmark_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."follows" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "notifyNewPosts" BOOLEAN NOT NULL DEFAULT true,
    "notifyActivity" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."view_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "viewDuration" INTEGER NOT NULL DEFAULT 0,
    "scrollDepth" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "referrer" TEXT,
    "deviceType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "view_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."search_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "query" TEXT NOT NULL,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "clickedResults" TEXT[],
    "searchType" TEXT,
    "deviceType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "userId" TEXT NOT NULL,
    "actorId" TEXT,
    "entityId" TEXT,
    "entityType" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "imageUrl" TEXT,
    "actionUrl" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "clicked" BOOLEAN NOT NULL DEFAULT false,
    "clickedAt" TIMESTAMP(3),
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "pushSent" BOOLEAN NOT NULL DEFAULT false,
    "smsSent" BOOLEAN NOT NULL DEFAULT false,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "dismissedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notification_queue" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "scheduledFor" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."email_campaigns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "segment" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "scheduledFor" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "totalRecipients" INTEGER NOT NULL DEFAULT 0,
    "delivered" INTEGER NOT NULL DEFAULT 0,
    "opened" INTEGER NOT NULL DEFAULT 0,
    "clicked" INTEGER NOT NULL DEFAULT 0,
    "bounced" INTEGER NOT NULL DEFAULT 0,
    "unsubscribed" INTEGER NOT NULL DEFAULT 0,
    "content" JSONB NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."newsletter_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscribed" BOOLEAN NOT NULL DEFAULT true,
    "frequency" TEXT NOT NULL DEFAULT 'weekly',
    "topics" TEXT[],
    "lastSent" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "newsletter_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."email_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "htmlContent" TEXT NOT NULL,
    "textContent" TEXT,
    "variables" TEXT[],
    "category" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."email_send_queue" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT,
    "recipient" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "variables" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "sentAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_send_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."achievements" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "shortDescription" TEXT,
    "icon" TEXT,
    "animatedIcon" TEXT,
    "bannerImage" TEXT,
    "xpReward" INTEGER NOT NULL DEFAULT 0,
    "sparklePointsReward" INTEGER NOT NULL DEFAULT 0,
    "premiumPointsReward" INTEGER NOT NULL DEFAULT 0,
    "rarity" "public"."BadgeRarity" NOT NULL DEFAULT 'COMMON',
    "category" TEXT,
    "subcategory" TEXT,
    "criteria" JSONB,
    "progressSteps" INTEGER NOT NULL DEFAULT 1,
    "isSecret" BOOLEAN NOT NULL DEFAULT false,
    "prerequisiteIds" TEXT[],
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "seasonal" BOOLEAN NOT NULL DEFAULT false,
    "eventBased" BOOLEAN NOT NULL DEFAULT false,
    "limited" BOOLEAN NOT NULL DEFAULT false,
    "maxAchievers" INTEGER,
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_achievements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "progressData" JSONB,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "showcased" BOOLEAN NOT NULL DEFAULT false,
    "showcaseOrder" INTEGER NOT NULL DEFAULT 0,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "claimedRewards" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."xp_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "sourceId" TEXT,
    "reason" TEXT,
    "multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "bonusXp" INTEGER NOT NULL DEFAULT 0,
    "totalXp" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "xp_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."level_configs" (
    "level" INTEGER NOT NULL,
    "requiredXp" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "perks" TEXT[],
    "sparkleReward" INTEGER NOT NULL DEFAULT 0,
    "premiumReward" INTEGER NOT NULL DEFAULT 0,
    "unlockFeatures" TEXT[],
    "badgeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "level_configs_pkey" PRIMARY KEY ("level")
);

-- CreateTable
CREATE TABLE "public"."currency_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currencyType" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceId" TEXT,
    "description" TEXT,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "balanceBefore" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "currency_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."creator_payouts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalRevenue" BIGINT NOT NULL DEFAULT 0,
    "platformFee" BIGINT NOT NULL DEFAULT 0,
    "creatorShare" BIGINT NOT NULL DEFAULT 0,
    "taxWithheld" BIGINT NOT NULL DEFAULT 0,
    "finalAmount" BIGINT NOT NULL DEFAULT 0,
    "payoutMethod" TEXT NOT NULL,
    "payoutStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "transactionId" TEXT,
    "failureReason" TEXT,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "processedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creator_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."fan_funding" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "message" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "platformFee" INTEGER NOT NULL DEFAULT 0,
    "creatorAmount" INTEGER NOT NULL DEFAULT 0,
    "paymentMethod" TEXT NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "transactionId" TEXT,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fan_funding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."revenue_shares" (
    "id" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "totalRevenue" BIGINT NOT NULL DEFAULT 0,
    "platformShare" BIGINT NOT NULL DEFAULT 0,
    "creatorShare" BIGINT NOT NULL DEFAULT 0,
    "affiliateShare" BIGINT NOT NULL DEFAULT 0,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "revenue_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tip_transactions" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "message" TEXT,
    "contentType" TEXT,
    "contentId" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tip_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."store_items" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "shortDescription" TEXT,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "itemType" TEXT NOT NULL,
    "rarity" "public"."BadgeRarity" NOT NULL DEFAULT 'COMMON',
    "priceSparkle" INTEGER,
    "pricePremium" INTEGER,
    "originalPriceSparkle" INTEGER,
    "originalPricePremium" INTEGER,
    "discountPercentage" INTEGER NOT NULL DEFAULT 0,
    "previewUrl" TEXT,
    "thumbnailUrl" TEXT,
    "images" TEXT[],
    "data" JSONB,
    "requirements" JSONB,
    "limitedEdition" BOOLEAN NOT NULL DEFAULT false,
    "stockRemaining" INTEGER,
    "maxPerUser" INTEGER,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "new" BOOLEAN NOT NULL DEFAULT false,
    "availableFrom" TIMESTAMP(3),
    "availableUntil" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."store_bundles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceSparkle" INTEGER,
    "pricePremium" INTEGER,
    "discountPercentage" INTEGER NOT NULL DEFAULT 0,
    "availableFrom" TIMESTAMP(3),
    "availableUntil" TIMESTAMP(3),
    "maxPurchases" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_bundles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_inventory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "equipped" BOOLEAN NOT NULL DEFAULT false,
    "equippedAt" TIMESTAMP(3),
    "customData" JSONB,
    "acquiredFrom" TEXT NOT NULL,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "tradeable" BOOLEAN NOT NULL DEFAULT true,
    "giftedBy" TEXT,

    CONSTRAINT "user_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."trades" (
    "id" TEXT NOT NULL,
    "initiatorId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "status" "public"."TradeStatus" NOT NULL DEFAULT 'PENDING',
    "initiatorItems" JSONB NOT NULL,
    "recipientItems" JSONB NOT NULL,
    "initiatorPoints" INTEGER NOT NULL DEFAULT 0,
    "recipientPoints" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT,
    "responseMessage" TEXT,
    "tradeValue" INTEGER NOT NULL DEFAULT 0,
    "escrowId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP + interval '7 days'),
    "respondedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."quests" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "shortDescription" TEXT,
    "icon" TEXT,
    "bannerImage" TEXT,
    "type" "public"."QuestType" NOT NULL,
    "category" TEXT,
    "difficulty" TEXT,
    "requirements" JSONB NOT NULL,
    "rewards" JSONB NOT NULL,
    "xpReward" INTEGER NOT NULL DEFAULT 0,
    "pointsReward" INTEGER NOT NULL DEFAULT 0,
    "prerequisiteIds" TEXT[],
    "levelRequired" INTEGER NOT NULL DEFAULT 1,
    "cooldownHours" INTEGER,
    "maxCompletions" INTEGER NOT NULL DEFAULT 1,
    "timeLimit" INTEGER,
    "availableFrom" TIMESTAMP(3),
    "availableUntil" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_quests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "status" "public"."QuestStatus" NOT NULL DEFAULT 'AVAILABLE',
    "progress" JSONB NOT NULL DEFAULT '{}',
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "totalSteps" INTEGER NOT NULL DEFAULT 1,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "claimedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "attemptCount" INTEGER NOT NULL DEFAULT 1,
    "bestTime" INTEGER,
    "metadata" JSONB,

    CONSTRAINT "user_quests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."leaderboards" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "scopeId" TEXT,
    "period" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "data" JSONB NOT NULL,
    "metadata" JSONB,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leaderboards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."leaderboard_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "score" BIGINT NOT NULL,
    "movement" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leaderboard_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."youtube_channels" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "userId" TEXT,
    "channelTitle" TEXT,
    "channelHandle" TEXT,
    "channelDescription" TEXT,
    "channelData" JSONB,
    "thumbnailUrl" TEXT,
    "bannerUrl" TEXT,
    "subscriberCount" BIGINT NOT NULL DEFAULT 0,
    "viewCount" BIGINT NOT NULL DEFAULT 0,
    "videoCount" INTEGER NOT NULL DEFAULT 0,
    "lastVideoId" TEXT,
    "lastVideoTitle" TEXT,
    "lastVideoPublishedAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "syncEnabled" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "youtube_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."youtube_videos" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "youtubeChannelId" TEXT,
    "title" VARCHAR(500),
    "description" TEXT,
    "thumbnailUrl" TEXT,
    "thumbnailUrlHd" TEXT,
    "duration" INTEGER,
    "durationFormatted" TEXT,
    "viewCount" BIGINT NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[],
    "categoryId" TEXT,
    "liveBroadcast" BOOLEAN NOT NULL DEFAULT false,
    "premiereDate" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "youtube_videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."video_analytics" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "watchTime" BIGINT NOT NULL DEFAULT 0,
    "avgWatchTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "engagementRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "clipCount" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "discussionCount" INTEGER NOT NULL DEFAULT 0,
    "sentimentScore" DOUBLE PRECISION,
    "topDiscussionTopics" TEXT[],
    "peakViewers" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."watch_parties" (
    "id" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "youtubeVideoId" TEXT NOT NULL,
    "youtubeVideoUrl" TEXT,
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "actualStart" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "maxParticipants" INTEGER NOT NULL DEFAULT 50,
    "currentParticipants" INTEGER NOT NULL DEFAULT 0,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "chatEnabled" BOOLEAN NOT NULL DEFAULT true,
    "syncPlayback" BOOLEAN NOT NULL DEFAULT true,
    "allowGuestChat" BOOLEAN NOT NULL DEFAULT false,
    "recordChat" BOOLEAN NOT NULL DEFAULT true,
    "tags" TEXT[],
    "customEmotes" JSONB,
    "partyCode" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "watch_parties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."watch_party_participants" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "playbackPosition" INTEGER NOT NULL DEFAULT 0,
    "isMuted" BOOLEAN NOT NULL DEFAULT false,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "bannedAt" TIMESTAMP(3),
    "banReason" TEXT,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "reactionCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "watch_party_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."watch_party_chat" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "replyToId" TEXT,
    "reactions" JSONB,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watch_party_chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."video_clips" (
    "id" TEXT NOT NULL,
    "youtubeVideoId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" INTEGER NOT NULL,
    "endTime" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "thumbnailUrl" TEXT,
    "tags" TEXT[],
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_clips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."playlists" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" TEXT NOT NULL,
    "isCollaborative" BOOLEAN NOT NULL DEFAULT false,
    "collaboratorIds" TEXT[],
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "coverImage" TEXT,
    "tags" TEXT[],
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "followerCount" INTEGER NOT NULL DEFAULT 0,
    "itemCount" INTEGER NOT NULL DEFAULT 0,
    "totalDuration" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "playlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."playlist_items" (
    "id" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "youtubeVideoId" TEXT NOT NULL,
    "addedBy" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "note" TEXT,
    "customTitle" TEXT,
    "startTime" INTEGER,
    "endTime" INTEGER,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "playlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."youtube_api_quota" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_DATE,
    "unitsUsed" INTEGER NOT NULL DEFAULT 0,
    "quotaLimit" INTEGER NOT NULL DEFAULT 10000,
    "readRequests" INTEGER NOT NULL DEFAULT 0,
    "writeRequests" INTEGER NOT NULL DEFAULT 0,
    "searchRequests" INTEGER NOT NULL DEFAULT 0,
    "resetAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "youtube_api_quota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "shortDescription" TEXT,
    "bannerImage" TEXT,
    "icon" TEXT,
    "coverImage" TEXT,
    "ownerId" TEXT NOT NULL,
    "visibility" "public"."GroupVisibility" NOT NULL DEFAULT 'PUBLIC',
    "joinApproval" BOOLEAN NOT NULL DEFAULT false,
    "memberCount" INTEGER NOT NULL DEFAULT 1,
    "postCount" INTEGER NOT NULL DEFAULT 0,
    "onlineCount" INTEGER NOT NULL DEFAULT 0,
    "rules" TEXT,
    "guidelines" JSONB,
    "tags" TEXT[],
    "categories" TEXT[],
    "settings" JSONB NOT NULL DEFAULT '{}',
    "features" TEXT[],
    "customEmojis" JSONB,
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."group_members" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "public"."GroupMemberRole" NOT NULL DEFAULT 'MEMBER',
    "permissions" TEXT[],
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invitedBy" TEXT,
    "approvedBy" TEXT,
    "mutedUntil" TIMESTAMP(3),
    "bannedUntil" TIMESTAMP(3),
    "banReason" TEXT,
    "contribution" INTEGER NOT NULL DEFAULT 0,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notifications" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."group_posts" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isAnnouncement" BOOLEAN NOT NULL DEFAULT false,
    "allowComments" BOOLEAN NOT NULL DEFAULT true,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "reactionCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "moderationStatus" "public"."ModerationStatus" NOT NULL DEFAULT 'AUTO_APPROVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."group_channels" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "permissions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "shortDescription" TEXT,
    "type" "public"."EventType" NOT NULL,
    "status" "public"."EventStatus" NOT NULL DEFAULT 'SCHEDULED',
    "hostId" TEXT NOT NULL,
    "cohostIds" TEXT[],
    "groupId" TEXT,
    "locationName" TEXT,
    "locationUrl" TEXT,
    "locationAddress" TEXT,
    "locationCoords" JSONB,
    "isVirtual" BOOLEAN NOT NULL DEFAULT false,
    "virtualPlatform" TEXT,
    "virtualLink" TEXT,
    "bannerImage" TEXT,
    "thumbnailImage" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "recurrence" JSONB,
    "maxAttendees" INTEGER,
    "currentAttendees" INTEGER NOT NULL DEFAULT 0,
    "minAttendees" INTEGER,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "requiresPayment" BOOLEAN NOT NULL DEFAULT false,
    "price" INTEGER,
    "currency" TEXT,
    "tags" TEXT[],
    "categories" TEXT[],
    "agenda" JSONB,
    "speakers" JSONB,
    "sponsors" JSONB,
    "streamUrl" TEXT,
    "recordingUrl" TEXT,
    "materials" JSONB,
    "feedback" JSONB,
    "remindersSent" TEXT[],
    "metadata" JSONB,
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."event_attendees" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'INTERESTED',
    "role" TEXT NOT NULL DEFAULT 'ATTENDEE',
    "approved" BOOLEAN NOT NULL DEFAULT true,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "checkInTime" TIMESTAMP(3),
    "checkInMethod" TEXT,
    "attended" BOOLEAN NOT NULL DEFAULT false,
    "rating" INTEGER,
    "feedback" TEXT,
    "certificateId" TEXT,
    "notes" TEXT,
    "remindersSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_attendees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."conversations" (
    "id" TEXT NOT NULL,
    "isGroup" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT,
    "description" TEXT,
    "icon" TEXT,
    "encryptedKey" TEXT,
    "lastMessageId" TEXT,
    "lastMessageAt" TIMESTAMP(3),
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "pinnedMessages" TEXT[],
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."conversation_participants" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nickname" TEXT,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastReadAt" TIMESTAMP(3),
    "lastReadMessageId" TEXT,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "notificationsMuted" BOOLEAN NOT NULL DEFAULT false,
    "mutedUntil" TIMESTAMP(3),
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "customSettings" JSONB,

    CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT,
    "encryptedContent" TEXT,
    "messageType" TEXT NOT NULL DEFAULT 'TEXT',
    "attachments" JSONB,
    "mentions" TEXT[],
    "replyToId" TEXT,
    "forwardedFrom" TEXT,
    "reactions" JSONB,
    "metadata" JSONB,
    "edited" BOOLEAN NOT NULL DEFAULT false,
    "editedAt" TIMESTAMP(3),
    "editHistory" JSONB[],
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedFor" TEXT[],
    "status" "public"."MessageStatus" NOT NULL DEFAULT 'SENT',
    "deliveredAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."message_reads" (
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_reads_pkey" PRIMARY KEY ("messageId","userId")
);

-- CreateTable
CREATE TABLE "public"."websocket_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "socketId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceType" TEXT,
    "location" TEXT,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastPingAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disconnectReason" TEXT,

    CONSTRAINT "websocket_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."chat_rooms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "topic" TEXT,
    "tags" TEXT[],
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isModerated" BOOLEAN NOT NULL DEFAULT false,
    "isPersistent" BOOLEAN NOT NULL DEFAULT true,
    "maxUsers" INTEGER NOT NULL DEFAULT 100,
    "activeUsers" INTEGER NOT NULL DEFAULT 0,
    "totalMessages" INTEGER NOT NULL DEFAULT 0,
    "slowMode" INTEGER NOT NULL DEFAULT 0,
    "customEmojis" JSONB,
    "rules" TEXT,
    "welcomeMessage" TEXT,
    "pinnedMessage" TEXT,
    "blockedWords" TEXT[],
    "createdBy" TEXT NOT NULL,
    "moderatorIds" TEXT[],
    "expiresAt" TIMESTAMP(3),
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."chat_messages" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mentions" TEXT[],
    "attachments" JSONB,
    "replyToId" TEXT,
    "systemMessage" BOOLEAN NOT NULL DEFAULT false,
    "highlighted" BOOLEAN NOT NULL DEFAULT false,
    "reactions" JSONB,
    "edited" BOOLEAN NOT NULL DEFAULT false,
    "editedAt" TIMESTAMP(3),
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "flagReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."collaborative_spaces" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" TEXT NOT NULL,
    "content" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "allowAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "maxCollaborators" INTEGER NOT NULL DEFAULT 10,
    "activeUsers" INTEGER NOT NULL DEFAULT 0,
    "editPermission" TEXT NOT NULL DEFAULT 'collaborators',
    "viewPermission" TEXT NOT NULL DEFAULT 'anyone',
    "forkable" BOOLEAN NOT NULL DEFAULT true,
    "forkCount" INTEGER NOT NULL DEFAULT 0,
    "parentId" TEXT,
    "tags" TEXT[],
    "lastEditedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collaborative_spaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."space_collaborators" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'editor',
    "canEdit" BOOLEAN NOT NULL DEFAULT true,
    "canComment" BOOLEAN NOT NULL DEFAULT true,
    "canInvite" BOOLEAN NOT NULL DEFAULT false,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invitedBy" TEXT,

    CONSTRAINT "space_collaborators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."presence_tracking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "locationType" TEXT NOT NULL,
    "deviceId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "presence_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."activity_streams" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityData" JSONB,
    "metadata" JSONB,
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_streams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_activity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_DATE,
    "loginCount" INTEGER NOT NULL DEFAULT 0,
    "pageViews" INTEGER NOT NULL DEFAULT 0,
    "postsCreated" INTEGER NOT NULL DEFAULT 0,
    "postsViewed" INTEGER NOT NULL DEFAULT 0,
    "commentsCreated" INTEGER NOT NULL DEFAULT 0,
    "reactionsGiven" INTEGER NOT NULL DEFAULT 0,
    "messagessSent" INTEGER NOT NULL DEFAULT 0,
    "minutesActive" INTEGER NOT NULL DEFAULT 0,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,
    "achievementsUnlocked" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "user_activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."content_performance" (
    "id" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_DATE,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "uniqueImpressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "engagements" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "avgTimeSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bounceRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "viralityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "content_performance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."polls" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "multipleChoice" BOOLEAN NOT NULL DEFAULT false,
    "anonymousVoting" BOOLEAN NOT NULL DEFAULT false,
    "showResults" TEXT NOT NULL DEFAULT 'after_vote',
    "requireComment" BOOLEAN NOT NULL DEFAULT false,
    "minChoices" INTEGER NOT NULL DEFAULT 1,
    "maxChoices" INTEGER NOT NULL DEFAULT 1,
    "closeAt" TIMESTAMP(3),
    "finalResults" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "polls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."poll_options" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "optionText" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "displayOrder" INTEGER NOT NULL,
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metadata" JSONB,

    CONSTRAINT "poll_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."poll_votes" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "comment" TEXT,
    "ipAddress" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poll_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."poll_vote_choices" (
    "id" TEXT NOT NULL,
    "pollVoteId" TEXT NOT NULL,
    "pollOptionId" TEXT NOT NULL,

    CONSTRAINT "poll_vote_choices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."fan_art_galleries" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "theme" TEXT,
    "rules" TEXT,
    "prizes" JSONB,
    "submissionDeadline" TIMESTAMP(3),
    "votingDeadline" TIMESTAMP(3),
    "votingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "publicVoting" BOOLEAN NOT NULL DEFAULT true,
    "maxSubmissionsPerUser" INTEGER NOT NULL DEFAULT 3,
    "requireApproval" BOOLEAN NOT NULL DEFAULT false,
    "allowNSFW" BOOLEAN NOT NULL DEFAULT false,
    "winnerCount" INTEGER NOT NULL DEFAULT 3,
    "winnersAnnounced" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fan_art_galleries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."fan_art_submissions" (
    "id" TEXT NOT NULL,
    "galleryId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "highResUrl" TEXT,
    "fileSize" INTEGER,
    "dimensions" JSONB,
    "medium" TEXT,
    "tools" TEXT[],
    "timeSpent" INTEGER,
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "avgRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "winner" BOOLEAN NOT NULL DEFAULT false,
    "winnerRank" INTEGER,
    "moderationStatus" "public"."ModerationStatus" NOT NULL DEFAULT 'PENDING',
    "moderationNotes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fan_art_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_recommendations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recommendationType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "context" JSONB,
    "clicked" BOOLEAN NOT NULL DEFAULT false,
    "clickedAt" TIMESTAMP(3),
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_content_suggestions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "suggestionType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "context" JSONB,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedContent" TEXT,
    "feedback" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_content_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_ai_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentPreferences" JSONB NOT NULL,
    "writingStyle" JSONB,
    "learningOptedOut" BOOLEAN NOT NULL DEFAULT false,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_ai_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_assistant_conversations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "messages" JSONB[],
    "context" JSONB,
    "model" TEXT NOT NULL DEFAULT 'gpt-4',
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_assistant_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reports" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reportedUserId" TEXT,
    "reason" "public"."ReportReason" NOT NULL,
    "subreason" TEXT,
    "description" TEXT,
    "evidence" JSONB,
    "status" "public"."ModerationStatus" NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "assignedTo" TEXT,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "resolutionNote" TEXT,
    "appealable" BOOLEAN NOT NULL DEFAULT true,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_moderation_queue" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "content" TEXT,
    "contentHash" TEXT,
    "aiProvider" TEXT NOT NULL DEFAULT 'openai',
    "aiScore" DOUBLE PRECISION,
    "aiCategories" JSONB,
    "aiReasons" JSONB,
    "confidence" DOUBLE PRECISION,
    "humanReviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "autoActionTaken" TEXT,
    "reviewPriority" INTEGER NOT NULL DEFAULT 0,
    "reviewedBy" TEXT,
    "reviewDecision" TEXT,
    "reviewNotes" TEXT,
    "falsePositive" BOOLEAN,
    "processingTime" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "ai_moderation_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."moderation_actions" (
    "id" TEXT NOT NULL,
    "moderatorId" TEXT NOT NULL,
    "targetUserId" TEXT,
    "targetContentId" TEXT,
    "targetType" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "duration" INTEGER,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "evidence" JSONB,
    "automated" BOOLEAN NOT NULL DEFAULT false,
    "reversedBy" TEXT,
    "reversedAt" TIMESTAMP(3),
    "reverseReason" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."content_filters" (
    "id" TEXT NOT NULL,
    "filterType" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "severity" INTEGER NOT NULL DEFAULT 1,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "lastHitAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_filters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."media_files" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "mimeType" TEXT,
    "originalName" TEXT,
    "storagePath" TEXT NOT NULL,
    "cdnUrl" TEXT,
    "thumbnailUrl" TEXT,
    "blurhash" TEXT,
    "duration" INTEGER,
    "dimensions" JSONB,
    "metadata" JSONB,
    "processedAt" TIMESTAMP(3),
    "processingError" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "lastAccessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."experiments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "hypothesis" TEXT,
    "variants" JSONB NOT NULL,
    "control" TEXT NOT NULL,
    "metrics" JSONB NOT NULL,
    "targetingRules" JSONB,
    "trafficPercentage" INTEGER NOT NULL DEFAULT 100,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "results" JSONB,
    "winner" TEXT,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "experiments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."experiment_assignments" (
    "id" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "converted" BOOLEAN NOT NULL DEFAULT false,
    "conversionData" JSONB,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "convertedAt" TIMESTAMP(3),

    CONSTRAINT "experiment_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."feature_flags" (
    "id" TEXT NOT NULL,
    "flag" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "rolloutPercentage" INTEGER NOT NULL DEFAULT 0,
    "enabledForUsers" TEXT[],
    "enabledForRoles" TEXT[],
    "conditions" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."site_settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isEditable" BOOLEAN NOT NULL DEFAULT true,
    "validation" JSONB,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" "public"."AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityData" JSONB,
    "changedData" JSONB,
    "reason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "requestId" TEXT,
    "duration" INTEGER,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."analytics_events" (
    "id" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "properties" JSONB,
    "context" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."search_index" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "searchableText" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "tags" TEXT[],
    "boost" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "lastIndexedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "search_index_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cache_entries" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "type" "public"."CacheType" NOT NULL,
    "tags" TEXT[],
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "lastAccessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cache_entries_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "public"."system_health" (
    "id" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "responseTime" DOUBLE PRECISION,
    "errorRate" DOUBLE PRECISION,
    "throughput" DOUBLE PRECISION,
    "cpuUsage" DOUBLE PRECISION,
    "memoryUsage" DOUBLE PRECISION,
    "diskUsage" DOUBLE PRECISION,
    "activeUsers" INTEGER,
    "queueDepth" INTEGER,
    "metadata" JSONB,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_health_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rate_limit_tracker" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "requests" INTEGER NOT NULL DEFAULT 1,
    "blocked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "rate_limit_tracker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_BundleItems" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BundleItems_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "public"."users"("username");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "public"."users"("username");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "public"."users"("role");

-- CreateIndex
CREATE INDEX "users_level_idx" ON "public"."users"("level");

-- CreateIndex
CREATE INDEX "users_onlineStatus_idx" ON "public"."users"("onlineStatus");

-- CreateIndex
CREATE INDEX "users_sparklePoints_idx" ON "public"."users"("sparklePoints");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "public"."users"("status");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "public"."users"("createdAt");

-- CreateIndex
CREATE INDEX "users_lastSeenAt_idx" ON "public"."users"("lastSeenAt");

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "public"."users"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_stats_userId_key" ON "public"."user_stats"("userId");

-- CreateIndex
CREATE INDEX "user_stats_userId_idx" ON "public"."user_stats"("userId");

-- CreateIndex
CREATE INDEX "user_stats_totalFollowers_idx" ON "public"."user_stats"("totalFollowers");

-- CreateIndex
CREATE INDEX "user_stats_engagementRate_idx" ON "public"."user_stats"("engagementRate");

-- CreateIndex
CREATE UNIQUE INDEX "user_balances_userId_key" ON "public"."user_balances"("userId");

-- CreateIndex
CREATE INDEX "user_balances_userId_idx" ON "public"."user_balances"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_subscriptions_userId_key" ON "public"."user_subscriptions"("userId");

-- CreateIndex
CREATE INDEX "user_subscriptions_userId_idx" ON "public"."user_subscriptions"("userId");

-- CreateIndex
CREATE INDEX "user_subscriptions_status_idx" ON "public"."user_subscriptions"("status");

-- CreateIndex
CREATE INDEX "user_subscriptions_endDate_idx" ON "public"."user_subscriptions"("endDate");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_userId_key" ON "public"."profiles"("userId");

-- CreateIndex
CREATE INDEX "profiles_userId_idx" ON "public"."profiles"("userId");

-- CreateIndex
CREATE INDEX "profiles_youtubeChannelId_idx" ON "public"."profiles"("youtubeChannelId");

-- CreateIndex
CREATE INDEX "profiles_profileCompleted_idx" ON "public"."profiles"("profileCompleted");

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "public"."accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "public"."accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "public"."sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "public"."sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_sessionToken_idx" ON "public"."sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "sessions_expires_idx" ON "public"."sessions"("expires");

-- CreateIndex
CREATE INDEX "login_history_userId_createdAt_idx" ON "public"."login_history"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "security_alerts_userId_resolved_idx" ON "public"."security_alerts"("userId", "resolved");

-- CreateIndex
CREATE INDEX "security_alerts_severity_idx" ON "public"."security_alerts"("severity");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_key" ON "public"."api_keys"("key");

-- CreateIndex
CREATE INDEX "api_keys_userId_idx" ON "public"."api_keys"("userId");

-- CreateIndex
CREATE INDEX "api_keys_key_idx" ON "public"."api_keys"("key");

-- CreateIndex
CREATE INDEX "webhooks_userId_idx" ON "public"."webhooks"("userId");

-- CreateIndex
CREATE INDEX "webhooks_active_idx" ON "public"."webhooks"("active");

-- CreateIndex
CREATE INDEX "blocks_blockerId_idx" ON "public"."blocks"("blockerId");

-- CreateIndex
CREATE INDEX "blocks_blockedId_idx" ON "public"."blocks"("blockedId");

-- CreateIndex
CREATE UNIQUE INDEX "blocks_blockerId_blockedId_key" ON "public"."blocks"("blockerId", "blockedId");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_key" ON "public"."notification_preferences"("userId");

-- CreateIndex
CREATE INDEX "notification_preferences_userId_idx" ON "public"."notification_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "referrals_referredUserId_key" ON "public"."referrals"("referredUserId");

-- CreateIndex
CREATE UNIQUE INDEX "referrals_referralCode_key" ON "public"."referrals"("referralCode");

-- CreateIndex
CREATE INDEX "referrals_referrerId_idx" ON "public"."referrals"("referrerId");

-- CreateIndex
CREATE INDEX "referrals_referralCode_idx" ON "public"."referrals"("referralCode");

-- CreateIndex
CREATE INDEX "referrals_status_idx" ON "public"."referrals"("status");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "public"."categories"("slug");

-- CreateIndex
CREATE INDEX "categories_slug_idx" ON "public"."categories"("slug");

-- CreateIndex
CREATE INDEX "categories_parentId_idx" ON "public"."categories"("parentId");

-- CreateIndex
CREATE INDEX "categories_isActive_idx" ON "public"."categories"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "posts_slug_key" ON "public"."posts"("slug");

-- CreateIndex
CREATE INDEX "posts_slug_idx" ON "public"."posts"("slug");

-- CreateIndex
CREATE INDEX "posts_authorId_idx" ON "public"."posts"("authorId");

-- CreateIndex
CREATE INDEX "posts_categoryId_idx" ON "public"."posts"("categoryId");

-- CreateIndex
CREATE INDEX "posts_seriesId_idx" ON "public"."posts"("seriesId");

-- CreateIndex
CREATE INDEX "posts_published_publishedAt_idx" ON "public"."posts"("published", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "posts_featured_idx" ON "public"."posts"("featured");

-- CreateIndex
CREATE INDEX "posts_contentType_idx" ON "public"."posts"("contentType");

-- CreateIndex
CREATE INDEX "posts_scheduledPublishAt_idx" ON "public"."posts"("scheduledPublishAt");

-- CreateIndex
CREATE INDEX "posts_contentStatus_idx" ON "public"."posts"("contentStatus");

-- CreateIndex
CREATE INDEX "posts_moderationStatus_idx" ON "public"."posts"("moderationStatus");

-- CreateIndex
CREATE INDEX "posts_deletedAt_idx" ON "public"."posts"("deletedAt");

-- CreateIndex
CREATE INDEX "scheduled_actions_scheduledFor_status_idx" ON "public"."scheduled_actions"("scheduledFor", "status");

-- CreateIndex
CREATE INDEX "scheduled_actions_entityType_entityId_idx" ON "public"."scheduled_actions"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "recurring_schedules_userId_isActive_nextRun_idx" ON "public"."recurring_schedules"("userId", "isActive", "nextRun");

-- CreateIndex
CREATE INDEX "recurring_schedules_nextRun_idx" ON "public"."recurring_schedules"("nextRun");

-- CreateIndex
CREATE UNIQUE INDEX "publish_queue_postId_key" ON "public"."publish_queue"("postId");

-- CreateIndex
CREATE INDEX "publish_queue_scheduledFor_status_idx" ON "public"."publish_queue"("scheduledFor", "status");

-- CreateIndex
CREATE UNIQUE INDEX "post_stats_postId_key" ON "public"."post_stats"("postId");

-- CreateIndex
CREATE INDEX "post_stats_postId_idx" ON "public"."post_stats"("postId");

-- CreateIndex
CREATE INDEX "post_stats_viewCount_idx" ON "public"."post_stats"("viewCount");

-- CreateIndex
CREATE INDEX "post_stats_totalReactionCount_idx" ON "public"."post_stats"("totalReactionCount");

-- CreateIndex
CREATE INDEX "post_stats_engagementRate_idx" ON "public"."post_stats"("engagementRate");

-- CreateIndex
CREATE INDEX "post_revisions_postId_version_idx" ON "public"."post_revisions"("postId", "version");

-- CreateIndex
CREATE INDEX "post_revisions_editorId_idx" ON "public"."post_revisions"("editorId");

-- CreateIndex
CREATE INDEX "post_relations_postId_idx" ON "public"."post_relations"("postId");

-- CreateIndex
CREATE INDEX "post_relations_relatedPostId_idx" ON "public"."post_relations"("relatedPostId");

-- CreateIndex
CREATE UNIQUE INDEX "post_relations_postId_relatedPostId_key" ON "public"."post_relations"("postId", "relatedPostId");

-- CreateIndex
CREATE UNIQUE INDEX "post_series_slug_key" ON "public"."post_series"("slug");

-- CreateIndex
CREATE INDEX "post_series_authorId_idx" ON "public"."post_series"("authorId");

-- CreateIndex
CREATE INDEX "post_series_slug_idx" ON "public"."post_series"("slug");

-- CreateIndex
CREATE INDEX "post_series_featured_idx" ON "public"."post_series"("featured");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "public"."tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_key" ON "public"."tags"("slug");

-- CreateIndex
CREATE INDEX "tags_name_idx" ON "public"."tags"("name");

-- CreateIndex
CREATE INDEX "tags_slug_idx" ON "public"."tags"("slug");

-- CreateIndex
CREATE INDEX "tags_featured_idx" ON "public"."tags"("featured");

-- CreateIndex
CREATE INDEX "tags_postCount_idx" ON "public"."tags"("postCount");

-- CreateIndex
CREATE INDEX "post_tags_postId_idx" ON "public"."post_tags"("postId");

-- CreateIndex
CREATE INDEX "post_tags_tagId_idx" ON "public"."post_tags"("tagId");

-- CreateIndex
CREATE INDEX "comments_postId_idx" ON "public"."comments"("postId");

-- CreateIndex
CREATE INDEX "comments_authorId_idx" ON "public"."comments"("authorId");

-- CreateIndex
CREATE INDEX "comments_parentId_idx" ON "public"."comments"("parentId");

-- CreateIndex
CREATE INDEX "comments_youtubeTimestamp_idx" ON "public"."comments"("youtubeTimestamp");

-- CreateIndex
CREATE INDEX "comments_moderationStatus_idx" ON "public"."comments"("moderationStatus");

-- CreateIndex
CREATE INDEX "comments_deleted_idx" ON "public"."comments"("deleted");

-- CreateIndex
CREATE INDEX "reactions_postId_idx" ON "public"."reactions"("postId");

-- CreateIndex
CREATE INDEX "reactions_commentId_idx" ON "public"."reactions"("commentId");

-- CreateIndex
CREATE INDEX "reactions_userId_idx" ON "public"."reactions"("userId");

-- CreateIndex
CREATE INDEX "reactions_type_idx" ON "public"."reactions"("type");

-- CreateIndex
CREATE UNIQUE INDEX "reactions_postId_userId_type_key" ON "public"."reactions"("postId", "userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "reactions_commentId_userId_type_key" ON "public"."reactions"("commentId", "userId", "type");

-- CreateIndex
CREATE INDEX "mentions_mentionedId_idx" ON "public"."mentions"("mentionedId");

-- CreateIndex
CREATE INDEX "mentions_postId_idx" ON "public"."mentions"("postId");

-- CreateIndex
CREATE INDEX "mentions_commentId_idx" ON "public"."mentions"("commentId");

-- CreateIndex
CREATE INDEX "bookmarks_userId_idx" ON "public"."bookmarks"("userId");

-- CreateIndex
CREATE INDEX "bookmarks_postId_idx" ON "public"."bookmarks"("postId");

-- CreateIndex
CREATE INDEX "bookmarks_folderId_idx" ON "public"."bookmarks"("folderId");

-- CreateIndex
CREATE UNIQUE INDEX "bookmarks_userId_postId_key" ON "public"."bookmarks"("userId", "postId");

-- CreateIndex
CREATE INDEX "bookmark_folders_userId_idx" ON "public"."bookmark_folders"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "bookmark_folders_userId_name_key" ON "public"."bookmark_folders"("userId", "name");

-- CreateIndex
CREATE INDEX "follows_followerId_idx" ON "public"."follows"("followerId");

-- CreateIndex
CREATE INDEX "follows_followingId_idx" ON "public"."follows"("followingId");

-- CreateIndex
CREATE UNIQUE INDEX "follows_followerId_followingId_key" ON "public"."follows"("followerId", "followingId");

-- CreateIndex
CREATE INDEX "view_history_userId_createdAt_idx" ON "public"."view_history"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "view_history_postId_idx" ON "public"."view_history"("postId");

-- CreateIndex
CREATE INDEX "search_history_userId_idx" ON "public"."search_history"("userId");

-- CreateIndex
CREATE INDEX "search_history_query_idx" ON "public"."search_history"("query");

-- CreateIndex
CREATE INDEX "search_history_createdAt_idx" ON "public"."search_history"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_read_createdAt_idx" ON "public"."notifications"("userId", "read", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "notifications_actorId_idx" ON "public"."notifications"("actorId");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "public"."notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_priority_idx" ON "public"."notifications"("priority");

-- CreateIndex
CREATE INDEX "notifications_expiresAt_idx" ON "public"."notifications"("expiresAt");

-- CreateIndex
CREATE INDEX "notification_queue_scheduledFor_processedAt_idx" ON "public"."notification_queue"("scheduledFor", "processedAt");

-- CreateIndex
CREATE INDEX "notification_queue_userId_idx" ON "public"."notification_queue"("userId");

-- CreateIndex
CREATE INDEX "notification_queue_priority_idx" ON "public"."notification_queue"("priority");

-- CreateIndex
CREATE INDEX "email_campaigns_status_scheduledFor_idx" ON "public"."email_campaigns"("status", "scheduledFor");

-- CreateIndex
CREATE INDEX "email_campaigns_createdBy_idx" ON "public"."email_campaigns"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscriptions_userId_key" ON "public"."newsletter_subscriptions"("userId");

-- CreateIndex
CREATE INDEX "newsletter_subscriptions_subscribed_frequency_idx" ON "public"."newsletter_subscriptions"("subscribed", "frequency");

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_name_key" ON "public"."email_templates"("name");

-- CreateIndex
CREATE INDEX "email_templates_category_idx" ON "public"."email_templates"("category");

-- CreateIndex
CREATE INDEX "email_templates_isActive_idx" ON "public"."email_templates"("isActive");

-- CreateIndex
CREATE INDEX "email_send_queue_status_attempts_idx" ON "public"."email_send_queue"("status", "attempts");

-- CreateIndex
CREATE INDEX "email_send_queue_campaignId_idx" ON "public"."email_send_queue"("campaignId");

-- CreateIndex
CREATE INDEX "email_send_queue_recipient_idx" ON "public"."email_send_queue"("recipient");

-- CreateIndex
CREATE UNIQUE INDEX "achievements_code_key" ON "public"."achievements"("code");

-- CreateIndex
CREATE INDEX "achievements_code_idx" ON "public"."achievements"("code");

-- CreateIndex
CREATE INDEX "achievements_category_idx" ON "public"."achievements"("category");

-- CreateIndex
CREATE INDEX "achievements_rarity_idx" ON "public"."achievements"("rarity");

-- CreateIndex
CREATE INDEX "user_achievements_userId_idx" ON "public"."user_achievements"("userId");

-- CreateIndex
CREATE INDEX "user_achievements_userId_showcased_idx" ON "public"."user_achievements"("userId", "showcased");

-- CreateIndex
CREATE INDEX "user_achievements_achievementId_idx" ON "public"."user_achievements"("achievementId");

-- CreateIndex
CREATE UNIQUE INDEX "user_achievements_userId_achievementId_key" ON "public"."user_achievements"("userId", "achievementId");

-- CreateIndex
CREATE INDEX "xp_logs_userId_createdAt_idx" ON "public"."xp_logs"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "xp_logs_source_idx" ON "public"."xp_logs"("source");

-- CreateIndex
CREATE INDEX "level_configs_requiredXp_idx" ON "public"."level_configs"("requiredXp");

-- CreateIndex
CREATE INDEX "currency_transactions_userId_createdAt_idx" ON "public"."currency_transactions"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "currency_transactions_transactionType_idx" ON "public"."currency_transactions"("transactionType");

-- CreateIndex
CREATE INDEX "currency_transactions_source_idx" ON "public"."currency_transactions"("source");

-- CreateIndex
CREATE INDEX "creator_payouts_payoutStatus_idx" ON "public"."creator_payouts"("payoutStatus");

-- CreateIndex
CREATE INDEX "creator_payouts_scheduledDate_idx" ON "public"."creator_payouts"("scheduledDate");

-- CreateIndex
CREATE UNIQUE INDEX "creator_payouts_userId_periodStart_periodEnd_key" ON "public"."creator_payouts"("userId", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "fan_funding_senderId_idx" ON "public"."fan_funding"("senderId");

-- CreateIndex
CREATE INDEX "fan_funding_recipientId_idx" ON "public"."fan_funding"("recipientId");

-- CreateIndex
CREATE INDEX "fan_funding_paymentStatus_idx" ON "public"."fan_funding"("paymentStatus");

-- CreateIndex
CREATE INDEX "revenue_shares_creatorId_calculatedAt_idx" ON "public"."revenue_shares"("creatorId", "calculatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "revenue_shares_contentType_contentId_creatorId_key" ON "public"."revenue_shares"("contentType", "contentId", "creatorId");

-- CreateIndex
CREATE INDEX "tip_transactions_senderId_idx" ON "public"."tip_transactions"("senderId");

-- CreateIndex
CREATE INDEX "tip_transactions_recipientId_idx" ON "public"."tip_transactions"("recipientId");

-- CreateIndex
CREATE INDEX "tip_transactions_contentType_contentId_idx" ON "public"."tip_transactions"("contentType", "contentId");

-- CreateIndex
CREATE UNIQUE INDEX "store_items_sku_key" ON "public"."store_items"("sku");

-- CreateIndex
CREATE INDEX "store_items_category_idx" ON "public"."store_items"("category");

-- CreateIndex
CREATE INDEX "store_items_featured_idx" ON "public"."store_items"("featured");

-- CreateIndex
CREATE INDEX "store_items_availableFrom_availableUntil_idx" ON "public"."store_items"("availableFrom", "availableUntil");

-- CreateIndex
CREATE INDEX "store_bundles_availableFrom_availableUntil_idx" ON "public"."store_bundles"("availableFrom", "availableUntil");

-- CreateIndex
CREATE INDEX "user_inventory_userId_idx" ON "public"."user_inventory"("userId");

-- CreateIndex
CREATE INDEX "user_inventory_userId_equipped_idx" ON "public"."user_inventory"("userId", "equipped");

-- CreateIndex
CREATE INDEX "user_inventory_itemId_idx" ON "public"."user_inventory"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "user_inventory_userId_itemId_key" ON "public"."user_inventory"("userId", "itemId");

-- CreateIndex
CREATE INDEX "trades_initiatorId_status_idx" ON "public"."trades"("initiatorId", "status");

-- CreateIndex
CREATE INDEX "trades_recipientId_status_idx" ON "public"."trades"("recipientId", "status");

-- CreateIndex
CREATE INDEX "trades_status_idx" ON "public"."trades"("status");

-- CreateIndex
CREATE UNIQUE INDEX "quests_code_key" ON "public"."quests"("code");

-- CreateIndex
CREATE INDEX "quests_type_idx" ON "public"."quests"("type");

-- CreateIndex
CREATE INDEX "quests_availableFrom_availableUntil_idx" ON "public"."quests"("availableFrom", "availableUntil");

-- CreateIndex
CREATE INDEX "user_quests_userId_status_idx" ON "public"."user_quests"("userId", "status");

-- CreateIndex
CREATE INDEX "user_quests_questId_idx" ON "public"."user_quests"("questId");

-- CreateIndex
CREATE INDEX "user_quests_status_idx" ON "public"."user_quests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "user_quests_userId_questId_key" ON "public"."user_quests"("userId", "questId");

-- CreateIndex
CREATE INDEX "leaderboards_type_periodEnd_idx" ON "public"."leaderboards"("type", "periodEnd" DESC);

-- CreateIndex
CREATE INDEX "leaderboards_processed_idx" ON "public"."leaderboards"("processed");

-- CreateIndex
CREATE UNIQUE INDEX "leaderboards_type_scope_scopeId_periodStart_periodEnd_key" ON "public"."leaderboards"("type", "scope", "scopeId", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "leaderboard_entries_type_period_rank_idx" ON "public"."leaderboard_entries"("type", "period", "rank");

-- CreateIndex
CREATE INDEX "leaderboard_entries_userId_idx" ON "public"."leaderboard_entries"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "leaderboard_entries_userId_type_period_key" ON "public"."leaderboard_entries"("userId", "type", "period");

-- CreateIndex
CREATE UNIQUE INDEX "youtube_channels_channelId_key" ON "public"."youtube_channels"("channelId");

-- CreateIndex
CREATE INDEX "youtube_channels_userId_idx" ON "public"."youtube_channels"("userId");

-- CreateIndex
CREATE INDEX "youtube_channels_channelId_idx" ON "public"."youtube_channels"("channelId");

-- CreateIndex
CREATE INDEX "youtube_channels_featured_idx" ON "public"."youtube_channels"("featured");

-- CreateIndex
CREATE UNIQUE INDEX "youtube_videos_videoId_key" ON "public"."youtube_videos"("videoId");

-- CreateIndex
CREATE INDEX "youtube_videos_channelId_idx" ON "public"."youtube_videos"("channelId");

-- CreateIndex
CREATE INDEX "youtube_videos_publishedAt_idx" ON "public"."youtube_videos"("publishedAt" DESC);

-- CreateIndex
CREATE INDEX "youtube_videos_viewCount_idx" ON "public"."youtube_videos"("viewCount");

-- CreateIndex
CREATE UNIQUE INDEX "video_analytics_videoId_key" ON "public"."video_analytics"("videoId");

-- CreateIndex
CREATE INDEX "video_analytics_videoId_idx" ON "public"."video_analytics"("videoId");

-- CreateIndex
CREATE UNIQUE INDEX "watch_parties_partyCode_key" ON "public"."watch_parties"("partyCode");

-- CreateIndex
CREATE INDEX "watch_parties_hostId_idx" ON "public"."watch_parties"("hostId");

-- CreateIndex
CREATE INDEX "watch_parties_scheduledStart_idx" ON "public"."watch_parties"("scheduledStart");

-- CreateIndex
CREATE INDEX "watch_parties_isPublic_scheduledStart_idx" ON "public"."watch_parties"("isPublic", "scheduledStart");

-- CreateIndex
CREATE INDEX "watch_parties_partyCode_idx" ON "public"."watch_parties"("partyCode");

-- CreateIndex
CREATE INDEX "watch_party_participants_partyId_isActive_idx" ON "public"."watch_party_participants"("partyId", "isActive");

-- CreateIndex
CREATE INDEX "watch_party_participants_userId_idx" ON "public"."watch_party_participants"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "watch_party_participants_partyId_userId_key" ON "public"."watch_party_participants"("partyId", "userId");

-- CreateIndex
CREATE INDEX "watch_party_chat_partyId_createdAt_idx" ON "public"."watch_party_chat"("partyId", "createdAt");

-- CreateIndex
CREATE INDEX "watch_party_chat_userId_idx" ON "public"."watch_party_chat"("userId");

-- CreateIndex
CREATE INDEX "video_clips_youtubeVideoId_idx" ON "public"."video_clips"("youtubeVideoId");

-- CreateIndex
CREATE INDEX "video_clips_creatorId_idx" ON "public"."video_clips"("creatorId");

-- CreateIndex
CREATE INDEX "video_clips_viewCount_idx" ON "public"."video_clips"("viewCount");

-- CreateIndex
CREATE UNIQUE INDEX "playlists_slug_key" ON "public"."playlists"("slug");

-- CreateIndex
CREATE INDEX "playlists_ownerId_idx" ON "public"."playlists"("ownerId");

-- CreateIndex
CREATE INDEX "playlists_isPublic_idx" ON "public"."playlists"("isPublic");

-- CreateIndex
CREATE INDEX "playlists_slug_idx" ON "public"."playlists"("slug");

-- CreateIndex
CREATE INDEX "playlist_items_playlistId_idx" ON "public"."playlist_items"("playlistId");

-- CreateIndex
CREATE INDEX "playlist_items_addedBy_idx" ON "public"."playlist_items"("addedBy");

-- CreateIndex
CREATE UNIQUE INDEX "playlist_items_playlistId_position_key" ON "public"."playlist_items"("playlistId", "position");

-- CreateIndex
CREATE INDEX "youtube_api_quota_date_idx" ON "public"."youtube_api_quota"("date");

-- CreateIndex
CREATE UNIQUE INDEX "youtube_api_quota_date_key" ON "public"."youtube_api_quota"("date");

-- CreateIndex
CREATE UNIQUE INDEX "groups_slug_key" ON "public"."groups"("slug");

-- CreateIndex
CREATE INDEX "groups_slug_idx" ON "public"."groups"("slug");

-- CreateIndex
CREATE INDEX "groups_ownerId_idx" ON "public"."groups"("ownerId");

-- CreateIndex
CREATE INDEX "groups_visibility_idx" ON "public"."groups"("visibility");

-- CreateIndex
CREATE INDEX "groups_isFeatured_idx" ON "public"."groups"("isFeatured");

-- CreateIndex
CREATE INDEX "group_members_groupId_role_idx" ON "public"."group_members"("groupId", "role");

-- CreateIndex
CREATE INDEX "group_members_userId_idx" ON "public"."group_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "group_members_groupId_userId_key" ON "public"."group_members"("groupId", "userId");

-- CreateIndex
CREATE INDEX "group_posts_groupId_createdAt_idx" ON "public"."group_posts"("groupId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "group_posts_authorId_idx" ON "public"."group_posts"("authorId");

-- CreateIndex
CREATE INDEX "group_channels_groupId_idx" ON "public"."group_channels"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "group_channels_groupId_name_key" ON "public"."group_channels"("groupId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "events_slug_key" ON "public"."events"("slug");

-- CreateIndex
CREATE INDEX "events_hostId_idx" ON "public"."events"("hostId");

-- CreateIndex
CREATE INDEX "events_groupId_idx" ON "public"."events"("groupId");

-- CreateIndex
CREATE INDEX "events_startTime_idx" ON "public"."events"("startTime");

-- CreateIndex
CREATE INDEX "events_isPublic_startTime_idx" ON "public"."events"("isPublic", "startTime");

-- CreateIndex
CREATE INDEX "events_status_idx" ON "public"."events"("status");

-- CreateIndex
CREATE INDEX "events_slug_idx" ON "public"."events"("slug");

-- CreateIndex
CREATE INDEX "event_attendees_eventId_status_idx" ON "public"."event_attendees"("eventId", "status");

-- CreateIndex
CREATE INDEX "event_attendees_userId_idx" ON "public"."event_attendees"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "event_attendees_eventId_userId_key" ON "public"."event_attendees"("eventId", "userId");

-- CreateIndex
CREATE INDEX "conversations_createdBy_idx" ON "public"."conversations"("createdBy");

-- CreateIndex
CREATE INDEX "conversations_lastMessageAt_idx" ON "public"."conversations"("lastMessageAt");

-- CreateIndex
CREATE INDEX "conversation_participants_conversationId_idx" ON "public"."conversation_participants"("conversationId");

-- CreateIndex
CREATE INDEX "conversation_participants_userId_idx" ON "public"."conversation_participants"("userId");

-- CreateIndex
CREATE INDEX "conversation_participants_userId_isPinned_idx" ON "public"."conversation_participants"("userId", "isPinned");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_participants_conversationId_userId_key" ON "public"."conversation_participants"("conversationId", "userId");

-- CreateIndex
CREATE INDEX "messages_conversationId_createdAt_idx" ON "public"."messages"("conversationId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "messages_senderId_idx" ON "public"."messages"("senderId");

-- CreateIndex
CREATE INDEX "message_reads_userId_idx" ON "public"."message_reads"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "websocket_sessions_socketId_key" ON "public"."websocket_sessions"("socketId");

-- CreateIndex
CREATE INDEX "websocket_sessions_userId_idx" ON "public"."websocket_sessions"("userId");

-- CreateIndex
CREATE INDEX "websocket_sessions_socketId_idx" ON "public"."websocket_sessions"("socketId");

-- CreateIndex
CREATE UNIQUE INDEX "chat_rooms_slug_key" ON "public"."chat_rooms"("slug");

-- CreateIndex
CREATE INDEX "chat_rooms_slug_idx" ON "public"."chat_rooms"("slug");

-- CreateIndex
CREATE INDEX "chat_rooms_isPublic_idx" ON "public"."chat_rooms"("isPublic");

-- CreateIndex
CREATE INDEX "chat_rooms_lastActiveAt_idx" ON "public"."chat_rooms"("lastActiveAt");

-- CreateIndex
CREATE INDEX "chat_messages_roomId_createdAt_idx" ON "public"."chat_messages"("roomId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "chat_messages_userId_idx" ON "public"."chat_messages"("userId");

-- CreateIndex
CREATE INDEX "collaborative_spaces_ownerId_idx" ON "public"."collaborative_spaces"("ownerId");

-- CreateIndex
CREATE INDEX "collaborative_spaces_type_idx" ON "public"."collaborative_spaces"("type");

-- CreateIndex
CREATE INDEX "collaborative_spaces_isPublic_idx" ON "public"."collaborative_spaces"("isPublic");

-- CreateIndex
CREATE INDEX "space_collaborators_spaceId_idx" ON "public"."space_collaborators"("spaceId");

-- CreateIndex
CREATE INDEX "space_collaborators_userId_idx" ON "public"."space_collaborators"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "space_collaborators_spaceId_userId_key" ON "public"."space_collaborators"("spaceId", "userId");

-- CreateIndex
CREATE INDEX "presence_tracking_location_idx" ON "public"."presence_tracking"("location");

-- CreateIndex
CREATE INDEX "presence_tracking_userId_idx" ON "public"."presence_tracking"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "presence_tracking_userId_location_key" ON "public"."presence_tracking"("userId", "location");

-- CreateIndex
CREATE INDEX "activity_streams_userId_createdAt_idx" ON "public"."activity_streams"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "activity_streams_entityType_entityId_idx" ON "public"."activity_streams"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "activity_streams_action_idx" ON "public"."activity_streams"("action");

-- CreateIndex
CREATE UNIQUE INDEX "user_activity_userId_key" ON "public"."user_activity"("userId");

-- CreateIndex
CREATE INDEX "user_activity_date_idx" ON "public"."user_activity"("date");

-- CreateIndex
CREATE UNIQUE INDEX "user_activity_userId_date_key" ON "public"."user_activity"("userId", "date");

-- CreateIndex
CREATE INDEX "content_performance_contentType_date_idx" ON "public"."content_performance"("contentType", "date");

-- CreateIndex
CREATE INDEX "content_performance_viralityScore_idx" ON "public"."content_performance"("viralityScore");

-- CreateIndex
CREATE UNIQUE INDEX "content_performance_contentType_contentId_date_key" ON "public"."content_performance"("contentType", "contentId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "polls_postId_key" ON "public"."polls"("postId");

-- CreateIndex
CREATE INDEX "polls_postId_idx" ON "public"."polls"("postId");

-- CreateIndex
CREATE INDEX "poll_options_pollId_idx" ON "public"."poll_options"("pollId");

-- CreateIndex
CREATE INDEX "poll_votes_pollId_idx" ON "public"."poll_votes"("pollId");

-- CreateIndex
CREATE INDEX "poll_votes_userId_idx" ON "public"."poll_votes"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "poll_votes_pollId_userId_key" ON "public"."poll_votes"("pollId", "userId");

-- CreateIndex
CREATE INDEX "poll_vote_choices_pollVoteId_idx" ON "public"."poll_vote_choices"("pollVoteId");

-- CreateIndex
CREATE INDEX "poll_vote_choices_pollOptionId_idx" ON "public"."poll_vote_choices"("pollOptionId");

-- CreateIndex
CREATE UNIQUE INDEX "poll_vote_choices_pollVoteId_pollOptionId_key" ON "public"."poll_vote_choices"("pollVoteId", "pollOptionId");

-- CreateIndex
CREATE UNIQUE INDEX "fan_art_galleries_postId_key" ON "public"."fan_art_galleries"("postId");

-- CreateIndex
CREATE INDEX "fan_art_galleries_postId_idx" ON "public"."fan_art_galleries"("postId");

-- CreateIndex
CREATE INDEX "fan_art_submissions_galleryId_idx" ON "public"."fan_art_submissions"("galleryId");

-- CreateIndex
CREATE INDEX "fan_art_submissions_artistId_idx" ON "public"."fan_art_submissions"("artistId");

-- CreateIndex
CREATE INDEX "fan_art_submissions_voteCount_idx" ON "public"."fan_art_submissions"("voteCount");

-- CreateIndex
CREATE INDEX "ai_recommendations_userId_recommendationType_idx" ON "public"."ai_recommendations"("userId", "recommendationType");

-- CreateIndex
CREATE INDEX "ai_recommendations_expiresAt_idx" ON "public"."ai_recommendations"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ai_recommendations_userId_entityType_entityId_recommendatio_key" ON "public"."ai_recommendations"("userId", "entityType", "entityId", "recommendationType");

-- CreateIndex
CREATE INDEX "ai_content_suggestions_userId_suggestionType_idx" ON "public"."ai_content_suggestions"("userId", "suggestionType");

-- CreateIndex
CREATE UNIQUE INDEX "user_ai_preferences_userId_key" ON "public"."user_ai_preferences"("userId");

-- CreateIndex
CREATE INDEX "user_ai_preferences_userId_idx" ON "public"."user_ai_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ai_assistant_conversations_sessionId_key" ON "public"."ai_assistant_conversations"("sessionId");

-- CreateIndex
CREATE INDEX "ai_assistant_conversations_userId_updatedAt_idx" ON "public"."ai_assistant_conversations"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "reports_status_priority_idx" ON "public"."reports"("status", "priority");

-- CreateIndex
CREATE INDEX "reports_entityType_entityId_idx" ON "public"."reports"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "reports_reporterId_idx" ON "public"."reports"("reporterId");

-- CreateIndex
CREATE INDEX "reports_reportedUserId_idx" ON "public"."reports"("reportedUserId");

-- CreateIndex
CREATE INDEX "ai_moderation_queue_humanReviewRequired_reviewPriority_crea_idx" ON "public"."ai_moderation_queue"("humanReviewRequired", "reviewPriority", "createdAt");

-- CreateIndex
CREATE INDEX "ai_moderation_queue_entityType_entityId_idx" ON "public"."ai_moderation_queue"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ai_moderation_queue_aiScore_idx" ON "public"."ai_moderation_queue"("aiScore");

-- CreateIndex
CREATE INDEX "moderation_actions_targetUserId_idx" ON "public"."moderation_actions"("targetUserId");

-- CreateIndex
CREATE INDEX "moderation_actions_targetType_targetContentId_idx" ON "public"."moderation_actions"("targetType", "targetContentId");

-- CreateIndex
CREATE INDEX "moderation_actions_moderatorId_idx" ON "public"."moderation_actions"("moderatorId");

-- CreateIndex
CREATE INDEX "moderation_actions_action_idx" ON "public"."moderation_actions"("action");

-- CreateIndex
CREATE INDEX "content_filters_filterType_isActive_idx" ON "public"."content_filters"("filterType", "isActive");

-- CreateIndex
CREATE INDEX "content_filters_pattern_idx" ON "public"."content_filters"("pattern");

-- CreateIndex
CREATE INDEX "media_files_userId_idx" ON "public"."media_files"("userId");

-- CreateIndex
CREATE INDEX "media_files_fileType_idx" ON "public"."media_files"("fileType");

-- CreateIndex
CREATE INDEX "media_files_createdAt_idx" ON "public"."media_files"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "experiments_name_key" ON "public"."experiments"("name");

-- CreateIndex
CREATE INDEX "experiments_status_idx" ON "public"."experiments"("status");

-- CreateIndex
CREATE INDEX "experiments_startedAt_endedAt_idx" ON "public"."experiments"("startedAt", "endedAt");

-- CreateIndex
CREATE INDEX "experiment_assignments_experimentId_variant_idx" ON "public"."experiment_assignments"("experimentId", "variant");

-- CreateIndex
CREATE INDEX "experiment_assignments_userId_idx" ON "public"."experiment_assignments"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "experiment_assignments_experimentId_userId_key" ON "public"."experiment_assignments"("experimentId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_flag_key" ON "public"."feature_flags"("flag");

-- CreateIndex
CREATE INDEX "feature_flags_flag_idx" ON "public"."feature_flags"("flag");

-- CreateIndex
CREATE INDEX "site_settings_category_idx" ON "public"."site_settings"("category");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "public"."audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "public"."audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "public"."audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "public"."audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "analytics_events_eventName_timestamp_idx" ON "public"."analytics_events"("eventName", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "analytics_events_userId_idx" ON "public"."analytics_events"("userId");

-- CreateIndex
CREATE INDEX "analytics_events_sessionId_idx" ON "public"."analytics_events"("sessionId");

-- CreateIndex
CREATE INDEX "analytics_events_timestamp_idx" ON "public"."analytics_events"("timestamp");

-- CreateIndex
CREATE INDEX "search_index_entityType_idx" ON "public"."search_index"("entityType");

-- CreateIndex
CREATE UNIQUE INDEX "search_index_entityType_entityId_key" ON "public"."search_index"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "cache_entries_type_idx" ON "public"."cache_entries"("type");

-- CreateIndex
CREATE INDEX "cache_entries_expiresAt_idx" ON "public"."cache_entries"("expiresAt");

-- CreateIndex
CREATE INDEX "cache_entries_tags_idx" ON "public"."cache_entries"("tags");

-- CreateIndex
CREATE INDEX "system_health_service_checkedAt_idx" ON "public"."system_health"("service", "checkedAt");

-- CreateIndex
CREATE INDEX "rate_limit_tracker_identifier_idx" ON "public"."rate_limit_tracker"("identifier");

-- CreateIndex
CREATE INDEX "rate_limit_tracker_windowStart_idx" ON "public"."rate_limit_tracker"("windowStart");

-- CreateIndex
CREATE UNIQUE INDEX "rate_limit_tracker_identifier_endpoint_windowStart_key" ON "public"."rate_limit_tracker"("identifier", "endpoint", "windowStart");

-- CreateIndex
CREATE INDEX "_BundleItems_B_index" ON "public"."_BundleItems"("B");

-- AddForeignKey
ALTER TABLE "public"."user_stats" ADD CONSTRAINT "user_stats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_balances" ADD CONSTRAINT "user_balances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_subscriptions" ADD CONSTRAINT "user_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."profiles" ADD CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."login_history" ADD CONSTRAINT "login_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."security_alerts" ADD CONSTRAINT "security_alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."api_keys" ADD CONSTRAINT "api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."webhooks" ADD CONSTRAINT "webhooks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."blocks" ADD CONSTRAINT "blocks_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."blocks" ADD CONSTRAINT "blocks_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."referrals" ADD CONSTRAINT "referrals_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."referrals" ADD CONSTRAINT "referrals_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."posts" ADD CONSTRAINT "posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."posts" ADD CONSTRAINT "posts_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."posts" ADD CONSTRAINT "posts_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "public"."post_series"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."posts" ADD CONSTRAINT "posts_parentVersionId_fkey" FOREIGN KEY ("parentVersionId") REFERENCES "public"."posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."recurring_schedules" ADD CONSTRAINT "recurring_schedules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."publish_queue" ADD CONSTRAINT "publish_queue_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."post_stats" ADD CONSTRAINT "post_stats_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."post_revisions" ADD CONSTRAINT "post_revisions_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."post_revisions" ADD CONSTRAINT "post_revisions_editorId_fkey" FOREIGN KEY ("editorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."post_relations" ADD CONSTRAINT "post_relations_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."post_relations" ADD CONSTRAINT "post_relations_relatedPostId_fkey" FOREIGN KEY ("relatedPostId") REFERENCES "public"."posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."post_series" ADD CONSTRAINT "post_series_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."post_tags" ADD CONSTRAINT "post_tags_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."post_tags" ADD CONSTRAINT "post_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reactions" ADD CONSTRAINT "reactions_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reactions" ADD CONSTRAINT "reactions_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "public"."comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reactions" ADD CONSTRAINT "reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."mentions" ADD CONSTRAINT "mentions_mentionerId_fkey" FOREIGN KEY ("mentionerId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."mentions" ADD CONSTRAINT "mentions_mentionedId_fkey" FOREIGN KEY ("mentionedId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."mentions" ADD CONSTRAINT "mentions_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."mentions" ADD CONSTRAINT "mentions_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "public"."comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bookmarks" ADD CONSTRAINT "bookmarks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bookmarks" ADD CONSTRAINT "bookmarks_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bookmarks" ADD CONSTRAINT "bookmarks_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "public"."bookmark_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bookmark_folders" ADD CONSTRAINT "bookmark_folders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."follows" ADD CONSTRAINT "follows_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."follows" ADD CONSTRAINT "follows_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."view_history" ADD CONSTRAINT "view_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."view_history" ADD CONSTRAINT "view_history_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."search_history" ADD CONSTRAINT "search_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."email_campaigns" ADD CONSTRAINT "email_campaigns_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."email_campaigns" ADD CONSTRAINT "email_campaigns_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."email_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."newsletter_subscriptions" ADD CONSTRAINT "newsletter_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."email_templates" ADD CONSTRAINT "email_templates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."email_send_queue" ADD CONSTRAINT "email_send_queue_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."email_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."email_send_queue" ADD CONSTRAINT "email_send_queue_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."email_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_achievements" ADD CONSTRAINT "user_achievements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_achievements" ADD CONSTRAINT "user_achievements_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "public"."achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."xp_logs" ADD CONSTRAINT "xp_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."currency_transactions" ADD CONSTRAINT "currency_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."creator_payouts" ADD CONSTRAINT "creator_payouts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fan_funding" ADD CONSTRAINT "fan_funding_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fan_funding" ADD CONSTRAINT "fan_funding_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."revenue_shares" ADD CONSTRAINT "revenue_shares_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tip_transactions" ADD CONSTRAINT "tip_transactions_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tip_transactions" ADD CONSTRAINT "tip_transactions_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_inventory" ADD CONSTRAINT "user_inventory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_inventory" ADD CONSTRAINT "user_inventory_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."store_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trades" ADD CONSTRAINT "trades_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trades" ADD CONSTRAINT "trades_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_quests" ADD CONSTRAINT "user_quests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_quests" ADD CONSTRAINT "user_quests_questId_fkey" FOREIGN KEY ("questId") REFERENCES "public"."quests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."youtube_channels" ADD CONSTRAINT "youtube_channels_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."youtube_videos" ADD CONSTRAINT "youtube_videos_youtubeChannelId_fkey" FOREIGN KEY ("youtubeChannelId") REFERENCES "public"."youtube_channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."video_analytics" ADD CONSTRAINT "video_analytics_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "public"."youtube_videos"("videoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."watch_parties" ADD CONSTRAINT "watch_parties_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."watch_parties" ADD CONSTRAINT "watch_parties_youtubeVideoId_fkey" FOREIGN KEY ("youtubeVideoId") REFERENCES "public"."youtube_videos"("videoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."watch_party_participants" ADD CONSTRAINT "watch_party_participants_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "public"."watch_parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."watch_party_participants" ADD CONSTRAINT "watch_party_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."watch_party_chat" ADD CONSTRAINT "watch_party_chat_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "public"."watch_parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."watch_party_chat" ADD CONSTRAINT "watch_party_chat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."watch_party_chat" ADD CONSTRAINT "watch_party_chat_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "public"."watch_party_chat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."video_clips" ADD CONSTRAINT "video_clips_youtubeVideoId_fkey" FOREIGN KEY ("youtubeVideoId") REFERENCES "public"."youtube_videos"("videoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."video_clips" ADD CONSTRAINT "video_clips_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."playlists" ADD CONSTRAINT "playlists_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."playlist_items" ADD CONSTRAINT "playlist_items_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "public"."playlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."playlist_items" ADD CONSTRAINT "playlist_items_addedBy_fkey" FOREIGN KEY ("addedBy") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."groups" ADD CONSTRAINT "groups_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."group_members" ADD CONSTRAINT "group_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."group_members" ADD CONSTRAINT "group_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."group_posts" ADD CONSTRAINT "group_posts_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."group_posts" ADD CONSTRAINT "group_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."group_channels" ADD CONSTRAINT "group_channels_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."events" ADD CONSTRAINT "events_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."events" ADD CONSTRAINT "events_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_attendees" ADD CONSTRAINT "event_attendees_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_attendees" ADD CONSTRAINT "event_attendees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conversations" ADD CONSTRAINT "conversations_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conversation_participants" ADD CONSTRAINT "conversation_participants_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conversation_participants" ADD CONSTRAINT "conversation_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "public"."messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."message_reads" ADD CONSTRAINT "message_reads_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."message_reads" ADD CONSTRAINT "message_reads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."websocket_sessions" ADD CONSTRAINT "websocket_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_rooms" ADD CONSTRAINT "chat_rooms_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_messages" ADD CONSTRAINT "chat_messages_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."chat_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_messages" ADD CONSTRAINT "chat_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_messages" ADD CONSTRAINT "chat_messages_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "public"."chat_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."collaborative_spaces" ADD CONSTRAINT "collaborative_spaces_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."space_collaborators" ADD CONSTRAINT "space_collaborators_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "public"."collaborative_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."space_collaborators" ADD CONSTRAINT "space_collaborators_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_streams" ADD CONSTRAINT "activity_streams_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."polls" ADD CONSTRAINT "polls_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."poll_options" ADD CONSTRAINT "poll_options_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "public"."polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."poll_votes" ADD CONSTRAINT "poll_votes_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "public"."polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."poll_votes" ADD CONSTRAINT "poll_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."poll_vote_choices" ADD CONSTRAINT "poll_vote_choices_pollVoteId_fkey" FOREIGN KEY ("pollVoteId") REFERENCES "public"."poll_votes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."poll_vote_choices" ADD CONSTRAINT "poll_vote_choices_pollOptionId_fkey" FOREIGN KEY ("pollOptionId") REFERENCES "public"."poll_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fan_art_galleries" ADD CONSTRAINT "fan_art_galleries_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fan_art_submissions" ADD CONSTRAINT "fan_art_submissions_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "public"."fan_art_galleries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fan_art_submissions" ADD CONSTRAINT "fan_art_submissions_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_recommendations" ADD CONSTRAINT "ai_recommendations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_content_suggestions" ADD CONSTRAINT "ai_content_suggestions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_ai_preferences" ADD CONSTRAINT "user_ai_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_assistant_conversations" ADD CONSTRAINT "ai_assistant_conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reports" ADD CONSTRAINT "reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reports" ADD CONSTRAINT "reports_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_moderation_queue" ADD CONSTRAINT "ai_moderation_queue_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."media_files" ADD CONSTRAINT "media_files_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."experiment_assignments" ADD CONSTRAINT "experiment_assignments_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "public"."experiments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."experiment_assignments" ADD CONSTRAINT "experiment_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."site_settings" ADD CONSTRAINT "site_settings_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."analytics_events" ADD CONSTRAINT "analytics_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_BundleItems" ADD CONSTRAINT "_BundleItems_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."store_bundles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_BundleItems" ADD CONSTRAINT "_BundleItems_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."store_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
