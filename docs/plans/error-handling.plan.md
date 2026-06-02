# Error handling

**Goal:** Clear user errors (toast / `QueryErrorPanel`); JSON `{ error: string }` from API; no empty UI on failed loads.

**Implemented:** `lib/shared/api-error.ts`, API route try/catch + validation strings, `fetchJson` / `parseApiError`, `QueryErrorPanel`, `app/(app)/error.tsx`, feature migrations. See [`AGENTS.md`](../../AGENTS.md#error-handling).

---

## Done

- [x] Phase 1 — `api-error` + tests + patterns
- [x] Phase 2 — API routes
- [x] Phase 3 — Client fetch + mutation toasts
- [x] Phase 4 — Query error UI (ledger, RSU, categories, savings, import, dashboard, income, stocks)
- [x] Phase 5 — `app/(app)/error.tsx`

---

## Optional

- [ ] Phase 6 — Import PDF server message in toast; BAC `warnings[]` in UI; Playwright duplicate-category error case

---

## Out of scope

i18n, Sentry, modal error dialogs, global `onError` toast for every query.
