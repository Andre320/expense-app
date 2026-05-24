# Expense App

Local-first expense and financial planning app built with Next.js and SQLite.

## Getting Started

This project uses [pnpm](https://pnpm.io) as its package manager.

### 1. Environment

Copy the example env file and adjust if needed:

```bash
cp .env.example .env
```

Required variable:

```env
DATABASE_URL="file:./dev.db"
```

This points Prisma at a SQLite file (`dev.db`) in the project root. The database file is gitignored.

### 2. Install dependencies

```bash
pnpm install
```

This runs `prisma generate` via `postinstall`, producing the Prisma client at `app/generated/prisma` (also gitignored).

### 3. Database setup

Apply migrations and optionally load demo data:

```bash
pnpm run db:setup
```

Or run the steps individually:

```bash
pnpm run db:migrate   # interactive — creates migration when schema changes
pnpm run db:seed      # optional demo categories, settings, savings goal
```

For CI or non-interactive environments, use `prisma migrate deploy` (included in `db:setup`).

### 4. Start the dev server

```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database

The app uses **SQLite** via Prisma 7 with the `better-sqlite3` driver adapter. Data is stored in a single local file (`dev.db` by default).

| Script | Purpose |
|--------|---------|
| `pnpm run db:migrate` | Apply schema changes interactively (creates new migration files) |
| `pnpm run db:push` | Push schema to DB without creating a migration (prototyping only) |
| `pnpm run db:seed` | Load optional demo data |
| `pnpm run db:setup` | Apply existing migrations + seed (good for first-time setup) |

### Schema changes

1. Edit `prisma/schema.prisma`
2. Run `pnpm run db:migrate` to create and apply a migration
3. Commit the new migration SQL under `prisma/migrations/`

API routes call `ensureAppDefaults()` on each request, so a fresh database works without seeding — seed is only for sample data.

## Scripts

```bash
pnpm run dev          # development server
pnpm run build        # production build
pnpm run start        # production server
pnpm run lint         # ESLint
pnpm run test         # Vitest
```
