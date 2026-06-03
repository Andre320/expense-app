import { expect, test } from "@playwright/test"

import { DEMO_EMAIL, DEMO_PASSWORD, login } from "./fixtures/auth"

test.describe("auth", () => {
  test("visit / redirects to /login when logged out", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible()
  })

  test("login succeeds and shows Dashboard", async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel("Email").fill(DEMO_EMAIL)
    await page.getByLabel("Password").fill(DEMO_PASSWORD)
    await page.getByRole("button", { name: "Sign in" }).click()

    await expect(page).toHaveURL("/")
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 15_000 })
  })

  test("authenticated session loads dashboard via helper", async ({ page }) => {
    await login(page)
    await expect(page.locator('a[data-sidebar="menu-button"][href="/income"]')).toBeVisible()
  })
})
