# Expense App

Personal expense tracker and financial planner: ledger, categories, BAC/CSV import, Costa Rica income/tax planner, savings goals, RSU vesting, and stock quotes. Each user has isolated data (Auth.js login).

**Stack:** [Next.js](https://nextjs.org) (App Router) · React · TypeScript · [Prisma](https://www.prisma.io) · PostgreSQL · [Auth.js](https://authjs.dev) · Tailwind · Vitest · Playwright

## Prerequisites

- [Node.js](https://nodejs.org) 22+
- [pnpm](https://pnpm.io) — `npm install -g pnpm`
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (runs PostgreSQL locally)

## Quick start

From the project root:

```bash
pnpm setup
pnpm dev
```

`pnpm setup` runs [`scripts/init.mjs`](scripts/init.mjs). It only does work that is still missing:

1. Creates `.env` from `.env.example` and generates `AUTH_SECRET` if needed
2. Starts Postgres with Docker (`docker compose up -d`)
3. Runs `pnpm install` if `node_modules` is absent
4. Runs migrations + demo seed if the database is not initialized yet

Open [http://localhost:3000](http://localhost:3000) and sign in:

| Email              | Password            |
| ------------------ | ------------------- |
| `demo@example.com` | `demo-password-123` |

Register at `/register` for your own account.

## Manual setup (optional)

```bash
cp .env.example .env          # then set AUTH_SECRET (openssl rand -base64 32)
docker compose up -d
pnpm install
pnpm run db:setup             # migrate + seed
pnpm dev
```

## Useful commands

| Command             | Purpose                             |
| ------------------- | ----------------------------------- |
| `pnpm dev`          | Development server                  |
| `pnpm build`        | Production build                    |
| `pnpm check`        | Format, lint, tests (CI gate)       |
| `pnpm run db:setup` | Apply migrations and seed           |
| `pnpm test:e2e`     | Playwright E2E (after `pnpm setup`) |

For production Postgres, use a **pooler** URL in `DATABASE_URL` (see comments in [`.env.example`](.env.example)).
