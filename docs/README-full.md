<!-- Path: docs/README-full.md -->
# Sparkle Universe — Full Project README

**Last updated:** August 2025  
**Scope:** Comprehensive technical & contributor reference for Sparkle Universe (full design, architecture, operational notes).

---

## Table of Contents
1. [Overview & Vision](#overview--vision)  
2. [Quickstart / Local Dev](#quickstart--local-dev)  
3. [Architecture & Tech Stack](#architecture--tech-stack)  
4. [Directory Layout & Key Files](#directory-layout--key-files)  
5. [Database & Schema Guidance](#database--schema-guidance)  
6. [APIs & tRPC Conventions](#apis--trpc-conventions)  
7. [Background Jobs & Real-time](#background-jobs--real-time)  
8. [Design System & UX tokens](#design-system--ux-tokens)  
9. [Testing, CI, and Release Process](#testing-ci-and-release-process)  
10. [Security & Ops (overview)](#security--ops-overview)  
11. [Troubleshooting & Common Fixes](#troubleshooting--common-fixes)  
12. [Contributing / PR Process (summary)](#contributing--pr-process-summary)  
13. [Appendices & Links](#appendices--links)

---

## Overview & Vision

**Sparkle Universe** is a fan-first community platform built around YouTube-native experiences, real-time interaction, advanced gamification, creator tools, and AI assistance. This document is the canonical, developer-focused reference: everything teams need to build, ship and operate the product.

Core pillars:
- Real-time social features (chat, presence, watch parties)
- Deep YouTube integration (timestamps, metadata, clips)
- Gamification + virtual economy (Sparkle Points & Gems)
- AI-driven personalization & moderation
- Production-ready engineering (scalable DB, robust queues, observability)

---

## Quickstart / Local Dev

### Prerequisites
- Node.js 20.x, npm 10.x
- PostgreSQL 16+
- Redis (6+)
- AWS credentials for S3 (or use local dev equivalent)
- Optional: Docker / docker-compose for full stack

### Basic setup
```bash
git clone https://github.com/nordeim/Sparkle-Universe-Next.git
cd Sparkle-Universe-Next
npm ci
cp .env.example .env.local
# edit .env.local with DATABASE_URL, NEXTAUTH_SECRET, REDIS_URL, AWS keys, etc.
````

### Local DB (recommended using docker)

Start Postgres + Redis via `docker-compose` (see `/scripts/docker-compose.dev.yml` if present), then:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed    # optional
npm run dev
```

### Helpful dev scripts

* `npm run dev` — start Next.js dev server
* `npm run build` — production build
* `npm run start` — start built server
* `npm run worker` — start BullMQ worker(s)
* `npm run db:generate` — prisma generate
* `npm run db:migrate` — run prisma migrations
* `npm run db:push` — push schema (dev only)
* `npm run test` — unit tests (jest)
* `npm run test:e2e` — Playwright e2e tests
* `npm run lint` / `npm run lint:fix`
* `npm run type-check`

---

## Architecture & Tech Stack

### High-level

* **Frontend**: Next.js 15 (App Router), TypeScript 5, Tailwind CSS (design tokens), shadcn/ui, Radix primitives.
* **Backend**: tRPC API, Prisma ORM, PostgreSQL 16 (JSONB + GIN), Redis (cache & sessions), BullMQ (jobs), Socket.IO (real-time).
* **Storage**: AWS S3 + CloudFront (media)
* **AI**: OpenAI API + optional local TF.js inference pieces
* **Infra**: Vercel for edge + serverless functions, long-lived services on AWS (workers/gateways)
* **Monitoring**: Sentry, Vercel Analytics, Datadog
* **CI**: GitHub Actions (typecheck, lint, tests, build, CodeQL)

### Logical diagram

```
Client (Next.js / PWA / mobile)
    ↕
tRPC API (Edge) ←→ Service Layer ←→ DB / Cache / Storage / Queue
    ↕
Socket.IO Gateway (Redis adapter) ←→ Workers (BullMQ)
```

---

## Directory Layout & Key Files

```
/src
  /app               # Next.js App Router (pages + layouts)
  /components        # UI components (ui/, features/, shared/)
  /server
    /api             # tRPC routers
    /services        # business logic
  /lib               # auth, db (prisma client + middleware), jobs, socket
  /hooks
  /types
/prisma              # schema.prisma, migrations, seeds
/public
/docs                # extended documentation (this file)
.scripts             # helpful scripts (deployment / docker)
```

**Important files**

* `src/lib/db.ts` — Prisma client + middleware (soft deletes, optimistic locking)
* `src/server/api/root.ts` — tRPC root router
* `src/lib/jobs/*` — queues & processors
* `src/lib/socket/*` — Socket.IO setup & adapters
* `prisma/schema.prisma` — canonical DB models

---

## Database & Schema Guidance

### Principles

* Prisma schema is canonical source of truth.
* Use JSONB for flexible fields (profile settings, post content) but create GIN indexes via SQL migrations for performance.
* Soft deletes: middleware converts `delete` into `update { deleted: true, deletedAt }`.
* Optimistic locking: `version` integer in critical models.

### Common schema patterns

* Add `@db.VarChar(length)` for string columns where appropriate.
* Use `@@index` in Prisma for simple indexes and raw SQL migrations for complex GIN / function indexes.
* Document any manual SQL in migration directory (prisma/migrations).

---

## APIs & tRPC Conventions

### Router organization

* One router per domain: `auth`, `user`, `post`, `comment`, `social`, `gamification`, `youtube`, `admin`, `analytics`.
* Combine routers in `src/server/api/root.ts` with `createTRPCRouter`.

### Procedure naming

* Use `publicProcedure`, `protectedProcedure`, `adminProcedure`.
* Keep payloads explicit; prefer single-responsibility RPC endpoints.

### Error handling

* Use tRPC errors with codes (e.g., `BAD_REQUEST`, `UNAUTHORIZED`, `INTERNAL_SERVER_ERROR`) and attach structured metadata for observability.

---

## Background Jobs & Real-time

### BullMQ

* Dedicated queues for `EMAIL`, `NOTIFICATION`, `IMAGE_PROCESSING`, `YOUTUBE_SYNC`, `MODERATION`.
* Workers should be stateless and idempotent (retries must be safe).
* Use separate worker processes (not serverless functions) for long-running tasks.

### Socket.IO

* Redis adapter for horizontal scaling.
* Auth via session token during handshake.
* Rooms: `user:<id>`, `post:<id>`, `group:<id>`.
* Keep message formats versioned to allow graceful upgrades.

---

## Design System & UX tokens

* Tokens stored in `/src/design-tokens` and consumed by Tailwind via config.
* Theme: dark-first, glassmorphism accents, particle micro-interactions.
* Accessibility baseline: WCAG AA/AAA targets for key flows.
* Storybook used for documentation and visual regression.

**Example token snippet**

```js
export const tokens = {
  colors: { primary: '#8B5CF6', accent: '#10B981' },
  radius: { base: '8px' },
  spacing: { base: 4 }
};
```

---

## Testing, CI, and Release Process

### Tests

* Unit tests (Jest), component tests (React Testing Library), e2e (Playwright).
* Test data handled via fixtures / prisma seeding.

### CI

* GitHub Actions workflow: `type-check`, `lint`, `unit tests`, `build`, optional `e2e`.
* CodeQL enabled for security scanning.

### Releases

* Semantic versioning: `vX.Y.Z`
* Merge to `main` triggers automatic Vercel deployment.
* Migrations: create locally and include `prisma/migrations/*` with PR. Production deployments run `prisma migrate deploy` as part of release pipeline.

---

## Security & Ops (overview)

* MFA & RBAC for production accounts.
* Sensitive data encrypted at rest (DB/service provider level).
* Rate limiting (Redis), webhook signing, HMAC for third-party integrations.
* Security incidents: follow `SECURITY.md` (repo root).

---

## Troubleshooting & Common Fixes

### DB connection errors

* Verify `DATABASE_URL`, run `npx prisma migrate status`.
* If connection pooling required in serverless, configure PgBouncer.

### Missing Prisma client

* Run `npm run db:generate` or `npx prisma generate`.

### Worker failing

* Check Redis connection and queue backlog.
* Run worker in foreground with additional logging.

### Socket disconnects at scale

* Ensure Redis adapter configured and connection limits are handled. Use sticky sessions for legacy websockets if needed.

---

## Contributing / PR Process (summary)

* See `/CONTRIBUTING.md` for full guide (branch naming, conventional commits, migrations).
* PR must include tests (unit + relevant e2e), migration files (if DB changes), and passing CI.

---

## Appendices & Links

* CONTRIBUTING: `/CONTRIBUTING.md`
* SECURITY: `/SECURITY.md`
* CI config: `.github/workflows/ci.yml`
* Full PRD: `/docs/PRD-v1.0.md`
* Architecture diagrams: `/docs/architecture/`
* Storybook: `/storybook`
* API docs: `/docs/api/`
