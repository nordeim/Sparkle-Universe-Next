<!-- Path: README.md -->
# Sparkle Universe — Next.js Community Platform

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]() [![License](https://img.shields.io/badge/license-MIT-blue)]() [![Vercel](https://img.shields.io/badge/deploy-vercel-black)]() [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)]() [![Next.js](https://img.shields.io/badge/Next.js-15-black)]()

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
* [🤝 Contributing](#-contributing)
* [📄 License](#-license)

---

## 🌟 About & Vision

**Sparkle Universe** is the definitive digital ecosystem for Sparkle's YouTube community, designed to transcend traditional forum platforms by creating an immersive, gamified, and AI-enhanced experience that brings fans and creators together in meaningful ways.

### 🎯 Core Mission
- **Primary Goal**: Become the premier global destination for Sparkle YouTube fans
- **Target Audience**: Content creators and fans aged 13–35
- **Unique Value**: Deep YouTube integration, real-time features, AI intelligence, and comprehensive gamification

### 🏆 Key Differentiators
- **YouTube-Native**: Timestamp discussions, automated metadata, watch parties, clip creation
- **Real-time First**: Live chat, presence indicators, collaborative editing, instant notifications
- **AI-Powered**: Content recommendations, auto-moderation, sentiment analysis, writing assistance
- **Gamified Experience**: XP system, achievements, virtual economy, seasonal events
- **Creator-Centric**: Analytics dashboard, monetization tools, content calendar, fan insights

---

## ✨ Key Features

### Content & Creation
- **Rich Post Editor**: WYSIWYG with Markdown support, media embeds, code blocks
- **Series & Collections**: Organize content into structured narratives
- **Collaborative Editing**: Real-time multi-user document editing
- **Version Control**: Post revision history with diff viewing

### YouTube Integration
- **Auto-Metadata**: Automatic video information fetching
- **Timestamp Discussions**: Comment on specific video moments
- **Watch Parties**: Synchronized viewing with chat
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
- **Achievements**: 100+ unlockable badges
- **Virtual Currency**: Sparkle Points & Gems system
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

### Core Tech Stack

```typescript
// Frontend Stack
const frontend = {
  framework: "Next.js 15.0" /* App Router, Server Components */,
  language: "TypeScript 5.0" /* Strict mode, noUncheckedIndexedAccess */,
  styling: "Tailwind CSS 3.4" /* JIT, custom design tokens */,
  components: "shadcn/ui + Radix UI" /* Accessible primitives */,
  state: {
    client: "Zustand 4.5" /* Lightweight, TypeScript-first */,
    server: "TanStack Query 5.0" /* Powerful data synchronization */
  },
  editor: "TipTap 2.0" /* Extensible rich text */,
  animations: "Framer Motion 11" /* Smooth interactions */
};

// Backend Stack
const backend = {
  database: "PostgreSQL 16" /* JSONB, GIN indexes, pg_trgm, pgcrypto */,
  orm: "Prisma 5.0" /* Type-safe database access */,
  api: "tRPC 11.0" /* End-to-end type safety */,
  cache: "Redis 7.2" /* Sessions, rate limiting, pub/sub */,
  queue: "BullMQ 5.0" /* Reliable job processing */,
  realtime: "Socket.IO 4.7" /* WebSocket with fallbacks */,
  storage: "AWS S3 + CloudFront" /* Scalable media delivery */,
  ai: "OpenAI API + TensorFlow.js" /* Hybrid AI approach */
};

// Infrastructure
const infrastructure = {
  hosting: "Vercel" /* Edge functions, automatic scaling */,
  cdn: "Cloudflare" /* Global distribution, DDoS protection */,
  monitoring: ["Sentry", "Vercel Analytics", "Datadog"],
  ci: "GitHub Actions" /* Automated testing and deployment */
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
        REST[REST Endpoints]
        WS[WebSocket Gateway]
    end
    
    subgraph "Service Layer"
        AUTH[Auth Service]
        CONTENT[Content Service]
        SOCIAL[Social Service]
        GAME[Gamification Service]
        YT[YouTube Service]
        AI[AI Service]
    end
    
    subgraph "Data Layer"
        PG[(PostgreSQL)]
        REDIS[(Redis)]
        S3[(S3 Storage)]
    end
    
    subgraph "Background"
        QUEUE[BullMQ Workers]
        CRON[Scheduled Jobs]
    end
    
    WEB --> TRPC
    PWA --> TRPC
    MOBILE --> TRPC
    WEB --> WS
    
    TRPC --> AUTH
    TRPC --> CONTENT
    TRPC --> SOCIAL
    TRPC --> GAME
    TRPC --> YT
    
    AUTH --> PG
    CONTENT --> PG
    SOCIAL --> REDIS
    GAME --> PG
    YT --> REDIS
    AI --> QUEUE
    
    QUEUE --> PG
    CRON --> QUEUE
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: 20.0.0+ (LTS recommended)
- **npm**: 10.0.0+ (or yarn/pnpm)
- **PostgreSQL**: 16+ with extensions
- **Redis**: 7.0+ (or Docker)
- **AWS**: S3 credentials for media storage

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

Create `.env.local` with the following configuration:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/sparkle_universe"
DATABASE_URL_NON_POOLING="postgresql://user:password@localhost:5432/sparkle_universe"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Redis
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD="" # If applicable

# AWS Storage
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_S3_BUCKET="sparkle-universe-dev"
AWS_CLOUDFRONT_URL="https://cdn.sparkle-universe.com"

# External APIs
YOUTUBE_API_KEY="your-youtube-api-key"
OPENAI_API_KEY="your-openai-api-key"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
DISCORD_CLIENT_ID="your-discord-client-id"
DISCORD_CLIENT_SECRET="your-discord-client-secret"

# Security
SESSION_SECRET="generate-random-string"
ENCRYPTION_KEY="32-character-key"

# Feature Flags
ENABLE_AI_FEATURES="true"
ENABLE_REAL_TIME="true"
ENABLE_GAMIFICATION="true"

# Monitoring
SENTRY_DSN="your-sentry-dsn"
VERCEL_ANALYTICS_ID="your-analytics-id"
```

### Database Setup

```bash
# Install PostgreSQL extensions
psql -U postgres -d sparkle_universe -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
psql -U postgres -d sparkle_universe -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
psql -U postgres -d sparkle_universe -c "CREATE EXTENSION IF NOT EXISTS uuid-ossp;"

# Run migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Seed database (development only)
npm run db:seed

# Open Prisma Studio (GUI)
npm run db:studio
```

### Development Scripts

```bash
# Development
npm run dev              # Start Next.js dev server
npm run dev:worker       # Start background workers
npm run dev:socket       # Start Socket.IO server

# Database
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Run migrations
npm run db:migrate:dev   # Create new migration
npm run db:push          # Push schema changes (dev only)
npm run db:seed          # Seed sample data
npm run db:reset         # Reset database
npm run db:studio        # Open Prisma Studio

# Testing
npm run test             # Run unit tests
npm run test:watch       # Watch mode
npm run test:e2e         # End-to-end tests
npm run test:coverage    # Coverage report

# Code Quality
npm run lint             # ESLint check
npm run lint:fix         # Auto-fix issues
npm run type-check       # TypeScript validation
npm run format           # Prettier formatting

# Build & Production
npm run build            # Production build
npm run start            # Start production server
npm run analyze          # Bundle analysis
```

---

## 📁 Project Structure

```
Sparkle-Universe-Next/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/              # Authentication routes
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── reset-password/
│   │   ├── (main)/              # Main application
│   │   │   ├── dashboard/
│   │   │   ├── posts/
│   │   │   ├── youtube/
│   │   │   ├── profile/
│   │   │   └── settings/
│   │   ├── api/                 # API endpoints
│   │   │   ├── auth/[...nextauth]/
│   │   │   ├── trpc/[trpc]/
│   │   │   └── webhooks/
│   │   └── layout.tsx           # Root layout
│   │
│   ├── components/              # React components
│   │   ├── ui/                 # Base UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   └── dialog.tsx
│   │   ├── features/           # Feature components
│   │   │   ├── post-editor/
│   │   │   ├── youtube-player/
│   │   │   ├── gamification/
│   │   │   └── chat/
│   │   └── shared/             # Shared components
│   │       ├── navbar.tsx
│   │       ├── footer.tsx
│   │       └── sidebar.tsx
│   │
│   ├── server/                  # Server-side code
│   │   ├── api/                # tRPC routers
│   │   │   ├── routers/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── post.ts
│   │   │   │   ├── youtube.ts
│   │   │   │   └── gamification.ts
│   │   │   └── root.ts         # Root router
│   │   └── services/           # Business logic
│   │       ├── auth.service.ts
│   │       ├── content.service.ts
│   │       ├── youtube.service.ts
│   │       └── ai.service.ts
│   │
│   ├── lib/                     # Core libraries
│   │   ├── auth/               # Authentication
│   │   ├── db.ts               # Prisma client
│   │   ├── redis.ts            # Redis client
│   │   ├── jobs/               # Background jobs
│   │   ├── socket/             # Socket.IO
│   │   ├── validations/        # Zod schemas
│   │   └── utils/              # Utilities
│   │
│   ├── hooks/                   # Custom React hooks
│   ├── types/                   # TypeScript types
│   ├── styles/                  # Global styles
│   └── config/                  # Configuration
│
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── migrations/             # Migration files
│   └── seed.ts                 # Seed script
│
├── public/                      # Static assets
├── tests/                       # Test files
├── docs/                        # Documentation
└── scripts/                     # Utility scripts
```

---

## 🗄️ Database Architecture

### Schema Design Principles

1. **Soft Deletes**: All deletions are soft (marked with `deletedAt` timestamp)
2. **Optimistic Locking**: `version` field prevents concurrent update conflicts
3. **JSONB Fields**: Flexible metadata with GIN indexes for performance
4. **Full-Text Search**: PostgreSQL `pg_trgm` for fuzzy search
5. **Encryption**: Sensitive data encrypted with `pgcrypto`

### Core Models

```prisma
// Example: User model with advanced patterns
model User {
  id            String    @id @default(cuid())
  email         String    @unique @db.VarChar(255)
  username      String    @unique @db.VarChar(30)
  passwordHash  String?   @db.Text
  
  // Profile
  profile       Profile?
  
  // Metadata
  metadata      Json      @default("{}") @db.JsonB
  settings      Json      @default("{}") @db.JsonB
  
  // Gamification
  xp            Int       @default(0)
  level         Int       @default(1)
  balance       Balance?
  
  // Timestamps
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?
  lastActiveAt  DateTime?
  
  // Versioning
  version       Int       @default(1)
  
  // Indexes
  @@index([email])
  @@index([username])
  @@index([createdAt])
  @@index([deletedAt])
}
```

### Database Middleware

```typescript
// src/lib/db.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Soft delete middleware
prisma.$use(async (params, next) => {
  if (params.action === 'delete') {
    params.action = 'update';
    params.args['data'] = { deletedAt: new Date() };
  }
  
  if (params.action === 'deleteMany') {
    params.action = 'updateMany';
    params.args['data'] = { deletedAt: new Date() };
  }
  
  return next(params);
});

// Optimistic locking middleware
prisma.$use(async (params, next) => {
  if (params.action === 'update') {
    params.args.data.version = { increment: 1 };
  }
  
  return next(params);
});

export { prisma };
```

### Performance Optimizations

```sql
-- GIN indexes for JSONB fields
CREATE INDEX idx_user_metadata ON "User" USING GIN (metadata);
CREATE INDEX idx_post_content ON "Post" USING GIN (content);

-- Full-text search indexes
CREATE INDEX idx_post_search ON "Post" USING GIN (
  to_tsvector('english', title || ' ' || content)
);

-- Fuzzy search with pg_trgm
CREATE INDEX idx_user_username_trgm ON "User" USING GIN (username gin_trgm_ops);
```

---

## 🔌 API & tRPC Conventions

### Router Organization

```typescript
// src/server/api/root.ts
export const appRouter = createTRPCRouter({
  auth: authRouter,
  user: userRouter,
  post: postRouter,
  comment: commentRouter,
  youtube: youtubeRouter,
  gamification: gamificationRouter,
  social: socialRouter,
  admin: adminRouter,
  analytics: analyticsRouter,
});
```

### Procedure Types

```typescript
// Public procedure - no auth required
export const publicProcedure = t.procedure;

// Protected procedure - requires authentication
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

// Admin procedure - requires admin role
export const adminProcedure = t.procedure.use(enforceUserIsAdmin);
```

### Error Handling

```typescript
// Standardized error responses
throw new TRPCError({
  code: 'UNAUTHORIZED',
  message: 'You must be logged in to perform this action',
  cause: {
    userId: ctx.session?.user?.id,
    action: 'CREATE_POST',
  },
});
```

### Input Validation

```typescript
// Using Zod for runtime validation
const createPostInput = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(50000),
  categoryId: z.string().cuid(),
  tags: z.array(z.string()).max(10).optional(),
  metadata: z.record(z.any()).optional(),
});
```

---

## ⚡ Real-time & Background Jobs

### Socket.IO Configuration

```typescript
// src/lib/socket/server.ts
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { authenticate } from './middleware';

const io = new Server({
  cors: {
    origin: process.env.NEXTAUTH_URL,
    credentials: true,
  },
  adapter: createAdapter(pubClient, subClient),
});

// Authentication middleware
io.use(authenticate);

// Room management
io.on('connection', (socket) => {
  // User-specific room
  socket.join(`user:${socket.userId}`);
  
  // Feature rooms
  socket.on('join:post', (postId) => {
    socket.join(`post:${postId}`);
  });
  
  socket.on('join:watchParty', (partyId) => {
    socket.join(`party:${partyId}`);
  });
});
```

### BullMQ Job Queues

```typescript
// src/lib/jobs/queues.ts
export const queues = {
  email: new Queue('email', { connection: redis }),
  notification: new Queue('notification', { connection: redis }),
  imageProcessing: new Queue('image-processing', { connection: redis }),
  youtubeSync: new Queue('youtube-sync', { connection: redis }),
  moderation: new Queue('moderation', { connection: redis }),
  analytics: new Queue('analytics', { connection: redis }),
};

// Worker example
new Worker('email', async (job) => {
  const { to, subject, template, data } = job.data;
  await sendEmail({ to, subject, template, data });
}, {
  connection: redis,
  concurrency: 5,
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 500 },
});
```

---

## 🎨 Design System

### Theme Configuration

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#8B5CF6', // Purple
          50: '#F5F3FF',
          // ... full scale
        },
        accent: {
          DEFAULT: '#EC4899', // Pink
          // ... full scale
        },
        success: '#10B981', // Emerald
        warning: '#F59E0B', // Amber
        error: '#EF4444',   // Red
      },
      animation: {
        'sparkle': 'sparkle 2s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('tailwindcss-animate'),
  ],
};
```

### Component Tokens

```typescript
// src/design-tokens/index.ts
export const tokens = {
  // Spacing
  spacing: {
    xs: '0.5rem',   // 8px
    sm: '1rem',     // 16px
    md: '1.5rem',   // 24px
    lg: '2rem',     // 32px
    xl: '3rem',     // 48px
  },
  
  // Typography
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui'],
      display: ['Sparkle', 'Inter'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
  },
  
  // Effects
  effects: {
    glassmorphism: {
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    },
    glow: {
      boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)',
    },
  },
};
```

---

## 🎮 Gamification System

### XP & Leveling

```typescript
// XP calculation formula
const calculateLevel = (xp: number): number => {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
};

const xpToNextLevel = (currentLevel: number): number => {
  return Math.pow(currentLevel, 2) * 100;
};

// XP rewards
export const XP_REWARDS = {
  POST_CREATE: 50,
  POST_LIKE_RECEIVED: 10,
  COMMENT_CREATE: 20,
  COMMENT_HELPFUL: 15,
  DAILY_LOGIN: 25,
  STREAK_BONUS: 100,
  ACHIEVEMENT_UNLOCK: 200,
};
```

### Achievement System

```typescript
// Achievement definitions
export const achievements = [
  {
    id: 'first_post',
    name: 'First Steps',
    description: 'Create your first post',
    icon: '✍️',
    xp: 100,
    rarity: 'common',
  },
  {
    id: 'viral_post',
    name: 'Going Viral',
    description: 'Get 1000 likes on a single post',
    icon: '🔥',
    xp: 1000,
    rarity: 'legendary',
  },
  // ... more achievements
];
```

### Virtual Economy

```typescript
// Currency system
interface Balance {
  sparklePoints: number;  // Earned through activity
  gems: number;           // Premium currency
}

// Store items
interface StoreItem {
  id: string;
  name: string;
  description: string;
  cost: {
    sparklePoints?: number;
    gems?: number;
  };
  type: 'theme' | 'badge' | 'effect' | 'boost';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}
```

---

## 🔐 Security & Privacy

### Authentication & Authorization

- **Multi-Factor Authentication (MFA)**: TOTP-based 2FA
- **Role-Based Access Control (RBAC)**: Granular permissions
- **Session Management**: Secure, HttpOnly cookies with Redis
- **OAuth Providers**: Google, Discord, GitHub integration

### Data Protection

- **Encryption**: AES-256 for sensitive data at rest
- **PII Handling**: Minimal collection, automatic purging
- **GDPR Compliance**: Right to deletion, data export
- **COPPA Compliance**: Age verification, parental controls

### Security Features

```typescript
// Rate limiting
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    client: redis,
    prefix: 'rl:',
  }),
});

// Input sanitization
import DOMPurify from 'isomorphic-dompurify';

export const sanitizeHTML = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
};
```

---

## 📊 Performance & Monitoring

### Performance Targets

- **Core Web Vitals**:
  - LCP: < 2.5s
  - FID: < 100ms
  - CLS: < 0.1
- **Lighthouse Score**: 95+
- **Bundle Size**: < 200KB initial JS
- **API Response**: p95 < 200ms

### Optimization Strategies

```typescript
// Image optimization
import Image from 'next/image';

<Image
  src={url}
  alt={alt}
  width={800}
  height={600}
  loading="lazy"
  placeholder="blur"
  blurDataURL={blurDataURL}
/>

// Code splitting
const YouTubePlayer = dynamic(
  () => import('@/components/features/youtube-player'),
  { 
    loading: () => <PlayerSkeleton />,
    ssr: false 
  }
);

// Data fetching optimization
export const postRouter = createTRPCRouter({
  list: publicProcedure
    .input(listPostsInput)
    .query(async ({ input, ctx }) => {
      const cached = await redis.get(`posts:${JSON.stringify(input)}`);
      if (cached) return JSON.parse(cached);
      
      const posts = await ctx.db.post.findMany({
        ...input,
        include: {
          author: true,
          _count: { select: { comments: true, likes: true } },
        },
      });
      
      await redis.setex(
        `posts:${JSON.stringify(input)}`,
        300, // 5 minutes
        JSON.stringify(posts)
      );
      
      return posts;
    }),
});
```

### Monitoring Stack

```typescript
// Sentry configuration
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

// Custom metrics
export const metrics = {
  recordApiCall: (endpoint: string, duration: number) => {
    // Send to monitoring service
  },
  recordCacheHit: (key: string) => {
    // Track cache performance
  },
  recordError: (error: Error, context: any) => {
    Sentry.captureException(error, { extra: context });
  },
};
```

---

## 🧪 Testing Strategy

### Testing Stack

```json
{
  "jest": "^29.0.0",
  "@testing-library/react": "^14.0.0",
  "@testing-library/jest-dom": "^6.0.0",
  "playwright": "^1.40.0",
  "msw": "^2.0.0"
}
```

### Unit Testing

```typescript
// Example: Service test
describe('PostService', () => {
  it('should create a post with valid data', async () => {
    const post = await postService.create({
      title: 'Test Post',
      content: 'Test content',
      authorId: 'user123',
    });
    
    expect(post).toHaveProperty('id');
    expect(post.title).toBe('Test Post');
  });
});
```

### Integration Testing

```typescript
// Example: API route test
describe('POST /api/trpc/post.create', () => {
  it('should require authentication', async () => {
    const response = await fetch('/api/trpc/post.create', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test' }),
    });
    
    expect(response.status).toBe(401);
  });
});
```

### E2E Testing

```typescript
// Example: Playwright test
test('user can create and publish a post', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Sign In');
  await page.fill('[name=email]', 'test@example.com');
  await page.fill('[name=password]', 'password');
  await page.click('button[type=submit]');
  
  await page.click('text=New Post');
  await page.fill('[name=title]', 'My Test Post');
  await page.fill('[name=content]', 'This is test content');
  await page.click('text=Publish');
  
  await expect(page).toHaveURL(/\/posts\/[a-z0-9]+/);
  await expect(page.locator('h1')).toContainText('My Test Post');
});
```

---

## 🚢 Deployment

### Vercel Configuration

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "devCommand": "npm run dev",
  "installCommand": "npm ci",
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "src/app/api/trpc/[trpc]/route.ts": {
      "maxDuration": 10
    }
  },
  "crons": [
    {
      "path": "/api/cron/daily-stats",
      "schedule": "0 0 * * *"
    }
  ]
}
```

### Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Redis connection verified
- [ ] S3 bucket configured with CORS
- [ ] CDN cache headers optimized
- [ ] Error tracking enabled (Sentry)
- [ ] Analytics configured
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] SSL certificates valid
- [ ] Backup strategy implemented
- [ ] Monitoring alerts configured
- [ ] Load testing completed

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test -- --ci
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 🛠️ Troubleshooting

### Common Issues & Solutions

#### Database Connection Issues
```bash
# Check connection
npx prisma db pull

# Reset connection pool
npm run db:generate

# Verify migrations
npx prisma migrate status
```

#### Prisma Client Issues
```bash
# Regenerate client
rm -rf node_modules/.prisma
npm run db:generate

# Clear cache
rm -rf .next
npm run dev
```

#### Redis Connection Issues
```bash
# Test connection
redis-cli ping

# Check memory usage
redis-cli INFO memory

# Flush cache (dev only)
redis-cli FLUSHALL
```

#### Build Failures
```bash
# Clear all caches
rm -rf .next node_modules/.cache
npm run build

# Check for type errors
npm run type-check

# Verify environment variables
npx dotenv-checker
```

#### Socket.IO Issues
```javascript
// Debug client connection
socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
});

// Enable debug mode
localStorage.debug = 'socket.io-client:*';
```

---

## 📈 Roadmap

### Phase 1: Foundation (Q1 2025) ✅
- [x] Core authentication system
- [x] User profiles and settings
- [x] Basic post creation and editing
- [x] Comment system
- [x] Search functionality
- [x] Database schema and migrations

### Phase 2: Social & Real-time (Q2 2025) 🚧
- [ ] Following system
- [ ] Direct messaging
- [ ] Real-time notifications
- [ ] Socket.IO integration
- [ ] Presence indicators
- [ ] Activity feeds

### Phase 3: YouTube Integration (Q3 2025) 📅
- [ ] Video metadata fetching
- [ ] Timestamp discussions
- [ ] Watch parties
- [ ] Clip creation
- [ ] Playlist management
- [ ] Creator analytics

### Phase 4: Gamification (Q4 2025) 📅
- [ ] XP and leveling system
- [ ] Achievement unlocks
- [ ] Virtual currency
- [ ] Item marketplace
- [ ] Leaderboards
- [ ] Seasonal events

### Phase 5: AI & Advanced Features (Q1 2026) 📅
- [ ] Content recommendations
- [ ] Auto-moderation
- [ ] Writing assistant
- [ ] Sentiment analysis
- [ ] Trend detection
- [ ] Admin dashboard

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Process

1. **Fork & Clone**: Fork the repo and clone locally
2. **Branch**: Create a feature branch (`feature/amazing-feature`)
3. **Develop**: Make your changes with tests
4. **Test**: Ensure all tests pass (`npm run test`)
5. **Commit**: Use conventional commits (`feat:`, `fix:`, `docs:`)
6. **Push**: Push to your fork
7. **PR**: Open a pull request with detailed description

### Code Standards

- **TypeScript**: Strict mode, no `any` types
- **Formatting**: Prettier with project config
- **Linting**: ESLint rules must pass
- **Testing**: Maintain >80% coverage
- **Documentation**: JSDoc for public APIs
- **Accessibility**: WCAG 2.1 AA compliance

### Review Process

All PRs require:
- Passing CI/CD checks
- Code review approval
- Up-to-date with main branch
- Updated documentation
- Test coverage for new features

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔗 Links & Resources

- **Documentation**: [/docs](./docs)
- **API Reference**: [/docs/api](./docs/api)
- **Architecture**: [/docs/architecture](./docs/architecture)
- **Storybook**: [/storybook](./storybook)
- **Contributing**: [CONTRIBUTING.md](./CONTRIBUTING.md)
- **Security**: [SECURITY.md](./SECURITY.md)
- **Code of Conduct**: [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)

---

## 👥 Team & Support

- **Project Lead**: [Contact via GitHub Issues]
- **Technical Support**: [Open a GitHub Issue](https://github.com/nordeim/Sparkle-Universe-Next/issues)
- **Security Issues**: [See SECURITY.md](./SECURITY.md)
- **Community**: [Join our Discord](#)

---

<p align="center">
  <strong>Built with ❤️ by the Sparkle Universe Team</strong>
  <br>
  <sub>Making the YouTube fan experience magical, one feature at a time ✨</sub>
</p>
