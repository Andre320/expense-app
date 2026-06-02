import { expect, test } from "@playwright/test"

import { login } from "./fixtures/auth"

test.describe("logout", () => {
  test("sign out redirects to login and protects routes", async ({ page }) => {
    await login(page)

    await page.getByRole("button", { name: "Sign out" }).click()
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible()

    await page.goto("/")
    await expect(page).toHaveURL(/\/login/)
  })
})
