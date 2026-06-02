import { expect, test } from "@playwright/test"

import { login } from "./fixtures/auth"

test.describe("categories", () => {
  test("create category and see it listed", async ({ page }) => {
    const name = `E2E Category ${Date.now()}`

    await login(page)
    await page.goto("/categories")

    await expect(page.getByRole("heading", { name: "Categories" })).toBeVisible()
    await page.getByLabel("Name").fill(name)
    await page.getByRole("button", { name: "Create" }).click()

    await expect(page.getByRole("cell", { name })).toBeVisible()
  })

  test("shows error when creating duplicate category name and type", async ({ page }) => {
    const name = `E2E Duplicate ${Date.now()}`

    await login(page)
    await page.goto("/categories")

    await page.getByLabel("Name").fill(name)
    await page.getByRole("button", { name: "Create" }).click()
    await expect(page.getByRole("cell", { name })).toBeVisible()

    await page.getByLabel("Name").fill(name)
    await page.getByRole("button", { name: "Create" }).click()
    await expect(page.getByText(/already exists/i)).toBeVisible()
  })
})
