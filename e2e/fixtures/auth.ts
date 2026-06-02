import { expect, type Page } from "@playwright/test"

export const DEMO_EMAIL = "demo@example.com"
export const DEMO_PASSWORD = "demo-password-123"

export async function login(page: Page) {
  await page.goto("/login")
  await page.getByLabel("Email").fill(DEMO_EMAIL)
  await page.getByLabel("Password").fill(DEMO_PASSWORD)
  await page.getByRole("button", { name: "Sign in" }).click()
  await expect(page).toHaveURL("/")
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 15_000 })
}
