import { expect, test } from "@playwright/test"

import { login } from "./fixtures/auth"

test.describe("income", () => {
  test("smoke visit /income", async ({ page }) => {
    await login(page)
    await page.goto("/income")

    await expect(page.getByRole("heading", { name: "Income" })).toBeVisible()
    await expect(page.getByText("Salary and fixed bonuses")).toBeVisible()
  })
})
