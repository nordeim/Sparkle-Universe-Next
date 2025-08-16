# CLAUDE.md

Comprehensive guide for Claude Code when working with Sparkle-Universe-Next, a next-generation social platform with gamification, monetization, and real-time features.

## 🚀 Project Overview

**Sparkle-Universe-Next** is a sophisticated social platform built for content creators and communities, featuring:
- **Advanced gamification** with XP, levels, achievements, and quests
- **Creator monetization** with revenue sharing, fan funding, and subscription tiers
- **Real-time features** including watch parties, live chat, and collaborative spaces
- **AI integration** for content recommendations and moderation
- **YouTube integration** for video content and watch parties
- **Comprehensive moderation** with AI-powered content filtering

## 🔧 Quick Start Commands

### Development
```bash
npm run dev          # Start Next.js dev server (localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
npm run type-check   # TypeScript validation
npm run lint         # ESLint + Prettier checks
npm run lint:fix     # Auto-fix code style issues
```

### Testing
```bash
npm test             # Run Jest unit tests
npm run test:watch   # Watch mode testing
npm run test:coverage# Generate coverage report
npm run test:e2e     # Playwright end-to-end tests
```

### Database Operations
```bash
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Create/run migrations
npm run db:studio    # Prisma Studio (localhost:5555)
npm run db:seed      # Seed with sample data
npm run db:reset     # Reset database completely
```

## 🏗️ Architecture Deep Dive

### Core Technology Stack
- **Framework**: Next.js 15 (App Router) with TypeScript strict mode
- **Database**: PostgreSQL 16 with Prisma ORM and advanced indexing
- **Authentication**: NextAuth.js v5 (beta) with multiple providers
- **API**: tRPC for type-safe client-server communication
- **State**: TanStack Query + Zustand for efficient state management
- **Real-time**: Socket.io with Redis pub/sub for horizontal scaling
- **Caching**: Redis with intelligent cache invalidation
- **Styling**: Tailwind CSS + Radix UI for accessible components

### Directory Structure
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes (login, register)
│   ├── (main)/            # Main application routes
│   ├── api/               # API routes (Webhooks, uploads)
│   └── globals.css        # Global styles
├── server/
│   ├── api/               # tRPC routers & procedures
│   │   ├── routers/       # Feature-based API routes
│   │   └── trpc.ts        # tRPC configuration
│   └── auth.ts            # NextAuth configuration
├── lib/                   # Core utilities
│   ├── db.ts              # Prisma client
│   ├── redis.ts           # Redis client
│   ├── auth/              # Auth utilities
│   ├── rate-limit.ts      # Rate limiting
│   └── utils.ts           # Common utilities
├── components/            # React components
│   ├── ui/                # Reusable UI components
│   ├── posts/             # Post-related components
│   ├── gamification/      # XP, achievements, quests
│   └── youtube/           # YouTube integration
├── hooks/                 # Custom React hooks
└── types/                 # TypeScript type definitions
```

## 🗄️ Database Schema Complexity

### Massive Scale
- **3614 lines** of comprehensive schema
- **70+ database models** with complex relationships
- **Advanced indexing** strategy for performance at scale
- **JSON fields** with GIN indexes for flexible data
- **Monetization** built-in with creator revenue sharing

### Key Model Categories

#### User & Authentication
- **User**: 70+ relations, roles (USER, CREATOR, ADMIN, VERIFIED_CREATOR)
- **Profile**: Social links, privacy settings, theme preferences
- **UserStats**: Comprehensive analytics and engagement metrics
- **UserBalance**: Sparkle Points, Premium Points, transaction history
- **UserSubscription**: Tiered subscriptions (FREE → SPARKLE_LEGEND)

#### Content & Social
- **Post**: Advanced content types (blog, video, live blog, polls)
- **Comment**: Threaded discussions with YouTube timestamp integration
- **Reaction**: 9 reaction types (LIKE, LOVE, FIRE, SPARKLE, etc.)
- **Follow**: Social graph with notification preferences
- **Groups**: Community spaces with roles and permissions

#### Gamification System
- **Achievement**: 8 rarity levels (COMMON → MYTHIC)
- **Quest**: Daily, weekly, monthly, seasonal challenges
- **XP System**: Level progression with perks and unlocks
- **Leaderboards**: Global, regional, and group rankings
- **Store**: Virtual items, badges, themes, reactions

#### Monetization Features
- **CreatorPayout**: Monthly revenue sharing with creators
- **FanFunding**: Direct creator support with messages
- **RevenueShare**: Automated content monetization
- **TipTransaction**: Sparkle/Premium point tipping
- **StoreItem**: Premium virtual goods and features

#### Real-time Features
- **WatchParty**: Synchronized YouTube viewing with chat
- **VideoClip**: User-generated clips from YouTube videos
- **ChatRoom**: Real-time messaging with moderation
- **CollaborativeSpace**: Real-time document editing
- **WebSocketSession**: Connection management and scaling

#### AI Integration
- **AiRecommendation**: Personalized content discovery
- **AiContentSuggestion**: AI-powered writing assistance
- **AiModerationQueue**: Automated content moderation
- **UserAiPreference**: Personalized AI interaction settings

### Performance Optimizations

#### Critical Indexes Required
```sql
-- JSON GIN indexes (MANDATORY for v4.3)
CREATE INDEX idx_profile_theme ON profiles USING GIN (themePreference);
CREATE INDEX idx_post_content ON posts USING GIN (content);
CREATE INDEX idx_group_settings ON groups USING GIN (settings);

-- Composite indexes for common queries
CREATE INDEX idx_user_active ON users(deleted, status, lastSeenAt DESC);
CREATE INDEX idx_post_feed ON posts(published, featured, createdAt DESC);
CREATE INDEX idx_comment_threads ON comments(postId, parentId, createdAt);
```

#### Database Views (Recommended)
- `trending_posts` - Materialized view, refresh hourly
- `top_creators` - Daily updated creator rankings
- `active_groups` - Real-time group activity metrics

## 🔐 Environment Configuration

### Required Environment Variables
```bash
# Core Services
DATABASE_URL="postgresql://user:pass@localhost:5432/sparkle_universe"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# External Services
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
YOUTUBE_API_KEY="your-youtube-api-key"
STRIPE_SECRET_KEY="your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="your-webhook-secret"

# Optional Enhancements
OPENAI_API_KEY="for-ai-features"
UPLOADTHING_SECRET="for-file-uploads"
RESEND_API_KEY="for-email-notifications"
```

### Development Setup
1. **Node.js**: v20+ required (package.json engines)
2. **PostgreSQL**: 15+ with pg_trgm and pgcrypto extensions
3. **Redis**: 6+ for caching and real-time features
4. **Git hooks**: Husky configured for pre-commit checks

## 🎯 Development Workflow

### Getting Started
```bash
# Clone and setup
git clone <repository>
cd sparkle-universe-next
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your configuration

# Setup database
npm run db:migrate
npm run db:seed

# Start development
npm run dev
```

### Database Development
```bash
# After schema changes
npm run db:generate    # Update Prisma client
npm run db:migrate     # Create migration
npm run db:push        # Push to dev database

# Data management
npm run db:studio      # Visual database browser
npm run db:seed        # Reset with sample data
```

### Code Quality
- **TypeScript**: Strict mode with noUncheckedIndexedAccess
- **ESLint**: Airbnb style guide with custom rules
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks for quality checks
- **Testing**: Jest for unit tests, Playwright for E2E

## 🚨 Performance Guidelines

### Database Query Best Practices
```typescript
// ❌ BAD - Loading too much data
const users = await prisma.user.findMany({
  include: { _count: true }
})

// ✅ GOOD - Selective loading
const users = await prisma.user.findMany({
  select: { id: true, username: true, profile: true }
})
```

### Critical Performance Notes
- **User model**: 70+ relations - always use selective queries
- **JSON fields**: Must have GIN indexes for production
- **Large queries**: Use pagination (cursor-based recommended)
- **Caching**: Redis for hot paths, database query caching
- **Real-time**: Socket.io with Redis adapter for scaling

### Monitoring & Scaling
- **Database**: Enable pg_stat_statements for query monitoring
- **Redis**: Monitor memory usage and connection pools
- **API**: Rate limiting per user/IP with sliding windows
- **Analytics**: Vercel Analytics and Speed Insights configured

## 🔄 Development Phases

The codebase shows evidence of multiple development phases:
- **Current**: Production-ready v4.6 with performance optimizations
- completed phase 5

## 📊 Feature Complexity Levels

### Tier 1: Basic Features
- User registration/authentication
- Post creation and basic interactions
- Simple following system

### Tier 2: Advanced Features
- Real-time notifications and messaging
- YouTube integration and watch parties
- Basic gamification (XP, levels)

### Tier 3: Enterprise Features
- Creator monetization and revenue sharing
- AI-powered content recommendations
- Advanced moderation and safety systems
- Collaborative real-time editing
- Comprehensive analytics and reporting

## 🔍 Troubleshooting

### Common Issues
1. **Database connection**: Ensure PostgreSQL extensions are installed
2. **Redis connection**: Check Redis server status and URL format
3. **TypeScript errors**: Run `npm run type-check` for detailed diagnostics
4. **Build failures**: Check environment variables and dependencies

### Performance Debugging
- Use Prisma Studio to inspect query patterns
- Enable query logging in development
- Monitor Redis memory usage with `INFO memory`
- Check PostgreSQL slow query logs

This documentation reflects the current state as of v4.6 with comprehensive performance optimizations and query strategy improvements.
