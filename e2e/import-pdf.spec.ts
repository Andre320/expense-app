import path from "node:path"
import { expect, test } from "@playwright/test"

import { login } from "./fixtures/auth"

const bacSamplePdf = path.join(process.cwd(), "e2e", "fixtures", "bac-sample.pdf")

test.describe("BAC PDF import", () => {
  test("upload BAC PDF on /activity shows preview table", async ({ page }) => {
    await login(page)
    await page.goto("/activity")

    await expect(page.getByRole("heading", { name: "Command bar" })).toBeVisible()
    await page.getByRole("tab", { name: "PDF" }).click()
    await expect(page.getByText("BAC statement (PDF)")).toBeVisible()

    const bacResponse = page.waitForResponse(
      (res) =>
        res.url().includes("/api/import/pdf/bac") && res.request().method() === "POST" && res.ok(),
    )
    await page.locator("#pdf-bac").setInputFiles(bacSamplePdf)
    const response = await bacResponse
    const payload = (await response.json()) as {
      transactions: { reference: string; bankDescription: string }[]
    }

    expect(payload.transactions).toHaveLength(1)
    expect(payload.transactions[0]?.reference).toBe("12345678901")
    expect(payload.transactions[0]?.bankDescription).toContain("SUPERMARKET")

    const preview = page.locator("#import-workspace")
    await expect(preview.getByText("12345678901")).toBeVisible({ timeout: 20_000 })
    await expect(preview.getByText(/SUPERMARKET/)).toBeVisible({ timeout: 20_000 })
    await expect(preview.getByRole("button", { name: "Save to ledger" })).toBeVisible()
  })
})
