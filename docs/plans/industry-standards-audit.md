# Industry standards audit (this codebase)

Audit of common Next.js + Prisma guidance against **expense-app** as built: **Route Handlers** (`app/api/*`), **no Server Actions**, client pages + `fetch`, `lib/<domain>/services/`, Auth.js, local/LAN scope ([`SECURITY.md`](../../SECURITY.md)).

---

## Stack mapping

| Article term   | Here                                                       |
| -------------- | ---------------------------------------------------------- |
| Server Actions | `app/api/**` + `apiRequireUser()` + Zod                    |
| DAL            | `lib/**/services/*.service.ts` + `lib/shared/serialize.ts` |
| Client data    | `fetchJson` / React Query (not RSC props with Prisma rows) |

---

## Status

| Area                                        | Verdict             | Notes                                                                                                                  |
| ------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **API auth + validation**                   | Aligned             | Most routes: `apiRequireUser` → `safeParse` → `(prisma, userId)` service                                               |
| **Middleware-only security**                | Aligned             | Routes re-check auth; middleware is not the only gate                                                                  |
| **Service layer + `server-only`**           | Aligned             | No Prisma in `components/`; services isolated                                                                          |
| **DTO / leak prevention**                   | Aligned             | `serialize*` on API responses; register returns `{ id, email }` only                                                   |
| **Prisma singleton (dev)**                  | Aligned             | `globalForPrisma` in [`lib/db/client.ts`](../../lib/db/client.ts)                                                      |
| **Schema IDs + indexes**                    | Aligned             | `cuid()` IDs; `@@index([userId])` on tenant tables                                                                     |
| **Unit tests**                              | Aligned             | Vitest on `lib/`; `pnpm check` ≥95% coverage gate                                                                      |
| **E2E**                                     | Aligned             | Playwright `e2e/`; `pnpm test:e2e`                                                                                     |
| **Route-level Prisma**                      | Gap                 | [`app/api/savings/[id]/route.ts`](../../app/api/savings/[id]/route.ts) — move to `goal.service`                        |
| **Connection pooler (prod)**                | Gap when serverless | Direct `DATABASE_URL` in [`.env.example`](../../.env.example); document PgBouncer/Supavisor before Vercel deploy       |
| **Lean `select` everywhere**                | Optional            | `include` on list queries is fine at current scale                                                                     |
| **DB integration suite**                    | Partial             | [`tenant-isolation.integration.test.ts`](../../lib/auth/tenant-isolation.integration.test.ts) only; no CI Postgres yet |
| **Server Actions / `lib/dal/` / Taint API** | N/A                 | Wrong pattern for this repo                                                                                            |

---

## Do next (actionable)

### Now

1. **Refactor** `app/api/savings/[id]/route.ts` — PATCH/DELETE via `lib/savings/services/goal.service.ts` (match categories/transactions routes).
2. **Document** production DB pooling in `.env.example` + README when deploying off localhost, e.g. pooler URL and `connection_limit=1` for serverless.

### Later

3. **Integration tests in CI** — run `*.integration.test.ts` against Docker Postgres on PRs (extend existing tenant-isolation pattern; truncate or fresh DB per suite if needed).
4. **Lean `select`** on hot paths only if analytics/list endpoints slow down (e.g. `analytics.service.ts`).

### Skip

- Server Action templates, rename to `lib/dal/`, React Taint API (low value while staying API + client-fetch).
- Testcontainers unless you outgrow Docker Compose + `DATABASE_URL` in CI.
- Mandatory `select` on every Prisma call for a personal/LAN app.

---

## PR checklist (this repo)

| Check       | Reject                            | Approve                                              |
| ----------- | --------------------------------- | ---------------------------------------------------- |
| Data access | `prisma.*` in `app/(app)/**` page | Logic in `lib/**/services/`                          |
| API route   | No auth/Zod                       | `apiRequireUser` + validator + service               |
| Response    | Raw Prisma model with secrets     | `serialize*` or minimal JSON                         |
| Secrets     | `NEXT_PUBLIC_` for DB/auth keys   | Server env only (`AUTH_SECRET`, `DATABASE_URL`)      |
| Tests       | Trivial assert only               | Domain/branch tests or integration where DAL changes |

---

## Tracking

- [ ] Savings goal route → service layer
- [ ] Production pooler docs in `.env.example`
- [ ] Optional: integration tests in CI
