import path from "node:path"
import { expect, test } from "@playwright/test"

import { login } from "./fixtures/auth"

const bacSamplePdf = path.join(process.cwd(), "e2e", "fixtures", "bac-sample.pdf")

test.describe("BAC PDF import", () => {
  test("upload BAC PDF on /import shows preview or success", async ({ page }) => {
    await login(page)
    await page.goto("/activity")

    await expect(page.getByRole("heading", { name: "Command bar" })).toBeVisible()
    await page.getByRole("tab", { name: "PDF" }).click()
    await expect(page.getByText("BAC statement (PDF)")).toBeVisible()

    await page.locator("#pdf-bac").setInputFiles(bacSamplePdf)

    await expect(page.getByText("Parsed 1 purchase(s)").or(page.getByText("Preview"))).toBeVisible({
      timeout: 20_000,
    })

    await expect(page.getByRole("cell", { name: "12345678901" })).toBeVisible()
    await expect(page.getByRole("cell", { name: /SUPERMARKET/ })).toBeVisible()
  })
})
