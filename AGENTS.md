<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Codebase conventions

## Folder structure

```
lib/
  auth/           Session helpers, onboarding, apiRequireUser
  db/             Prisma client + Postgres adapter
  shared/         Currency, decimal, serialize, validators, tag service
  income/         Salary/tax domain + settings/bonus/analytics services
  savings/        Goals, accounts, movement logic + services
  rsu/            Vesting, projection + plan service
  stocks/         Forecast, quotes, history
  import/         BAC parser, CSV import services
  store/          Known-store mapping + service
  planning/       Forecast planning helpers
  categories/     Category service
  transactions/   Transaction service
  test/           Test shims and fixtures only (not product tests)

components/
  ui/             shadcn primitives (max-lines exempt)
  patterns/       Shared layout patterns
  shell/          App chrome (site-shell)
  features/       Domain UI by feature (income, savings, stocks, rsu, …)
  providers/      React context providers

app/
  (app)/          Thin pages; import from components/features/*
  (auth)/         Login / register
  api/            Thin routes: validate → apiRequireUser → service → JSON
```

## Readability

- **Max ~250 lines** per `.ts` / `.tsx` (exceptions: `components/ui/` shadcn primitives)
- **One primary export** per file; helpers stay private or move to `*.utils.ts` in the same folder
- **Routes:** validate with Zod → `apiRequireUser()` → call **one service function** → return JSON (no inline Prisma)
- **Files:** `kebab-case.ts`; **folders:** plural domain nouns (`income/`, `stocks/`)

## Testing

- Co-located **`{module}.test.ts`** beside `{module}.ts` under `lib/` (not a top-level `tests/` tree)
- Integration tests: `*.integration.test.ts` (real Postgres; skip when `DATABASE_URL` unset)
- Vitest shim: `lib/test/shims/server-only.ts`
- Coverage thresholds (CI): **85%** statements, branches, functions, and lines on `lib/**/*.ts` (`lib/db/client.ts` excluded — app bootstrap singleton)
- Run: `pnpm test`, `pnpm test:coverage`, full gate: `pnpm check`

## Service layer

Every service method signature: `(prisma, userId, …)` — see `lib/income/services/settings.service.ts`.

```ts
export async function GET() {
  const ctx = await apiRequireUser()
  if (ctx.response) return ctx.response
  return NextResponse.json(await listCategories(prisma, ctx.userId))
}
```

## ESLint

- `max-lines`: warn at 250
- `complexity`: warn at 15
- `@typescript-eslint/consistent-type-imports`: error
