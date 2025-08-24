# 📚 Sparkle Universe - Project Codebase Summary

**Version:** 1.0.0  
**Purpose:** Quick reference for coding agents and contributors to understand the Sparkle Universe codebase

---

## Quick executive summary

Sparkle Universe is an enterprise-scale community platform (YouTube fan community) implemented with Next.js App Router and a strict TypeScript + Prisma backend. This repository includes a large, production-oriented data model (112 Prisma models), comprehensive typed JSON fields (109 typed JSON fields), and an automated type generation pipeline that produces TypeScript types, validators and runtime helpers.

Recent verification (local dev run & type generation):

- Next.js (dev): 14.2.32 (dev server started successfully on http://localhost:3000)
- TypeScript: 5.9.2 (project configured in strict mode)
- Prisma Client: v6.14.0 (generated to node_modules/@prisma/client during postinstall)
- Type generation: scripts/generate-types-final.ts completed successfully and created a full type bundle in src/types/generated
- Generated artifacts: 112 models, 22 enums, 109 JSON fields typed, runtime validators, API/component typings, type tests

Note: During development environment setup `npm install` produced several deprecation warnings and reported 13 vulnerabilities (3 low, 10 moderate). The repo also uses husky; the install command shows a deprecation warning from husky's installer. Review and upgrade dependencies as part of maintenance.

---

## Table of contents

- Quick overview
- Essential commands
- Project structure
- Type generation & generated artifacts
- Technology stack (verified)
- Database & Prisma notes
- Environment configuration (required variables)
- Quick start & development checklist
- Performance & scaling guidance
- Testing & code quality
- Deployment checklist
- Known runtime/dependency warnings & remediation guidance
- Interaction flow (Mermaid)
- Key code files & interfaces
- Resources

---

## 🎯 Quick Overview

Sparkle Universe is built with:

- 112 Database Models (Prisma) with strategic relationships
- 22 Enum Types (Prisma)
- 109 Typed JSON Fields (fully typed via generation)
- Next.js App Router (Next.js 14.x; dev showed 14.2.32)
- TypeScript 5.9.2 with strict compiler options
- PostgreSQL 16+ with Prisma 6.14.0 ORM
- tRPC (server API layer), NextAuth (auth), Socket.IO (realtime), Redis, and Tailwind CSS

Key runtime confirmations from local dev logs:
- Prisma schema validated successfully (`npx prisma validate`)
- `npm run dev` started Next.js dev server and compiled routes including middleware and auth endpoints
- Prisma Client generation was executed as part of postinstall

---

## ⚡ Essential Commands

Development
```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
```

Database & Prisma
```bash
npm run db:generate  # Generate Prisma client + types
npm run db:migrate   # Run migrations (dev)
npm run db:push      # Push schema changes
npm run db:studio    # Open Prisma Studio GUI
npm run db:seed      # Load sample data
npm run db:reset     # Reset database
npm run db:indexes   # Apply JSON GIN indexes (CRITICAL)
```

Type generation & maintenance
```bash
npm run generate:types:final  # Generate all TypeScript types (scripts/generate-types-final.ts)
npm run generate:types:watch  # Watch mode for schema changes
npm run prepare               # Husky install (postinstall hooks)
```

Code quality & testing
```bash
npm run type-check   # TypeScript validation
npm run lint         # ESLint check
npm run lint:fix     # Auto-fix issues
npm run format       # Prettier formatting
npm run test         # Jest unit tests
npm run test:e2e     # Playwright E2E tests
```

---

## 🏗️ Project Structure (top-level important folders)

src/
- app/                    — Next.js App Router pages & layouts (including (auth), (main), admin, api routes)
- components/             — React components (ui primitives, admin panels, features)
- providers/              — React providers (auth, theme, query)
- lib/                    — Utilities (db, redis, openapi, security, monitoring)
- hooks/                  — React hooks
- server/                 — Server-side tRPC routers and server services
- services/               — Client-facing service wrappers
- types/generated/        — Auto-generated TypeScript types (detailed below)
- prisma/                 — Prisma schema (prisma/schema.prisma at repo root)
- config/, jobs/, socket/ — ancillary backend utilities and workers

Important note: the `src/types/generated` directory is actively produced by scripts/generate-types-final.ts and must be committed to ensure type-safety across the codebase.

---

## Type generation & generated artifacts (verified)

Type generation was run successfully via npm scripts. Output directory: `src/types/generated`.

Generated files (existing listing as of verification):
- src/types/generated/README.md
- src/types/generated/api.ts
- src/types/generated/components.ts
- src/types/generated/enums.ts
- src/types/generated/index.ts
- src/types/generated/json-types.ts
- src/types/generated/models.ts
- src/types/generated/type-tests.ts
- src/types/generated/utils.ts
- src/types/generated/validators.ts

Generation summary (from logs):
- Models processed: 112
- Enums processed: 22
- Total fields processed: 1923
- JSON fields typed: 109 / 109
- Runtime validators generated
- API and component typings generated
- Type tests generated at src/types/generated/type-tests.ts

Prisma client generation:
- Prisma Client (v6.14.0) was generated to `./node_modules/@prisma/client` during postinstall.

Why this matters:
- The generated models.ts and json-types.ts provide strict TypeScript mappings for JSONB fields — crucial for runtime-safe handling of flexible JSON columns.
- validators.ts contains runtime checks (likely using zod or similar) for JSON value shapes.

Recommended maintenance:
- Commit generated outputs when intended to be part of the repo's canonical types. If generated at CI, ensure CI runs generation and type-checks before merging.
- Add a CI gate to run `npm run generate:types:final` and type-check to detect schema drift.

---

## Technology Stack (verified / updated)

- Framework: Next.js 14.2.32 (App Router)
- Language: TypeScript 5.9.2 (strict)
- ORM: Prisma 6.14.0
- Database: PostgreSQL 16+
- API layer: tRPC
- Auth: NextAuth.js
- Realtime: Socket.IO
- Cache/Session: Redis (ioredis)
- Styling: Tailwind CSS (utility CSS)
- UI primitives: Radix UI / shadcn-based component set
- State & data fetching: Zustand, TanStack Query
- Validation: Zod (project uses runtime validators generated)
- Rich-text editor: TipTap
- Testing: Jest (unit), Playwright (E2E), tsd or type-tests for type assertions

---

## 🗄️ Database Schema & Prisma notes

Overview (confirmed):
- Total Models: 112 (Prisma schema validated)
- Total Enums: 22
- JSON fields typed: 109 (typed via generation scripts)
- Soft delete pattern used: fields like `deleted`, `deletedAt`, `deletedBy`
- Versioning: `version` field used for optimistic locking on important models
- Money precision: Decimal(19,4) used for monetary values
- The User model has very high number of relations (70+). Avoid including relations indiscriminately.

Critical performance notes (preserved & essential):
- NEVER load all relations for high-relation models (User). Use select to load necessary columns only.
- Required JSON GIN indexes must be applied in production for JSONB-heavy fields, e.g.:
  - CREATE INDEX idx_profile_theme USING GIN (themePreference);
  - CREATE INDEX idx_post_content USING GIN (content);

---

## 🔐 Environment configuration (required variables)

Essential env vars (examples; ensure .env.local is configured):
- DATABASE_URL="postgresql://user:pass@localhost:5432/sparkle_universe"
- DIRECT_URL="postgresql://user:pass@localhost:5432/sparkle_universe"
- NEXTAUTH_URL="http://localhost:3000"
- NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (optional)
- GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET (optional)
- YOUTUBE_API_KEY (optional)
- REDIS_URL="redis://localhost:6379"
- UPLOADTHING_SECRET, OPENAI_API_KEY, STRIPE_* (optional depending on features)

During verification an alternative DATABASE_URL was used:
- export DATABASE_URL="postgresql://sparkle_user:StrongPass1234@localhost:5433/sparkle_db"

---

## 🚀 Quick Start (verified steps)

1. Clone & install
```bash
git clone https://github.com/nordeim/Sparkle-Universe-Next.git
cd Sparkle-Universe-Next
npm ci
```

2. Setup environment
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

3. Setup database
```bash
psql -U postgres -c "CREATE DATABASE sparkle_universe_dev;"
psql -U postgres -d sparkle_universe_dev -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
psql -U postgres -d sparkle_universe_dev -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
```

4. Initialize database & types
```bash
npm run db:generate
npm run db:migrate
npm run db:indexes  # CRITICAL: Apply JSON indexes
npm run db:seed     # Optional: Load sample data
npm run generate:types:final
```

5. Start development
```bash
npm run dev
# Open http://localhost:3000
```

Notes from verification:
- `npm install` runs `prisma generate` and `npm run generate:types:final` via postinstall in this project. The generation completed successfully in the environment used for verification.

---

## 🎯 Key Features (preserved & verified)

Content system
- 9 content types (BLOG, LIVE_BLOG, POLL, VIDEO_REVIEW, FAN_ART, THEORY_THREAD, SERIES, TUTORIAL, NEWS)
- TipTap rich text editor with YouTube embeds
- Post revision/version control
- 5-level nested comments
- 9 reaction types

YouTube integration
- Watch Parties, timestamp comments, auto-metadata (via YouTube API), clip creation, quota tracking

Gamification
- 8 achievement tiers, 8 quest types, dual-currency system (sparklePoints + premiumPoints), trading system, leveling

Monetization
- 4 subscription tiers (FREE, SPARKLE_FAN, SPARKLE_CREATOR, SPARKLE_LEGEND)
- Creator revenue share default: 0.7000

Realtime
- Socket.IO for WebSocket, presence, live chat, notifications

AI
- AiModerationQueue, AiRecommendation, AiContentSuggestion, UserAiPreference (in-progress features)

---

## 📊 Enums (reference)

User & Auth:
- UserRole: USER, CREATOR, VERIFIED_CREATOR, MODERATOR, ADMIN, SYSTEM
- UserStatus: PENDING_VERIFICATION, ACTIVE, SUSPENDED, BANNED, DELETED
- AuthProvider: LOCAL, GOOGLE, GITHUB, TWITTER, DISCORD
- SubscriptionTier: FREE, SPARKLE_FAN, SPARKLE_CREATOR, SPARKLE_LEGEND

Content & Moderation:
- ContentType: BLOG, LIVE_BLOG, POLL, VIDEO_REVIEW, FAN_ART, THEORY_THREAD, SERIES, TUTORIAL, NEWS
- ContentStatus: DRAFT, SCHEDULED, PUBLISHED, ARCHIVED, DELETED
- ReactionType: 9 reaction kinds
- NotificationType: ~19 types (comprehensive notifications)
- ModerationStatus, ReportReason, etc. (see src/types/generated/enums.ts for authoritative list)

Note: The authoritative enum definitions are present in `src/types/generated/enums.ts` which is generated from Prisma schema.

---

## 🔧 Development Guidelines & TypeScript config

Key TS settings (project uses strict options):
```json
{
  "strict": true,
  "strictNullChecks": true,
  "noUncheckedIndexedAccess": true,
  "noImplicitOverride": true,
  "target": "ES2022"
}
```

Code style:
- Functional React components with hooks
- Zustand for client state, TanStack Query for server state
- Tailwind CSS utilities and shadcn/ui primitives
- Zod for runtime validation; additional validators are generated into src/types/generated/validators.ts

Type generation & CI recommendation:
- Ensure CI runs `npm run generate:types:final` and `npm run type-check` to prevent schema drift and ensure generated types are up to date.

---

## Quality Assurance & Testing

- Unit tests: Jest (npm run test)
- E2E: Playwright (npm run test:e2e)
- Type assertion tests: `src/types/generated/type-tests.ts` was generated by the type generation process (use tsd/ts-jest or CI to enforce)
- Coverage: npm run test:coverage

---

## ⚡ Performance & Scaling Guidance (preserved and expanded)

- Use selective `select`/`include` in Prisma queries for high-relation models
- Add JSON GIN indexes for JSONB fields heavily used in queries
- Use cursor pagination for large list endpoints (feed, users)
- Introduce caching (Redis) and TTL strategies (see CacheType enum in codebase)
- Rate-limiting policies exist; verify values in lib/rate-limit.*

---

## Deployment Checklist (production)

- Run migrations: `npm run db:migrate:prod`
- Apply JSON GIN indexes: `npm run db:indexes`
- Build and verify: `npm run build`
- Configure environment variables on host
- Configure Redis, disable debug logs, set NEXTAUTH_SECRET
- Configure monitoring and backups, set up CDN
- CI/CD: run `generate:types:final` and type-check prior to deployment

Suggested deployment commands:
```bash
npm run build
npm run db:migrate:prod
vercel --prod
```

---

## Known runtime/dependency warnings & remediation guidance (from verification)

- npm install reported several deprecation warnings for transitive dependencies (inflight, glob, rimraf older versions, etc.). Consider updating top-level dependencies to clear deprecated transitive dependencies.
- npm audit reported 13 vulnerabilities (3 low, 10 moderate). Run `npm audit` and `npm audit fix` as appropriate. For security-sensitive environments, plan dependency upgrades and retest.
- Husky's install command produced a deprecation warning. Verify your Husky configuration and upgrade if necessary.

---

## Interaction flow (Mermaid)

Below is a high-level interaction flow showing how user actions propagate through the application, where generated types and validators fit, and how realtime and caching components interact.

```mermaid
flowchart TD
  %% User to UI
  User[User (browser / client)] -->|HTTP / client events| UI[UI Components (src/app, components/*)]
  UI -->|Uses Providers| Providers[Providers (auth, query, theme)]
  Providers -->|Call services| Services[Client Services (src/services/*)]
  Services -->|REST / tRPC / Graph| ApiRoutes[API Routes (src/app/api/*, src/server/api/*)]
  ApiRoutes -->|tRPC / NextJS handlers| Server[Server logic (src/server/, services/)]
  Server -->|Prisma Client| Prisma[Prisma Client (lib/db.ts -> node_modules/@prisma/client)]
  Prisma -->|SQL| Postgres[(PostgreSQL DB)]
  Server -->|Redis cache| Redis[(Redis)]
  Server -->|Emit events| Socket[Socket.IO / WebSocket (socket/ or server/websocket)]
  Socket -->|Push to clients| UI

  %% Generated types + validators cross-cutting
  Providers ---|import types/validators| Types[src/types/generated/*]
  Server ---|import types & validators| Types
  Services ---|import types| Types

  %% Admin / Background jobs
  Background[Jobs / Workers (src/jobs/*, services/*)] --> Server
  Admin[Admin UI / routes (src/components/admin, src/app/admin/*)] --> ApiRoutes

  style Types fill:#f9f,stroke:#333,stroke-width:1px
  style Redis fill:#bbf,stroke:#333
  style Prisma fill:#bfb,stroke:#333
```

Notes:
- src/types/generated is used both client- and server-side to ensure uniform shapes.
- validators.ts provides runtime checks for JSON fields on server endpoints and background jobs.
- Socket server and Redis provide realtime and caching layers; they bypass heavy DB loads where possible.

---

## Key code files & interfaces

A focused list of high-impact files, their purpose, and the primary exports / interfaces you will interact with.

- prisma/schema.prisma
  - Purpose: canonical DB schema and Prisma model definitions (source of truth).
  - Interfaces: Prisma models → used to generate Prisma Client and src/types/generated.

- src/types/generated/models.ts
  - Purpose: TypeScript model declarations reflecting Prisma models with typed JSONs.
  - Exports: Model interfaces/types (e.g., User, Post, Comment types) used across client/server.

- src/types/generated/json-types.ts
  - Purpose: Detailed interfaces for JSONB columns (109 typed JSON fields).
  - Exports: Named interfaces for structured JSON fields used within models.

- src/types/generated/validators.ts
  - Purpose: Runtime validators (Zod or similar) for generated JSON types.
  - Exports: validators: Record<string, ZodSchema> (or named Zod schemas) used by server endpoints and jobs.

- src/lib/db.ts
  - Purpose: Prisma client wrapper and central DB access.
  - Exports: prisma: PrismaClient; helper utilities for transactions.

- src/lib/redis.ts
  - Purpose: Redis client and cache helpers (ioredis wrapper).
  - Exports: redis client instance, helpers for cache get/set/invalidate.

- src/lib/openapi.ts
  - Purpose: OpenAPI generation and openapi.json maintenance (used by api-docs).
  - Exports: functions to build or serve OpenAPI JSON.

- src/middleware.ts
  - Purpose: Global Next.js middleware for auth, redirects, or edge logic.
  - Exports: default middleware function (Edge runtime hooks).

- src/app/layout.tsx / src/app/page.tsx
  - Purpose: Root app layout and top-level pages.
  - Exports: React components used by App Router.

- src/app/api/trpc/* and src/server/api/*
  - Purpose: API endpoints and tRPC routers that implement server logic.
  - Exports: route handlers, tRPC routers, and typed procedure signatures.

- src/server/websocket/ and socket/
  - Purpose: Socket.IO / WebSocket server logic (presence, notifications, live chat).
  - Exports: initializeSocketServer(server, options), event handlers.

- src/services/auth.service.ts
  - Purpose: High-level auth logic used by API and pages (session management, user creation).
  - Exports: functions like signIn, signUp, getSession, linkProvider.

- src/services/notification.service.ts
  - Purpose: Notifications generation and delivery (DB writes and socket emits).
  - Exports: createNotification, markRead, fetchNotifications.

- src/services/email.service.ts
  - Purpose: Email templating and delivery (templates in src/emails/templates).
  - Exports: sendEmail(templateName, payload, opts).

- src/components/ui/*
  - Purpose: UI primitives (button, input, dialog, toast).
  - Exports: React components with consistent props (size, variant, onClick, etc.).

- src/hooks/use-auth.ts / use-socket.ts / use-toast.ts
  - Purpose: Client hooks to interact with auth state, socket, and toasts.
  - Exports: React hooks (useAuth(), useSocket(), useToast()).

- scripts/generate-types-final.ts
  - Purpose: Generates src/types/generated/* from Prisma schema and metadata.
  - Exports: build script invoked during postinstall/CI.

- src/types/generated/index.ts
  - Purpose: Re-exports and index of generated types for convenient imports.

When adding or refactoring:
- Prefer importing types from src/types/generated to keep client/server type parity.
- Use validators.ts on server boundaries to validate untrusted JSON input before DB writes.
- Keep Prisma selects minimal for high-relations models (User) to avoid heavy queries.

---

## Additional developer notes & recommendations

- The generated types directory (`src/types/generated`) is critical for compile-time correctness. Keep it part of the repository if you rely on committed generated types; otherwise, ensure CI generates them.
- Add CI checks:
  - `generate:types:final`
  - `type-check`
  - `lint`
  - `test`
- Consider running a dependency update sweep (npm-check-updates) and re-running generation & tests to reduce vulnerabilities and deprecation warnings.
- Add documentation or a small README for the type generation script to explain when to commit generated files vs. generate at CI time.

---

## Resources

- Repository: https://github.com/nordeim/Sparkle-Universe-Next
- Prisma schema: prisma/schema.prisma
- Generated types: src/types/generated/
- Type generation script: scripts/generate-types-final.ts
- Dev server: http://localhost:3000 (when running `npm run dev`)

---

## Appendix — Verified generation & runtime log excerpts

- Prisma generated 112 models and 22 enums; typed 109 JSON fields (generation summary reported by scripts/generate-types-final.ts).
- Generated files saved to src/types/generated (README.md, models.ts, json-types.ts, enums.ts, validators.ts, api.ts, components.ts, utils.ts, index.ts, type-tests.ts).
- Prisma Client generated in node_modules/@prisma/client (v6.14.0) during postinstall.
- Next.js dev server started: Next.js 14.2.32, Local: http://localhost:3000

---

If you want, I can:
- Commit the generated types to a branch and open a PR with CI checks for generation & type-checks.
- Create a small CI workflow (GitHub Actions) that runs generate:types:final, type-check, lint, and tests on push/PR.
- Produce a short migration plan to address dependency vulnerabilities and deprecation warnings and execute safe upgrades.

Quick migration & remediation plan (high level)
1. Audit
   - Run: `npm audit` and `npm audit fix` to surface and auto-resolve issues.
   - Create an inventory of direct vs. transitive vulnerable packages.

2. Upgrade & test
   - Update direct dependencies with `npm-check-updates` (review breaking changes).
   - Re-run `npm ci`, regenerate Prisma client and types (`npm run db:generate && npm run generate:types:final`), and run the full test suite.
   - Fix any compilation or test regressions.

3. Hardening
   - Replace or eliminate packages that are deprecated or have security issues (where feasible).
   - Pin critical transitive dependencies via overrides if upstream upgrades are delayed.

4. CI enforcement
   - Add CI gates to block merges when `generate:types:final` or `type-check` fails.
   - Add scheduled dependency-upgrade checks (dependabot / renovate) and automated PRs.

Minimal GitHub Actions CI example (place in .github/workflows/ci.yml)
```yaml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Use Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install deps
        run: npm ci
      - name: Generate Prisma Client & types
        run: npx prisma generate && npm run generate:types:final
      - name: Type check
        run: npm run type-check
      - name: Lint
        run: npm run lint
      - name: Run tests
        run: npm run test -- --ci
```

If you want, I can:
- Create the CI workflow file and open a PR.
- Produce a detailed, safe dependency upgrade plan with PRs and test runs.
- Apply a small patch that pins critical transitive packages or suggests replacements.

