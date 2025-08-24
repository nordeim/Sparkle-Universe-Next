# 📚 Sparkle Universe - Project Codebase Summary

**Version:** 1.0.0  
**Purpose:** Quick reference for coding agents to understand the Sparkle Universe codebase

## 🎯 Quick Overview

**Sparkle Universe** is an enterprise-scale community platform for YouTube fans, built with:
- **112 Database Models** with strategic relationships
- **22 Enum Types** for type-safe constants  
- **109 Typed JSON Fields** for flexible, validated data
- **Next.js 14.2.31** with App Router and Server Components
- **TypeScript 5.9.2** in strict mode for maximum type safety
- **PostgreSQL 16** with Prisma 6.14.0 ORM

### Core Metrics
| Metric | Value | Source |
|--------|-------|--------|
| **Database Models** | 112 | `src/types/generated/models.ts` |
| **Enum Types** | 22 | `src/types/generated/enums.ts` |
| **Typed JSON Fields** | 109 | `src/types/generated/json-types.ts` |
| **User Roles** | 6 | USER, CREATOR, VERIFIED_CREATOR, MODERATOR, ADMIN, SYSTEM |
| **Content Types** | 9 | BLOG through NEWS |
| **Notification Types** | 19 | Comprehensive alert system |
| **Achievement Tiers** | 8 | COMMON through SEASONAL |

---

## ⚡ Essential Commands

### Development
```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
```

### Database
```bash
npm run db:generate  # Generate Prisma client + types
npm run db:migrate   # Run migrations (dev)
npm run db:push      # Push schema changes
npm run db:studio    # Open Prisma Studio GUI
npm run db:seed      # Load sample data
npm run db:reset     # Reset database
npm run db:indexes   # Apply JSON GIN indexes (CRITICAL)
```

### Code Quality
```bash
npm run type-check   # TypeScript validation
npm run lint         # ESLint check
npm run lint:fix     # Auto-fix issues
npm run format       # Prettier formatting
npm run test         # Jest unit tests
npm run test:e2e     # Playwright E2E tests
```

### Type Generation
```bash
npm run generate:types:final  # Generate all TypeScript types
npm run generate:types:watch  # Watch mode for schema changes
```

---

## 🏗️ Architecture

### Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Framework** | Next.js | 14.2.31 | React framework with App Router |
| **Language** | TypeScript | 5.9.2 | Type-safe development |
| **Database** | PostgreSQL | 16+ | Primary datastore |
| **ORM** | Prisma | 6.14.0 | Type-safe database access |
| **API** | tRPC | 11.4.4 | End-to-end type safety |
| **Auth** | NextAuth | 4.24.11 | Multi-provider authentication |
| **Real-time** | Socket.IO | 4.8.1 | WebSocket communication |
| **Cache** | Redis/ioredis | 5.7.0 | Caching and sessions |
| **Styling** | Tailwind CSS | 3.4.17 | Utility-first CSS |
| **UI Components** | Radix UI | Latest | Accessible primitives |
| **State** | Zustand | 5.0.7 | Client state management |
| **Data Fetching** | TanStack Query | 5.85.3 | Server state management |
| **Validation** | Zod | 3.25.76 | Runtime validation |
| **Editor** | TipTap | 2.26.1 | Rich text editing |

### Project Structure

```
Sparkle-Universe-Next/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth routes (login, register)
│   │   ├── (main)/            # Main app routes
│   │   ├── admin/             # Admin dashboard
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   ├── ui/               # Base UI (shadcn/ui)
│   │   ├── features/         # Feature components
│   │   ├── admin/            # Admin components
│   │   └── providers/        # Context providers
│   ├── server/                # Server-side code
│   │   ├── api/              # tRPC routers
│   │   └── services/         # Business logic
│   ├── lib/                   # Core utilities
│   │   ├── auth/             # Auth configuration
│   │   ├── db.ts             # Prisma client
│   │   └── redis.ts          # Redis client
│   ├── hooks/                 # Custom React hooks
│   ├── types/                 # TypeScript types
│   │   └── generated/        # Auto-generated types
│   └── services/              # Client services
├── prisma/
│   └── schema.prisma          # Database schema (112 models)
├── scripts/
│   └── generate-types-final.ts # Type generation
└── public/                    # Static assets
```

---

## 🗄️ Database Schema

### Overview
- **Total Models**: 112
- **Total Enums**: 22  
- **Soft Delete Pattern**: `deleted`, `deletedAt`, `deletedBy`
- **Version Control**: `version` field for optimistic locking
- **Financial Precision**: `Decimal(19,4)` for money, `Int` for points

### Model Categories

| Category | Count | Key Models |
|----------|-------|------------|
| **User & Auth** | 13 | User, Profile, Account, Session |
| **Content** | 19 | Post, Comment, Tag, Category |
| **Social** | 15 | Group, Event, Conversation, Message |
| **Gamification** | 11 | Achievement, Quest, Trade, UserBalance |
| **YouTube** | 10 | YoutubeChannel, WatchParty, VideoClip |
| **Monetization** | 7 | FanFunding, CreatorPayout, RevenueShare |
| **AI** | 4 | AiRecommendation, AiModerationQueue |
| **System** | 17+ | AuditLog, SystemHealth, CacheEntry |
| **Notifications** | 6 | Notification, NotificationQueue |
| **Real-time** | 10 | WebsocketSession, ChatRoom |

### Critical Performance Notes

#### ⚠️ User Model Warning
The User model has **70+ relations**. NEVER load all relations:

```typescript
// ❌ NEVER DO THIS
const users = await prisma.user.findMany({
  include: { _count: true }  // Will load 70+ relations!
});

// ✅ DO THIS INSTEAD
const users = await prisma.user.findMany({
  select: { id: true, username: true, profile: true }
});
```

#### Required JSON GIN Indexes
These must be applied for production performance:

```sql
CREATE INDEX idx_profile_theme USING GIN (themePreference);
CREATE INDEX idx_post_content USING GIN (content);
CREATE INDEX idx_group_settings USING GIN (settings);
CREATE INDEX idx_event_agenda USING GIN (agenda);
```

---

## 🔐 Environment Configuration

### Required Variables

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/sparkle_universe"
DIRECT_URL="postgresql://user:pass@localhost:5432/sparkle_universe"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# OAuth Providers (5 supported: LOCAL, GOOGLE, GITHUB, TWITTER, DISCORD)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# External Services
YOUTUBE_API_KEY=""
REDIS_URL="redis://localhost:6379"
UPLOADTHING_SECRET=""

# Optional AI
OPENAI_API_KEY=""

# Optional Payments
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
```

---

## 🚀 Quick Start

```bash
# 1. Clone and install
git clone https://github.com/nordeim/Sparkle-Universe-Next.git
cd Sparkle-Universe-Next
npm ci

# 2. Setup environment
cp .env.example .env.local
# Edit .env.local with your configuration

# 3. Setup database
psql -U postgres -c "CREATE DATABASE sparkle_universe_dev;"
psql -U postgres -d sparkle_universe_dev -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
psql -U postgres -d sparkle_universe_dev -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"

# 4. Initialize database
npm run db:generate
npm run db:migrate
npm run db:indexes  # CRITICAL: Apply JSON indexes
npm run db:seed     # Optional: Load sample data

# 5. Start development
npm run dev
# Open http://localhost:3000
```

---

## 🎯 Key Features

### Content System
- **9 Content Types**: BLOG, LIVE_BLOG, POLL, VIDEO_REVIEW, FAN_ART, THEORY_THREAD, SERIES, TUTORIAL, NEWS
- **Rich Text Editor**: TipTap with YouTube embeds
- **Version Control**: PostRevision tracking
- **5-Level Comment Nesting**: Threaded discussions
- **9 Reaction Types**: Including platform-specific SPARKLE

### YouTube Integration
- **Watch Parties**: Synchronized viewing with WatchParty model
- **Timestamp Comments**: Link comments to video moments
- **Auto-Metadata**: Fetch video info via YouTube API
- **Clip Creation**: VideoClip model for highlights
- **Quota Management**: YouTubeApiQuota tracking

### Gamification
- **8 Achievement Tiers**: COMMON → MYTHIC, LIMITED_EDITION, SEASONAL
- **8 Quest Types**: DAILY, WEEKLY, MONTHLY, SPECIAL, ACHIEVEMENT, SEASONAL, COMMUNITY, CREATOR
- **Dual Currency**: `sparklePoints` (earned), `premiumPoints` (purchased)
- **Trading System**: 7-status workflow with escrow
- **100 Levels**: Progressive XP system

### Monetization
- **4 Subscription Tiers**: FREE, SPARKLE_FAN ($4.99), SPARKLE_CREATOR ($9.99), SPARKLE_LEGEND ($19.99)
- **Creator Revenue Share**: 70% default (`creatorRevenueShare: 0.7000`)
- **Fan Funding**: Direct creator support
- **Virtual Marketplace**: StoreItem with Decimal pricing

### Real-time Features
- **Socket.IO**: WebSocket with fallbacks
- **Live Chat**: ChatRoom and ChatMessage models
- **Presence Tracking**: Online status indicators
- **19 Notification Types**: Comprehensive alerts
- **Collaborative Spaces**: Real-time editing

### AI Integration
- **Content Moderation**: AiModerationQueue
- **Recommendations**: AiRecommendation with scoring
- **Writing Assistant**: AiContentSuggestion
- **User Preferences**: UserAiPreference

---

## 📊 Enums Reference

### User & Auth
```typescript
UserRole: USER, CREATOR, VERIFIED_CREATOR, MODERATOR, ADMIN, SYSTEM
UserStatus: PENDING_VERIFICATION, ACTIVE, SUSPENDED, BANNED, DELETED
AuthProvider: LOCAL, GOOGLE, GITHUB, TWITTER, DISCORD
SubscriptionTier: FREE, SPARKLE_FAN, SPARKLE_CREATOR, SPARKLE_LEGEND
```

### Content & Social
```typescript
ContentType: 9 types (BLOG through NEWS)
ContentStatus: DRAFT, SCHEDULED, PUBLISHED, ARCHIVED, DELETED
ReactionType: 9 types (LIKE through CUSTOM)
NotificationType: 19 types
```

### Moderation
```typescript
ModerationStatus: 7 states (PENDING through UNDER_REVIEW)
ReportReason: 9 reasons (SPAM through OTHER)
```

### Gamification
```typescript
BadgeRarity: 8 tiers (COMMON through SEASONAL)
QuestType: 8 types (DAILY through CREATOR)
QuestStatus: 6 states (AVAILABLE through LOCKED)
TradeStatus: 7 states (PENDING through DISPUTED)
```

---

## 🔧 Development Guidelines

### TypeScript Configuration
```json
{
  "strict": true,
  "strictNullChecks": true,
  "noUncheckedIndexedAccess": true,
  "noImplicitOverride": true,
  "target": "ES2022"
}
```

### Code Style
- **Components**: Functional with hooks
- **State**: Zustand for client, TanStack Query for server
- **Styling**: Tailwind CSS utilities
- **Validation**: Zod schemas
- **API**: tRPC for type safety

### Testing
```bash
npm run test          # Jest unit tests
npm run test:e2e      # Playwright E2E
npm run test:types    # Type tests with tsd
npm run test:coverage # Coverage report
```

### Git Workflow
```bash
# Commit conventions
feat:     # New feature
fix:      # Bug fix
docs:     # Documentation
perf:     # Performance
refactor: # Code restructuring
```

---

## ⚡ Performance Optimizations

### Query Strategies
- **50+ Composite Indexes** for common patterns
- **JSON GIN Indexes** for JSONB fields
- **Selective Loading** for high-relation models
- **Cursor Pagination** for large datasets

### Caching
```typescript
enum CacheType {
  USER_PROFILE = 'USER_PROFILE',   // 5 min TTL
  POST_CONTENT = 'POST_CONTENT',   // 10 min TTL
  FEED = 'FEED',                   // 1 min TTL
  TRENDING = 'TRENDING',           // 15 min TTL
  LEADERBOARD = 'LEADERBOARD',     // 5 min TTL
  STATS = 'STATS'                  // 30 min TTL
}
```

### Rate Limiting
```javascript
{
  api: { authenticated: 1000, unauthenticated: 100 }, // per hour
  content: { posts: 10, comments: 5 },                // per hour/minute
  auth: { login: 5, register: 3 }                     // per 15 min/hour
}
```

---

## 🚢 Deployment

### Production Checklist
- [ ] Run migrations: `npm run db:migrate:prod`
- [ ] Apply JSON indexes: `npm run db:indexes`
- [ ] Set environment variables
- [ ] Configure Redis
- [ ] Enable monitoring
- [ ] Setup backups
- [ ] Configure CDN
- [ ] Enable rate limiting

### Deployment Commands
```bash
npm run build
npm run db:migrate:prod
vercel --prod
```

---

## 📈 Current Status

### Completed Features ✅
- Database schema with 112 models
- Authentication with 5 OAuth providers
- Type generation system
- Basic UI components
- Admin dashboard structure

### In Progress 🚧
- Content creation system
- Comment threading
- Real-time notifications
- YouTube integration

### Planned 📅
- Full gamification system
- Monetization features
- AI integration
- Mobile app

---

## 🔗 Resources

- **Repository**: [GitHub](https://github.com/nordeim/Sparkle-Universe-Next)
- **Schema**: `prisma/schema.prisma`
- **Types**: `src/types/generated/`
- **Docs**: See README.md and Project Requirements Document.md
