# Sparkle Universe — Next.js Community Platform

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]() [![License](https://img.shields.io/badge/license-MIT-blue)]() [![Vercel](https://img.shields.io/badge/deploy-vercel-black)]()

> **Sparkle Universe** — the next-generation fan community platform for Sparkle YouTube fans: rich posts, live chat, watch parties, creator tools, advanced gamification, and AI-powered experiences.

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
* [Contact & Maintainers](#contact--maintainers)
* [License](#license)
* [Appendices / Links](#appendices--links)

---

## About

Sparkle Universe is a dedicated platform where fans of Sparkle's YouTube content gather to create, share, and celebrate. Built for creators and fans aged \~13–35, it emphasizes real-time interaction, deep YouTube integration, an engaging gamification layer, and AI enhancements for content and moderation.

This README synthesizes the project PRD (v1.0 — Aug 2025), the current technical documentation, and developer-focused implementation notes.

---

## Key Features

* Rich post editor (WYSIWYG + Markdown + media embeds)
* Deep YouTube integration (auto metadata, timestamp discussions, playlists)
* Real-time chat, presence, notifications (Socket.IO + Redis)
* Watch parties & clip creation
* Gamification: XP, levels, achievements, virtual economy (Sparkle Points & Gems)
* Creator toolkit: channel analytics, content calendar, monetization primitives
* AI: content recommendations, auto-moderation, writing assistant
* Scalable backend: Prisma + PostgreSQL, tRPC APIs, BullMQ background workers
* Production-ready infra: Vercel Edge Functions, Cloudflare CDN, S3 storage

---

## Tech Stack & Architecture

**Frontend**

* Next.js 15 (App Router, Server Components)
* TypeScript 5 (strict)
* Tailwind CSS (design system)
* shadcn/ui + Radix primitives
* Zustand (client state), React Query (server state)
* TipTap rich editor, Framer Motion for micro-interactions

**Backend**

* PostgreSQL 16 (JSONB, GIN indexes, `pg_trgm`, `pgcrypto`)
* Prisma ORM (schema + middleware)
* tRPC (type-safe API layer)
* Redis (cache, session, rate limiting, Socket.IO adapter)
* BullMQ (background job queues)
* AWS S3 + CloudFront (media)
* OpenAI API + optional TensorFlow\.js (AI features)

**Observability & Infra**

* Vercel primary hosting (edge functions)
* Cloudflare CDN & DDoS protection
* Sentry, Vercel Analytics, Datadog (monitoring)
* GitHub Actions for CI/CD

**High-level architecture**

```
Client (Next.js / PWA / Mobile)  <--->  tRPC API (Vercel Edge)  <--->  Service Layer
                                     |                       \
                                     |                        --> PostgreSQL (primary + replicas)
                                     |                        --> Redis (cache/sessions)
                                     |                        --> BullMQ Workers (processing)
                                     |                        --> S3 (media)
                                     |
                                 Socket.IO (workers + gateway via Redis adapter)
```

---

## Quick Start (Local Development)

### Prerequisites

* Node.js 20+
* npm 10+ (or yarn/pnpm)
* PostgreSQL 16+
* Redis (local or docker)
* AWS credentials for media (or local alternative)
* Optional: Docker for dev convenience

### Clone & Install

```bash
git clone https://github.com/nordeim/Sparkle-Universe-Next.git
cd Sparkle-Universe-Next
npm ci
```

### Environment

Copy the example env file:

```bash
cp .env.example .env.local
# Edit .env.local with your config
```

Example required variables (see [Environment Variables](#environment-variables) below).

### Database (dev)

Run migrations + generate Prisma client:

```bash
npm run db:generate      # prisma generate -> builds client
npm run db:migrate       # apply dev migrations
npm run db:seed          # optional: seed initial data
```

If you prefer direct Prisma commands:

```bash
npx prisma migrate dev --name init
npx prisma generate
npx prisma db seed
```

### Start app (dev)

```bash
npm run dev
# Open http://localhost:3000
```

---

## Environment Variables

Minimum vars to run locally (put into `.env.local`):

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
```

> Keep production secrets in the host (Vercel/GH Actions) secret manager and never commit `.env.local`.

---

## Database & Migrations

* Prisma is the single source of truth for schema.
* JSONB fields require manual GIN index setup in SQL migrations (Prisma can't auto-create complex indexes).
* Use raw migrations for GIN / pg\_trgm indexes and function-based indexes as needed.

Recommended workflow:

1. Update `prisma/schema.prisma`.
2. `npx prisma migrate dev --name {desc}`
3. Review generated SQL in `prisma/migrations/`.
4. For production: `npx prisma migrate deploy`.

**Notes**

* Middleware patterns: soft deletes and optimistic locking are implemented in `src/lib/db.ts` via Prisma middleware — ensure they run in local dev & CI.
* If using connection-pooled hosts (like Amazon RDS), use PgBouncer or equivalent for connection pooling in serverless environments.

---

## Run Background Workers & Real-time

**Start the next app** (serves UI + API):

```bash
npm run dev
```

**Run workers (BullMQ processors)**:

```bash
npm run worker
# or
node ./dist/worker.js
```

**Socket.IO / real-time**

* Socket gateway is bootstrapped by a dedicated server process or via long-running server (recommended outside serverless edge).
* Use Redis adapter for cross-instance pub/sub (`socket.io-redis`).

**Recommended local setup using docker-compose**

* postgres, redis, localstack (optional), and a worker container.

---

## Testing & CI

**Local tests**

```bash
npm run test        # unit tests (Jest)
npm run test:e2e    # E2E (Playwright)
npm run test:coverage
```

**Pre-commit & Hooks**

* Husky runs lint / type check and tests on pre-commit / pre-push.

**Example GitHub Actions (CI)**

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test -- --ci --runInBand
      - run: npm run build
```

**Production migrations in CI/CD**

* Use `prisma migrate deploy` during deployment pipeline (with DB credentials set as secrets).

---

## Deployment (Vercel recommended)

**Vercel Steps**

1. Connect the GitHub repo to Vercel.
2. Add environment variables in Vercel dashboard (use secrets).
3. Set build command: `npm run build` and output path (Next.js default).
4. Deploy — preview and production via branches.

**Best practices**

* Use Vercel Edge Functions for SSR where possible, but long-running sockets/workers should run in separate long-lived infrastructure (AWS ECS/Fargate/Kubernetes).
* Use read replicas for heavy read workloads and Batched writes for heavy events.
* Enable Vercel analytics, Sentry, and Datadog integrations.

---

## Directory Layout

A concise snapshot (expanded in `docs/`):

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
```

---

## Design System & UX Notes

* Dark-mode-first, glassmorphism, particle micro-interactions.
* Tokens & component library live in `/src/components/ui` and `/design-tokens`.
* Use storybook for UI regression tests.
* Accessibility: follow WCAG, keyboard navigation, ARIA attributes, reduced motion.

---

## Security, Performance & Monitoring

**Security**

* MFA, role-based access control, session management via Redis (secure + HttpOnly cookies).
* PII minimization, GDPR + COPPA compliance, audit logs for moderation actions.
* Rate limiting with Redis backing; webhook signing for external integrations.

**Performance**

* GIN indexes for JSONB; `pg_trgm` for fuzzy search.
* Multi-layer caching: CDN (Cloudflare), Redis hot path, React Query SWR.
* Background jobs for heavy tasks (image processing, moderation).

**Monitoring**

* Use Sentry for error reporting.
* Vercel Analytics + Datadog for performance & infra.
* Structured logs (JSON) routed into centralized logging (ELK/Datadog).

---

## Roadmap & Release Plan

**Phase 1 — Foundational (MVP)**

* Auth, basic profiles, posts, comments, search, migrations.

**Phase 2 — Social & Real-time**

* Following, DMs, notifications, Socket.IO presence & chat.

**Phase 3 — YouTube & Creator Tools**

* Deep YouTube integration, analytics, watch parties.

**Phase 4 — Gamification & Economy**

* XP system, achievements, marketplace.

**Phase 5 — AI & Admin Tools**

* Recommendations, auto-moderation, admin dashboards.

(Full PRD with milestones stored in `/docs/PRD-v1.0.md`)

---

## Contributing & Code Guidelines

* Please read `CONTRIBUTING.md` (in repo) before raising PRs.
* Branches: `feature/*`, `bugfix/*`, `hotfix/*`
* Commit messages: Conventional Commits (feat, fix, chore, docs, style).
* PRs must include:

  * Tests (unit + E2E where applicable)
  * Updated docs
  * Passing CI
* Code style:

  * TypeScript strict mode
  * ESLint + Prettier enforcement
  * `npm run lint` and `npm run type-check` as gates

**Maintainers will review for accessibility, security, and scalability.**

---

## Contact & Maintainers

* **Project Lead**: TODO (add name / email)
* **Technical Lead**: TODO
* **Design Lead**: TODO
* For urgent issues: open a GitHub issue with `critical` label.

---

## License

Licensed under the **MIT License** — see `LICENSE` in repository.

---

## Appendices / Links

* Full Project Requirements Document: `/docs/PRD-v1.0.md`
* Architecture diagrams & DB schema: `/docs/architecture/`
* API docs (tRPC OpenAPI / doc generator): `/docs/api/`
* Storybook: `/storybook`
* Contributing: `/CONTRIBUTING.md`
* Security policy: `/SECURITY.md`

---

## Quick Developer Cheat Sheet

```bash
# Install
npm ci

# Dev
npm run dev

# Generate prisma client
npm run db:generate

# Apply migrations (dev)
npm run db:migrate

# Seed
npm run db:seed

# Run worker
npm run worker

# Test
npm run test
npm run test:e2e
```


