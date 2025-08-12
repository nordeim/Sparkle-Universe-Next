<!-- Path: README.md -->
# Sparkle Universe — Next.js Community Platform

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]() 
[![License](https://img.shields.io/badge/license-MIT-blue)]() 
[![Next.js](https://img.shields.io/badge/Next.js-15.0-black)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)]()
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC)]()

> **Sparkle Universe** — The premier next-generation fan community platform for Sparkle YouTube fans, featuring rich content creation, real-time interaction, watch parties, creator tools, advanced gamification, and AI-powered experiences.

<p align="center">
  <strong>🚀 Production-Ready • 🎮 Gamified • 🤖 AI-Powered • ⚡ Real-time • 📺 YouTube-Native</strong>
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
* [🔌 API & tRPC Conventions](#-api--trpc-conventions)
* [⚡ Real-time & Background Jobs](#-real-time--background-jobs)
* [🎨 Design System](#-design-system)
* [🎮 Gamification System](#-gamification-system)
* [💳 Monetization & Economy](#-monetization--economy)
* [🔐 Security & Privacy](#-security--privacy)
* [📊 Performance & Monitoring](#-performance--monitoring)
* [🧪 Testing Strategy](#-testing-strategy)
* [🚢 Deployment](#-deployment)
* [🛠️ Troubleshooting](#️-troubleshooting)
* [📈 Roadmap](#-roadmap)
* [💰 Business Model](#-business-model)
* [🤝 Contributing](#-contributing)
* [📄 License](#-license)

---

## 🌟 About & Vision

**Sparkle Universe** is the definitive digital ecosystem for Sparkle's YouTube community, designed to transcend traditional forum platforms by creating an immersive, gamified, and AI-enhanced experience that brings fans and creators together in meaningful ways.

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

---

## ✨ Key Features

### Content & Creation
- **Rich Post Editor**: TipTap-based WYSIWYG with Markdown support, media embeds, code blocks
- **Series & Collections**: Organize content into structured narratives
- **Collaborative Editing**: Real-time multi-user document editing
- **Version Control**: Post revision history with diff viewing
- **Content Types**: 
  - `DISCUSSION` - General discussions
  - `ANNOUNCEMENT` - Official announcements
  - `GUIDE` - How-to guides
  - `REVIEW` - Reviews and critiques
  - `QUESTION` - Q&A posts
  - `POLL` - Community polls
  - `LIVE_BLOG` - Real-time event coverage
  - `VIDEO_REVIEW` - YouTube video analysis
  - `FAN_ART` - Creative content showcase
  - `THEORY_THREAD` - Theory discussions

### YouTube Integration
- **Auto-Metadata**: Automatic video information fetching via YouTube API
- **Timestamp Discussions**: Comment on specific video moments
- **Watch Parties**: Synchronized viewing with Socket.IO
- **Clip Creation**: Create and share video highlights
- **Playlist Management**: Curated content collections
- **Channel Analytics**: Creator performance dashboards

### Social & Community
- **Following System**: User and topic following
- **Direct Messaging**: Private conversations with rich media
- **Groups & Events**: Community spaces and scheduled activities
- **Live Presence**: See who's online and what they're doing
- **Reactions & Awards**: Express appreciation beyond likes
- **Blocking System**: User blocking with cascade effects

### Gamification & Economy
- **XP & Levels**: Progress through engagement
- **Achievements**: 100+ unlockable badges across 8 rarity tiers
- **Virtual Currency**: Sparkle Points (earned) & Premium Points (purchased)
- **Marketplace**: Trade virtual goods and themes
- **Leaderboards**: Global and category rankings
- **Seasonal Events**: Limited-time challenges and rewards

### AI & Intelligence
- **Smart Recommendations**: Personalized content discovery
- **Auto-Moderation**: AI-powered content filtering
- **Writing Assistant**: Grammar and style suggestions
- **Sentiment Analysis**: Community mood tracking
- **Trend Detection**: Emerging topic identification

---

## 🏗️ Technical Architecture

### Core Tech Stack (As Implemented)

```typescript
// Frontend Stack
const frontend = {
  framework: "Next.js 15.0.0" /* App Router, Server Components */,
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
  orm: "Prisma 5.8.1" /* Type-safe database access */,
  api: "tRPC 10.45.0" /* End-to-end type safety */,
  cache: "Redis (ioredis 5.3.2)" /* Sessions, rate limiting, pub/sub */,
  realtime: "Socket.IO 4.7.4" /* WebSocket with fallbacks */,
  auth: "NextAuth 5.0.0-beta.4" /* OAuth + credentials */,
  validation: "Zod 3.22.4" /* Runtime type validation */,
  precision: "Decimal.js" /* Financial calculations with Decimal(19,4) precision */
};

// Infrastructure
const infrastructure = {
  hosting: "Vercel" /* Edge functions, automatic scaling */,
  monitoring: ["Vercel Analytics", "Vercel Speed Insights"],
  node: ">=20.0.0" /* LTS version */,
  packageManager: "npm 10.2.5" /* Specified version */
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
    end
    
    subgraph "Data Layer"
        PG[(PostgreSQL)]
        REDIS[(Redis)]
        S3[(S3 Storage)]
    end
    
    WEB --> TRPC
    WEB --> AUTH
    WEB --> WS
    
    TRPC --> USER
    TRPC --> CONTENT
    TRPC --> SOCIAL
    TRPC --> GAME
    TRPC --> PAY
    
    USER --> PG
    CONTENT --> PG
    SOCIAL --> REDIS
    GAME --> PG
    PAY --> PG
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: 20.0.0+ (LTS required)
- **npm**: 10.0.0+ (10.2.5 recommended)
- **PostgreSQL**: 16+ with extensions
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

# Setup database
npm run db:generate
npm run db:migrate
npm run db:seed # Optional: Load sample data

# Apply required JSON GIN indexes (see Database Architecture section)
npm run db:indexes

# Start development server
npm run dev

# Open http://localhost:3000
```

---

## 🔧 Development Setup

### Environment Variables

Based on the implemented `.env.local`:

```bash
# Database Configuration
DATABASE_URL="postgresql://postgres:password@localhost:5432/sparkle_universe_dev"
DIRECT_URL="postgresql://postgres:password@localhost:5432/sparkle_universe_dev"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# OAuth Providers (schema supports: GOOGLE, GITHUB, DISCORD, TWITTER, LOCAL)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
DISCORD_CLIENT_ID="" # Schema ready, implementation pending
DISCORD_CLIENT_SECRET=""
TWITTER_CLIENT_ID="" # Schema ready, implementation pending
TWITTER_CLIENT_SECRET=""

# External Services
YOUTUBE_API_KEY="your-youtube-api-key"
UPLOADTHING_SECRET=""
UPLOADTHING_APP_ID=""

# Redis Configuration
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD=""

# Email Configuration
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER=""
EMAIL_SERVER_PASSWORD=""
EMAIL_FROM="noreply@sparkle-universe.com"

# SMS Configuration (for phone verification)
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""

# Application URLs
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_WS_URL="ws://localhost:3000"

# Feature Flags
NEXT_PUBLIC_ENABLE_YOUTUBE="true"
NEXT_PUBLIC_ENABLE_WEBSOCKET="true"
NEXT_PUBLIC_ENABLE_PWA="false"
NEXT_PUBLIC_ENABLE_PHONE_VERIFICATION="false"

# Security
ENCRYPTION_KEY="generate-32-byte-hex-key"
JWT_SECRET="another-secret-key"
HASH_SALT="generate-secure-salt"

# Development
NODE_ENV="development"
```

### Database Setup

```bash
# Install PostgreSQL extensions (required)
psql -U postgres -d sparkle_universe_dev -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
psql -U postgres -d sparkle_universe_dev -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
psql -U postgres -d sparkle_universe_dev -c "CREATE EXTENSION IF NOT EXISTS uuid-ossp;"

# Run migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Apply JSON GIN indexes (CRITICAL for performance)
psql -U postgres -d sparkle_universe_dev < prisma/indexes.sql

# Seed database (development only)
npm run db:seed

# Open Prisma Studio (GUI)
npm run db:studio
```

### Required Manual Migrations for JSON GIN Indexes

JSON GIN indexes must be created manually for optimal performance:

```sql
-- Profile indexes
CREATE INDEX idx_profile_theme_preference ON "Profile" USING GIN (themePreference jsonb_path_ops);
CREATE INDEX idx_profile_notification_settings ON "Profile" USING GIN (notificationSettings jsonb_path_ops);
CREATE INDEX idx_profile_privacy_settings ON "Profile" USING GIN (privacySettings jsonb_path_ops);

-- Post indexes
CREATE INDEX idx_post_content ON "Post" USING GIN (content jsonb_path_ops);
CREATE INDEX idx_post_youtube_data ON "Post" USING GIN (youtubeVideoData jsonb_path_ops);
CREATE INDEX idx_post_sponsor_info ON "Post" USING GIN (sponsorInfo jsonb_path_ops);

-- Group indexes
CREATE INDEX idx_group_guidelines ON "Group" USING GIN (guidelines jsonb_path_ops);
CREATE INDEX idx_group_settings ON "Group" USING GIN (settings jsonb_path_ops);
CREATE INDEX idx_group_custom_emojis ON "Group" USING GIN (customEmojis jsonb_path_ops);

-- Event indexes
CREATE INDEX idx_event_agenda ON "Event" USING GIN (agenda jsonb_path_ops);
CREATE INDEX idx_event_speakers ON "Event" USING GIN (speakers jsonb_path_ops);
CREATE INDEX idx_event_sponsors ON "Event" USING GIN (sponsors jsonb_path_ops);

-- UserEngagement indexes
CREATE INDEX idx_user_engagement_metrics ON "UserEngagement" USING GIN (weeklyMetrics jsonb_path_ops);
```

### Available Scripts (from package.json)

```bash
# Development
npm run dev              # Start Next.js dev server
npm run build           # Production build
npm run start           # Start production server

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
│   │   ├── (main)/              # Main application
│   │   ├── api/                 # API endpoints
│   │   │   ├── auth/[...nextauth]/
│   │   │   └── trpc/[trpc]/
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
│   │   └── services/           # Business logic
│   │
│   ├── lib/                     # Core libraries
│   │   ├── auth/               # NextAuth configuration
│   │   │   ├── auth.config.ts # NextAuth options
│   │   │   └── auth.ts        # Auth utilities
│   │   ├── db.ts              # Prisma client
│   │   └── utils.ts           # Utilities
│   │
│   ├── hooks/                   # Custom React hooks
│   │   └── use-auth.ts        # Auth hook
│   │
│   ├── types/                   # TypeScript types
│   └── styles/                  # Global styles
│
├── prisma/
│   ├── schema.prisma           # Database schema (126 models)
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

### Schema Implementation (from schema.prisma)

The database uses PostgreSQL with Prisma ORM, implementing a comprehensive 126-model schema with:

1. **Soft Deletes**: `deleted`, `deletedAt`, `deletedBy` pattern for data recovery
2. **Optimistic Locking**: `version` field on 15+ models for concurrent updates
3. **Author Preservation**: `authorName`, `ownerName`, `hostName` fields preserve names after user deletion
4. **Audit Trail**: Complete tracking of who deleted what and when
5. **Financial Precision**: All monetary values use `Decimal(19,4)` for accurate calculations

### Database Schema Constants

#### User Roles (6 roles)
```typescript
enum UserRole {
  USER              // Standard user
  CREATOR           // Content creator
  VERIFIED_CREATOR  // Verified content creator
  MODERATOR         // Community moderator
  ADMIN             // Platform administrator
  SYSTEM            // Automated system actions
}
```

#### Account Status (5 states)
```typescript
enum UserStatus {
  PENDING_VERIFICATION  // Email verification pending
  ACTIVE               // Normal active user
  SUSPENDED            // Temporarily suspended
  BANNED               // Permanently banned
  DELETED              // Soft deleted account
}
```

#### Subscription Tiers (4 levels)
```typescript
enum SubscriptionTier {
  FREE              // Basic features
  SPARKLE_FAN       // Enhanced features ($4.99/month)
  SPARKLE_CREATOR   // Creator tools ($9.99/month)
  SPARKLE_LEGEND    // Premium experience ($19.99/month)
}
```

#### Achievement Rarity (8 tiers)
```typescript
enum AchievementRarity {
  COMMON            // 50%+ of users
  UNCOMMON          // 30-50% of users
  RARE              // 10-30% of users
  EPIC              // 5-10% of users
  LEGENDARY         // 1-5% of users
  MYTHIC            // <1% of users
  LIMITED_EDITION   // Time-limited availability
  SEASONAL          // Seasonal events only
}
```

#### Notification Types (19 types)
```typescript
enum NotificationType {
  // Social notifications
  FOLLOW, UNFOLLOW, MENTION, REPLY
  
  // Content notifications
  POST_LIKE, COMMENT_LIKE, POST_COMMENT, COMMENT_REPLY
  
  // System notifications
  ACHIEVEMENT_UNLOCKED, LEVEL_UP, BADGE_EARNED
  
  // Admin notifications
  WARNING, BAN, UNBAN, CONTENT_REMOVED
  
  // Monetization notifications
  TIP_RECEIVED, SUBSCRIPTION_EXPIRED, PAYOUT_PROCESSED
  
  // General
  SYSTEM_MESSAGE
}
```

### Core Models

- **User**: Authentication, basic profile, phone verification support
- **Profile**: Extended user information with JSONB settings
- **Post**: Content with JSONB for rich text, YouTube metadata
- **Comment**: Nested commenting system with threading
- **Follow/Block**: Social relationships with cascade behaviors
- **Notification**: Real-time notifications with read tracking
- **Achievement/UserAchievement**: 8-tier gamification system
- **UserBalance**: Virtual currency tracking (sparklePoints & premiumPoints)

### Data Retention Strategy

- **Soft Deletes**: All major entities support soft deletion with full audit trail
- **Author Preservation**: Content authors' names preserved even after account deletion
- **Cascade Behaviors**: SetNull cascades preserve content integrity
- **Version Control**: Optimistic locking prevents race conditions
- **Deletion Tracking**: `deletedBy` references track who performed deletions

---

## 🔌 API & tRPC Conventions

### Authentication Implementation

Based on the implemented auth system:

```typescript
// OAuth Providers (Schema Support)
✅ Google OAuth (implemented)
✅ GitHub OAuth (implemented)
🔄 Discord OAuth (schema ready, not implemented)
🔄 Twitter OAuth (schema ready, not implemented)
✅ Local credentials (email/password)
🔄 Phone verification (schema ready, not implemented)

// Session management
- JWT strategy with 30-day expiration
- Role-based access control (6-tier system)
- Automatic last seen tracking
- Account status enforcement
```

### Auth Utilities (from auth.ts)

```typescript
// Server-side auth utilities
getServerAuth()      // Get session
requireAuth()        // Require authentication
requireRole(role)    // Require specific role
getCurrentUserId()   // Get user ID
hasRole(role)       // Check role
hasMinimumRole(role) // Check role hierarchy
isSystemUser()      // Check for SYSTEM role
```

### Client-side Auth Hook (from use-auth.ts)

```typescript
// useAuth hook provides:
- user data with status
- session info
- login/logout methods
- role checking (including SYSTEM role)
- loading states
- phone verification status
```

---

## ⚡ Real-time & Background Jobs

### Socket.IO Configuration

```typescript
// Socket.IO 4.7.4 implementation
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';

// Real-time features:
- Live chat with typing indicators
- Presence indicators (online/away/busy)
- Real-time notifications (19 types)
- Watch parties with sync
- Collaborative editing
- Live streaming comments
```

### Redis Integration

Using `ioredis 5.3.2` for:
- Session storage with TTL
- Cache layer for hot data
- Rate limiting per endpoint
- Socket.IO adapter
- Pub/Sub messaging
- Queue management
- Leaderboard caching

---

## 🎨 Design System

### Component Implementation (from button.tsx)

```typescript
// Button variants implemented:
- default
- destructive  
- outline
- secondary
- ghost
- link
- sparkle (gradient effect)
- glow (shadow effect)

// Sizes:
- sm, default, lg, xl, icon

// Features:
- Loading states with spinner
- Async child support
- Full accessibility
- Ripple effects
```

### Theme Configuration

Based on Tailwind CSS 3.4.1 with:
- Custom color palette (primary, secondary, accent)
- Glassmorphism effects
- Dark mode support
- Responsive design system
- Animation utilities via `tailwindcss-animate`
- Custom theme preferences (stored in Profile.themePreference JSONB)

---

## 🎮 Gamification System

### XP & Leveling System

```typescript
// XP rewards (from schema alignment)
const XP_REWARDS = {
  POST_CREATE: 10,            // Create a post
  COMMENT_CREATE: 5,          // Add a comment  
  QUALITY_POST_BONUS: 50,     // High engagement bonus
  HELPFUL_COMMENT: 20,        // Helpful comment bonus
  DAILY_LOGIN: 10,            // Daily login reward
  FIRST_POST_OF_DAY: 15,      // First post bonus
  STREAK_BONUS: 5,            // Per day streak
  ACHIEVEMENT_UNLOCK: 25,     // Achievement completion
};

// Level calculation with progressive scaling
const calculateLevel = (xp: number): number => {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
};

// Level requirements
const getXPForLevel = (level: number): number => {
  return Math.pow(level - 1, 2) * 100;
};
```

### Achievement System (8 Rarity Tiers)

Database models support:
- **Common** (50%+ unlock rate): Basic engagement achievements
- **Uncommon** (30-50%): Regular activity milestones
- **Rare** (10-30%): Dedicated user achievements
- **Epic** (5-10%): Significant contributions
- **Legendary** (1-5%): Exceptional accomplishments
- **Mythic** (<1%): Ultra-rare achievements
- **Limited Edition**: Time-limited availability
- **Seasonal**: Event-specific achievements

### Virtual Economy

```typescript
// Dual Currency System (from schema)
interface UserBalance {
  sparklePoints: Decimal    // Earned through activity
  premiumPoints: Decimal    // Purchased currency
  lifetimeEarned: Decimal   // Total earned all-time
  lifetimeSpent: Decimal    // Total spent all-time
}

// Conversion rates
const CURRENCY_RATES = {
  USD_TO_PREMIUM: 100,      // 100 Premium Points = $1.00 USD
  SPARKLE_TO_PREMIUM: 1000, // 1000 Sparkle Points = 1 Premium Point
};

// Transaction types
enum TransactionType {
  EARNED, PURCHASED, SPENT, TRANSFERRED,
  REFUNDED, BONUS, PENALTY, CONVERTED
}
```

---

## 💳 Monetization & Economy

### Creator Monetization Models

The platform implements comprehensive monetization through dedicated models:

#### Fan Funding System
```typescript
interface FanFunding {
  creator: User              // Receiving creator
  supporter: User            // Supporting fan
  tier: FundingTier         // Support tier
  amount: Decimal(19,4)     // Monthly amount
  benefits: Json            // Tier benefits
  active: boolean           // Active subscription
}
```

#### Revenue Sharing
```typescript
interface RevenueShare {
  creator: User              // Content creator
  post: Post                // Monetized content
  platformShare: Decimal     // Platform percentage (30%)
  creatorShare: Decimal      // Creator percentage (70%)
  totalRevenue: Decimal      // Total generated
  period: DateTime           // Revenue period
}
```

#### Tip Transactions
```typescript
interface TipTransaction {
  sender: User               // Tip sender
  recipient: User            // Tip recipient
  amount: Decimal(19,4)      // Tip amount
  currency: Currency         // SPARKLE_POINTS or PREMIUM_POINTS
  message?: string           // Optional message
  anonymous: boolean         // Anonymous tip option
}
```

#### Creator Payouts
```typescript
interface CreatorPayout {
  creator: User              // Receiving creator
  amount: Decimal(19,4)      // Payout amount
  currency: string           // Real currency (USD, EUR, etc.)
  status: PayoutStatus       // PENDING, PROCESSING, COMPLETED, FAILED
  method: PayoutMethod       // BANK_TRANSFER, PAYPAL, STRIPE
  processedAt?: DateTime     // Processing timestamp
}
```

### Subscription Tiers with Pricing

Based on schema `SubscriptionTier` enum:

1. **FREE** (Free Tier)
   - Core features with limitations
   - Ad-supported experience
   - 5 posts per day limit
   - Basic achievements

2. **SPARKLE_FAN** ($4.99/month)
   - Ad-free experience
   - Unlimited posts
   - Priority support
   - Exclusive badges
   - 2x XP multiplier

3. **SPARKLE_CREATOR** ($9.99/month)
   - All Fan benefits
   - Creator analytics dashboard
   - Monetization tools
   - Custom profile themes
   - Early access features
   - 3x XP multiplier

4. **SPARKLE_LEGEND** ($19.99/month)
   - All Creator benefits
   - Verified badge
   - Beta features access
   - Direct creator line
   - Custom emojis
   - 5x XP multiplier
   - Monthly Premium Points bonus

### Virtual Goods Marketplace

```typescript
interface MarketplaceItem {
  type: ItemType            // THEME, BADGE, EMOJI, EFFECT
  rarity: AchievementRarity // Uses same rarity system
  price: Decimal            // In Premium Points
  limitedQuantity?: number  // For limited items
  expiresAt?: DateTime      // For seasonal items
}
```

---

## 🔐 Security & Privacy

### Implemented Security Features

Based on auth implementation and schema:

- **Authentication**: NextAuth v5 with OAuth and credentials
- **Session Management**: JWT with 30-day expiration
- **Password Security**: bcrypt hashing with salt rounds
- **Phone Verification**: Schema support for 2FA via SMS
- **Role-Based Access**: 6-tier role system including SYSTEM role
- **Account Status**: 5 states including PENDING_VERIFICATION
- **CSRF Protection**: Built into NextAuth
- **Input Validation**: Zod schemas throughout
- **SQL Injection Prevention**: Parameterized queries via Prisma
- **XSS Protection**: React's built-in escaping + CSP headers

### Privacy Features

- **Soft Deletes**: Complete `deleted`/`deletedAt`/`deletedBy` tracking
- **Data Retention**: Author name preservation on user deletion
- **Profile Privacy**: JSONB `privacySettings` field for granular control
- **Block System**: Comprehensive blocking with relationship cascades
- **Data Minimization**: Only essential data collected
- **Phone Number Hashing**: Separate hash field for privacy
- **Anonymous Actions**: Support for anonymous tips and interactions
- **GDPR Compliance**: Right to deletion, data export capabilities

### Security Headers

```typescript
// Recommended security headers
const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};
```

---

## 📊 Performance & Monitoring

### Performance Targets (PRD Aligned)

- **Page Load**: < 3s on 3G connection
- **API Response**: < 100ms (p95)
- **Database Queries**: < 50ms (p99)
- **Core Web Vitals**:
  - LCP: < 2.5s
  - FID: < 100ms  
  - CLS: < 0.1
- **Lighthouse Score**: 95+ overall

### Database Optimizations

- **JSON GIN Indexes**: Critical for JSONB query performance
- **Composite Indexes**: On frequently joined columns
- **Partial Indexes**: For soft delete queries
- **Text Search**: pg_trgm extension for fuzzy search
- **Connection Pooling**: Via Prisma connection management

### Monitoring Stack

Currently implemented:
- Vercel Analytics
- Vercel Speed Insights
- TypeScript strict mode for compile-time safety
- React Query DevTools for debugging

Recommended additions:
- Sentry for error tracking
- DataDog for APM
- PgHero for database monitoring
- Redis Commander for cache inspection

---

## 🧪 Testing Strategy

### Testing Stack (from package.json)

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
- **Integration Tests**: Critical paths covered
- **E2E Tests**: User journeys validated
- **Performance Tests**: Load testing for scaling

### Test Commands

```bash
npm run test           # Unit tests with Jest
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report
npm run test:e2e       # Playwright E2E tests
```

### Testing Patterns

```typescript
// Example test structure
describe('UserBalance', () => {
  it('should handle decimal precision correctly', () => {
    const balance = new Decimal(10.9999);
    expect(balance.toFixed(4)).toBe('10.9999');
  });
  
  it('should prevent negative balances', () => {
    const result = deductBalance(5, 10);
    expect(result.success).toBe(false);
  });
});
```

---

## 🚢 Deployment

### Vercel Deployment

Optimized for Vercel with:
- Edge Functions support
- Automatic preview deployments
- Environment variable management
- Analytics integration
- Automatic SSL/TLS

### Production Checklist

- [ ] Set production environment variables
- [ ] Run database migrations: `npm run db:migrate:prod`
- [ ] Apply JSON GIN indexes: `npm run db:indexes`
- [ ] Configure OAuth redirect URLs for production domain
- [ ] Set up Redis for production (Redis Cloud/AWS ElastiCache)
- [ ] Enable monitoring services (Sentry, DataDog)
- [ ] Configure rate limiting rules
- [ ] Set up database backup strategy (daily snapshots)
- [ ] Configure CDN for static assets
- [ ] Enable security headers
- [ ] Set up error alerting
- [ ] Configure auto-scaling rules
- [ ] Document rollback procedures

### Environment-Specific Configurations

```bash
# Production-specific settings
NODE_ENV="production"
DATABASE_URL="postgresql://prod_connection_string"
REDIS_URL="redis://prod_redis_url"
NEXTAUTH_URL="https://sparkle-universe.com"
NEXT_PUBLIC_APP_URL="https://sparkle-universe.com"
NEXT_PUBLIC_WS_URL="wss://sparkle-universe.com"
```

---

## 💰 Business Model

### Revenue Streams

1. **Subscriptions** (40% of revenue)
   - 4-tier system: FREE, SPARKLE_FAN ($4.99), SPARKLE_CREATOR ($9.99), SPARKLE_LEGEND ($19.99)
   - Target: 10% premium conversion rate

2. **Virtual Currency** (35% of revenue)
   - Premium Points sales (100 points = $1 USD)
   - Sparkle Points earned through engagement
   - Marketplace transactions with 30% platform fee

3. **Creator Monetization** (20% of revenue)
   - 30% platform share on fan funding
   - 30% commission on tips
   - Revenue sharing on sponsored content

4. **Advertising** (5% of revenue)
   - Free tier only
   - Native advertising format
   - Creator-sponsored content

### Key Metrics & Targets

- **MAU Target**: 1M users by end of Year 1
- **DAU/MAU Ratio**: 40% (highly engaged community)
- **ARPU**: $5 monthly average
- **Premium Conversion**: 10% of active users
- **Creator Fund**: $100K monthly distribution
- **Gross Margin**: 70% after infrastructure costs

### Unit Economics

```typescript
// Per user monthly economics
const userEconomics = {
  averageRevenue: 5.00,      // ARPU
  infrastructureCost: 0.50,  // Hosting, database, etc.
  supportCost: 0.30,         // Customer support
  marketingCAC: 2.00,        // Amortized over 6 months
  grossProfit: 2.20,         // Per user monthly profit
  LTV: 66.00,               // 30-month average lifetime
};
```

---

## 📈 Roadmap

### Phase 1: Foundation ✅ (Months 1-2)
- [x] Project setup with Next.js 15
- [x] Database schema with Prisma (126 models)
- [x] Authentication system (NextAuth v5)
- [x] Basic user profiles with extended fields
- [x] UI component library (shadcn/ui)
- [x] Button component with 8 variants
- [ ] Rich text editor (TipTap) - In Progress
- [ ] Post creation and display - In Progress
- [ ] Comment system - In Progress
- [ ] Search implementation

### Phase 2: Social Features 🚧 (Months 3-4)
- [ ] Following system implementation
- [ ] Direct messaging with encryption
- [ ] Notification system (19 types)
- [ ] Activity feeds with algorithms
- [ ] Socket.IO integration
- [ ] Real-time presence indicators
- [ ] Block system with cascades
- [ ] Phone verification setup

### Phase 3: YouTube Integration 📅 (Months 5-6)
- [ ] YouTube API integration
- [ ] Video metadata fetching
- [ ] Timestamp discussions
- [ ] Watch parties with Socket.IO
- [ ] Creator analytics dashboard
- [ ] Playlist management
- [ ] Clip creation tools
- [ ] Channel synchronization

### Phase 4: Gamification 📅 (Months 7-8)
- [ ] XP and leveling system
- [ ] Achievement unlocks (8 tiers)
- [ ] Virtual currency implementation
- [ ] Marketplace development
- [ ] Leaderboards with Redis
- [ ] Seasonal events system
- [ ] Daily quests and challenges
- [ ] Badge display system

### Phase 5: Monetization 📅 (Months 9-10)
- [ ] Subscription tier implementation
- [ ] Premium Points purchase flow
- [ ] Fan funding system
- [ ] Tip transactions
- [ ] Creator payouts
- [ ] Revenue sharing
- [ ] Marketplace transactions
- [ ] Stripe/PayPal integration

### Phase 6: AI & Advanced Features 📅 (Months 11-12)
- [ ] Content recommendations ML
- [ ] Auto-moderation with AI
- [ ] Writing assistant integration
- [ ] Sentiment analysis
- [ ] Admin dashboard
- [ ] A/B testing framework
- [ ] Advanced analytics
- [ ] Trend detection algorithms

### Phase 7: Mobile & Expansion 📅 (Year 2)
- [ ] PWA optimization
- [ ] React Native mobile app
- [ ] API v2 with GraphQL
- [ ] International expansion
- [ ] Multi-language support
- [ ] Regional content delivery
- [ ] Partner integrations
- [ ] SDK development

---

## 🛠️ Troubleshooting

### Common Issues & Solutions

#### Database Connection
```bash
# Verify PostgreSQL is running
psql -U postgres -c "SELECT 1"

# Check migrations status
npx prisma migrate status

# Reset if needed
npm run db:reset
```

#### Prisma Client Issues
```bash
# Regenerate client
rm -rf node_modules/.prisma
npm run db:generate

# Clear Prisma engine cache
rm -rf ~/.cache/prisma
```

#### JSON GIN Index Performance
```bash
# Verify indexes exist
psql -U postgres -d sparkle_universe_dev -c "\di *gin*"

# Reapply if missing
psql -U postgres -d sparkle_universe_dev < prisma/indexes.sql
```

#### TypeScript Errors
```bash
# Check for type errors
npm run type-check

# Clear Next.js cache
rm -rf .next
npm run dev
```

#### Redis Connection
```bash
# Test Redis connection
redis-cli ping

# Clear Redis cache
redis-cli FLUSHALL
```

#### Auth Issues
```bash
# Regenerate NextAuth secret
openssl rand -base64 32

# Clear sessions
redis-cli --scan --pattern "sess:*" | xargs redis-cli DEL
```

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Process

1. Fork the repository
2. Create a feature branch (`feature/amazing-feature`)
3. Commit with conventional commits (`feat:`, `fix:`, `docs:`)
4. Ensure tests pass (`npm run test`)
5. Check types (`npm run type-check`)
6. Open a Pull Request

### Code Standards

- **TypeScript**: Strict mode enabled, no `any` types
- **Linting**: ESLint + Prettier enforced
- **Testing**: Minimum 80% coverage for new code
- **Commits**: Conventional format required
- **Reviews**: 2 approvals required before merge
- **Documentation**: Update README for new features

### Commit Convention

```bash
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Format code
refactor: Refactor code
test: Add tests
chore: Update dependencies
perf: Improve performance
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔗 Links & Resources

- **Documentation**: [/docs](./docs)
- **API Reference**: [/docs/api](./docs/api)
- **Schema Reference**: [/prisma/schema.prisma](./prisma/schema.prisma)
- **Issues**: [GitHub Issues](https://github.com/nordeim/Sparkle-Universe-Next/issues)
- **Discussions**: [GitHub Discussions](https://github.com/nordeim/Sparkle-Universe-Next/discussions)
- **Changelog**: [CHANGELOG.md](./CHANGELOG.md)

---

## 📊 Project Statistics

- **Total Database Models**: 126
- **Total Enum Types**: 23
- **OAuth Providers**: 5 (2 implemented, 3 ready)
- **Notification Types**: 19
- **Achievement Tiers**: 8
- **User Roles**: 6
- **Subscription Tiers**: 4
- **Currency Types**: 2 (Sparkle Points & Premium Points)
- **Decimal Precision**: 19,4 for all financial fields

---

<p align="center">
  <strong>Built with ❤️ by the Sparkle Universe Team</strong>
  <br>
  <sub>Making the YouTube fan experience magical, one feature at a time ✨</sub>
  <br><br>
  <sub>Schema Version: 1.0.0 | README Version: 2.0.0 | Last Updated: 2024</sub>
</p>
