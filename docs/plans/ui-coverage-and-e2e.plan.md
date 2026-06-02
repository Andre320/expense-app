# UI coverage + E2E

**Goal:** Strong unit tests on product code + Playwright for auth/CRUD flows. **CI gate:** `lib/**/*.ts` ≥95% via `pnpm check`. **Report:** `pnpm test:coverage:product` (lib + features + patterns + shell).

**Excluded from coverage gate:** `components/ui/**`, `app/**` (E2E covers thin pages).

---

## Done

- [x] Vitest unit + ui (jsdom) projects, `components/test/*`
- [x] P0/P1 feature tests + hook/RTL tests (grow over time)
- [x] Playwright: auth, categories, transactions, income, settings, logout
- [x] README + AGENTS

---

## Remaining

- [ ] **E2E:** BAC PDF import — needs `e2e/fixtures/bac-sample.pdf` (spec currently skipped)
- [ ] **Product 95%:** raise `pnpm test:coverage:product` toward 95% (lib gate already green); optional CI job for product report only
- [ ] **Optional:** `.github/workflows/e2e.yml` (non-blocking)

---

## Commands

```bash
pnpm test                  # all Vitest
pnpm test:coverage         # lib gate (CI)
pnpm test:coverage:product # full product report
pnpm test:e2e              # Docker + pnpm db:setup + playwright install
```

Demo user: `demo@example.com` / `demo-password-123`
