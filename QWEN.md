# Sparkle Universe Next.js Project Guide

## 🌟 Project Overview

**Sparkle Universe** is a next-generation community platform designed exclusively for Sparkle YouTube fans. It combines blog forum functionality, social networking, YouTube integration, advanced gamification, and AI-powered features to create an immersive digital ecosystem.

### 🎯 Core Purpose
- **Primary Goal**: Premier global destination for Sparkle YouTube fans
- **Target Users**: 13-35 year old content creators and fans
- **Key Differentiators**: YouTube-native integration, real-time features, AI intelligence, advanced gamification

## 🏗️ Technical Architecture

### Tech Stack
```
Frontend: Next.js 15 + TypeScript 5 + Tailwind CSS 3
Backend: PostgreSQL 16 + Prisma ORM + tRPC
Real-time: Socket.io + Redis
Background Jobs: BullMQ
Infrastructure: Vercel Edge Functions + Cloudflare CDN
AI/ML: OpenAI API + TensorFlow.js
```

### Key Technologies
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5 with strict mode
- **Styling**: Tailwind CSS 3 with a custom design system
- **Database**: PostgreSQL 16 with advanced indexing and full-text search
- **ORM**: Prisma with custom middleware for soft deletes and optimistic locking
- **API**: tRPC for end-to-end type-safe APIs
- **Authentication**: NextAuth.js v5 with multi-provider OAuth
- **Real-time**: Socket.io with Redis adapter for horizontal scaling
- **Background Jobs**: BullMQ for processing intensive tasks like email sending and video processing
- **State Management**: Zustand (client state) + React Query (server state)
- **UI Components**: shadcn/ui with a custom Sparkle theme

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
│   │   ├── features/         # Components for specific features (post, editor)
│   │   └── shared/           # Components shared across features
│   ├── lib/                  # Core libraries, utilities, and configs
│   │   ├── auth/             # Auth configuration and helpers
│   │   ├── jobs/             # BullMQ job definitions and processors
│   │   ├── socket/           # Socket.IO server setup
│   │   └── validations/      # Zod validation schemas
│   ├── server/               # Server-side code (tRPC)
│   │   ├── api/              # tRPC routers and root configuration
│   │   └── services/         # Core business logic (service layer)
│   ├── hooks/                # Custom React hooks
│   ├── types/                # Global TypeScript definitions
│   └── services/             # Client-side service integrations (e.g., Email)
├── prisma/                   # Prisma schema, migrations, and seed scripts
├── public/                   # Static assets
└── ...                       # Config files, docs, etc.
```

## 🚀 Getting Started

### Prerequisites
- Node.js 20.0.0+
- npm 10.0.0+
- PostgreSQL 16+
- Redis

### Installation

1.  **Clone and install dependencies**:
    ```bash
    git clone <repository-url>
    cd Sparkle-Universe-Next
    npm install
    ```

2.  **Environment setup**:
    ```bash
    cp .env.example .env.local
    # Edit .env.local with your database, auth, and other credentials
    ```

3.  **Database setup**:
    ```bash
    # Run migrations to create the database schema
    npm run db:migrate

    # (Optional) Seed the database with initial data
    npm run db:seed
    ```

4.  **Start development server**:
    ```bash
    npm run dev
    ```

## 🗄️ Database Schema (`prisma/schema.prisma`)

The schema is the source of truth for our data models. It's extensive, defining over 50 models with detailed relations.

### Key Architectural Patterns
- **Soft Deletes**: A Prisma middleware in `src/lib/db.ts` intercepts `delete` operations on key models (User, Post, Comment) and replaces them with an `update` that sets a `deletedAt` timestamp. This prevents data loss and allows for recovery.
- **Optimistic Locking**: A middleware in `src/lib/db.ts` adds a `version` field to critical models (`User`, `Post`, `Trade`) to prevent concurrent write conflicts.
- **JSON Fields with GIN Indexes**: Models like `Profile` and `Post` use `Json` fields for flexible data (`themePreference`, `content`). The schema documentation specifies that GIN indexes must be created via raw SQL migrations for efficient querying of this JSON data.

### Core Model Groups

- **User & Auth**: `User`, `Profile`, `Account`, `Session`, `UserStats`, `UserBalance`, `Follow`, `Block`. The `User` model is the central hub, connecting to nearly every other feature.
- **Content**: `Post`, `Comment`, `Category`, `Tag`, `Reaction`, `PostRevision`, `PostSeries`. The `Post` model uses a `Json` field for its rich text content.
- **Gamification**: `Achievement`, `UserAchievement`, `Quest`, `UserQuest`, `LevelConfig`, `XpLog`, `Leaderboard`.
- **Economy**: `StoreItem`, `UserInventory`, `Trade`, `CurrencyTransaction`, `CreatorPayout`, `FanFunding`.
- **YouTube Integration**: `YoutubeChannel`, `YoutubeVideo`, `WatchParty`, `VideoClip`, `Playlist`.
- **Social**: `Group`, `GroupMember`, `Event`, `EventAttendee`, `Conversation`, `Message`.
- **Moderation**: `Report`, `AiModerationQueue`, `AuditLog`.

### Schema Highlights
```prisma
// User model with extensive relations and gamification fields
model User {
  id              String     @id @default(cuid())
  username        String     @unique @db.VarChar(50)
  email           String     @unique @db.VarChar(255)
  role            UserRole   @default(USER)
  status          UserStatus @default(PENDING_VERIFICATION)
  experience      Int        @default(0)
  level           Int        @default(1)
  sparklePoints   Int        @default(0)
  reputationScore Int        @default(0)
  version         Int        @default(0) // For optimistic locking
  deleted         Boolean    @default(false) // For soft deletes
  deletedAt       DateTime?

  // Relations to almost every feature
  profile         Profile?
  stats           UserStats?
  posts           Post[]
  comments        Comment[]
  followers       Follow[]   @relation("following")
  following       Follow[]   @relation("follower")
  achievements    UserAchievement[]
  // ... and 50+ more relations
}

// Post model with JSON content and detailed stats
model Post {
  id            String        @id @default(cuid())
  title         String        @db.VarChar(500)
  slug          String        @unique
  content       Json          // Rich text content, requires GIN index
  authorId      String?
  published     Boolean       @default(false)
  deleted       Boolean       @default(false) // For soft deletes
  deletedAt     DateTime?

  // Relations
  author        User?         @relation("UserPosts", fields: [authorId], references: [id], onDelete: SetNull)
  comments      Comment[]
  reactions     Reaction[]
  tags          PostTag[]
  stats         PostStats?
  revisions     PostRevision[]
}
```

## ⚙️ Backend Architecture

The backend is built on a robust, service-oriented architecture designed for scalability and maintainability.

### tRPC API Layer (`src/server/api/`)
- **Type-Safe**: Provides end-to-end type safety between the backend and frontend.
- **Routers**: The API is modularized into routers based on domain (e.g., `postRouter`, `userRouter`). These are combined in `src/server/api/root.ts`.
- **Procedures**: Uses `publicProcedure` for public access, `protectedProcedure` for authenticated users, and `adminProcedure` for admin-only actions. Middleware handles authentication, rate limiting, and logging.

### Service Layer (`src/server/services/`)
- **Business Logic**: This is where all core business logic resides. Each service is responsible for a specific domain (e.g., `PostService`, `UserService`, `NotificationService`).
- **Database Abstraction**: Services interact with the Prisma client (`db`), abstracting data access away from the API routers.
- **Decoupled**: Services are decoupled from the API layer, making them reusable and easier to test.

### Background Jobs (`src/lib/jobs/`)
- **Queueing**: Uses **BullMQ** with a Redis backend to manage background jobs.
- **Job Queues**: Defines multiple queues for different task types (`EMAIL`, `NOTIFICATION`, `IMAGE_PROCESSING`, `YOUTUBE_SYNC`, `CONTENT_MODERATION`).
- **Processors**: Workers process jobs asynchronously, preventing long-running tasks from blocking the API and improving response times.

### Real-time System (`src/lib/socket/`)
- **Technology**: Uses **Socket.IO** with the Redis adapter to support horizontal scaling.
- **Authentication**: Sockets are authenticated using the user's session token.
- **Rooms**: Leverages rooms for targeted communication (e.g., `user:<id>`, `post:<id>`).
- **Events**: Handles events for user presence, notifications, live content updates, typing indicators, and more.

## 🔧 Development Workflow

### Available Scripts
```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run start        # Start production server

# Database (Prisma)
npm run db:generate  # Generate Prisma client from schema
npm run db:migrate   # Create and apply a new migration
npm run db:push      # Push schema changes directly to DB (dev only)
npm run db:seed      # Seed the database
npm run db:studio    # Open Prisma Studio GUI

# Testing
npm run test         # Run unit tests with Jest
npm run test:e2e     # Run E2E tests with Playwright

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler check
```

### Git Workflow
1.  **Feature branches**: `feature/your-feature-name`
2.  **Commit conventions**: Follow [Conventional Commits](https://www.conventionalcommits.org/).
3.  **Pull requests**: Require at least one review and all CI checks to pass.
4.  **Release tags**: Use semantic versioning (`v1.2.3`).

## 🔐 Security & Privacy

- **Authentication**: Multi-factor authentication is supported.
- **Authorization**: Role-based access control is enforced via tRPC middleware.
- **Data Protection**: Implements soft deletes for data recovery. Sensitive data in the DB is encrypted. Compliant with GDPR and COPPA.
- **Content Security**: All user-generated content is sanitized to prevent XSS attacks.
- **API Security**: Rate limiting is applied to all API endpoints via middleware.

**Welcome to Sparkle Universe! ✨**