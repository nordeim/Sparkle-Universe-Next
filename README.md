<!-- Path: README.md -->
# Sparkle Universe — Next.js Community Platform

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]() 
[![License](https://img.shields.io/badge/license-MIT-blue)]() 
[![Next.js](https://img.shields.io/badge/Next.js-14.0-black)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)]()
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC)]()
[![Prisma](https://img.shields.io/badge/Prisma-5.8.1-2D3748)]()
[![Schema Version](https://img.shields.io/badge/Schema-v4.6-orange)]()

> **Sparkle Universe** — The premier next-generation fan community platform for Sparkle YouTube fans, featuring rich content creation, real-time interaction, watch parties, creator tools, advanced gamification, and AI-powered experiences with enterprise-grade performance optimizations.

<p align="center">
  <strong>🚀 Production-Ready • 🎮 Gamified • 🤖 AI-Powered • ⚡ Real-time • 📺 YouTube-Native • 🔒 Enterprise Security</strong>
</p>

---

## 📑 Table of Contents

* [🌟 About & Vision](#-about--vision)
* [✨ Key Features](#-key-features)
* [🏗️ Technical Architecture](#️-technical-architecture)
* [🚀 Quick Start](#-quick-start)
* [🔧 Development Setup](#-development-setup)
* [📁 Project Structure](#-project-structure)
* [🗄️ Database Architecture](#️-database-architecture)
* [📊 Database Schema Reference](#-database-schema-reference)
* [🔌 API & tRPC Conventions](#-api--trpc-conventions)
* [⚡ Real-time & Background Jobs](#-real-time--background-jobs)
* [🎨 Design System](#-design-system)
* [🎮 Gamification System](#-gamification-system)
* [💳 Monetization & Economy](#-monetization--economy)
* [🔐 Security & Privacy](#-security--privacy)
* [⚙️ Performance Optimizations](#️-performance-optimizations)
* [📊 Monitoring & Analytics](#-monitoring--analytics)
* [🧪 Testing Strategy](#-testing-strategy)
* [🚢 Deployment](#-deployment)
* [🛠️ Troubleshooting](#️-troubleshooting)
* [📈 Roadmap](#-roadmap)
* [💰 Business Model](#-business-model)
* [🤝 Contributing](#-contributing)
* [📄 License](#-license)

---

## 🌟 About & Vision

**Sparkle Universe** is the definitive digital ecosystem for Sparkle's YouTube community, engineered with enterprise-grade architecture and performance optimizations (v4.6) to deliver an immersive, gamified, and AI-enhanced experience that brings fans and creators together at scale.

### 🎯 Core Mission
- **Primary Goal**: Become the premier global destination for Sparkle YouTube fans
- **Target Audience**: Content creators and fans aged 13–35
- **User Growth Target**: 100,000 active users within 6 months, 1M within year one
- **Engagement Target**: 70% weekly active users (WAU), 15+ minutes average session time
- **Performance Target**: Sub-100ms API response times (p95), 95+ Lighthouse scores

### 🏆 Key Differentiators
- **YouTube-Native**: Timestamp discussions, automated metadata, watch parties, clip creation
- **Real-time First**: Live chat, presence indicators, collaborative editing, instant notifications
- **AI-Powered**: Content recommendations, auto-moderation, sentiment analysis, writing assistance
- **Gamified Experience**: XP system, achievements, virtual economy, seasonal events
- **Creator-Centric**: Analytics dashboard, monetization tools, content calendar, fan insights
- **Performance Optimized**: v4.6 query strategies, strategic composite indexes, JSON GIN indexes

---

## ✨ Key Features

### Content & Creation
- **Rich Post Editor**: TipTap-based WYSIWYG with Markdown support, media embeds, code blocks
- **Series & Collections**: Organize content into structured narratives with PostSeries model
- **Collaborative Editing**: Real-time multi-user document editing via CollaborativeSpace
- **Version Control**: Post revision history with diff viewing (20+ models with version fields)
- **Content Types**: 
  - `BLOG` - Traditional blog posts
  - `LIVE_BLOG` - Real-time event coverage
  - `POLL` - Community polls with multiple choice
  - `VIDEO_REVIEW` - YouTube video analysis
  - `FAN_ART` - Creative content showcase
  - `THEORY_THREAD` - Theory discussions
  - `SERIES` - Multi-part content series
  - `TUTORIAL` - How-to guides
  - `NEWS` - News and announcements

### YouTube Integration
- **Auto-Metadata**: Automatic video information fetching via YouTube API
- **Timestamp Discussions**: Comment on specific video moments with youtubeTimestamp field
- **Watch Parties**: Synchronized viewing with Socket.IO and WatchParty model
- **Clip Creation**: Create and share video highlights via VideoClip model
- **Playlist Management**: Curated content collections with collaborative features
- **Channel Analytics**: Creator performance dashboards via VideoAnalytics
- **API Quota Management**: YouTubeApiQuota tracking to prevent rate limits

### Social & Community
- **Following System**: User and topic following with notification preferences
- **Direct Messaging**: Encrypted conversations with Message model
- **Groups & Events**: Community spaces with role-based permissions
- **Live Presence**: Real-time tracking via PresenceTracking model
- **Reactions & Awards**: 9 reaction types including SPARKLE and MIND_BLOWN
- **Blocking System**: Comprehensive blocking with cascade effects
- **Mentions**: Track and notify @mentions across content

### Gamification & Economy
- **XP & Levels**: Progress tracking with XpLog audit trail
- **Achievements**: 100+ unlockable badges across 8 rarity tiers
- **Virtual Currency**: Integer-based sparklePoints (earned) & premiumPoints (purchased)
- **Marketplace**: StoreItem and StoreBundle systems with rarity tiers
- **Leaderboards**: Global and category rankings with period tracking
- **Seasonal Events**: Time-limited quests and achievements
- **Trading System**: Secure item trading with escrow support

### AI & Intelligence
- **Smart Recommendations**: AiRecommendation model with confidence scoring
- **Auto-Moderation**: AiModerationQueue with multi-provider support
- **Writing Assistant**: AiContentSuggestion for content enhancement
- **Sentiment Analysis**: Automated content sentiment tracking
- **Trend Detection**: Real-time trend identification via analytics
- **AI Conversations**: AiAssistantConversation with token tracking

---

## 🏗️ Technical Architecture

### Core Tech Stack (Production Implementation)

```typescript
// Frontend Stack
const frontend = {
  framework: "Next.js 14.2.31" /* App Router, Server Components */,
  language: "TypeScript 5.3.3" /* Strict mode, noUncheckedIndexedAccess */,
  styling: "Tailwind CSS 3.4.1" /* JIT, custom design tokens */,
  components: "shadcn/ui + Radix UI" /* Accessible primitives */,
  state: {
    client: "Zustand 4.4.7" /* Lightweight, TypeScript-first */,
    server: "TanStack Query 5.17.9" /* Powerful data synchronization */
  },
  editor: "TipTap 2.1.16" /* Extensible rich text */,
  animations: "Framer Motion 10.18.0" /* Smooth interactions */
};

// Backend Stack
const backend = {
  database: "PostgreSQL 16" /* JSONB, GIN indexes, pg_trgm, pgcrypto */,
  orm: "Prisma 5.8.1" /* Type-safe database access, v4.6 optimizations */,
  api: "tRPC 10.45.0" /* End-to-end type safety */,
  cache: "Redis (ioredis 5.3.2)" /* Sessions, rate limiting, pub/sub */,
  realtime: "Socket.IO 4.7.4" /* WebSocket with fallbacks */,
  auth: "NextAuth 5.0.0-beta.4" /* OAuth + credentials */,
  validation: "Zod 3.22.4" /* Runtime type validation */,
  precision: "PostgreSQL Decimal" /* Decimal(19,4) for financial calculations */
};

// Infrastructure
const infrastructure = {
  hosting: "Vercel" /* Edge functions, automatic scaling */,
  monitoring: ["Vercel Analytics", "Vercel Speed Insights"],
  node: ">=20.0.0" /* LTS version */,
  packageManager: "npm 10.2.5" /* Specified version */,
  schemaVersion: "4.5" /* Performance Optimization Release */
};
```

### System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Next.js Web App]
        PWA[Progressive Web App]
        MOBILE[Mobile Responsive]
    end
    
    subgraph "API Gateway"
        TRPC[tRPC API]
        AUTH[NextAuth]
        WS[Socket.IO Gateway]
    end
    
    subgraph "Service Layer"
        USER[User Service]
        CONTENT[Content Service]
        SOCIAL[Social Service]
        GAME[Gamification Service]
        YT[YouTube Service]
        PAY[Monetization Service]
        AI[AI Service]
    end
    
    subgraph "Data Layer"
        PG[(PostgreSQL)]
        REDIS[(Redis)]
        S3[(S3 Storage)]
        QUEUE[(Job Queue)]
    end
    
    WEB --> TRPC
    WEB --> AUTH
    WEB --> WS
    
    TRPC --> USER
    TRPC --> CONTENT
    TRPC --> SOCIAL
    TRPC --> GAME
    TRPC --> PAY
    TRPC --> AI
    
    USER --> PG
    CONTENT --> PG
    SOCIAL --> REDIS
    GAME --> PG
    PAY --> PG
    AI --> PG
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: 20.0.0+ (LTS required)
- **npm**: 10.0.0+ (10.2.5 recommended)
- **PostgreSQL**: 16+ with extensions (pgcrypto, pg_trgm)
- **Redis**: 7.0+ (or Docker)

### Installation

```bash
# Clone repository
git clone https://github.com/nordeim/Sparkle-Universe-Next.git
cd Sparkle-Universe-Next

# Install dependencies
npm ci

# Setup environment
cp .env.example .env.local
# Edit .env.local with your configuration

# Setup database extensions
psql -U postgres -d sparkle_universe_dev -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
psql -U postgres -d sparkle_universe_dev -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"

# Setup database
npm run db:generate
npm run db:migrate
npm run db:seed # Optional: Load sample data

# Apply required JSON GIN indexes (CRITICAL for performance)
psql -U postgres -d sparkle_universe_dev < prisma/indexes.sql

# Start development server
npm run dev

# Open http://localhost:3000
```

---

## 🔧 Development Setup

### Environment Variables

Complete production-ready configuration:

```bash
# Database Configuration
DATABASE_URL="postgresql://postgres:password@localhost:5432/sparkle_universe_dev"
DIRECT_URL="postgresql://postgres:password@localhost:5432/sparkle_universe_dev"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# OAuth Providers (schema supports: LOCAL, GOOGLE, GITHUB, TWITTER, DISCORD)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
DISCORD_CLIENT_ID="your-discord-client-id"
DISCORD_CLIENT_SECRET="your-discord-client-secret"
TWITTER_CLIENT_ID="your-twitter-client-id"
TWITTER_CLIENT_SECRET="your-twitter-client-secret"

# External Services
YOUTUBE_API_KEY="your-youtube-api-key"
UPLOADTHING_SECRET="your-uploadthing-secret"
UPLOADTHING_APP_ID="your-uploadthing-app-id"

# Redis Configuration
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD=""

# Email Configuration
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="noreply@sparkle-universe.com"

# SMS Configuration (for 2FA)
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"

# Application URLs
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_WS_URL="ws://localhost:3000"

# Feature Flags
NEXT_PUBLIC_ENABLE_YOUTUBE="true"
NEXT_PUBLIC_ENABLE_WEBSOCKET="true"
NEXT_PUBLIC_ENABLE_PWA="false"
NEXT_PUBLIC_ENABLE_PHONE_VERIFICATION="true"
NEXT_PUBLIC_ENABLE_2FA="true"

# Security
ENCRYPTION_KEY="generate-32-byte-hex-key"
JWT_SECRET="another-secret-key"
HASH_SALT="generate-secure-salt"

# AI Services
OPENAI_API_KEY="your-openai-api-key"
AI_MODEL="gpt-4"

# Payment Processing
STRIPE_SECRET_KEY="your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"
PAYPAL_CLIENT_ID="your-paypal-client-id"
PAYPAL_CLIENT_SECRET="your-paypal-client-secret"

# Development
NODE_ENV="development"
```

### Database Setup with Performance Optimizations

```bash
# Install PostgreSQL extensions (required)
psql -U postgres -d sparkle_universe_dev << EOF
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
EOF

# Run migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Apply JSON GIN indexes (CRITICAL for v4.6 performance)
psql -U postgres -d sparkle_universe_dev << 'EOF'
-- Profile JSON indexes
CREATE INDEX CONCURRENTLY idx_profile_theme ON profiles USING GIN (themePreference jsonb_path_ops);
CREATE INDEX CONCURRENTLY idx_profile_notifications ON profiles USING GIN (notificationSettings jsonb_path_ops);
CREATE INDEX CONCURRENTLY idx_profile_privacy ON profiles USING GIN (privacySettings jsonb_path_ops);
CREATE INDEX CONCURRENTLY idx_profile_social ON profiles USING GIN (socialLinks jsonb_path_ops);

-- Post JSON indexes
CREATE INDEX CONCURRENTLY idx_post_content ON posts USING GIN (content jsonb_path_ops);
CREATE INDEX CONCURRENTLY idx_post_youtube_data ON posts USING GIN (youtubeVideoData jsonb_path_ops);
CREATE INDEX CONCURRENTLY idx_post_sponsor ON posts USING GIN (sponsorInfo jsonb_path_ops);
CREATE INDEX CONCURRENTLY idx_post_content_type ON posts ((content->>'type'));
CREATE INDEX CONCURRENTLY idx_post_content_blocks ON posts ((content->'blocks'));

-- Group JSON indexes
CREATE INDEX CONCURRENTLY idx_group_guidelines ON groups USING GIN (guidelines jsonb_path_ops);
CREATE INDEX CONCURRENTLY idx_group_settings ON groups USING GIN (settings jsonb_path_ops);
CREATE INDEX CONCURRENTLY idx_group_emojis ON groups USING GIN (customEmojis jsonb_path_ops);

-- Event JSON indexes
CREATE INDEX CONCURRENTLY idx_event_agenda ON events USING GIN (agenda jsonb_path_ops);
CREATE INDEX CONCURRENTLY idx_event_speakers ON events USING GIN (speakers jsonb_path_ops);
CREATE INDEX CONCURRENTLY idx_event_sponsors ON events USING GIN (sponsors jsonb_path_ops);

-- Full-text search index
CREATE INDEX CONCURRENTLY idx_search_index_text ON search_index 
  USING GIN (to_tsvector('english', searchableText));
EOF

# Seed database (development only)
npm run db:seed

# Open Prisma Studio (GUI)
npm run db:studio
```

### Available Scripts

```bash
# Development
npm run dev              # Start Next.js dev server
npm run build           # Production build
npm run start           # Start production server
npm run preview         # Preview production build

# Database
npm run db:generate     # Generate Prisma client
npm run db:push         # Push schema changes (dev)
npm run db:migrate      # Run dev migrations
npm run db:migrate:prod # Deploy production migrations
npm run db:seed         # Seed sample data
npm run db:reset        # Reset database
npm run db:studio       # Open Prisma Studio
npm run db:indexes      # Apply JSON GIN indexes

# Testing
npm run test            # Run Jest tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
npm run test:e2e        # Playwright E2E tests

# Code Quality
npm run lint            # ESLint check
npm run lint:fix        # Auto-fix issues
npm run type-check      # TypeScript validation
npm run format          # Prettier formatting

# Hooks
npm run prepare         # Install Husky hooks
npm run postinstall     # Generate Prisma client after install
```

---

## 📁 Project Structure

```
Sparkle-Universe-Next/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/              # Authentication routes
│   │   ├── (main)/              # Main application routes
│   │   ├── api/                 # API endpoints
│   │   │   ├── auth/[...nextauth]/
│   │   │   ├── trpc/[trpc]/
│   │   │   └── webhooks/       # Stripe, PayPal webhooks
│   │   └── layout.tsx           # Root layout
│   │
│   ├── components/              # React components
│   │   ├── ui/                 # Base UI components (shadcn/ui)
│   │   ├── features/           # Feature-specific components
│   │   ├── providers/          # Context providers
│   │   └── shared/             # Shared components
│   │
│   ├── server/                  # Server-side code
│   │   ├── api/                # tRPC routers
│   │   ├── services/           # Business logic
│   │   └── jobs/               # Background jobs
│   │
│   ├── lib/                     # Core libraries
│   │   ├── auth/               # NextAuth configuration
│   │   │   ├── auth.config.ts # NextAuth options
│   │   │   └── auth.ts        # Auth utilities
│   │   ├── db.ts              # Prisma client
│   │   ├── redis.ts           # Redis client
│   │   └── utils.ts           # Utilities
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── use-auth.ts        # Auth hook
│   │   └── use-websocket.ts   # WebSocket hook
│   │
│   ├── types/                   # TypeScript types
│   └── styles/                  # Global styles
│
├── prisma/
│   ├── schema.prisma           # Database schema (126 models, v4.6)
│   ├── migrations/             # Migration files
│   ├── seed.ts                 # Seed script
│   └── indexes.sql             # Manual JSON GIN indexes
│
├── public/                      # Static assets
├── tests/                       # Test files
└── package.json                # Dependencies & scripts
```

---

## 🗄️ Database Architecture

### Schema Implementation Overview

The database uses PostgreSQL 16 with Prisma ORM v5.8.1, implementing a comprehensive 126-model schema (v4.6) with:

1. **Performance Optimizations**: Strategic composite indexes and JSON GIN indexes
2. **Soft Deletes**: `deleted`, `deletedAt`, `deletedBy` pattern for data recovery
3. **Optimistic Locking**: `version` field on 20+ models for concurrent updates
4. **Author Preservation**: `authorName`, `ownerName`, `hostName` fields preserve names after user deletion
5. **Audit Trail**: Complete tracking with AuditLog model
6. **Financial Precision**: All monetary values use `Decimal(19,4)` for accurate calculations
7. **Query Complexity Management**: Documented patterns for high-relation models

### Core Database Statistics

- **Total Database Models**: 126
- **Total Enum Types**: 22
- **Models with Version Field**: 20+
- **Models with Soft Delete**: 25+
- **Models Requiring JSON Indexes**: 8
- **Strategic Composite Indexes**: 50+
- **Currency Precision**: Decimal(19,4) for money, Int for points

---

## 📊 Database Schema Reference

### Complete Enum Reference (23 Types)

#### User & Authentication Enums

```typescript
enum UserRole {
  USER              // Standard user
  CREATOR           // Content creator
  VERIFIED_CREATOR  // Verified content creator
  MODERATOR         // Community moderator
  ADMIN             // Platform administrator
  SYSTEM            // Automated system actions
}

enum UserStatus {
  PENDING_VERIFICATION  // Email verification pending
  ACTIVE               // Normal active user
  SUSPENDED            // Temporarily suspended
  BANNED               // Permanently banned
  DELETED              // Soft deleted account
}

enum AuthProvider {
  LOCAL     // Email/password
  GOOGLE    // Google OAuth
  GITHUB    // GitHub OAuth
  TWITTER   // Twitter OAuth
  DISCORD   // Discord OAuth
}

enum SubscriptionTier {
  FREE              // Basic features
  SPARKLE_FAN       // Enhanced features ($4.99/month)
  SPARKLE_CREATOR   // Creator tools ($9.99/month)
  SPARKLE_LEGEND    // Premium experience ($19.99/month)
}
```

#### Content & Interaction Enums

```typescript
enum ContentType {
  BLOG           // Traditional blog posts
  LIVE_BLOG      // Real-time event coverage
  POLL           // Community polls
  VIDEO_REVIEW   // YouTube video analysis
  FAN_ART        // Creative content showcase
  THEORY_THREAD  // Theory discussions
  SERIES         // Multi-part content series
  TUTORIAL       // How-to guides
  NEWS           // News and announcements
}

enum ContentStatus {
  DRAFT      // Work in progress
  SCHEDULED  // Scheduled for publication
  PUBLISHED  // Live and visible
  ARCHIVED   // Archived content
  DELETED    // Soft deleted
}

enum ReactionType {
  LIKE        // Basic like
  LOVE        // Heart reaction
  FIRE        // Fire/hot reaction
  SPARKLE     // Platform special
  MIND_BLOWN  // Amazed reaction
  LAUGH       // Funny reaction
  CRY         // Sad reaction
  ANGRY       // Angry reaction
  CUSTOM      // Custom emoji
}

enum NotificationType {
  POST_LIKED            // Post received a like
  POST_COMMENTED        // Post received a comment
  COMMENT_LIKED         // Comment received a like
  USER_FOLLOWED         // New follower
  ACHIEVEMENT_UNLOCKED  // Achievement earned
  LEVEL_UP              // Level increased
  MENTION               // Mentioned in content
  SYSTEM                // System notification
  GROUP_INVITE          // Group invitation
  GROUP_POST            // New group post
  EVENT_REMINDER        // Event reminder
  WATCH_PARTY_INVITE    // Watch party invitation
  DIRECT_MESSAGE        // New direct message
  YOUTUBE_PREMIERE      // YouTube premiere notification
  QUEST_COMPLETE        // Quest completed
  TRADE_REQUEST         // Trade request received
  CONTENT_FEATURED      // Content was featured
  MILESTONE_REACHED     // Milestone achieved
}
```

#### Moderation & Safety Enums

```typescript
enum ReportReason {
  SPAM             // Spam content
  INAPPROPRIATE    // Inappropriate content
  HARASSMENT       // Harassment or bullying
  MISINFORMATION   // False information
  COPYRIGHT        // Copyright violation
  NSFW             // Not safe for work
  HATE_SPEECH      // Hate speech
  SELF_HARM        // Self-harm content
  OTHER            // Other reason
}

enum ModerationStatus {
  PENDING        // Awaiting review
  APPROVED       // Approved content
  REJECTED       // Rejected content
  ESCALATED      // Escalated to higher level
  AUTO_APPROVED  // Automatically approved
  SHADOW_BANNED  // Shadow banned content
  UNDER_REVIEW   // Currently being reviewed
}
```

#### Gamification Enums

```typescript
enum BadgeRarity {
  COMMON           // 50%+ of users
  UNCOMMON         // 30-50% of users
  RARE             // 10-30% of users
  EPIC             // 5-10% of users
  LEGENDARY        // 1-5% of users
  MYTHIC           // <1% of users
  LIMITED_EDITION  // Time-limited availability
  SEASONAL         // Seasonal events only
}

enum QuestType {
  DAILY       // Daily quests
  WEEKLY      // Weekly quests
  MONTHLY     // Monthly quests
  SPECIAL     // Special event quests
  ACHIEVEMENT // Achievement-based quests
  SEASONAL    // Seasonal quests
  COMMUNITY   // Community quests
  CREATOR     // Creator-specific quests
}

enum QuestStatus {
  AVAILABLE    // Available to start
  IN_PROGRESS  // Currently active
  COMPLETED    // Completed but not claimed
  CLAIMED      // Rewards claimed
  EXPIRED      // Time expired
  LOCKED       // Requirements not met
}

enum TradeStatus {
  PENDING    // Awaiting response
  ACCEPTED   // Trade accepted
  REJECTED   // Trade rejected
  CANCELLED  // Trade cancelled
  EXPIRED    // Trade expired
  COMPLETED  // Trade completed
  DISPUTED   // Under dispute
}
```

#### Communication & Events Enums

```typescript
enum MessageStatus {
  SENT       // Message sent
  DELIVERED  // Message delivered
  READ       // Message read
  DELETED    // Message deleted
}

enum EventType {
  WATCH_PARTY       // Watch party event
  COMMUNITY_MEETUP  // Community meetup
  CONTEST           // Contest event
  PREMIERE          // Content premiere
  AMA               // Ask Me Anything
  SPECIAL           // Special event
  TOURNAMENT        // Tournament
  WORKSHOP          // Educational workshop
}

enum EventStatus {
  DRAFT      // Draft status
  SCHEDULED  // Scheduled event
  LIVE       // Currently live
  ENDED      // Event ended
  CANCELLED  // Event cancelled
}

enum GroupVisibility {
  PUBLIC       // Open to all
  PRIVATE      // Members only
  INVITE_ONLY  // Invitation required
  HIDDEN       // Not discoverable
}

enum GroupMemberRole {
  MEMBER     // Regular member
  MODERATOR  // Group moderator
  ADMIN      // Group admin
  OWNER      // Group owner
}
```

#### System & Infrastructure Enums

```typescript
enum PaymentStatus {
  PENDING     // Payment pending
  PROCESSING  // Being processed
  COMPLETED   // Successfully completed
  FAILED      // Payment failed
  REFUNDED    // Payment refunded
  CANCELLED   // Payment cancelled
}

enum CacheType {
  USER_PROFILE  // User profile cache
  POST_CONTENT  // Post content cache
  FEED          // Feed cache
  TRENDING      // Trending content cache
  LEADERBOARD   // Leaderboard cache
  STATS         // Statistics cache
}

enum AuditAction {
  CREATE            // Entity created
  UPDATE            // Entity updated
  DELETE            // Entity deleted
  LOGIN             // User login
  LOGOUT            // User logout
  PERMISSION_CHANGE // Permissions changed
  MODERATION_ACTION // Moderation action taken
  SYSTEM_ACTION     // System automated action
}
```

### Critical Model Documentation

#### User Model (EXTREME Query Complexity - 126 Relations)

**⚠️ PERFORMANCE WARNING**: The User model has 126 relations. Never use `include: { _count: true }` or load all relations.

```typescript
// GOOD: Selective field loading
const user = await prisma.user.findMany({ 
  select: { 
    id: true, 
    username: true, 
    profile: true 
  }
});

// BAD: Loading all relations
const user = await prisma.user.findMany({ 
  include: { _count: true }
});

// Common Query Patterns:
// - Basic Profile: id, username, image, role, status
// - Extended Profile: + profile, stats, achievements
// - Social Features: + followers, following counts only
// - Content Creator: + posts (paginated), subscription
// - Full Admin View: Use multiple targeted queries
```

**Key User Fields**:
- **Points**: `sparklePoints: Int`, `premiumPoints: Int` (integers, not decimals)
- **Security**: Full 2FA support with `twoFactorEnabled`, `twoFactorSecret`, `twoFactorBackupCodes`
- **Verification**: Email and phone verification with tokens and expiry
- **Account Security**: Lockout attempts, failed login tracking, password change history
- **Monetization**: `creatorRevenueShare: Decimal(19,4)`, `totalRevenueEarned: BigInt`, `lastPayoutDate`
- **Preferences**: `preferredLanguage`, `timezone`

#### Post Model (HIGH Query Complexity)

**JSON GIN Indexes Required**:
- `content` field for rich text searching
- `youtubeVideoData` for video metadata queries
- `sponsorInfo` for sponsor information

**Key Features**:
- Version control with `version` field
- AI content support with `aiGenerated`, `aiModel`, `aiPrompt`
- Author preservation with `authorName` for deleted users
- Collaborative editing with `collaborators` array
- Comprehensive SEO fields

#### Message Model (Optimized for Chat)

**Query Patterns**:
- Conversation messages: Use `conversationId + createdAt` index
- Undelivered messages: Use `conversationId + status` index
- User's sent messages: Use `senderId + createdAt` index

**Features**:
- End-to-end encryption support with `encryptedContent`
- Message reactions stored as JSON
- Edit history tracking
- Selective deletion per user

---

## 🔌 API & tRPC Conventions

### Authentication Implementation

Based on NextAuth v5 with comprehensive security:

```typescript
// OAuth Providers (All Configured in Schema)
✅ Google OAuth (implemented)
✅ GitHub OAuth (implemented)
🔧 Discord OAuth (schema ready)
🔧 Twitter OAuth (schema ready)
✅ Local credentials (email/password)
✅ Phone verification (2FA ready)

// Session Management
- JWT strategy with 30-day expiration
- Role-based access control (6-tier system)
- Automatic last seen tracking
- Account status enforcement
- Two-factor authentication support
```

### Server-Side Auth Utilities

```typescript
// Core authentication functions
getServerAuth()           // Get current session
requireAuth()             // Require authentication
requireRole(role)         // Require specific role
getCurrentUserId()        // Get user ID
hasRole(role)            // Check specific role
hasMinimumRole(role)     // Check role hierarchy
isSystemUser()           // Check for SYSTEM role
validateTwoFactor(code)  // Validate 2FA code
```

### Client-Side Auth Hook

```typescript
// useAuth hook provides:
interface AuthHookReturn {
  user: User | null;
  session: Session | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  isCreator: boolean;
  isVerifiedCreator: boolean;
  isModerator: boolean;
  isAdmin: boolean;
  isSystem: boolean;
  has2FAEnabled: boolean;
  hasPhoneVerified: boolean;
  login: (credentials) => Promise<void>;
  logout: () => Promise<void>;
  verifyTwoFactor: (code: string) => Promise<void>;
}
```

---

## ⚡ Real-time & Background Jobs

### Socket.IO Configuration

```typescript
// Socket.IO 4.7.4 implementation with Redis adapter
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';

// Real-time features:
- Live chat with ChatRoom and ChatMessage models
- Presence indicators via PresenceTracking
- Typing indicators
- Real-time notifications (19 types)
- Watch parties with synchronized playback
- Collaborative editing with operational transforms
- Live streaming comments
```

### Redis Integration

Using `ioredis 5.3.2` for:
- Session storage with TTL management
- Cache layer (6 cache types via CacheEntry)
- Rate limiting (RateLimitTracker model)
- Socket.IO adapter for horizontal scaling
- Pub/Sub messaging
- Queue management for background jobs
- Leaderboard caching
- Real-time presence tracking

### Background Job Processing

```typescript
// Scheduled jobs via ScheduledAction model
- Content publishing (PublishQueue)
- Email campaigns (EmailCampaign)
- Notification digests
- Analytics aggregation
- Cache warming
- Data retention cleanup

// Recurring schedules via RecurringSchedule
- Newsletter delivery
- Quest rotation
- Leaderboard updates
- Backup operations
```

---

## 🎨 Design System

### Component Library

Built on shadcn/ui with custom variants:

```typescript
// Button variants (8 total)
- default    // Primary action
- destructive // Dangerous actions
- outline    // Secondary actions
- secondary  // Alternative actions
- ghost      // Minimal styling
- link       // Link appearance
- sparkle    // Gradient effect (custom)
- glow       // Shadow effect (custom)

// Component sizes
- sm, default, lg, xl, icon

// Accessibility features
- Full ARIA support
- Keyboard navigation
- Focus management
- Screen reader optimization
```

### Theme System

```typescript
// Theme stored in Profile.themePreference (JSON)
interface ThemePreference {
  mode: 'light' | 'dark' | 'auto';
  primaryColor: string;
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  reducedMotion: boolean;
  highContrast: boolean;
}

// Custom CSS support via Profile
- customCss: String (Text field)
- customHtml: String (Text field)
```

---

## 🎮 Gamification System

### XP & Leveling System

```typescript
// XP rewards tracked via XpLog model
const XP_REWARDS = {
  POST_CREATE: 10,            // Create a post
  COMMENT_CREATE: 5,          // Add a comment  
  QUALITY_POST_BONUS: 50,     // High engagement bonus
  HELPFUL_COMMENT: 20,        // Helpful comment bonus
  DAILY_LOGIN: 10,            // Daily login reward
  FIRST_POST_OF_DAY: 15,      // First post bonus
  STREAK_BONUS: 5,            // Per day streak
  ACHIEVEMENT_UNLOCK: 25,     // Achievement completion
  QUEST_COMPLETE: 30,         // Quest completion
  LEVEL_UP: 100,             // Level up bonus
};

// Level configuration via LevelConfig model
interface LevelConfig {
  level: number;
  requiredXp: number;
  title: string;
  perks: string[];
  sparkleReward: number;  // Int type
  premiumReward: number;  // Int type
  unlockFeatures: string[];
}

// Progressive level calculation
const calculateLevel = (xp: number): number => {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
};
```

### Achievement System (8 Rarity Tiers)

```typescript
// Achievement model with comprehensive tracking
interface Achievement {
  code: string;                // Unique identifier
  rarity: BadgeRarity;        // 8 tier system
  xpReward: number;
  sparklePointsReward: number; // Int type
  premiumPointsReward: number; // Int type
  progressSteps: number;
  isSecret: boolean;
  seasonal: boolean;
  limited: boolean;
  maxAchievers?: number;       // For limited edition
}

// User progress tracked via UserAchievement
interface UserAchievement {
  progress: number;      // 0 to 1
  progressData: Json;    // Detailed progress
  showcased: boolean;
  claimedRewards: boolean;
}
```

### Quest System

```typescript
// 8 quest types with different cycles
enum QuestType {
  DAILY, WEEKLY, MONTHLY, SPECIAL,
  ACHIEVEMENT, SEASONAL, COMMUNITY, CREATOR
}

// Quest configuration
interface Quest {
  type: QuestType;
  difficulty: 'easy' | 'medium' | 'hard' | 'epic';
  requirements: Json;      // Completion criteria
  rewards: Json;          // Reward specification
  xpReward: number;
  pointsReward: number;   // Sparkle points
  cooldownHours?: number; // For repeatable quests
  timeLimit?: number;     // In minutes
}
```

### Virtual Economy

```typescript
// Dual Currency System
interface UserBalance {
  sparklePoints: number;    // Int - Earned through activity
  premiumPoints: number;    // Int - Purchased currency
  frozenPoints: number;     // Int - Points in escrow
  lifetimeEarned: number;   // Int - Total earned
  lifetimeSpent: number;    // Int - Total spent
}

// Store System
interface StoreItem {
  priceSparkle?: Decimal;   // Decimal(19,4)
  pricePremium?: Decimal;   // Decimal(19,4)
  rarity: BadgeRarity;      // 8 tier rarity
  limitedEdition: boolean;
  stockRemaining?: number;
  maxPerUser?: number;
}

interface StoreBundle {
  priceSparkle?: number;    // Decimal(19,4)
  pricePremium?: number;    // Decimal(19,4)
}

// Trading System with escrow
interface Trade {
  status: TradeStatus;      // 7 status types
  escrowId?: string;        // Secure trading
  tradeValue: number;       // Estimated value
  version: number;          // Optimistic locking
}
```

---

## 💳 Monetization & Economy

### Creator Monetization System

```typescript
// Creator revenue configuration (User model)
interface CreatorMonetization {
  creatorRevenueShare: Decimal;  // Default 0.7000 (70%)
  totalRevenueEarned: BigInt;
  lastPayoutDate?: DateTime;
}

// Fan Funding
interface FanFunding {
  amount: Decimal;           // Decimal(19,4)
  currency: string;         // Default "USD"
  platformFee: Decimal;     // Platform cut
  creatorAmount: Decimal;   // Creator receives
  isAnonymous: boolean;
  paymentMethod: string;    // "stripe", "paypal"
}

// Revenue Sharing
interface RevenueShare {
  totalRevenue: Decimal;    // Decimal(19,4)
  platformShare: Decimal;   // 30% default
  creatorShare: Decimal;    // 70% default
  affiliateShare: Decimal;  // For referrals
}

// Tip System
interface TipTransaction {
  amount: Decimal;          // Decimal(19,4)
  currency: string;         // "sparkle" or "premium"
  isAnonymous: boolean;
}

// Creator Payouts
interface CreatorPayout {
  totalRevenue: Decimal;    // Decimal(19,4)
  platformFee: Decimal;
  creatorShare: Decimal;
  taxWithheld: Decimal;
  finalAmount: Decimal;
  payoutMethod: string;     // "stripe", "paypal", "bank_transfer"
  payoutStatus: string;     // "PENDING", "PROCESSING", "COMPLETED", "FAILED"
}
```

### Subscription Tiers

```typescript
// Based on SubscriptionTier enum
const SUBSCRIPTION_TIERS = {
  FREE: {
    price: 0,
    features: [
      "Core features with limitations",
      "Ad-supported experience",
      "5 posts per day limit",
      "Basic achievements"
    ]
  },
  SPARKLE_FAN: {
    price: 4.99,
    features: [
      "Ad-free experience",
      "Unlimited posts",
      "Priority support",
      "Exclusive badges",
      "2x XP multiplier",
      "Custom themes"
    ]
  },
  SPARKLE_CREATOR: {
    price: 9.99,
    features: [
      "All Fan benefits",
      "Creator analytics dashboard",
      "Monetization tools",
      "Advanced profile customization",
      "Early access features",
      "3x XP multiplier",
      "Fan funding enabled"
    ]
  },
  SPARKLE_LEGEND: {
    price: 19.99,
    features: [
      "All Creator benefits",
      "Verified badge",
      "Beta features access",
      "Direct support line",
      "Custom emojis",
      "5x XP multiplier",
      "100 Premium Points monthly",
      "Revenue share bonus"
    ]
  }
};
```

### Currency Conversion Rates

```typescript
const CURRENCY_CONFIG = {
  // Point conversions
  USD_TO_PREMIUM: 100,        // $1 = 100 Premium Points
  SPARKLE_TO_PREMIUM: 1000,   // 1000 Sparkle = 1 Premium
  
  // Platform fees
  PLATFORM_FEE: 0.30,         // 30% platform fee
  CREATOR_SHARE: 0.70,        // 70% creator share
  TAX_WITHHOLDING: 0.10,      // 10% tax withholding
  
  // Minimum thresholds
  MIN_PAYOUT: 10.00,          // $10 minimum payout
  MIN_TIP: 0.50,              // $0.50 minimum tip
};
```

---

## 🔐 Security & Privacy

### Comprehensive Security Implementation

#### Authentication & Authorization
- **Multi-Factor Authentication**: Full 2FA with TOTP and backup codes
- **OAuth Providers**: Google, GitHub, Discord, Twitter support
- **Password Security**: bcrypt hashing with configurable salt rounds
- **Session Management**: JWT with 30-day expiration, refresh tokens
- **Role-Based Access**: 6-tier system with SYSTEM role for automation

#### Account Security Features
```typescript
interface UserSecurityFields {
  // Two-Factor Authentication
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;           // Encrypted TOTP secret
  twoFactorBackupCodes: string[];     // Encrypted backup codes
  
  // Password Reset
  resetPasswordToken?: string;
  resetPasswordExpires?: DateTime;
  lastPasswordChangedAt?: DateTime;
  
  // Email Verification
  emailVerificationToken?: string;
  emailVerificationExpires?: DateTime;
  emailVerified?: DateTime;
  
  // Phone Verification
  phoneNumber?: string;               // Encrypted
  phoneNumberHash?: string;           // For lookups
  phoneVerified?: DateTime;
  
  // Account Lockout
  accountLockoutAttempts: number;
  accountLockedUntil?: DateTime;
  lastFailedLoginAt?: DateTime;
  failedLoginAttempts: number;
}
```

#### Data Privacy & Protection
- **Soft Deletes**: Complete audit trail with `deleted`, `deletedAt`, `deletedBy`
- **Data Retention**: DataRetentionPolicy model for GDPR compliance
- **Encryption**: EncryptionKey model for key rotation
- **Author Preservation**: Content author names preserved after account deletion
- **Phone Number Hashing**: Separate hash field for secure lookups
- **Anonymous Features**: Anonymous voting, tipping, and fan funding
- **Privacy Settings**: Granular control via JSON settings

#### Security Monitoring
```typescript
// Login tracking
interface LoginHistory {
  ipAddress: string;
  userAgent: string;
  location?: string;
  success: boolean;
  reason?: string;
}

// Security alerts
interface SecurityAlert {
  type: string;
  severity: string;
  resolved: boolean;
}

// Audit logging
interface AuditLog {
  action: AuditAction;
  entityData?: Json;    // Before snapshot
  changedData?: Json;   // What changed
  ipAddress?: string;
}
```

### Content Safety

#### AI-Powered Moderation
```typescript
interface AiModerationQueue {
  aiProvider: string;        // "openai", "perspective", "custom"
  aiScore?: number;          // 0-1 violation probability
  aiCategories?: Json;       // Category scores
  confidence?: number;       // AI confidence
  humanReviewRequired: boolean;
  autoActionTaken?: string;  // "blocked", "shadow_banned", "flagged"
}
```

#### Content Filtering
```typescript
interface ContentFilter {
  filterType: string;        // "keyword", "regex", "ai_category"
  pattern: string;
  action: string;           // "block", "flag", "shadow_ban"
  severity: number;         // 1-5 scale
}
```

#### Reporting System
- 9 report reasons with sub-reasons
- Priority levels (0=low to 3=urgent)
- Appeal support
- Evidence attachment (JSON)

---

## ⚙️ Performance Optimizations

### v4.6 Query Strategy Optimizations

#### Strategic Composite Indexes
The schema includes 50+ composite indexes optimized for common query patterns:

```sql
-- User queries (avoid loading all 70+ relations)
@@index([deleted, status, role, lastSeenAt(sort: Desc)])
@@index([deleted, status, onlineStatus, lastSeenAt(sort: Desc)])
@@index([role, verified, createdAt(sort: Desc)])

-- Post queries (content discovery)
@@index([authorId, isDraft, createdAt(sort: Desc)])
@@index([scheduledPublishAt, contentStatus])
@@index([contentType, moderationStatus, createdAt(sort: Desc)])

-- Comment queries (thread navigation)
@@index([postId, parentId, deleted, createdAt])
@@index([postId, pinned, createdAt(sort: Desc)])

-- Notification queries (unread management)
@@index([userId, priority, read, createdAt(sort: Desc)])
@@index([userId, type, createdAt(sort: Desc)])

-- Message queries (conversation loading)
@@index([conversationId, deleted, createdAt(sort: Desc)])
@@index([senderId, createdAt(sort: Desc)])

-- Activity queries (feed generation)
@@index([visibility, createdAt(sort: Desc)])
@@index([userId, visibility, createdAt(sort: Desc)])
```

#### JSON GIN Indexes (Critical)
Required for performant JSONB queries:

```sql
-- Profile JSON performance
CREATE INDEX idx_profile_theme USING GIN (themePreference jsonb_path_ops);
CREATE INDEX idx_profile_notifications USING GIN (notificationSettings jsonb_path_ops);

-- Post content searching
CREATE INDEX idx_post_content USING GIN (content jsonb_path_ops);
CREATE INDEX idx_post_youtube_data USING GIN (youtubeVideoData jsonb_path_ops);

-- Group settings
CREATE INDEX idx_group_settings USING GIN (settings jsonb_path_ops);

-- Event data
CREATE INDEX idx_event_agenda USING GIN (agenda jsonb_path_ops);
```

#### Query Complexity Management

**User Model Best Practices**:
```typescript
// ❌ NEVER DO THIS - Loads 70+ relations
const users = await prisma.user.findMany({
  include: { 
    posts: true,
    comments: true,
    followers: true,
    following: true,
    // ... 60+ more relations
  }
});

// ✅ DO THIS - Selective loading
const users = await prisma.user.findMany({
  select: {
    id: true,
    username: true,
    image: true,
    profile: {
      select: {
        displayName: true,
        bio: true
      }
    }
  }
});

// ✅ OR USE MULTIPLE QUERIES
const user = await prisma.user.findUnique({ where: { id } });
const posts = await prisma.post.findMany({ 
  where: { authorId: id },
  take: 10 
});
```

### Caching Strategy

```typescript
// Cache types via CacheEntry model
enum CacheType {
  USER_PROFILE,   // User profiles - 5 min TTL
  POST_CONTENT,   // Post content - 10 min TTL
  FEED,          // Activity feeds - 1 min TTL
  TRENDING,      // Trending content - 15 min TTL
  LEADERBOARD,   // Leaderboards - 5 min TTL
  STATS          // Statistics - 30 min TTL
}

// Redis cache patterns
const CACHE_KEYS = {
  userProfile: (id) => `user:${id}:profile`,
  postContent: (id) => `post:${id}:content`,
  userFeed: (id) => `feed:${id}:activity`,
  trending: (type) => `trending:${type}:hourly`,
  leaderboard: (type) => `leaderboard:${type}:daily`
};
```

---

## 📊 Monitoring & Analytics

### System Health Monitoring

```typescript
interface SystemHealth {
  service: string;         // "api", "websocket", "worker"
  status: string;         // "healthy", "degraded", "down"
  responseTime?: number;   // In ms
  errorRate?: number;      // Percentage
  throughput?: number;     // Requests per second
  cpuUsage?: number;
  memoryUsage?: number;
  activeUsers?: number;
}
```

### Analytics Events

```typescript
// Event tracking via AnalyticsEvent
interface AnalyticsEvent {
  eventName: string;
  eventType: string;      // "pageview", "click", "custom"
  properties?: Json;
  context?: Json;         // Device, browser, location
}

// User activity tracking
interface UserActivity {
  loginCount: number;
  pageViews: number;
  postsCreated: number;
  commentsCreated: number;
  minutesActive: number;
  xpEarned: number;
  pointsEarned: number;
}

// Content performance
interface ContentPerformance {
  impressions: number;
  uniqueImpressions: number;
  clicks: number;
  engagements: number;
  avgTimeSpent: number;
  bounceRate: number;
  viralityScore: number;
}
```

### Rate Limiting

```typescript
interface RateLimitTracker {
  identifier: string;      // IP, userId, apiKey
  endpoint: string;
  windowStart: DateTime;
  requests: number;
  blocked: boolean;
}

// Rate limit configuration
const RATE_LIMITS = {
  api: {
    authenticated: 1000,   // per hour
    unauthenticated: 100,  // per hour
  },
  auth: {
    login: 5,             // per 15 minutes
    register: 3,          // per hour
    passwordReset: 3,     // per hour
  },
  content: {
    post: 10,             // per hour
    comment: 30,          // per hour
    reaction: 100,        // per hour
  }
};
```

---

## 🧪 Testing Strategy

### Testing Stack

```json
{
  "jest": "^29.7.0",
  "@testing-library/react": "^14.1.2",
  "@testing-library/jest-dom": "^6.2.0",
  "@playwright/test": "^1.41.0"
}
```

### Test Coverage Requirements

- **Unit Tests**: 80% coverage minimum
- **Integration Tests**: All API endpoints
- **E2E Tests**: Critical user journeys
- **Performance Tests**: Load testing with k6
- **Security Tests**: OWASP compliance

### Test Commands

```bash
npm run test           # Unit tests with Jest
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report
npm run test:e2e       # Playwright E2E tests
npm run test:perf      # Performance tests
npm run test:security  # Security scan
```

### Testing Patterns

```typescript
// Model testing example
describe('UserBalance', () => {
  it('should maintain integer precision for points', () => {
    const balance = { sparklePoints: 1000, premiumPoints: 50 };
    expect(Number.isInteger(balance.sparklePoints)).toBe(true);
    expect(Number.isInteger(balance.premiumPoints)).toBe(true);
  });
  
  it('should track frozen points during trades', () => {
    const balance = { 
      sparklePoints: 1000, 
      frozenPoints: 100 
    };
    const available = balance.sparklePoints - balance.frozenPoints;
    expect(available).toBe(900);
  });
});

// API testing example
describe('POST /api/trpc/post.create', () => {
  it('should enforce rate limits', async () => {
    const requests = Array(11).fill(null).map(() => 
      createPost({ title: 'Test' })
    );
    const results = await Promise.allSettled(requests);
    const rejected = results.filter(r => r.status === 'rejected');
    expect(rejected.length).toBeGreaterThan(0);
  });
});
```

---

## 🚢 Deployment

### Production Infrastructure

#### Vercel Configuration
```json
{
  "functions": {
    "app/api/trpc/[trpc]/route.ts": {
      "maxDuration": 30
    },
    "app/api/webhooks/stripe/route.ts": {
      "maxDuration": 60
    }
  },
  "crons": [
    {
      "path": "/api/cron/daily",
      "schedule": "0 0 * * *"
    }
  ]
}
```

#### Database Configuration
```bash
# Production database with connection pooling
DATABASE_URL="postgresql://user:pass@host:5432/sparkle_prod?pgbouncer=true&connection_limit=40"
DIRECT_URL="postgresql://user:pass@host:5432/sparkle_prod"

# Required extensions
CREATE EXTENSION pgcrypto;
CREATE EXTENSION pg_trgm;
CREATE EXTENSION "uuid-ossp";
```

### Production Checklist

#### Pre-deployment
- [ ] Run database migrations: `npm run db:migrate:prod`
- [ ] Apply all JSON GIN indexes
- [ ] Verify environment variables
- [ ] Run security audit: `npm audit`
- [ ] Run type checking: `npm run type-check`
- [ ] Run test suite: `npm test`
- [ ] Build production bundle: `npm run build`

#### Infrastructure Setup
- [ ] Configure PostgreSQL with connection pooling
- [ ] Set up Redis cluster for high availability
- [ ] Configure CDN for static assets
- [ ] Set up SSL certificates
- [ ] Configure DDoS protection
- [ ] Set up monitoring alerts
- [ ] Configure backup strategy (3-2-1 rule)
- [ ] Set up log aggregation

#### Security Configuration
- [ ] Enable security headers (CSP, HSTS, etc.)
- [ ] Configure rate limiting
- [ ] Set up WAF rules
- [ ] Enable audit logging
- [ ] Configure secret rotation
- [ ] Set up vulnerability scanning
- [ ] Configure OAuth redirect URLs
- [ ] Enable 2FA for admin accounts

#### Performance Optimization
- [ ] Enable query result caching
- [ ] Configure edge caching
- [ ] Set up database read replicas
- [ ] Enable HTTP/2 and HTTP/3
- [ ] Configure image optimization
- [ ] Enable Brotli compression
- [ ] Set up performance monitoring
- [ ] Configure auto-scaling rules

### Deployment Commands

```bash
# Production deployment
npm run build
npm run db:migrate:prod
npm run db:indexes:prod
vercel --prod

# Rollback procedure
npm run db:migrate:rollback
vercel rollback

# Health check
curl https://sparkle-universe.com/api/health
```

---

## 🛠️ Troubleshooting

### Common Issues & Solutions

#### Database Issues

```bash
# Connection pool exhaustion
# Solution: Increase connection limit
DATABASE_URL="...?connection_limit=50"

# Slow queries
# Solution: Check missing indexes
EXPLAIN ANALYZE SELECT * FROM users WHERE ...;

# Migration conflicts
# Solution: Reset and reapply
npx prisma migrate reset --skip-seed
npx prisma migrate deploy
```

#### Performance Issues

```bash
# High memory usage
# Solution: Check for memory leaks
node --inspect app.js
# Use Chrome DevTools Memory Profiler

# Slow API responses
# Solution: Enable query logging
DEBUG=prisma:query npm run dev

# JSON query performance
# Solution: Verify GIN indexes
\di *gin*
```

#### Authentication Issues

```bash
# 2FA not working
# Solution: Check time sync
date
# Ensure server time is synchronized

# OAuth redirect errors
# Solution: Verify callback URLs
NEXTAUTH_URL=https://sparkle-universe.com
# Update OAuth provider settings

# Session persistence issues
# Solution: Check Redis connection
redis-cli ping
```

#### Real-time Issues

```bash
# WebSocket connection failures
# Solution: Check CORS settings
NEXT_PUBLIC_WS_URL=wss://sparkle-universe.com

# Message delivery issues
# Solution: Check Socket.IO adapter
redis-cli PUBSUB CHANNELS *
```

### Error Codes Reference

```typescript
// Application error codes
const ERROR_CODES = {
  // Auth errors (1xxx)
  AUTH_INVALID_CREDENTIALS: 1001,
  AUTH_2FA_REQUIRED: 1002,
  AUTH_ACCOUNT_LOCKED: 1003,
  AUTH_EMAIL_NOT_VERIFIED: 1004,
  
  // Content errors (2xxx)
  CONTENT_NOT_FOUND: 2001,
  CONTENT_FORBIDDEN: 2002,
  CONTENT_RATE_LIMITED: 2003,
  
  // Payment errors (3xxx)
  PAYMENT_INSUFFICIENT_FUNDS: 3001,
  PAYMENT_INVALID_METHOD: 3002,
  PAYMENT_PROCESSING_ERROR: 3003,
  
  // System errors (9xxx)
  SYSTEM_MAINTENANCE: 9001,
  SYSTEM_OVERLOAD: 9002,
  SYSTEM_DATABASE_ERROR: 9003,
};
```

---

## 📈 Roadmap

### Phase 1: Foundation ✅ (Completed)
- [x] Project setup with Next.js 15
- [x] Database schema v4.6 with 126 models
- [x] Authentication system with 2FA support
- [x] Extended user profiles with security fields
- [x] UI component library (shadcn/ui)
- [x] Button component with 8 variants
- [x] Performance optimizations (v4.3-v4.5)

### Phase 2: Content System 🚧 (Current)
- [ ] Rich text editor integration (TipTap)
- [ ] Post creation with 9 content types
- [ ] Comment system with threading
- [ ] AI content moderation
- [ ] Search with PostgreSQL full-text
- [ ] Media upload with CDN

### Phase 3: Social Features 📅 (Q1 2025)
- [ ] Following system implementation
- [ ] Direct messaging with E2E encryption
- [ ] Notification system (19 types)
- [ ] Activity feeds with algorithms
- [ ] Socket.IO real-time features
- [ ] Presence indicators
- [ ] Block system with cascades
- [ ] Phone verification (2FA)

### Phase 4: YouTube Integration 📅 (Q2 2025)
- [ ] YouTube API v3 integration
- [ ] Video metadata auto-fetching
- [ ] Timestamp discussions
- [ ] Watch parties with sync
- [ ] Creator analytics dashboard
- [ ] Playlist collaboration
- [ ] Clip creation tools
- [ ] Channel synchronization

### Phase 5: Gamification 📅 (Q2 2025)
- [ ] XP and leveling system
- [ ] Achievement unlocks (8 tiers)
- [ ] Virtual currency (Int-based)
- [ ] Marketplace with StoreItem
- [ ] Trading system with escrow
- [ ] Leaderboards with Redis
- [ ] Quest system (8 types)
- [ ] Seasonal events

### Phase 6: Monetization 📅 (Q3 2025)
- [ ] Subscription tiers (4 levels)
- [ ] Premium Points purchase
- [ ] Fan funding system
- [ ] Tip transactions
- [ ] Creator payouts
- [ ] Revenue sharing (70/30)
- [ ] Marketplace fees
- [ ] Stripe integration

### Phase 7: AI Features 📅 (Q3 2025)
- [ ] Content recommendations
- [ ] Auto-moderation system
- [ ] Writing assistant
- [ ] Sentiment analysis
- [ ] Trend detection
- [ ] Chat assistant (GPT-4)
- [ ] Content summarization
- [ ] Translation support

### Phase 8: Enterprise & Scale 📅 (Q4 2025)
- [ ] Multi-tenancy support
- [ ] White-label options
- [ ] API v2 with GraphQL
- [ ] Webhook system
- [ ] Advanced analytics
- [ ] Compliance tools (GDPR, CCPA)
- [ ] Audit system enhancements
- [ ] Global CDN deployment

### Phase 9: Mobile & Expansion 📅 (2026)
- [ ] PWA optimization
- [ ] React Native app
- [ ] Desktop app (Electron)
- [ ] Browser extensions
- [ ] SDK development
- [ ] Partner integrations
- [ ] International expansion
- [ ] Multi-language support

---

## 💰 Business Model

### Revenue Projections

```typescript
// Monthly revenue model (Year 1)
const revenueModel = {
  users: {
    month6: 100000,
    month12: 1000000,
  },
  conversion: {
    premium: 0.10,        // 10% premium conversion
    creator: 0.02,        // 2% creator tier
    legend: 0.005,        // 0.5% legend tier
  },
  revenue: {
    subscriptions: {
      sparkle_fan: 4.99,
      sparkle_creator: 9.99,
      sparkle_legend: 19.99,
    },
    virtualGoods: {
      averageTransaction: 2.50,
      transactionsPerUser: 0.3,
    },
    creatorFees: {
      platformShare: 0.30,
      averageCreatorRevenue: 500,
    }
  },
  projectedMonthly: {
    month6: 75000,        // $75K MRR
    month12: 500000,      // $500K MRR
  }
};
```

### Additional Schema Discoveries

#### 1. **Missing Relation Definition (Fixed in Schema v4.6)**
The schema includes a fix for `WatchPartyChat` relations:
```prisma
// Relations - FIXED: Consistent relation naming
party   WatchParty       @relation(...)
user    User             @relation(...)
replyTo WatchPartyChat?  @relation("WatchPartyChatReplies", ...)
replies WatchPartyChat[] @relation("WatchPartyChatReplies")
```

#### 2. **Report Model Enhancement**
The schema includes a fix adding missing `reportedUser` relation:
```prisma
// Relations - FIXED: Added missing reportedUser relation
reportedUser User? @relation("reportedUser", ...) // NEW
```

#### 3. **Strategic Index Optimizations**
The schema includes v4.6 specific optimizations:
```prisma
// OPTIMIZED: Combine related indexes
@@index([deleted, status, role, onlineStatus, lastSeenAt(sort: Desc)])  // NEW: Combined index
```

### Key Metrics

- **MAU Target**: 1M by end of Year 1
- **DAU/MAU Ratio**: 40%
- **Average Session**: 15+ minutes
- **ARPU**: $5.00 monthly
- **CAC**: $2.00
- **LTV**: $66.00 (30-month average)
- **Gross Margin**: 70%
- **Creator Fund**: $100K monthly

### Monetization Streams

1. **Subscriptions** (40% of revenue)
   - 4-tier system with clear value progression
   - Family plans and annual discounts

2. **Virtual Economy** (35% of revenue)
   - Premium Points direct sales
   - Marketplace transaction fees (30%)
   - Limited edition items

3. **Creator Economy** (20% of revenue)
   - Platform fee on fan funding (30%)
   - Revenue share on sponsored content
   - Premium creator tools subscription

4. **Advertising** (5% of revenue)
   - Native ads for free tier only
   - Sponsored content partnerships
   - Brand collaborations

---

## 🤝 Contributing

### Development Standards

#### Code Style
- **TypeScript**: Strict mode, no `any` types
- **React**: Functional components with hooks
- **Styling**: Tailwind CSS utility classes
- **Database**: Prisma with type safety
- **API**: tRPC for end-to-end types

#### Git Workflow
```bash
# Feature development
git checkout -b feature/amazing-feature
git commit -m "feat: add amazing feature"
git push origin feature/amazing-feature

# Commit types
feat:     # New feature
fix:      # Bug fix
docs:     # Documentation
style:    # Formatting
refactor: # Code restructuring
test:     # Test additions
chore:    # Maintenance
perf:     # Performance improvements
```

#### Pull Request Process
1. Update documentation
2. Add/update tests (maintain 80% coverage)
3. Run `npm run lint:fix`
4. Run `npm run type-check`
5. Update schema version if database changed
6. Request review from 2 maintainers

#### Code Review Checklist
- [ ] Follows TypeScript best practices
- [ ] Includes appropriate tests
- [ ] Documentation updated
- [ ] No console.logs in production code
- [ ] Prisma queries optimized
- [ ] Security considerations addressed
- [ ] Performance impact assessed
- [ ] Accessibility maintained

---

## 📄 License

This project is licensed under the MIT License:

```
MIT License

Copyright (c) 2024 Sparkle Universe

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🔗 Links & Resources

### Documentation
- **API Reference**: [/docs/api](./docs/api/README.md)
- **Schema Reference**: [/prisma/schema.prisma](./prisma/schema.prisma)
- **Component Storybook**: [/docs/storybook](./docs/storybook/README.md)
- **Performance Guide**: [/docs/performance](./docs/performance/README.md)
- **Security Guide**: [/docs/security](./docs/security/README.md)

### Community
- **GitHub Issues**: [Report bugs and request features](https://github.com/nordeim/Sparkle-Universe-Next/issues)
- **GitHub Discussions**: [Community discussions](https://github.com/nordeim/Sparkle-Universe-Next/discussions)
- **Discord**: Join our developer community
- **Twitter**: [@SparkleUniverse](https://twitter.com/SparkleUniverse)

### External Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [tRPC Documentation](https://trpc.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)

---

## 📊 Project Metrics

### Schema Statistics
- **Database Version**: 4.6 (Performance Optimization Release)
- **Total Models**: 126
- **Total Enums**: 22
- **Total Indexes**: 200+
- **JSON GIN Indexes**: 15
- **Models with Soft Delete**: 25+
- **Models with Version Field**: 20+
- **Models with Audit Fields**: 30+

### Technology Metrics
- **OAuth Providers**: 5 (2 active, 3 ready)
- **Notification Types**: 19
- **Content Types**: 9
- **User Roles**: 6
- **Achievement Tiers**: 8
- **Quest Types**: 8
- **Subscription Tiers**: 4

### Performance Targets
- **API Response**: <100ms (p95)
- **Database Query**: <50ms (p99)
- **Page Load**: <3s (3G)
- **Lighthouse Score**: 95+
- **Core Web Vitals**: All green

---

<p align="center">
  <strong>Built with ❤️ by the Sparkle Universe Team</strong>
  <br>
  <sub>Making the YouTube fan experience magical, one feature at a time ✨</sub>
  <br><br>
  <a href="#-about--vision">Back to Top ↑</a>
  <br><br>
  <sub>
    <strong>Schema Version:</strong> 4.6.0 | 
    <strong>README Version:</strong> 3.0.0 | 
    <strong>Last Updated:</strong> August 2025
  </sub>
</p>
