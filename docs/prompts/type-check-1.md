You are my **Elite AI Coding Assistant and Strategic Partner**. Here's how you will serve me :

## Your Role & Core Mission

You are my world-class strategic partner, dedicated to delivering production-quality code and exceptional UI/UX design that not only meets but exceeds expectations. you approach every interaction as an opportunity to demonstrate excellence.

## Your Key Responsibilities

### 1. **Strategic Partnership**
- Think deeply and systematically before proposing any solution
- Anticipate long-term implications and ripple effects of decisions
- Provide forward-thinking solutions that future-proof my projects
- Act as a trusted advisor who sees beyond immediate requirements

### 2. **Exceptional UI/UX Design**
- Craft interfaces with genuine "wow" factor—visually stunning, intuitive, and delightful
- Elevate user experiences beyond functional to memorable
- Consider accessibility, performance, and user delight in every design decision

### 3. **Production-Quality Code**
- Write clean, efficient, maintainable, and robust code
- Provide complete, fully working replacement files when modifying existing code
- Preserve existing logic while seamlessly integrating improvements
- Always include file path comments as the first line in every file

### 4. **Meticulous Implementation**
- Operate with surgical precision to ensure non-disruptive changes
- Validate every modification against the broader system context
- Ensure backward compatibility and graceful degradation where applicable

### 5. **Thorough Planning & Execution**
- Create detailed, step-by-step execution plans with integrated checklists
- Break complex tasks into logical, independently verifiable phases
- Provide clear milestones and success criteria for each phase

### 6. **Clear Communication**
- Explain all architectural decisions and design rationale in detail
- Ensure I understand not just the "what" but the "why" behind every solution
- Share your thought process transparently (within <think> tags when appropriate)

## How you Will Behave

- **Excellence-Driven**: Every line of code, every pixel, every decision reflects commitment to the highest quality
- **Innovative**: you actively seek opportunities to deliver elegant solutions that provide strategic advantages
- **Reliable & Forward-Thinking**: you solve today's problems while improving tomorrow's possibilities
- **Transparent**: you share your reasoning to ensure perfect alignment with my vision

## Your Commitment

You don't just deliver code - you reimagine possibilities. Your commitment is to transform my vision into reality through:
- Rigorous internal deliberation before every response
- Solutions that go beyond basic requirements to deliver strategic value
- Continuous improvement of my project's health and maintainability
- Treating every task as an opportunity to demonstrate technical and creative excellence

You will serve as my trusted partner who:

1. **Thinks strategically** - Analyzing implications, identifying opportunities, and proposing solutions that scale elegantly with my project's growth
2. **Delivers production excellence** - Writing clean, maintainable code with complete file replacements, preserving existing logic while seamlessly integrating improvements
3. **Creates exceptional experiences** - Designing interfaces that don't just work, but delight users with thoughtful interactions and visual polish
4. **Communicates transparently** - Sharing your reasoning process within `<think>` tags and explaining the "why" behind every technical and design decision
5. **Plans meticulously** - Breaking complex tasks into verifiable phases with clear success criteria and integrated checklists

## How You will Approach Every Task

1. **Deep Analysis** - You will thoroughly consider requirements, constraints, and opportunities before proposing solutions
2. **Strategic Vision** - Every recommendation will consider both immediate needs and long-term project health
3. **Complete Solutions** - Full, working implementations with proper file paths and comprehensive documentation
4. **Quality Assurance** - Ensuring backward compatibility, accessibility, and performance in every deliverable
5. **Continuous Enhancement** - Actively identifying ways to improve your project beyond stated requirements

Remember not to rush to an answer without performing a thorough and thoughtful consideration. You will enclose your internal monologue inside <think> and </think> tags before giving your final answer.

Take the above as your meta instruction going forward. Always commit to maintaining this elite level of service, treating every task as an opportunity to demonstrate excellence in both technical implementation and creative design. Every line of code, every design decision, and every strategic recommendation will reflect your commitment to exceeding my expectations.

Now please put on your deep-thinking hat to deeply think and carefully and systematically review the project's `README.md` and PRD using line by line comparison, then give me your comprehensive assessment on what the project is all about, also highlight any inconsistencies between `README.md` and the PRD. please meticulously plan how to review and compare the two documents before proceeding cautiously.

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
  orm: "Prisma 6.14.0" /* Type-safe database access, v4.6 optimizations */,
  api: "tRPC 11.4.4" /* End-to-end type safety */,
  cache: "Redis (ioredis 5.3.2)" /* Sessions, rate limiting, pub/sub */,
  realtime: "Socket.IO 4.7.4" /* WebSocket with fallbacks */,
  auth: "NextAuth 4.24.11" /* OAuth + credentials */,
  validation: "Zod 3.22.4" /* Runtime type validation */,
  precision: "PostgreSQL Decimal" /* Decimal(19,4) for financial calculations */
};

// Infrastructure
const infrastructure = {
  hosting: "Vercel" /* Edge functions, automatic scaling */,
  monitoring: ["Vercel Analytics", "Vercel Speed Insights"],
  node: ">=20.0.0" /* LTS version */,
  packageManager: "npm 10.2.5" /* Specified version */,
  schemaVersion: "4.6" /* Performance Optimization Release */
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

### package.json
```json
{
  "name": "sparkle-universe",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write \"**/*.{js,jsx,ts,tsx,md,json}\"",
    "format:check": "prettier --check \"**/*.{js,jsx,ts,tsx,md,json}\"",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:migrate:prod": "prisma migrate deploy",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    "db:reset": "prisma migrate reset",
    "db:indexes": "tsx scripts/apply-indexes.ts",
    "postinstall": "prisma generate",
    "prepare": "husky install",
    "validate": "npm run type-check && npm run lint && npm run format:check",
    "validate:fix": "npm run type-check && npm run lint:fix && npm run format",
    "analyze": "ANALYZE=true next build",
    "clean": "rm -rf .next out node_modules/.cache",
    "clean:all": "rm -rf .next out node_modules package-lock.json && npm install"
  },
  "dependencies": {
    "@auth/prisma-adapter": "^2.10.0",
    "@aws-sdk/client-s3": "^3.864.0",
    "@aws-sdk/s3-request-presigner": "^3.864.0",
    "@hookform/resolvers": "^5.2.1",
    "@next-auth/prisma-adapter": "^1.0.7",
    "@portabletext/react": "^3.2.1",
    "@prisma/client": "^6.14.0",
    "@radix-ui/react-avatar": "^1.1.10",
    "@radix-ui/react-checkbox": "^1.3.3",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-label": "^2.1.7",
    "@radix-ui/react-popover": "^1.1.15",
    "@radix-ui/react-progress": "^1.1.7",
    "@radix-ui/react-radio-group": "^1.3.8",
    "@radix-ui/react-scroll-area": "^1.2.10",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-separator": "^1.1.7",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-switch": "^1.2.6",
    "@radix-ui/react-tabs": "^1.1.13",
    "@radix-ui/react-toast": "^1.2.15",
    "@radix-ui/react-toggle": "^1.1.10",
    "@radix-ui/react-tooltip": "^1.2.8",
    "@react-email/components": "^0.5.0",
    "@react-email/render": "^1.2.0",
    "@react-three/drei": "^9.122.0",
    "@react-three/fiber": "^8.18.0",
    "@socket.io/redis-adapter": "^8.3.0",
    "@tanstack/react-query": "^5.85.3",
    "@tanstack/react-query-devtools": "^5.85.3",
    "@tiptap/extension-code-block-lowlight": "^2.26.1",
    "@tiptap/extension-image": "^2.26.1",
    "@tiptap/extension-link": "^2.26.1",
    "@tiptap/extension-placeholder": "^2.26.1",
    "@tiptap/extension-youtube": "^2.26.1",
    "@tiptap/pm": "^2.26.1",
    "@tiptap/react": "^2.26.1",
    "@tiptap/starter-kit": "^2.26.1",
    "@trpc/client": "^11.4.4",
    "@trpc/next": "^11.4.4",
    "@trpc/react-query": "^11.4.4",
    "@trpc/server": "^11.4.4",
    "@types/recharts": "^1.8.29",
    "@types/swagger-ui-react": "^5.18.0",
    "@vercel/analytics": "^1.5.0",
    "@vercel/speed-insights": "^1.2.0",
    "algoliasearch": "^5.35.0",
    "bcryptjs": "^3.0.2",
    "bullmq": "^5.58.0",
    "canvas-confetti": "^1.9.3",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "decimal.js": "^10.6.0",
    "framer-motion": "^11.18.2",
    "googleapis": "^156.0.0",
    "ioredis": "^5.7.0",
    "isomorphic-dompurify": "^2.26.0",
    "jsonwebtoken": "^9.0.2",
    "lowlight": "^3.3.0",
    "lucide-react": "^0.539.0",
    "next": "^14.2.31",
    "next-auth": "^4.24.11",
    "next-sanity": "^9.12.3",
    "next-themes": "^0.4.6",
    "nodemailer": "^6.10.1",
    "openapi-types": "^12.1.3",
    "qrcode": "^1.5.4",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.62.0",
    "react-hot-toast": "^2.6.0",
    "react-intersection-observer": "^9.16.0",
    "react-player": "^3.3.1",
    "recharts": "^3.1.2",
    "sanity": "^3.99.0",
    "socket.io": "^4.8.1",
    "socket.io-client": "^4.8.1",
    "sonner": "^2.0.7",
    "speakeasy": "^2.0.0",
    "superjson": "^2.2.2",
    "swagger-ui-react": "^5.27.1",
    "tailwind-merge": "^3.3.1",
    "three": "^0.179.1",
    "twilio": "^5.8.0",
    "uploadthing": "^7.7.4",
    "uuid": "^10.0.0",
    "zod": "^3.25.76",
    "zustand": "^5.0.7"
  },
  "devDependencies": {
    "@next/bundle-analyzer": "^15.5.0",
    "@playwright/test": "^1.54.2",
    "@svgr/webpack": "^8.1.0",
    "@testing-library/jest-dom": "^6.8.0",
    "@testing-library/react": "^16.3.0",
    "@types/bcryptjs": "^2.4.6",
    "@types/canvas-confetti": "^1.9.0",
    "@types/cookie": "^0.6.0",
    "@types/jest": "^30.0.0",
    "@types/jsonwebtoken": "^9.0.10",
    "@types/next": "^8.0.7",
    "@types/node": "^22.17.2",
    "@types/nodemailer": "^7.0.0",
    "@types/qrcode": "^1.5.5",
    "@types/react": "^18.3.23",
    "@types/react-dom": "^18.3.7",
    "@types/speakeasy": "^2.0.10",
    "@types/three": "^0.179.0",
    "@types/uuid": "^10.0.0",
    "@types/youtube": "^0.1.2",
    "@typescript-eslint/eslint-plugin": "^8.39.1",
    "@typescript-eslint/parser": "^8.39.1",
    "autoprefixer": "^10.4.21",
    "cssnano": "^7.1.0",
    "eslint": "^8.57.1",
    "eslint-config-next": "^14.2.31",
    "eslint-config-prettier": "^8.10.2",
    "eslint-plugin-import": "^2.32.0",
    "eslint-plugin-prettier": "^5.5.4",
    "eslint-plugin-react": "^7.37.5",
    "eslint-plugin-react-hooks": "^5.2.0",
    "husky": "^9.1.7",
    "jest": "^30.0.5",
    "jest-environment-jsdom": "^30.0.5",
    "lint-staged": "^15.5.2",
    "postcss": "^8.5.6",
    "prettier": "^3.6.2",
    "prettier-plugin-tailwindcss": "^0.6.14",
    "prisma": "^6.14.0",
    "sharp": "^0.34.3",
    "tailwindcss": "^3.4.17",
    "tailwindcss-animate": "^1.0.7",
    "tsx": "^4.20.4",
    "tw-animate-css": "^1.3.7",
    "typescript": "^5.9.2"
  },
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  },
  "packageManager": "npm@10.2.5",
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,yml,yaml}": [
      "prettier --write"
    ]
  },
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run validate"
    }
  }
}
```

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

```bash
# codebase file structure and file list:
.gitignore
components.json
manifest.json
package-lock.json
package.json
tsconfig.json
next-env.d.ts
scripts/generate-icons.js
tailwind.config.ts
eslint.config.mjs
jest.config.mjs
jest.setup.js
next.config.mjs
postcss.config.mjs
src/emails/templates/index.tsx
src/hooks/use-toast.ts.p6
src/hooks/use-toast.ts
src/hooks/use-socket.ts
src/hooks/use-auth.ts
src/hooks/use-debounce.ts
src/config/achievements.ts
src/types/comment.ts
src/types/index.ts
src/types/jest-dom.d.ts
src/types/global.d.ts
src/lib/rate-limit.ts.p7
src/lib/rate-limit-server.ts
src/lib/analytics.ts
src/lib/security.ts
src/lib/utils.ts.orig
src/lib/jobs/job-processor.ts
src/lib/socket/socket-server.ts
src/lib/openapi.ts
src/lib/redis.ts
src/lib/utils.ts
src/lib/api.ts
src/lib/utils/format.ts
src/lib/utils.ts.shadcn-init
src/lib/events/event-emitter.ts
src/lib/auth/auth.config.ts.p7
src/lib/auth/auth.ts
src/lib/auth/auth.config.ts
src/lib/monitoring.ts
src/lib/rate-limit.ts
src/lib/validations/comment.ts
src/lib/validations/post.ts
src/lib/validations/user.ts
src/lib/db.ts
src/services/auth.service.ts
src/services/user.service.ts
src/services/notification.service.ts
src/services/email.service.ts
src/services/upload.service.ts
src/server/websocket/socket.server.ts
src/server/api/trpc.ts
src/server/api/routers/comment.ts
src/server/api/routers/upload.ts
src/server/api/routers/analytics.ts
src/server/api/routers/gamification.ts
src/server/api/routers/social.ts
src/server/api/routers/post.ts
src/server/api/routers/youtube.ts
src/server/api/routers/search.ts
src/server/api/routers/admin.ts
src/server/api/routers/auth.ts
src/server/api/routers/message.ts
src/server/api/routers/notification.ts
src/server/api/routers/group.ts
src/server/api/routers/user.ts
src/server/api/root.ts
src/server/services/comment.service.ts
src/server/services/analytics.service.ts
src/server/services/event.service.ts
src/server/services/watchparty.service.ts
src/server/services/user.service.ts
src/server/services/mention.service.ts
src/server/services/notification.service.ts
src/server/services/realtime.service.ts
src/server/services/post.service.ts
src/server/services/watch-party.service.ts
src/server/services/activity.service.ts
src/server/services/gamification.service.ts
src/server/services/youtube.service.ts
src/server/services/upload.service.ts
src/server/services/achievement.service.ts
src/server/services/system.service.ts
src/server/services/cache.service.ts
src/server/services/admin.service.ts
src/server/services/moderation.service.ts
src/server/services/search.service.ts
src/middleware.ts
src/components/ui/button.tsx
src/components/ui/select.tsx
src/components/ui/dropdown-menu.tsx
src/components/ui/switch.tsx
src/components/ui/badge.tsx
src/components/ui/textarea.tsx
src/components/ui/toaster.tsx
src/components/ui/separator.tsx
src/components/ui/radio-group.tsx
src/components/ui/tooltip.tsx
src/components/ui/progress.tsx
src/components/ui/toggle.tsx
src/components/ui/avatar.tsx
src/components/ui/label.tsx
src/components/ui/alert.tsx
src/components/ui/skeleton.tsx
src/components/ui/input.tsx
src/components/ui/checkbox.tsx
src/components/ui/table.tsx
src/components/ui/use-toast.ts
src/components/ui/tabs.tsx
src/components/ui/sonner.tsx
src/components/ui/popover.tsx
src/components/ui/dialog.tsx
src/components/ui/toast.tsx
src/components/ui/scroll-area.tsx
src/components/ui/card.tsx
src/components/ui/emoji-picker.tsx
src/components/admin/moderator-queue.tsx
src/components/admin/moderation-stats.tsx
src/components/admin/system-health.tsx
src/components/admin/top-content.tsx
src/components/admin/recent-activity.tsx
src/components/admin/admin-activity-monitor.tsx
src/components/admin/moderation-history.tsx
src/components/admin/user-analytics.tsx
src/components/admin/admin-sidebar.tsx
src/components/admin/bulk-action-dialog.tsx
src/components/admin/realtime-metrics.tsx
src/components/admin/content-preview-dialog.tsx
src/components/admin/ai-analysis-panel.tsx
src/components/admin/admin-notifications.tsx
src/components/admin/admin-header.tsx
src/components/admin/analytics-chart.tsx
src/components/admin/user-details-dialog.tsx
src/components/admin/charts/content-performance.tsx
src/components/admin/charts/user-growth-chart.tsx
src/components/admin/charts/engagement-heatmap.tsx
src/components/error-boundary.tsx
src/components/features/youtube/youtube-embed.tsx
src/components/features/gamification/level-progress.tsx
src/components/features/gamification/achievement-details-modal.tsx
src/components/features/gamification/achievement-grid.tsx
src/components/features/editor/rich-text-editor.tsx
src/components/features/post/post-card.tsx
src/components/features/post/post-actions.tsx
src/components/features/comments/comment-form.tsx
src/components/features/comments/mention-suggestions.tsx
src/components/features/comments/comment-item.tsx
src/components/features/comments/reaction-picker.tsx
src/components/features/comments/comment-thread.tsx
src/components/providers/admin-provider.tsx
src/components/providers/query-provider.tsx
src/components/providers/theme-provider.tsx
src/components/providers/auth-provider.tsx
src/app/globals.css
src/app/page.tsx
src/app/(main)/create/page.tsx
src/app/api-docs/page.tsx
src/app/api/trpc/[trpc]/route.ts
src/app/api/admin/jobs/route.ts
src/app/api/openapi.json/route.ts
src/app/api/auth/[...nextauth]/route.ts
src/app/api/generate-icon/route.ts
src/app/layout.tsx
src/app/admin/layout.tsx
src/app/admin/moderation/page.tsx
src/app/admin/dashboard/page.tsx
src/app/admin/users/page.tsx
src/app/layout.tsx.p7
src/app/layout.tsx.p8
src/app/fonts/GeistVF.woff
src/app/fonts/GeistMonoVF.woff
src/app/(auth)/login/page.tsx
src/app/(auth)/layout.tsx
src/app/(auth)/register/page.tsx
prisma/schema.prisma
public/apple-touch-icon.png
public/favicon-16x16.png
public/favicon-32x32.png
public/favicon.ico
public/favicon.png
public/icon-128x128.png
public/icon-144x144.png
public/icon-152x152.png
public/icon-192.png
public/icon-192.svg
public/icon-192x192.png
public/icon-384x384.png
public/icon-512.png
public/icon-512.svg
public/icon-512x512.png
public/icon-72x72.png
public/icon-96x96.png
public/icon.svg
public/manifest.json
public/sw.js
scripts/generate-icons.js
```
---

## 🗄️ Database Architecture

### Schema Implementation Overview

The database uses PostgreSQL 16 with Prisma ORM v6.14.0, implementing a comprehensive 126-model schema (v4.6) with:

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

Based on NextAuth v4 with comprehensive security:

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
  "jest": "^30.0.5",
  "@testing-library/react": "^16.3.0",
  "@testing-library/jest-dom": "^6.7.0",
  "@playwright/test": "^1.54.2"
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

### Phase 2: Content System ✅ (Completed)
- [ ] Rich text editor integration (TipTap)
- [ ] Post creation with 9 content types
- [ ] Comment system with threading
- [ ] AI content moderation
- [ ] Search with PostgreSQL full-text
- [ ] Media upload with CDN

### Phase 3: Social Features ✅ (Completed)
- [ ] Following system implementation
- [ ] Direct messaging with E2E encryption
- [ ] Notification system (19 types)
- [ ] Activity feeds with algorithms
- [ ] Socket.IO real-time features
- [ ] Presence indicators
- [ ] Block system with cascades
- [ ] Phone verification (2FA)

### Phase 4: YouTube Integration ✅ (Completed)
- [ ] YouTube API v3 integration
- [ ] Video metadata auto-fetching
- [ ] Timestamp discussions
- [ ] Watch parties with sync
- [ ] Creator analytics dashboard
- [ ] Playlist collaboration
- [ ] Clip creation tools
- [ ] Channel synchronization

### Phase 5: Gamification ✅ (Completed)
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
### Documentation
- **API Reference**: [/docs/api](./docs/api/README.md)
- **Schema Reference**: [/prisma/schema.prisma](./prisma/schema.prisma)
- **Component Storybook**: [/docs/storybook](./docs/storybook/README.md)
- **Performance Guide**: [/docs/performance](./docs/performance/README.md)
- **Security Guide**: [/docs/security](./docs/security/README.md)

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
# Project Requirements Document

**Sparkle Universe** is a revolutionary, next-generation community platform designed exclusively for Sparkle YouTube fans. Built on a comprehensive 126-model database architecture (v4.6), it transcends traditional forum limitations by seamlessly blending YouTube-native integration, real-time social interactions, advanced gamification with 8-tier achievement system, and AI-powered features to create an immersive digital ecosystem where fans connect, create, and celebrate their shared passion.

### 1.2 Strategic Objectives

- **Primary Goal**: Establish the premier global destination for Sparkle YouTube fans
- **User Growth Target**: 100,000 active users within 6 months, 1M within year one
- **Engagement Target**: 70% weekly active users (WAU), 15+ minutes average session time
- **Performance Target**: Sub-100ms API response times (p95), 95+ Lighthouse scores
- **Revenue Model**: Freemium with 4-tier subscription system, virtual economy, creator monetization

### 1.3 Key Differentiators

1. **YouTube-Native Integration**: Deep platform integration with timestamp discussions, watch parties, clip creation
2. **Real-Time Everything**: Socket.IO powered live features at the core architecture
3. **AI-Powered Intelligence**: Smart content curation, moderation, and assistance
4. **Advanced Gamification**: Meaningful progression system with 8 badge rarity tiers and dual-currency economy
5. **Creator Empowerment**: Professional tools with 70% revenue share for creators
6. **Enterprise Architecture**: 126 database models, strategic composite indexes, JSON GIN optimization

### 1.4 Technical Foundation

- **Frontend**: Next.js 14.0 (App Router), TypeScript 5.9, Tailwind CSS 3.4
- **Backend**: PostgreSQL 16, Prisma ORM 6.14.0 (v4.6 schema), tRPC 11.4.4
- **Infrastructure**: Vercel Edge Functions, Redis caching, Socket.IO real-time
- **Financial Precision**: PostgreSQL Decimal(19,4) for all monetary values
- **Currency System**: Integer-based points (sparklePoints, premiumPoints)

---

## 2. Project Overview

### 2.1 Product Description

Sparkle Universe is a comprehensive community platform implementing:
- **Blog Forum**: Rich content creation with 9 content types
- **Social Network**: User connections with 6-tier role system
- **YouTube Hub**: Deep integration with timestamp discussions and watch parties
- **Gamification Platform**: XP system, 8-tier achievements, dual-currency economy
- **Creator Tools**: Analytics, monetization with 70% revenue share, fan funding

### 2.2 Target Audience

#### Primary Users
- **Age**: 13-35 years old (with COPPA compliance for minors)
- **Demographics**: Global audience, English-first with multi-language support planned
- **Interests**: Sparkle content, YouTube culture, fan art, theory discussions
- **Behavior**: High social media engagement, video-first consumption, 15+ minute sessions

#### Secondary Users
- **Content Creators**: YouTubers, artists, writers in the Sparkle community
- **Verified Creators**: Premium creators with enhanced monetization features
- **Community Moderators**: Volunteer and staff moderators
- **System Users**: Automated processes and bot accounts

### 2.3 Business Model

1. **Subscription Tiers (4 Levels)**
   - **FREE**: Core features with limitations, ad-supported
   - **SPARKLE_FAN** ($4.99/month): Enhanced features, no ads, 2x XP
   - **SPARKLE_CREATOR** ($9.99/month): Creator tools, analytics, 3x XP
   - **SPARKLE_LEGEND** ($19.99/month): Premium experience, 5x XP, 100 premium points monthly

2. **Virtual Economy**
   - **sparklePoints (Integer)**: Earned through engagement, spent on virtual goods
   - **premiumPoints (Integer)**: Purchased currency for exclusive items
   - **Store Prices**: Decimal(19,4) for precise pricing in marketplace

3. **Creator Monetization**
   - Direct fan funding with 70% creator share (creatorRevenueShare: 0.7000)
   - Tip transactions in both currencies
   - Revenue sharing on sponsored content
   - Creator payouts via Stripe/PayPal

### 2.4 Platform Values

- **Community First**: Every decision prioritizes community health
- **Inclusive Design**: WCAG AAA compliance for accessibility
- **Privacy Focused**: Comprehensive data protection with soft deletes
- **Sustainable Growth**: Long-term platform health with version control
- **Innovation Culture**: Continuous evolution with feature flags

---

## 3. User Research & Personas

### 3.1 Primary Personas

#### Persona 1: The Active Fan
- **Name**: Sarah, 22
- **Behavior**: Daily platform visitor, creates fan art, participates in discussions
- **Goals**: Connect with like-minded fans, share creations, earn achievements
- **Pain Points**: Fragmented communities, limited interaction tools
- **Features Needed**: Rich media posting, real-time chat, 19 notification types

#### Persona 2: The Content Creator
- **Name**: Alex, 28 (VERIFIED_CREATOR role)
- **Behavior**: Creates YouTube videos, seeks community feedback, monetizes content
- **Goals**: Grow audience, earn revenue (70% share), collaborate with others
- **Pain Points**: Limited analytics, difficult monetization, audience fragmentation
- **Features Needed**: Creator dashboard, fan funding, revenue tracking

#### Persona 3: The Lurker
- **Name**: Jamie, 17
- **Behavior**: Reads content daily but rarely posts
- **Goals**: Stay informed, enjoy content without pressure to participate
- **Pain Points**: Intimidating to start participating, FOMO on discussions
- **Features Needed**: Easy onboarding, low-pressure engagement, bookmark folders

#### Persona 4: The Community Leader
- **Name**: Morgan, 30 (MODERATOR role)
- **Behavior**: Organizes events, moderates discussions, mentors new users
- **Goals**: Build healthy community, organize activities, help others
- **Pain Points**: Limited moderation tools, difficult event coordination
- **Features Needed**: Advanced moderation, event tools, AI moderation queue

#### Persona 5: The System
- **Role**: SYSTEM user type
- **Behavior**: Automated processes, scheduled tasks, bot operations
- **Functions**: Auto-moderation, scheduled publishing, system notifications
- **Requirements**: API access, webhook integration, audit logging

### 3.2 User Journey Maps

#### New User Onboarding
1. **Discovery**: Find platform through YouTube/social media
2. **Registration**: Quick OAuth signup (5 providers: LOCAL, GOOGLE, GITHUB, TWITTER, DISCORD)
3. **Personalization**: Select interests, favorite creators
4. **First Action**: Guided to make first post/comment (max 5 levels deep)
5. **Reward**: Receive first achievement from 8 rarity tiers
6. **Retention**: Daily login rewards, personalized content feed

#### Content Creation Flow
1. **Inspiration**: Browse trending topics from 9 content types
2. **Creation**: Rich editor with media tools, YouTube integration
3. **Enhancement**: AI assistance, templates, formatting
4. **Publishing**: Schedule via PublishQueue, tags, visibility settings
5. **Engagement**: Real-time reactions (9 types), comments, shares
6. **Analytics**: Track performance via PostStats, iterate content

---

## 4. Functional Requirements

### 4.1 User Management System

#### 4.1.1 Authentication & Authorization
- **OAuth Integration**: 5 providers - LOCAL, GOOGLE, GITHUB, TWITTER, DISCORD
- **Two-Factor Authentication**: TOTP support with backup codes
- **Role-Based Access Control**: 6 roles - USER, CREATOR, VERIFIED_CREATOR, MODERATOR, ADMIN, SYSTEM
- **Session Management**: JWT-based with Redis backing
- **Account Recovery**: Email/phone recovery with tokens

#### 4.1.2 User Profiles
- **Basic Information**: Username, avatar, bio, pronouns
- **Points System**: 
  - sparklePoints (Integer) - Earned currency
  - premiumPoints (Integer) - Purchased currency
  - experience (Integer) - XP for leveling
  - reputationScore (Integer) - Community standing
- **Security Features**:
  - phoneNumberHash for secure lookups
  - twoFactorSecret (encrypted)
  - accountLockoutAttempts tracking
- **Creator Features**:
  - creatorRevenueShare: Decimal(19,4) default 0.7000
  - totalRevenueEarned: BigInt
  - lastPayoutDate tracking

#### 4.1.3 Reputation System
- **XP Calculation**: 
  - Post creation: 10 XP
  - Quality post (high engagement): 50 XP bonus
  - Comments: 5 XP (5 per minute rate limit)
  - Helpful comments: 20 XP bonus
  - Daily login: 10 XP
- **Level Progression**: 100 levels via LevelConfig model
- **Trust Levels**: Unlock features as trust increases

### 4.2 Content Management

#### 4.2.1 Blog Post System
- **Content Types (9 total)**:
  - BLOG - Traditional blog posts
  - LIVE_BLOG - Real-time event coverage
  - POLL - Community polls with PollOption model
  - VIDEO_REVIEW - YouTube video analysis
  - FAN_ART - Creative content showcase via FanArtGallery
  - THEORY_THREAD - Theory discussions
  - SERIES - Multi-part content via PostSeries
  - TUTORIAL - How-to guides
  - NEWS - News and announcements
- **Rich Features**:
  - Version control with PostRevision model
  - Collaborative editing (collaborators array)
  - YouTube integration (youtubeVideoId, youtubeVideoData JSON)
  - AI content generation tracking
  - Scheduled publishing via ScheduledAction

#### 4.2.2 Commenting System
- **Nested Comments**: Threaded discussions up to 5 levels deep
- **Rich Formatting**: Markdown support, emoji picker
- **Reactions**: 9 types - LIKE, LOVE, FIRE, SPARKLE, MIND_BLOWN, LAUGH, CRY, ANGRY, CUSTOM
- **Special Features**:
  - youtubeTimestamp for video moments
  - quotedTimestamp for specific quotes
  - Edit history tracking (editHistory JSON)
  - Soft delete for comments with replies
- **Rate Limiting**: 5 comments per minute

#### 4.2.3 Media Management
- **File Types**: Images, videos, GIFs via MediaFile model
- **Processing**: Auto-optimization, CDN distribution
- **YouTube Features**: 
  - Automatic metadata fetching via YoutubeChannel model
  - Playlist creation with PlaylistItem
  - Clip creation via VideoClip
  - Watch parties with WatchParty model

### 4.3 Social Features

#### 4.3.1 User Interactions
- **Following System**: Follow model with notification preferences
- **Blocking**: Block model with cascade behaviors
- **Direct Messaging**: Conversation and Message models
- **Mentions**: Mention model with notification triggers
- **Activity Feed**: ActivityStream model with visibility controls

#### 4.3.2 Groups & Communities
- **Group Types**: 4 visibility levels - PUBLIC, PRIVATE, INVITE_ONLY, HIDDEN
- **Group Roles**: 4 levels - MEMBER, MODERATOR, ADMIN, OWNER
- **Features**:
  - Dedicated GroupPost model
  - GroupChannel for organized discussions
  - Group-specific settings (JSON)
  - Custom emojis support
- **Discovery**: Featured groups, search, categories

#### 4.3.3 Real-time Features
- **WebSocket Sessions**: WebsocketSession tracking
- **Chat Rooms**: ChatRoom with ChatMessage model
- **Watch Parties**: Synchronized viewing with WatchPartyParticipant
- **Presence**: PresenceTracking for online status
- **Collaborative Spaces**: Real-time editing via CollaborativeSpace

### 4.4 Gamification System

#### 4.4.1 Achievement System
- **Badge Rarity (8 tiers)**:
  - COMMON - 50%+ of users
  - UNCOMMON - 30-50% of users
  - RARE - 10-30% of users
  - EPIC - 5-10% of users
  - LEGENDARY - 1-5% of users
  - MYTHIC - <1% of users
  - LIMITED_EDITION - Time-limited
  - SEASONAL - Seasonal events only
- **Achievement Model**:
  - xpReward (Integer)
  - sparklePointsReward (Integer)
  - premiumPointsReward (Integer)
  - progressSteps for multi-part achievements
  - UserAchievement tracks progress (0 to 1 float)

#### 4.4.2 Virtual Economy
- **Currency System**:
  - UserBalance model tracks all points
  - sparklePoints (Integer) - Earned through activities
  - premiumPoints (Integer) - Purchased with real money
  - frozenPoints (Integer) - Points held in escrow for trades
- **Marketplace**:
  - StoreItem with Decimal(19,4) pricing
  - StoreBundle with special pricing
  - UserInventory for owned items
  - Trade system with 7 status types

#### 4.4.3 Quest System
- **Quest Types (8 total)**:
  - DAILY - Reset every 24 hours
  - WEEKLY - Reset every week
  - MONTHLY - Reset monthly
  - SPECIAL - Limited time events
  - ACHIEVEMENT - Tied to achievements
  - SEASONAL - Seasonal content
  - COMMUNITY - Community goals
  - CREATOR - Creator-specific quests
- **Quest Status (6 states)**:
  - AVAILABLE, IN_PROGRESS, COMPLETED, CLAIMED, EXPIRED, LOCKED
- **UserQuest** tracks individual progress with JSON data

### 4.5 YouTube Integration

#### 4.5.1 Video Features
- **Models**:
  - YoutubeChannel - Channel data and sync
  - YoutubeVideo - Video metadata
  - VideoAnalytics - Performance tracking
  - YouTubeApiQuota - API limit management
- **Features**:
  - Timestamp discussions on comments
  - Video reactions overlay
  - Clip creation and sharing
  - Premiere events support

#### 4.5.2 Creator Tools
- **Analytics**: Channel and video performance
- **Monetization**:
  - FanFunding model with platform fees
  - TipTransaction in both currencies
  - RevenueShare calculations
  - CreatorPayout processing
- **Collaboration**: Find editors, artists, moderators

### 4.6 Notification System

#### 4.6.1 Notification Types (19 total)
- **Content**: POST_LIKED, POST_COMMENTED, COMMENT_LIKED
- **Social**: USER_FOLLOWED, MENTION
- **Achievements**: ACHIEVEMENT_UNLOCKED, LEVEL_UP, MILESTONE_REACHED
- **Groups**: GROUP_INVITE, GROUP_POST
- **Events**: EVENT_REMINDER, WATCH_PARTY_INVITE, YOUTUBE_PREMIERE
- **Economy**: QUEST_COMPLETE, TRADE_REQUEST
- **Special**: CONTENT_FEATURED, DIRECT_MESSAGE, SYSTEM

#### 4.6.2 Delivery Channels
- **In-app**: Real-time via Socket.IO
- **Email**: Via NotificationQueue
- **Push**: Web push notifications
- **Preferences**: NotificationPreference model with granular controls

### 4.7 AI-Powered Features

#### 4.7.1 Content Intelligence
- **Models**:
  - AiRecommendation - Personalized content
  - AiContentSuggestion - Writing assistance
  - UserAiPreference - User preferences
  - AiAssistantConversation - Chat history
- **Features**:
  - Smart recommendations with confidence scores
  - Content summarization
  - Sentiment analysis via VideoAnalytics
  - Trend prediction

#### 4.7.2 Moderation Support
- **AiModerationQueue Model**:
  - aiScore (0-1 probability)
  - aiCategories (JSON)
  - humanReviewRequired flag
  - reviewPriority system
- **ContentFilter**: Pattern-based filtering
- **Report System**: 9 reason types via ReportReason enum

### 4.8 Administrative Features

#### 4.8.1 Admin Dashboard
- **User Management**: Advanced search, bulk operations
- **Content Moderation**: 
  - ModerationStatus (7 states)
  - ModerationAction tracking
  - AI-assisted review queue
- **System Configuration**:
  - SiteSetting key-value store
  - FeatureFlag for gradual rollouts
  - Experiment A/B testing

#### 4.8.2 Analytics & Reporting
- **Models**:
  - UserActivity - Daily activity tracking
  - ContentPerformance - Content metrics
  - AnalyticsEvent - Custom events
  - SystemHealth - Infrastructure monitoring
- **Leaderboards**: Global and scoped rankings
- **Custom Reports**: SQL-based reporting

---

## 5. Technical Architecture

### 5.1 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                           │
├─────────────────────────────────────────────────────────────┤
│  Next.js 14 App │ Mobile PWA │ TypeScript 5.3 │ Tailwind 3.4│
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                     API Gateway (tRPC 11.4.4)               │
├─────────────────────────────────────────────────────────────┤
│  Type-safe APIs │ Rate Limiting │ Auth │ Request Validation │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                    Service Layer                             │
├─────────────────────────────────────────────────────────────┤
│ User │ Content │ Comment │ Notification │ Activity │ Cache  │
│ Auth │ Media   │ Mention │ Moderation   │ Event    │ AI     │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                    Data Layer                                │
├─────────────────────────────────────────────────────────────┤
│ PostgreSQL 16 │ Prisma 6.14.0 │ Redis │ S3 │ 126 Models     │
│ pgcrypto ext  │ pg_trgm ext  │ Cache │ CDN│ v4.6 Schema    │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Database Schema Overview (126 Models)

#### Core Models (User & Auth)
```prisma
// User model with 70+ relations (EXTREME complexity)
model User {
  id                String     @id @default(cuid())
  email             String     @unique
  username          String     @unique
  // Points system (Integers)
  sparklePoints     Int        @default(0)
  premiumPoints     Int        @default(0)
  experience        Int        @default(0)  // Not xp_points
  reputationScore   Int        @default(0)
  // Creator monetization (Decimals)
  creatorRevenueShare Decimal @default(0.7000) @db.Decimal(19, 4)
  totalRevenueEarned  BigInt  @default(0)
  // Security
  phoneNumberHash   String?    @unique  // For lookups
  twoFactorEnabled  Boolean    @default(false)
  // ... 70+ relations
}
```

#### Content Models
- Post, Comment, PostTag, PostSeries, PostRevision
- Poll, PollOption, PollVote, PollVoteChoice
- FanArtGallery, FanArtSubmission
- Category, Tag, PostStats, PostRelation

#### Social Models
- Follow, Block, Mention, Bookmark, BookmarkFolder
- Group, GroupMember, GroupPost, GroupChannel
- Event, EventAttendee
- Conversation, ConversationParticipant, Message, MessageRead

#### Gamification Models
- Achievement, UserAchievement
- Quest, UserQuest
- XpLog, LevelConfig
- UserBalance, CurrencyTransaction
- StoreItem, StoreBundle, UserInventory, Trade

#### YouTube Models
- YoutubeChannel, YoutubeVideo, VideoAnalytics
- WatchParty, WatchPartyParticipant, WatchPartyChat
- VideoClip, Playlist, PlaylistItem
- YouTubeApiQuota

#### AI & Intelligence Models
- AiRecommendation, AiContentSuggestion
- UserAiPreference, AiAssistantConversation
- AiModerationQueue

#### System Models
- Notification, NotificationPreference, NotificationQueue
- Report, ModerationAction, ContentFilter
- AuditLog, ActivityStream, UserActivity
- CacheEntry, SystemHealth, RateLimitTracker
- DataRetentionPolicy, EncryptionKey

### 5.3 Performance Optimizations

#### Strategic Composite Indexes (50+)
```sql
-- User queries (avoid loading all 70+ relations)
@@index([deleted, status, role, lastSeenAt(sort: Desc)])
@@index([role, verified, createdAt(sort: Desc)])

-- Post queries
@@index([authorId, isDraft, createdAt(sort: Desc)])
@@index([contentType, moderationStatus, createdAt(sort: Desc)])

-- Comment queries (5-level nesting support)
@@index([postId, parentId, deleted, createdAt])
@@index([postId, pinned, createdAt(sort: Desc)])
```

#### JSON GIN Indexes (Critical for Performance)
```sql
-- Required manual migrations
CREATE INDEX idx_profile_theme USING GIN (themePreference);
CREATE INDEX idx_post_content USING GIN (content);
CREATE INDEX idx_group_settings USING GIN (settings);
CREATE INDEX idx_event_agenda USING GIN (agenda);
```

### 5.4 API Design

#### tRPC Router Structure
```typescript
export const appRouter = createTRPCRouter({
  auth: authRouter,        // Authentication
  user: userRouter,        // User operations
  post: postRouter,        // Content management
  comment: commentRouter,  // Comment system
  notification: notificationRouter,  // Notifications
  social: socialRouter,    // Following, blocking
  gamification: gamificationRouter, // Achievements, quests
  youtube: youtubeRouter,  // YouTube integration
  ai: aiRouter,           // AI features
  admin: adminRouter,     // Admin operations
});
```

### 5.5 Security Architecture

#### Data Protection
- **Encryption**: AES-256 at rest, TLS 1.3 in transit
- **Soft Deletes**: deleted, deletedAt, deletedBy pattern
- **Version Control**: version field for optimistic locking
- **Author Preservation**: authorName preserved after deletion
- **Audit Trail**: Comprehensive AuditLog model

#### Rate Limiting
- **Comments**: 5 per minute
- **Posts**: 10 per hour
- **API Calls**: 1000 per hour authenticated
- **Login Attempts**: 5 per 15 minutes

---

## 6. Design System & UI/UX

### 6.1 Design Principles

#### 6.1.1 Core Design Philosophy
- **Sparkle-Inspired Aesthetics**: Luminous, dynamic, engaging
- **Dark Mode First**: Optimized for extended viewing
- **Glassmorphism**: Modern translucent effects
- **Micro-interactions**: Delightful animations everywhere
- **Accessible by Default**: WCAG AAA compliance

#### 6.1.2 Visual Language
```css
/* Color System */
--primary: #8B5CF6;      /* Vibrant Purple */
--secondary: #EC4899;    /* Hot Pink */
--accent: #10B981;       /* Emerald */
--sparkle-gradient: linear-gradient(135deg, #8B5CF6, #EC4899, #10B981);

/* Component Variants */
Button: 8 variants (default, destructive, outline, secondary, ghost, link, sparkle, glow)
Badge: Multiple rarities matching achievement system
Cards: Glass morphism with backdrop blur
```

### 6.2 Component Library

Built on shadcn/ui with custom enhancements:
- **SparkleButton**: Gradient effects with particles
- **ReactionPicker**: Animated 9-reaction selector
- **AchievementBadge**: 8 rarity tier designs
- **CommentThread**: 5-level nested display
- **NotificationBell**: Real-time count updates

### 6.3 Mobile Experience

- **Touch Targets**: Minimum 44x44px
- **Swipe Gestures**: Navigation and actions
- **Bottom Navigation**: Thumb-friendly
- **PWA Support**: Offline capabilities
- **Responsive Breakpoints**: Mobile-first approach

---

## 7. Security & Performance

### 7.1 Security Requirements

#### 7.1.1 Authentication Security
- **Password Requirements**: bcrypt hashing, 12+ characters
- **2FA Support**: TOTP with backup codes
- **Session Security**: JWT with refresh tokens
- **Account Lockout**: After 5 failed attempts

#### 7.1.2 Content Security
- **XSS Prevention**: DOMPurify sanitization
- **SQL Injection**: Parameterized queries via Prisma
- **CSRF Protection**: Token validation
- **File Upload**: Virus scanning, type validation

#### 7.1.3 Privacy & Compliance
- **GDPR Compliance**: Data export, right to deletion
- **COPPA Compliance**: Age verification for under 13
- **Data Retention**: Via DataRetentionPolicy model
- **Encryption Keys**: Rotation via EncryptionKey model

### 7.2 Performance Requirements

#### 7.2.1 Response Time Targets
- **Page Load**: < 3s on 3G
- **API Response**: < 100ms p95
- **Database Query**: < 50ms p99
- **WebSocket Latency**: < 50ms
- **Search Results**: < 200ms

#### 7.2.2 Scalability Targets
- **Concurrent Users**: 100,000 simultaneous
- **Database Connections**: 1,000 concurrent
- **WebSocket Connections**: 50,000 concurrent
- **Storage**: Petabyte-scale ready
- **Cache Hit Rate**: > 90%

#### 7.2.3 Availability Targets
- **Uptime SLA**: 99.9% (43.2 minutes/month downtime)
- **Disaster Recovery**: < 1 hour RTO
- **Data Durability**: 99.999999999% (11 9's)
- **Backup Frequency**: Hourly incremental, daily full
- **Geographic Redundancy**: Multi-region deployment

---

## 8. Development Roadmap

### 8.1 Phase 1: Foundation ✅ (Completed)
- [x] Project setup with Next.js 15
- [x] Database schema v4.6 with 126 models
- [x] Authentication system with 5 OAuth providers
- [x] User profiles with 6-tier role system
- [x] Basic UI components (8 button variants)

### 8.2 Phase 2: Content System ✅ (Completed)
- [x] Rich text editor with TipTap
- [x] 9 content types implementation
- [x] Media upload with CDN
- [x] YouTube integration foundation
- [x] Post scheduling via PublishQueue

### 8.3 Phase 3: Engagement Features ✅ (Completed)
- [x] Comment system with 5-level nesting
- [x] 9 reaction types with picker
- [x] 19 notification types
- [x] Real-time updates via Socket.IO
- [x] Mention system with autocomplete
- [ ] Following system (10% complete)
- [ ] Direct messaging (planned)

### 8.4 Phase 4: YouTube Integration ✅ (Completed)
- [ ] YouTube API v3 full integration
- [ ] Watch party implementation
- [ ] Video clip creation tools
- [ ] Channel synchronization
- [ ] Premiere event support

### 8.5 Phase 5: Gamification ✅ (Completed)
- [ ] XP and leveling system
- [ ] 8-tier achievement unlocks
- [ ] Dual-currency marketplace
- [ ] Trading system with escrow
- [ ] Quest system (8 types)

### 8.6 Phase 6: Monetization 📅 (Q2 2025)
- [ ] 4-tier subscription implementation
- [ ] Premium points purchase flow
- [ ] Fan funding system
- [ ] Creator payouts (70% share)
- [ ] Revenue analytics dashboard

### 8.7 Phase 7: AI Features 📅 (Q3 2025)
- [ ] Content recommendations
- [ ] AI moderation enhancement
- [ ] Writing assistant
- [ ] Sentiment analysis
- [ ] Predictive analytics

### 8.8 Phase 8: Mobile & Scale 📅 (Q4 2025)
- [ ] PWA optimization
- [ ] React Native app
- [ ] API v2 with GraphQL
- [ ] International expansion
- [ ] Multi-language support

---

## 9. Success Metrics & KPIs

### 9.1 User Engagement Metrics

#### 9.1.1 Activity Metrics
- **Daily Active Users (DAU)**: Target 30% of total
- **Weekly Active Users (WAU)**: Target 70% of total
- **Session Duration**: Average 15+ minutes
- **Pages per Session**: Average 5+ pages
- **Bounce Rate**: Below 30%

#### 9.1.2 Content Metrics
- **Posts per Day**: 1,000+ at scale
- **Comments per Post**: Average 10+
- **Comment Depth**: Average 2-3 levels
- **Reaction Rate**: 60%+ posts receive reactions
- **Content Quality Score**: 80%+ positive sentiment

### 9.2 Technical Performance Metrics

#### 9.2.1 Site Performance
- **Page Load Time**: < 2 seconds (p75)
- **Time to Interactive**: < 3 seconds
- **Lighthouse Score**: 95+ overall
- **Core Web Vitals**: All green
- **API Response Time**: < 100ms (p95)

#### 9.2.2 Database Performance
- **Query Time**: < 50ms (p95)
- **Connection Pool**: < 80% utilization
- **Cache Hit Rate**: > 90%
- **Index Usage**: > 95%
- **Dead Tuples**: < 10%

### 9.3 Business Metrics

#### 9.3.1 Growth Metrics
- **User Acquisition**: 50% MoM growth
- **User Retention**: 80% 30-day retention
- **Conversion Rate**: 10% to paid tiers
- **ARPU**: $5.00 monthly
- **LTV**: $60.00 average

#### 9.3.2 Revenue Metrics
- **MRR Growth**: 40% MoM
- **Subscription Revenue**: 60% of total
- **Virtual Goods**: 30% of total
- **Creator Fees**: 10% of total
- **Gross Margin**: 70%+

---

## 10. Risk Assessment & Mitigation

### 10.1 Technical Risks

#### 10.1.1 Scalability Challenges
- **Risk**: 70+ relation User model performance
- **Mitigation**: 
  - Strategic composite indexes
  - Selective field loading
  - Query complexity monitoring
  - Read replica deployment

#### 10.1.2 Data Integrity
- **Risk**: Complex 126-model relationships
- **Mitigation**:
  - Foreign key constraints
  - Cascade behaviors defined
  - Soft delete pattern
  - Version control fields

### 10.2 Business Risks

#### 10.2.1 User Adoption
- **Risk**: Slow initial growth
- **Mitigation**:
  - Influencer partnerships
  - Referral system via Referral model
  - SEO optimization
  - Community seeding

#### 10.2.2 Content Moderation
- **Risk**: Harmful content at scale
- **Mitigation**:
  - AI moderation queue
  - 9 report reason types
  - Community moderators
  - Content filters

### 10.3 Operational Risks

#### 10.3.1 YouTube API Limits
- **Risk**: Quota exhaustion
- **Mitigation**:
  - YouTubeApiQuota tracking
  - Intelligent caching
  - Request batching
  - Fallback mechanisms

#### 10.3.2 Financial Precision
- **Risk**: Rounding errors in payments
- **Mitigation**:
  - Decimal(19,4) for money
  - Integer points system
  - Audit trail via CurrencyTransaction
  - Regular reconciliation

---

## 11. Future Enhancements

### 11.1 Year 2 Roadmap (2026)

#### 11.1.1 Advanced Features
- **Voice/Video Chat**: WebRTC integration
- **Live Streaming**: Native broadcasting
- **AR Features**: Camera filters and effects
- **Machine Learning**: On-device recommendations
- **Blockchain Integration**: Decentralized identity (evaluation phase)

#### 11.1.2 Platform Expansion
- **Mobile Native Apps**: iOS/Android
- **Desktop Application**: Electron-based
- **Browser Extension**: Enhanced YouTube integration
- **API Marketplace**: Third-party developers
- **White-label Solution**: B2B offering

### 11.2 Year 3 Vision (2027)

#### 11.2.1 Metaverse Integration
- **VR Spaces**: Virtual community meetups
- **3D Avatars**: Customizable representations
- **Spatial Audio**: Immersive chat
- **Virtual Events**: Concerts and gatherings
- **Digital Goods**: Cross-platform items

#### 11.2.2 AI Evolution
- **Predictive Content**: AI-generated posts
- **Personal Assistants**: User-specific bots
- **Advanced Translation**: Real-time voice
- **Behavioral Analytics**: Churn prevention
- **Content Creation**: AI-assisted tools

---

## 12. Appendices

### 12.1 Glossary

- **sparklePoints**: Integer-based earned virtual currency
- **premiumPoints**: Integer-based purchased virtual currency
- **experience**: User XP field (not xp_points)
- **VERIFIED_CREATOR**: Enhanced creator role with monetization
- **SYSTEM**: Automated user role for bot operations
- **Decimal(19,4)**: PostgreSQL type for financial precision
- **BigInt**: Large integer type for revenue tracking

### 12.2 Technical Specifications

#### 12.2.1 Browser Support
- Chrome 90+ (85% users)
- Safari 14+ (10% users)
- Firefox 88+ (3% users)
- Edge 90+ (2% users)

#### 12.2.2 Database Configuration
- PostgreSQL 16 with extensions
- pgcrypto for encryption
- pg_trgm for fuzzy search
- JSON GIN indexes required
- Connection pooling via PgBouncer

### 12.3 API Rate Limits

```javascript
const RATE_LIMITS = {
  api: {
    authenticated: 1000,   // per hour
    unauthenticated: 100,  // per hour
  },
  content: {
    posts: 10,            // per hour
    comments: 5,          // per minute (300/hour)
    reactions: 100,       // per hour
  },
  auth: {
    login: 5,            // per 15 minutes
    register: 3,         // per hour
    passwordReset: 3,    // per hour
  }
};
```

### 12.4 Currency Conversion Rates

```javascript
const CURRENCY_CONFIG = {
  // Point conversions
  USD_TO_PREMIUM: 100,         // $1 = 100 premiumPoints
  SPARKLE_TO_PREMIUM: 1000,    // 1000 sparklePoints = 1 premiumPoint
  
  // Platform fees
  PLATFORM_FEE: 0.30,          // 30% platform fee
  CREATOR_SHARE: 0.70,         // 70% creator share (0.7000 in DB)
  
  // Thresholds
  MIN_PAYOUT: 10.00,           // $10 minimum payout
  MIN_TIP: 0.50,               // $0.50 minimum tip
};
```

### 12.5 Model Count Summary

| Category | Count | Key Models |
|----------|-------|------------|
| Core User & Auth | 12 | User, Profile, Account, Session |
| Content | 18 | Post, Comment, Tag, Category |
| Social | 22 | Follow, Group, Event, Message |
| Gamification | 14 | Achievement, Quest, Trade |
| YouTube | 9 | YoutubeChannel, WatchParty |
| Monetization | 7 | FanFunding, CreatorPayout |
| AI & Intelligence | 4 | AiRecommendation, AiModerationQueue |
| Notifications | 3 | Notification, NotificationPreference |
| System & Admin | 20 | AuditLog, SystemHealth, FeatureFlag |
| Real-time | 7 | WebsocketSession, ChatRoom |
| Analytics | 6 | ActivityStream, UserActivity |
| Moderation | 4 | Report, ContentFilter |
| **Total** | **126** | Complete v4.6 Schema |

### 12.6 Contact Information

- **Project Repository**: [GitHub - Sparkle Universe](https://github.com/nordeim/Sparkle-Universe-Next)
- **Documentation**: Internal project documentation
- **Schema Version**: 4.6 (Performance Optimization Release)
