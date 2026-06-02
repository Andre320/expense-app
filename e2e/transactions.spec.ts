import { expect, test } from "@playwright/test"

import { login } from "./fixtures/auth"

test.describe("transactions", () => {
  test("create expense entry visible in ledger", async ({ page }) => {
    const description = `E2E expense ${Date.now()}`

    await login(page)
    await page.goto("/transactions")

    await expect(page.getByRole("heading", { name: "Ledger" })).toBeVisible()
    await page.getByLabel("Description").fill(description)
    await page.getByLabel("Amount").fill("42.50")
    await page.getByRole("button", { name: "Save entry" }).click()

    await expect(page.getByRole("cell", { name: description })).toBeVisible()
  })
})
