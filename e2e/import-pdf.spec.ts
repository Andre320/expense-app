import { test } from "@playwright/test"

test.describe("BAC PDF import", () => {
  test.skip(
    true,
    "No committed bac-sample.pdf fixture yet — add e2e/fixtures/bac-sample.pdf to enable",
  )

  test("upload BAC PDF on /import shows preview or success", async () => {
    // Placeholder for flow 6 in ui-coverage-and-e2e.plan.md
  })
})
