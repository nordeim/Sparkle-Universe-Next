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

### Gamification & Economy
- **XP & Levels**: Progress through engagement
- **Achievements**: 100+ unlockable badges across 5 rarity tiers
- **Virtual Currency**: Sparkle Points (earned) & Gems (premium)
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
  validation: "Zod 3.22.4" /* Runtime type validation */
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
    
    USER --> PG
    CONTENT --> PG
    SOCIAL --> REDIS
    GAME --> PG
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

# OAuth Providers (configured in auth.config.ts)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

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

# Application URLs
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_WS_URL="ws://localhost:3000"

# Feature Flags
NEXT_PUBLIC_ENABLE_YOUTUBE="true"
NEXT_PUBLIC_ENABLE_WEBSOCKET="true"
NEXT_PUBLIC_ENABLE_PWA="false"

# Security
ENCRYPTION_KEY="generate-32-byte-hex-key"
JWT_SECRET="another-secret-key"

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

# Seed database (development only)
npm run db:seed

# Open Prisma Studio (GUI)
npm run db:studio
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
│   ├── schema.prisma           # Database schema
│   ├── migrations/             # Migration files
│   └── seed.ts                 # Seed script
│
├── public/                      # Static assets
├── tests/                       # Test files
└── package.json                # Dependencies & scripts
```

---

## 🗄️ Database Architecture

### Schema Implementation (from schema.prisma)

The database uses PostgreSQL with Prisma ORM, implementing:

1. **Soft Deletes**: `deletedAt` timestamp field
2. **Optimistic Locking**: `version` field for concurrent updates
3. **User Roles**: Enum-based role system (USER, CREATOR, VERIFIED_CREATOR, MODERATOR, ADMIN)
4. **Status Management**: Account status tracking (ACTIVE, SUSPENDED, BANNED)

### Core Models

- **User**: Authentication and basic profile
- **Profile**: Extended user information
- **Post**: Content with JSONB for rich text
- **Comment**: Nested commenting system
- **Follow/Block**: Social relationships
- **Notification**: Real-time notifications
- **Achievement/UserAchievement**: Gamification
- **UserBalance**: Virtual currency tracking

---

## 🔌 API & tRPC Conventions

### Authentication Implementation

Based on the implemented auth system:

```typescript
// Available auth methods (from auth.config.ts)
- Google OAuth
- GitHub OAuth  
- Credentials (email/password)

// Session management
- JWT strategy with 30-day expiration
- Role-based access control
- Automatic last seen tracking
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
```

### Client-side Auth Hook (from use-auth.ts)

```typescript
// useAuth hook provides:
- user data
- session info
- login/logout methods
- role checking
- loading states
```

---

## ⚡ Real-time & Background Jobs

### Socket.IO Configuration

```typescript
// Socket.IO 4.7.4 implementation
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';

// Real-time features:
- Live chat
- Presence indicators  
- Typing indicators
- Real-time notifications
- Watch parties
```

### Redis Integration

Using `ioredis 5.3.2` for:
- Session storage
- Cache layer
- Rate limiting
- Socket.IO adapter
- Pub/Sub messaging

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
```

### Theme Configuration

Based on Tailwind CSS 3.4.1 with:
- Custom color palette (primary, secondary, accent)
- Glassmorphism effects
- Dark mode support
- Responsive design system
- Animation utilities via `tailwindcss-animate`

---

## 🎮 Gamification System

### XP & Leveling (from PRD alignment)

```typescript
// XP rewards as per PRD:
const XP_REWARDS = {
  POST_CREATE: 10,        // Create a post
  COMMENT_CREATE: 5,      // Add a comment  
  QUALITY_POST_BONUS: 50, // High engagement bonus
  HELPFUL_COMMENT: 20,    // Helpful comment bonus
  DAILY_LOGIN: 10,        // Daily login reward
};

// Level calculation
const calculateLevel = (xp: number): number => {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
};
```

### Achievement System

Database models support:
- Multiple rarity tiers (COMMON, RARE, EPIC, LEGENDARY, MYTHIC)
- XP rewards per achievement
- Icon and description storage
- User progress tracking

### Virtual Economy

```typescript
// Currency system (from schema)
- sparklePoints: Earned through activity
- gems: Premium currency

// Conversion rate (PRD):
100 Gems = $1.00 USD
```

---

## 🔐 Security & Privacy

### Implemented Security Features

Based on auth implementation:

- **Authentication**: NextAuth v5 with OAuth and credentials
- **Session Management**: JWT with 30-day expiration
- **Password Security**: bcrypt hashing
- **Role-Based Access**: 5-tier role system
- **Account Status**: Ban/suspension support
- **CSRF Protection**: Built into NextAuth
- **Input Validation**: Zod schemas throughout

### Privacy Features

- **Soft Deletes**: Data recovery capability
- **Profile Privacy**: Public/private settings
- **Block System**: User blocking functionality
- **Data Minimization**: Only essential data collected

---

## 📊 Performance & Monitoring

### Performance Targets (PRD Aligned)

- **Page Load**: < 3s on 3G connection
- **API Response**: < 100ms (p95)
- **Core Web Vitals**:
  - LCP: < 2.5s
  - FID: < 100ms  
  - CLS: < 0.1
- **Lighthouse Score**: 95+ overall

### Monitoring Stack

Currently implemented:
- Vercel Analytics
- Vercel Speed Insights
- TypeScript strict mode for compile-time safety
- React Query DevTools for debugging

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

### Test Commands

```bash
npm run test           # Unit tests with Jest
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report
npm run test:e2e       # Playwright E2E tests
```

---

## 🚢 Deployment

### Vercel Deployment

Optimized for Vercel with:
- Edge Functions support
- Automatic preview deployments
- Environment variable management
- Analytics integration

### Production Checklist

- [ ] Set production environment variables
- [ ] Run database migrations: `npm run db:migrate:prod`
- [ ] Configure OAuth redirect URLs
- [ ] Set up Redis for production
- [ ] Enable monitoring services
- [ ] Configure rate limiting
- [ ] Set up backup strategy

---

## 💰 Business Model

### Subscription Tiers (from PRD)

1. **Free Tier**
   - Core features with limitations
   - Ad-supported

2. **Sparkle Plus** ($4.99/month)
   - Enhanced features
   - No advertisements
   - Priority support

3. **Sparkle Pro** ($9.99/month)
   - Creator tools
   - Advanced analytics
   - Monetization features

### Virtual Economy

- **Sparkle Points**: Earned through engagement
- **Gems**: Premium currency (100 Gems = $1)
- **Marketplace**: Virtual goods and themes
- **Creator Fund**: $100K monthly distribution target

### Revenue Targets (PRD)

- **ARPU**: $5 monthly
- **Premium Conversion**: 10% of active users
- **Virtual Goods Revenue**: $2 per user average

---

## 📈 Roadmap

### Phase 1: Foundation ✅ (Months 1-2)
- [x] Project setup with Next.js 15
- [x] Database schema with Prisma
- [x] Authentication system (NextAuth v5)
- [x] Basic user profiles
- [x] UI component library (shadcn/ui)
- [ ] Rich text editor (TipTap)
- [ ] Post creation and display
- [ ] Comment system
- [ ] Search implementation

### Phase 2: Social Features 🚧 (Months 3-4)
- [ ] Following system
- [ ] Direct messaging
- [ ] Notifications
- [ ] Activity feeds
- [ ] Socket.IO integration
- [ ] Real-time presence

### Phase 3: YouTube Integration 📅 (Months 5-6)
- [ ] YouTube API integration
- [ ] Video metadata fetching
- [ ] Timestamp discussions
- [ ] Watch parties
- [ ] Creator analytics

### Phase 4: Gamification 📅 (Months 7-8)
- [ ] XP and leveling system
- [ ] Achievement unlocks
- [ ] Virtual currency
- [ ] Marketplace
- [ ] Leaderboards

### Phase 5: AI & Advanced Features 📅 (Months 9-10)
- [ ] Content recommendations
- [ ] Auto-moderation
- [ ] Writing assistant
- [ ] Admin dashboard
- [ ] A/B testing framework

### Phase 6: Mobile & Expansion 📅 (Months 11-12)
- [ ] PWA optimization
- [ ] Mobile app
- [ ] API ecosystem
- [ ] International expansion

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
```

#### TypeScript Errors
```bash
# Check for type errors
npm run type-check

# Clear Next.js cache
rm -rf .next
npm run dev
```

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Process

1. Fork the repository
2. Create a feature branch (`feature/amazing-feature`)
3. Commit with conventional commits (`feat:`, `fix:`, `docs:`)
4. Ensure tests pass (`npm run test`)
5. Open a Pull Request

### Code Standards

- **TypeScript**: Strict mode enabled
- **Linting**: ESLint + Prettier enforced
- **Testing**: Maintain coverage
- **Commits**: Conventional format
- **Reviews**: Required before merge

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔗 Links & Resources

- **Documentation**: [/docs](./docs)
- **Issues**: [GitHub Issues](https://github.com/nordeim/Sparkle-Universe-Next/issues)
- **Discussions**: [GitHub Discussions](https://github.com/nordeim/Sparkle-Universe-Next/discussions)

---

<p align="center">
  <strong>Built with ❤️ by the Sparkle Universe Team</strong>
  <br>
  <sub>Making the YouTube fan experience magical, one feature at a time ✨</sub>
</p>
