import { expect, test } from "@playwright/test"

import { login } from "./fixtures/auth"

test.describe("settings", () => {
  test("change CRC per USD rate and persist after reload", async ({ page }) => {
    const newRate = "512.75"

    await login(page)
    await page.goto("/settings")

    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible()

    const rateInput = page.getByLabel("CRC per 1 USD")
    await rateInput.fill(newRate)
    await page.getByRole("button", { name: "Save rate" }).click()
    await expect(page.getByText("Saved")).toBeVisible()

    await page.reload()
    await expect(rateInput).toHaveValue(newRate)
  })
})
