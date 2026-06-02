import "dotenv/config"

import { defineConfig, devices } from "@playwright/test"

const webEnv: Record<string, string> = {}
for (const key of ["DATABASE_URL", "AUTH_SECRET", "AUTH_URL"] as const) {
  const value = process.env[key]
  if (value) webEnv[key] = value
}
if (!webEnv.AUTH_SECRET) {
  webEnv.AUTH_SECRET = "e2e-test-auth-secret-not-for-production"
}

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: process.env.CI ? "pnpm build && pnpm start" : "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: process.env.CI ? 180_000 : 120_000,
    env: webEnv,
  },
})
