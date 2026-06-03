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

## Industry alignment (Next.js / Vercel)

| Practice            | This project                                         |
| ------------------- | ---------------------------------------------------- |
| Thin `app/` routing | Pages import from `components/features/*`            |
| Route groups        | `(auth)/`, `(app)/`                                  |
| API                 | Route Handlers + Zod + `apiRequireUser()` → services |
| Design system       | `components/ui/` (shadcn, line budget exempt)        |
| Domain logic        | `lib/<domain>/` + feature UI folders                 |
| Tests               | Co-located `*.test.ts` beside modules                |

See [Next.js project structure](https://nextjs.org/docs/app/getting-started/project-structure).

## Readability

- **Max 200 lines** per `.ts` / `.tsx` (product code; `components/ui/` exempt)
- **One primary export** per file; helpers in `*.parts.tsx`, `use-*.ts`, `*-queries.ts` / `*-mutations.ts`
- **Routes:** validate with Zod → `apiRequireUser()` → **one service function** → JSON
- **Files:** `kebab-case.ts`; **folders:** plural domain nouns (`income/`, `stocks/`)

### Split patterns

1. **React feature:** `use-*.ts` hooks + `*-form.tsx` / `*-list.tsx` + thin composer `*.tsx`
2. **Lib service:** `*.service.ts` + `*.helpers.ts` or read/mutations split
3. **Lib math:** facade + `forecast-holt.ts`-style modules
4. **Tests:** mirror production names (`plan.service.receive.test.ts`)

### New module checklist

- `lib/<domain>/services/<name>.service.ts` — stay under 200 lines
- Co-located tests; thin route in `app/api/`
- Feature UI split from day one

Reference: [`app/api/categories/route.ts`](app/api/categories/route.ts) + [`lib/categories/services/category.service.ts`](lib/categories/services/category.service.ts).

## Testing

- Co-located **`{module}.test.ts`** / **`{module}.test.tsx`** beside modules
- Integration: `*.integration.test.ts` (Postgres; skip without `DATABASE_URL`)
- Vitest: **unit** project (`node`) + **ui** project (`jsdom`); helpers in `components/test/`
- Vitest shim: `lib/test/shims/server-only.ts`
- **Coverage gate (`pnpm check`):** **≥95%** on `lib/**/*.ts` (`lib/db/client.ts` excluded)
- **Product coverage (report only):** `pnpm test:coverage:product` — `lib/` + `components/features|patterns|shell` (grow toward 95%; no CI gate)
- **E2E:** `pnpm test:e2e` — Playwright (`e2e/`); BAC fixture at `e2e/fixtures/bac-sample.pdf`; optional non-blocking CI in `.github/workflows/e2e.yml`
- **Integration:** `pnpm test:integration` — `*.integration.test.ts` (Postgres; runs in CI after migrate)
- **Error handling:** see below
- **Architecture:** Route Handlers + `lib/**/services/` (no Server Actions); savings goals use `goal.service.ts` like categories

### Error handling

- API failures: `{ error: string }` via `errorResponse` / `validationErrorResponse` from `@/lib/shared/api-error`
- Client: `fetchJson` / `parseApiError`; mutations → `toast.error(e.message)`; queries → `QueryErrorPanel` + retry (never empty state on `isError`)
- App boundary: `app/(app)/error.tsx`
- Meaningful tests only — branch/error paths, domain math, hooks with mocked `fetch`; no trivial asserts
- Run: `pnpm test`, `pnpm test:coverage`, `pnpm test:coverage:product`, full gate: `pnpm check`

| Scope                                      | CI gate (`pnpm check`)? | Notes                         |
| ------------------------------------------ | ----------------------- | ----------------------------- |
| `lib/**/*.ts`                              | Yes (≥95%)              | Domain logic                  |
| `components/features`, `patterns`, `shell` | Report via `:product`   | Vitest + RTL; grow toward 95% |
| `components/ui/`, `app/` pages             | No                      | shadcn; pages wired to E2E    |

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

- `max-lines`: **200** (skip blanks/comments); `components/ui/**` exempt
- `complexity`: warn at 15
- `--max-warnings 0` in CI
