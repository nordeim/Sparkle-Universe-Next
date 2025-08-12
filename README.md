<!-- File: README.md -->
# Sparkle Universe — Next.js Community Platform

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]() [![License](https://img.shields.io/badge/license-MIT-blue)]() [![Vercel](https://img.shields.io/badge/deploy-vercel-black)]()

_Last updated: August 12, 2025_

> **Sparkle Universe** — next-generation fan community platform for Sparkle YouTube fans: rich posts, watch parties, real-time chat, creator tools, gamification, and AI-powered experiences.

---

## Table of contents

* [About](#about)  
* [Key Features](#key-features)  
* [Tech Stack & Architecture](#tech-stack--architecture)  
* [Quick Start (Local Development)](#quick-start-local-development)  
* [Environment Variables](#environment-variables)  
* [Database & Migrations](#database--migrations)  
* [Run Background Workers & Real-time](#run-background-workers--real-time)  
* [Testing & CI](#testing--ci)  
* [Deployment (Vercel)](#deployment-vercel)  
* [Directory Layout](#directory-layout)  
* [Design System & UX Notes](#design-system--ux-notes)  
* [Security, Performance & Monitoring](#security-performance--monitoring)  
* [Roadmap & Release Plan](#roadmap--release-plan)  
* [Contributing & Code Guidelines](#contributing--code-guidelines)  
* [Maintainers & Contact](#maintainers--contact)  
* [License](#license)  
* [Appendices & Links](#appendices--links)  
* [Quick Developer Cheat Sheet](#quick-developer-cheat-sheet)  
* [PR / Release Checklist](#pr--release-checklist)

---

## About

Sparkle Universe is the dedicated social experience for Sparkle's fan community. Built for creators and fans (≈13–35), Sparkle Universe offers YouTube-native integration (timestamps, clips), real-time social features (chat, watch parties), gamification (XP, economy), and AI-driven moderation & personalization.

This `README.md` consolidates the project PRD, developer notes, and operational guidance for contributors and maintainers.

---

## Key Features

* Rich post editor (WYSIWYG + Markdown + media embeds + TipTap)
* Deep YouTube integration (auto metadata, timestamp discussions, playlist sync)
* Real-time chat, presence, notifications (Socket.IO + Redis)
* Watch parties, synchronized playback & clip creation
* Gamification: XP, levels, achievements, Sparkle Points & Gems economy
* Creator toolkit: analytics, content calendar, monetization primitives
* AI: recommendations, auto-moderation, writing assistant (OpenAI + optional TF.js)
* Scalable backend: Prisma + PostgreSQL, tRPC APIs, BullMQ workers
* Production-ready infra: Vercel Edge Functions, Cloudflare CDN, S3 storage

---

## Tech Stack & Architecture

### Frontend
* Next.js 15 (App Router, Server Components)
* TypeScript 5 (strict, `noUncheckedIndexedAccess` recommended)
* Tailwind CSS + design tokens
* shadcn/ui + Radix primitives
* Zustand (client state) + React Query (server state)
* TipTap rich editor, Framer Motion micro-interactions

### Backend & Services
* PostgreSQL 16 (JSONB, GIN, `pg_trgm`, `pgcrypto`)
* Prisma ORM (schema + middleware)
* tRPC for type-safe API layer
* Redis (cache, sessions, rate limiting, socket adapter)
* BullMQ for background processing
* AWS S3 + CloudFront for media
* OpenAI API (+ optional TensorFlow.js for local inference)

### Observability & Infra
* Vercel (primary host for edge functions & front end)
* Cloudflare CDN & DDoS protection
* Sentry, Datadog & Vercel Analytics for monitoring
* GitHub Actions for CI/CD

### Logical diagram
```

Client (Next.js / PWA / Mobile)
↕
tRPC API (Vercel Edge)  <--->  Service Layer
\|                         ├─ PostgreSQL (primary + replicas)
\|                         ├─ Redis (cache, sessions)
\|                         ├─ BullMQ Workers (processing)
\|                         └─ S3/CloudFront (media)
↕
Socket.IO Gateway (Redis adapter)  <--->  Workers (BullMQ)

````

---

## Quick Start (Local Development)

### Prerequisites
* Node.js 20+ and npm 10+ (or pnpm/yarn)
* PostgreSQL 16+
* Redis
* AWS credentials (or localstack for S3 emulation)
* Optional: Docker / docker-compose for full stack

### Clone & install
```bash
git clone https://github.com/nordeim/Sparkle-Universe-Next.git
cd Sparkle-Universe-Next
npm ci
````

### Environment

```bash
cp .env.example .env.local
# Edit .env.local with local credentials (never commit .env.local)
```

Start dev stack:

```bash
# If you have docker-compose for local postgres/redis
docker-compose -f ./scripts/docker-compose.dev.yml up -d

npm run db:generate
npm run db:migrate
npm run db:seed   # optional

npm run dev
# Open http://localhost:3000
```

---

## Environment Variables

Minimum variables to run dev:

```
DATABASE_URL="postgresql://user:pass@localhost:5432/sparkle_universe"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="super-secret"
REDIS_URL="redis://localhost:6379"
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_S3_BUCKET="sparkle-dev"
OPENAI_API_KEY="..."
YOUTUBE_API_KEY="..."
SESSION_SECRET="..."
SENTRY_DSN=""
DATADOG_API_KEY=""
```

**Best practice:** Keep production secrets in Vercel / GitHub Actions secret store. Use per-environment config and never commit secrets.

---

## Database & Migrations

* Prisma is the canonical schema (`prisma/schema.prisma`).
* Use JSONB for flexible metadata and create GIN indexes via raw SQL migrations (Prisma cannot create complex GIN indexes automatically).
* Soft deletes and optimistic locking are implemented in `src/lib/db.ts` via Prisma middleware — keep middleware active in all environments.

### Common workflow

```bash
# dev
npx prisma migrate dev --name your-change
npx prisma generate
npx prisma db seed

# production
npx prisma migrate deploy
```

### Example: create GIN index migration (raw SQL)

Add a raw SQL migration file (example snippet):

```sql
-- prisma/migrations/20250812_add_gin_idx/steps.sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_posts_content_gin ON "Post" USING gin ((to_tsvector('english', coalesce(content->>'text',''))));
CREATE INDEX idx_posts_metadata_gin ON "Post" USING gin (metadata jsonb_path_ops);
```

**Notes**

* Review generated SQL (in `prisma/migrations/`) before applying.
* Add migration tests in CI where feasible.

---

## Run Background Workers & Real-time

### Start app (UI + API)

```bash
npm run dev
```

### Start worker(s) (BullMQ)

```bash
npm run worker
# or
node ./dist/worker.js
```

### Socket.IO / Real-time

* Use a dedicated gateway or long-running Node service for Socket.IO.
* Use Redis adapter (`socket.io-redis`) for pub/sub across instances.
* Rooms pattern: `user:<id>`, `post:<id>`, `party:<id>`, `guild:<id>`

**Handshake (example)**:

* Client sends session token on handshake
* Server validates session + attaches user context to socket
* Use versioned message schemas for forward compatibility

**Recommended local setup (docker-compose)**:

* postgres, redis, localstack (optional), worker container.

---

## Testing & CI

### Local tests

```bash
npm run test        # unit tests (Jest)
npm run test:e2e    # E2E (Playwright)
npm run test:coverage
```

### Pre-commit & Hooks

* Husky + lint-staged run lint/type-check/tests on commit

### Example GitHub Actions (CI)

`.github/workflows/ci.yml` (high level)

```yaml
name: CI
on: [push, pull_request]
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: node-version: '20'
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test -- --ci --runInBand
      - run: npm run build
```

**Production migrations in pipeline:** include `npx prisma migrate deploy` during deploy, with DB credentials from secrets.

---

## Deployment (Vercel recommended)

### Quick steps

1. Connect repo to Vercel.
2. Add production environment variables in Vercel dashboard.
3. Set build command: `npm run build`.
4. Configure preview & production branches.

### Best practices

* Use Vercel Edge Functions for SSR/fast paths; run long-lived sockets/workers on dedicated infra (AWS ECS / Fargate / Kubernetes).
* Use read replicas for heavy reads.
* Offload heavy processing (video transcoding, moderation ML) to workers.
* Enable Sentry & Datadog integrations.

---

## Directory Layout

```
/src
  /app                 # Next.js app router
  /components          # UI Components (ui/, features/, shared/)
  /server
    /api               # tRPC routers
    /services          # Business logic
  /lib                 # auth, db, jobs, socket, validations
  /hooks
  /types
/prisma
/public
/docs
/scripts
.storybook
```

**Key files**

* `src/lib/db.ts` — Prisma client + middleware
* `src/server/api/root.ts` — tRPC root router
* `src/lib/jobs/*` — BullMQ queues & processors
* `src/lib/socket/*` — Socket.IO setup
* `prisma/schema.prisma` — canonical DB models

---

## Design System & UX Notes

* Dark-first theme, glassmorphism accents, particle micro-interactions.
* Tokens & component library in `/src/components/ui` and `/design-tokens`.
* Use Storybook for visual docs and regression tests.
* Accessibility baseline: follow WCAG AA (key flows), ARIA attributes, keyboard navigation, reduced motion support.

**Brand tokens (example)**:

```js
export const tokens = {
  colors: { primary: '#8B5CF6', accent: '#10B981', pink: '#EC4899' },
  radius: { base: '8px' },
  spacing: { base: 4 }
}
```

---

## Security, Performance & Monitoring

**Security**

* NextAuth.js with Prisma adapter and secure HttpOnly cookies.
* RBAC, MFA for critical admin actions.
* Input sanitization, content moderation queue, automated auto-moderation (OpenAI).
* PII minimization; GDPR & COPPA considerations (user age ranges; parental consent flows).
* Rate limiting (Redis); signed webhooks for integrations.

**Performance**

* GIN indexes for JSONB; `pg_trgm` for fuzzy search.
* Multi-layer caching: Cloudflare CDN → Redis hot path → React Query.
* Image/video optimization and background processing.

**Monitoring**

* Sentry for error reporting.
* Vercel Analytics + Datadog for performance metrics.
* Structured JSON logs routed to centralized pipeline (ELK/Datadog).

---

## Roadmap & Release Plan

**Phase 1 — Foundational (MVP)**

* Auth, profiles, posts, comments, search, DB migrations.

**Phase 2 — Social & Real-time**

* Following, DMs, notifications, Socket.IO presence & chat.

**Phase 3 — YouTube & Creator Tools**

* Deep YouTube integration, analytics, watch parties.

**Phase 4 — Gamification & Economy**

* XP system, achievements, marketplace.

**Phase 5 — AI & Admin Tools**

* Recommendations, auto-moderation, admin dashboards.

(Full PRD in `/docs/PRD-v1.0.md`)

---

## Contributing & Code Guidelines

* Read `CONTRIBUTING.md` before work.
* Branch naming: `feature/*`, `bugfix/*`, `hotfix/*`.
* Commit messages: Conventional Commits (`feat`, `fix`, `chore`, `docs`, `style`).
* PR requirements:

  * Tests (unit & relevant e2e)
  * Passing CI
  * Migration files for DB changes
  * Updated docs when behaviour changes

**Code style**

* TypeScript strict mode
* ESLint + Prettier
* `npm run lint` and `npm run type-check` are gates

---

## Maintainers & Contact

* **Project Lead**: TODO — add name & email
* **Technical Lead**: TODO — add name & email
* **Design Lead**: TODO — add name & email

For urgent issues: open a GitHub issue with label `critical`.

---

## License

Licensed under the **MIT License** — see `LICENSE`.

---

## Appendices & Links

* Full Project Requirements Document: `/docs/PRD-v1.0.md`
* Architecture diagrams & DB schema: `/docs/architecture/`
* API docs (tRPC generator): `/docs/api/`
* Storybook: `/storybook`
* Contributing: `/CONTRIBUTING.md`
* Security policy: `/SECURITY.md`
* CI config: `.github/workflows/ci.yml`

---

## Quick Developer Cheat Sheet

```bash
# Install
npm ci

# Dev
npm run dev

# Generate prisma client
npm run db:generate   # or npx prisma generate

# Apply migrations (dev)
npm run db:migrate

# Seed
npm run db:seed

# Run worker
npm run worker

# Build / start
npm run build
npm run start

# Tests
npm run test
npm run test:e2e

# Code quality
npm run lint
npm run lint:fix
npm run type-check
```

---

## PR / Release Checklist

Before merging to `main` (or creating release):

* [ ] Branch follows naming convention
* [ ] Descriptive PR description & linked issue(s)
* [ ] All tests pass (unit & e2e where required)
* [ ] Type check passes
* [ ] Linting passes
* [ ] Migration files included (if DB changes) and SQL reviewed
* [ ] Security review for new dependencies or permissions
* [ ] Storybook / visual regression updates (if UI changes)
* [ ] Performance checks for heavy queries / endpoints
* [ ] Observability: Sentry breadcrumbs / metrics updated if needed
* [ ] Release notes drafted (CHANGELOG)

Suggested commit message for replacing README:

```
docs(readme): consolidate and extend README with full dev & ops guidance (2025-08-12)
```

---

## Notes & Next Steps (for maintainers)

1. Fill in maintainer contact info in the "Maintainers & Contact" section.
2. Keep `prisma/migrations/` small and reviewed. Raw SQL migrations (GIN, trigrams) are required for JSONB indexes — document them.
3. Add a short `SECURITY.md` link and contact info for security disclosure.
4. Consider adding a dedicated `OPERATION.md` for runbook & runbook playbooks (incident response, DB failover, recovery steps).
5. If you want, I can create a `docs/CONTRIBUTOR-ONBOARDING.md` and a `scripts/docker-compose.dev.yml` (if not already present) for single-command dev env bring-up.

---

**Welcome to Sparkle Universe — happy building!** ✨


Which of those would you like me to do now?
```
