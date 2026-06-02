# Expense App

Multi-user expense and financial planning app built with Next.js, PostgreSQL, and Auth.js.

## Getting Started

This project uses [pnpm](https://pnpm.io) as its package manager.

### 1. Environment

Copy the example env file and adjust if needed:

```bash
cp .env.example .env
```

Required variables:

```env
DATABASE_URL="postgresql://expense:expense@localhost:5432/expense_app?schema=public"
AUTH_SECRET="generate-with-openssl-rand-base64-32"
```

Generate `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 2. Start PostgreSQL

```bash
docker compose up -d
```

### 3. Install dependencies

```bash
pnpm install
```

This runs `prisma generate` via `postinstall`, producing the Prisma client at `app/generated/prisma` (gitignored).

### 4. Database setup

Apply migrations and optionally load demo data:

```bash
pnpm run db:setup
```

Or run the steps individually:

```bash
pnpm run db:migrate   # interactive — creates migration when schema changes
pnpm run db:seed      # demo user + sample categories, settings, savings, RSU
```

For CI or non-interactive environments, use `prisma migrate deploy` (included in `db:setup`).

After seeding, sign in with:

- Email: `demo@example.com`
- Password: `demo-password-123`

### 5. Start the dev server

```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000). Unauthenticated requests redirect to `/login`.

## Authentication

- **Auth.js v5** with email/password credentials (JWT sessions)
- Register at `/register`; each user gets isolated settings, categories, transactions, savings, and RSU data
- API routes require a valid session (except `/api/auth/*`)

## Database

The app uses **PostgreSQL** via Prisma 7.

| Script                | Purpose                                                          |
| --------------------- | ---------------------------------------------------------------- |
| `pnpm run db:migrate` | Apply schema changes interactively (creates new migration files) |
| `pnpm run db:push`    | Push schema to DB without creating a migration (prototyping)     |
| `pnpm run db:seed`    | Load demo user and sample data                                   |
| `pnpm run db:setup`   | Apply existing migrations + seed                                 |

### Schema changes

1. Edit `prisma/schema.prisma`
2. Run `pnpm run db:migrate` to create and apply a migration
3. Commit the new migration SQL under `prisma/migrations/`

## Scripts

```bash
pnpm run dev          # development server
pnpm run build        # production build
pnpm run start        # production server
pnpm run check                 # format + lint + test coverage (lib ≥95% gate)
pnpm run lint                  # ESLint
pnpm run test                  # Vitest (lib + component tests)
pnpm run test:coverage:product # coverage report: lib + feature UI (95% target)
pnpm run test:e2e              # Playwright E2E (needs Docker + db:setup)
pnpm run test:e2e:ui           # Playwright interactive UI mode
```

Plans: [UI & E2E](docs/plans/ui-coverage-and-e2e.plan.md) · [Error handling](docs/plans/error-handling.plan.md) · [Industry standards audit](docs/plans/industry-standards-audit.md).

## E2E tests (Playwright)

End-to-end tests exercise real login, API, and database flows. They are **not** part of `pnpm check` (slow; requires Postgres).

### Prerequisites

1. Copy and configure env (see [Environment](#1-environment) above).
2. Start PostgreSQL:

   ```bash
   docker compose up -d
   ```

3. Apply migrations and seed the demo user:

   ```bash
   pnpm run db:setup
   ```

4. Install dependencies (includes `@playwright/test`):

   ```bash
   pnpm install
   pnpm exec playwright install chromium
   ```

### Run locally

Playwright starts `pnpm dev` automatically unless a server is already running on port 3000 (`reuseExistingServer`).

```bash
pnpm run test:e2e
```

Interactive/debug mode:

```bash
pnpm run test:e2e:ui
```

Demo credentials (from seed): `demo@example.com` / `demo-password-123`.

Ensure `.env` includes `DATABASE_URL` (Postgres) and `AUTH_SECRET`. Playwright injects a test-only `AUTH_SECRET` when starting the dev server if yours is unset; a manually started `pnpm dev` still needs a real secret.

### CI

Set `CI=true` so Playwright runs `pnpm build && pnpm start` instead of the dev server.
