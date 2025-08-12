# Sparkle Universe Next.js Project Guide

## 🌟 Project Overview

**Sparkle Universe** is a next-generation community platform designed exclusively for Sparkle YouTube fans. It combines blog forum functionality, social networking, YouTube integration, advanced gamification, and AI-powered features to create an immersive digital ecosystem.

### 🎯 Core Purpose
- **Primary Goal**: Premier global destination for Sparkle YouTube fans
- **Target Users**: 13–35-year-old content creators and fans
- **Key Differentiators**: YouTube-native integration, real-time features, AI intelligence, advanced gamification

---

## 🏗️ Technical Architecture

### Tech Stack
```

Frontend: Next.js 15 + TypeScript 5 + Tailwind CSS 3 + Radix UI
Backend: PostgreSQL 16 + Prisma ORM + tRPC
Real-time: Socket.io + Redis
Background Jobs: BullMQ
Infrastructure: Vercel Edge Functions + Cloudflare CDN
AI/ML: OpenAI API + TensorFlow\.js

```

### Key Technologies
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5 with strict mode and `noUncheckedIndexedAccess`
- **Styling**: Tailwind CSS 3 with a custom design system + Radix UI components
- **Database**: PostgreSQL 16 with advanced indexing, full-text search, and pgcrypto for encryption
- **Database Extensions**: `pg_trgm` for fuzzy search, `pgcrypto` for encryption
- **ORM**: Prisma with custom middleware for soft deletes and optimistic locking
- **API**: tRPC for end-to-end type-safe APIs
- **Authentication**: NextAuth.js v5 with multi-provider OAuth and Prisma adapter
- **Real-time**: Socket.io with Redis adapter for horizontal scaling
- **Background Jobs**: BullMQ for processing intensive tasks (email, video processing, content moderation)
- **State Management**: Zustand (client state) + React Query (server state)
- **UI Components**: shadcn/ui + custom Sparkle theme
- **Caching**: Redis integration for performance
- **File Uploads**: AWS S3 with CloudFront CDN
- **Rate Limiting**: Redis-backed rate limiting

---

## 📁 Project Structure

```

Sparkle-Universe-Next/
├── src/
│   ├── app/                  # Next.js App Router (Pages & Layouts)
│   │   ├── (auth)/           # Auth routes (login, register)
│   │   ├── (main)/           # Main application routes
│   │   └── api/              # API routes (NextAuth, tRPC, OpenAPI)
│   ├── components/           # Reusable React components
│   │   ├── ui/               # Base shadcn/ui components
│   │   ├── features/         # Components for specific features
│   │   └── shared/           # Shared components
│   ├── lib/                  # Core libraries, utilities, and configs
│   │   ├── auth/             # Auth configuration and helpers
│   │   ├── jobs/             # BullMQ job definitions and processors
│   │   ├── socket/           # Socket.IO server setup
│   │   └── validations/      # Zod validation schemas
│   ├── server/               # Server-side code
│   │   ├── api/              # tRPC routers and root configuration
│   │   └── services/         # Core business logic (service layer)
│   ├── hooks/                # Custom React hooks
│   ├── types/                # Global TypeScript definitions
│   └── services/             # Client-side service integrations
├── prisma/                   # Prisma schema, migrations, seed scripts
├── public/                   # Static assets
├── docs/                     # Additional documentation
└── scripts/                  # Build and utility scripts

````

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20.0.0+
- npm 10.0.0+
- PostgreSQL 16+
- Redis
- AWS S3 bucket for file storage

### Installation
```bash
git clone <repository-url>
cd Sparkle-Universe-Next
npm install
````

### Environment Setup

```bash
cp .env.example .env.local
# Edit with database, auth, API keys, and storage credentials
```

**Required Variables:**

```
DATABASE_URL="postgresql://user:pass@localhost:5432/sparkle_universe"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret"
REDIS_URL="redis://localhost:6379"
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_S3_BUCKET="..."
YOUTUBE_API_KEY="..."
OPENAI_API_KEY="..."
```

### Database

```bash
npm run db:migrate
npm run db:seed   # optional
```

### Start Development

```bash
npm run dev
```

---

## 🗄️ Database Schema (`prisma/schema.prisma`)

### Key Architectural Patterns

* **Soft Deletes**: Middleware intercepts delete operations and replaces them with timestamp updates.
* **Optimistic Locking**: Version field to avoid concurrent update conflicts.
* **JSON Fields + GIN Indexes**: For flexible metadata with performant querying.

### Core Domains

* **User & Auth**: User, Profile, Account, Session, Stats, Balances, Follows, Blocks
* **Content**: Post, Comment, Category, Tag, Reaction, Revision, Series
* **Gamification**: Achievement, Quest, Leaderboard
* **Economy**: Store Items, Inventory, Trades, Transactions
* **YouTube Integration**: Channels, Videos, Watch Parties, Clips, Playlists
* **Social**: Groups, Events, Conversations, Messages
* **Moderation**: Reports, AI moderation queue, Audit logs

---

## ⚙️ Backend Architecture

### tRPC API Layer

* Domain-specific routers
* Procedure types: public, protected, admin
* Middleware for auth, rate limiting, logging

### Service Layer

* Encapsulates domain business logic
* Decoupled from API for reuse/testing

### Background Jobs

* BullMQ queues for email, notifications, processing, moderation
* Redis backend

### Real-time System

* Socket.IO with Redis adapter for scaling
* Room-based communication for targeted events

---

## 🎮 Gamification System

*(Restored from original — still relevant)*

* **XP Sources**: Posts, comments, likes
* **Rewards**: Feature unlocks, badges, currency
* **Marketplace**: Virtual goods, profile themes
* **Achievements**: Multiple rarity tiers, seasonal events

---

## 📱 Features Overview

*(Restored — non-conflicting)*

* Rich content creation with YouTube integration
* Real-time chat
* Watch parties
* Video clips
* Collaborative editing
* Following, DMs, groups, events
* Creator monetization tools
* AI-powered recommendations, moderation, sentiment analysis

---

## 🎨 Design System

*(Restored)*

* **Theme**: Dark mode first, Sparkle-inspired
* **Colors**: Purple #8B5CF6, Pink #EC4899, Emerald #10B981
* **Typography**: Inter + Sparkle font
* **Effects**: Glassmorphism, particles, glow

---

## 🔧 Development Workflow

**Scripts**

```bash
npm run dev
npm run build
npm run start
npm run type-check
npm run lint
npm run lint:fix
npm run test
npm run test:e2e
npm run test:coverage
npm run db:generate
npm run db:migrate
npm run db:push
npm run db:seed
npm run db:studio
```

**Git Workflow**

* Feature branches: `feature/your-feature`
* Conventional commits
* PRs require review + passing CI
* Semantic versioning

---

## 📊 Performance & Monitoring

*(Restored condensed version)*

* Targets: <2s load on 3G, 95+ Lighthouse score
* Tools: Sentry, Vercel Analytics
* DB monitoring, uptime alerts
* Strategies: code splitting, image optimization, caching

---

## 🔐 Security & Privacy

* MFA, RBAC, GDPR/COPPA compliance
* Soft deletes for recovery
* Input sanitization
* Rate limiting

---

## 🚀 Deployment

*(Restored condensed version)*

* Hosting: Vercel + edge network
* DB: Postgres with replicas
* Cache: Redis
* Storage: AWS S3 + CDN

---

## 📈 Analytics

*(Restored condensed version)*

* Engagement metrics
* Content performance
* Technical metrics
* A/B testing support

---

## 🆘 Troubleshooting

* DB connection errors: check `DATABASE_URL`
* Auth issues: verify credentials
* Performance: review indexes & queries

---

**Welcome to Sparkle Universe! ✨**

