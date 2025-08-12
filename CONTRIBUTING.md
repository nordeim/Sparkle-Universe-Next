<!-- Path: CONTRIBUTING.md -->
# Contributing to Sparkle Universe

Thank you for helping build Sparkle Universe! This document explains how to contribute, our standards, and the project workflow.

---

## Table of contents
- [Code of Conduct](#code-of-conduct)
- [Getting started (dev setup)](#getting-started-dev-setup)
- [Branching & commit conventions](#branching--commit-conventions)
- [Pull request process](#pull-request-process)
- [Review checklist (maintainers)](#review-checklist-maintainers)
- [Testing guidelines](#testing-guidelines)
- [Database migrations (Prisma)](#database-migrations-prisma)
- [Security reporting](#security-reporting)
- [Style & linting rules](#style--linting-rules)
- [Translations & docs](#translations--docs)
- [Contacts](#contacts)

---

## Code of Conduct
Please follow the project's Code of Conduct (see `CODE_OF_CONDUCT.md`). Be respectful, constructive, and inclusive.

---

## Getting started (dev setup)
1. Fork the repository and clone your fork:
   ```bash
   git clone https://github.com/<your-username>/Sparkle-Universe-Next.git
   cd Sparkle-Universe-Next
````

2. Install dependencies:

   ```bash
   npm ci
   ```
3. Copy environment file:

   ```bash
   cp .env.example .env.local
   # Fill in DATABASE_URL, NEXTAUTH_SECRET, REDIS_URL, and API keys
   ```
4. Start DB/Redis locally (docker-compose recommended) and run:

   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed  # optional
   npm run dev
   ```
5. Pre-commit hooks (Husky) run lint/type-check; run locally:

   ```bash
   npm run lint
   npm run type-check
   ```

---

## Branching & commit conventions

* Branch: `feature/<short-desc>`, `fix/<short-desc>`, `chore/<short-desc>`.
* Use [Conventional Commits](https://www.conventionalcommits.org/):

  * `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `ci:`, etc.
* Keep PRs small and focused.

---

## Pull request process

1. Create a branch from `main`:

   ```bash
   git checkout -b chore/ci-and-contributing
   ```
2. Make changes and run tests/lint locally.
3. Commit, push, and open a PR against `main`.
4. Use the PR template (auto-populated if `.github/PULL_REQUEST_TEMPLATE.md` exists).
5. Assign reviewers and link related issues.

**PR description should include:**

* Short summary of changes
* Related issue number
* How to test locally (commands)
* Screenshots (if UI)
* Migration notes (if applicable)

---

## Review checklist (maintainers)

* [ ] PR follows conventional commits
* [ ] CI passes (type-check, lint, tests, build)
* [ ] New functionality covered by tests
* [ ] No sensitive data in the diff
* [ ] Documentation updated
* [ ] Accessibility considerations tested
* [ ] DB migration files included and explained (if any)

---

## Testing guidelines

* Unit tests: `npm run test`
* E2E tests: `npm run test:e2e`
* Coverage: `npm run test:coverage`
* If adding features, include unit tests and update E2E flows where relevant.

---

## Database migrations (Prisma)

* Workflow for schema changes:

  1. Update `prisma/schema.prisma`.
  2. Create a migration locally:

     ```bash
     npx prisma migrate dev --name your_migration_name
     ```
  3. Run tests and verify `prisma/migrations/` SQL.
  4. Commit migration folder in PR.
* **Important**: Do not run `prisma migrate deploy` in PR CI. Production migrations run during deploy pipeline with approval.

---

## Security reporting

If you discover a security vulnerability, please open a private issue labelled `security` or email the security contact listed in `SECURITY.md`. Do not create public issues disclosing the vulnerability.

---

## Style & linting rules

* TypeScript strict mode enabled — prefer explicit types.
* ESLint + Prettier enforced.
* Keep components small and accessible by default.

---

## Translations & docs

* Keep docs in `/docs/`.
* For UI text, use i18n keys and provide English copy.
* When adding UI text, add translation keys and update language files.

---

## Contacts

* Project Lead: (TBD)
* Technical Lead: (TBD)
* For urgent matters, open an issue with label `critical`.

---

Thanks for contributing! We review PRs promptly and aim to keep the process smooth and friendly.

````

---

## 3) Pull request template — `.github/PULL_REQUEST_TEMPLATE.md`

```markdown
<!-- Path: .github/PULL_REQUEST_TEMPLATE.md -->
## Summary

<!-- Short description of the changes. -->

## Related Issue / Ticket
- Resolves: # (link issue)

## What I changed
- Key change 1
- Key change 2

## How to test
1. Steps to reproduce locally
2. Commands to run
   - `npm ci`
   - `npm run db:generate`
   - `npm run dev`

## Checklist
- [ ] I added tests that prove the fix or feature works
- [ ] I ran `npm run lint` and `npm run type-check`
- [ ] I updated relevant documentation in `/docs` or README
- [ ] If this introduces a DB change, I added a Prisma migration and described its impact

## Screenshots (if UI)
<!-- Paste before/after screenshots or screen recordings -->

## Notes for maintainers
- Any special deploy/migration steps
````

---

## 4) Ready-to-use PR (title + body) and exact Git commands

**Branch name**
`chore/ci-contrib`

**Suggested PR title**
`chore(ci): add CI workflow, contributing guidelines, and PR template`

**Suggested PR body**

```
This PR adds a robust CI workflow and contributor docs for the repository.

Files added:
- .github/workflows/ci.yml
- CONTRIBUTING.md
- .github/PULL_REQUEST_TEMPLATE.md

Why:
- Enforces type safety, linting, tests and build checks on PRs and pushes.
- Adds CodeQL security scanning and dependency audit artifacts.
- Standardizes contributor onboarding, PR expectations, and migration workflow.

Notes:
- Prisma migrations should be generated locally and included in PRs; CI runs prisma generate only.
- E2E tests are optional in PRs and may be gated by environment availability.

Next steps:
- Add `SECURITY.md` contact and project leads.
- Optionally enable Dependabot for dependency updates.
```

**Commands to create branch, add files, and push**

```bash
# from repo root
git checkout -b chore/ci-contrib

# create files locally (paste content from the three code blocks above into files)
# e.g.
# - .github/workflows/ci.yml
# - CONTRIBUTING.md
# - .github/PULL_REQUEST_TEMPLATE.md

git add .github/workflows/ci.yml CONTRIBUTING.md .github/PULL_REQUEST_TEMPLATE.md
git commit -m "chore(ci): add CI workflow and contributing guidelines"
git push origin chore/ci-contrib

# Create PR (with GitHub CLI) — optional:
gh pr create --title "chore(ci): add CI workflow, contributing guidelines, and PR template" --body-file ./pr-body.md --base main
```
