import path from "node:path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"
import { productCoverageInclude } from "./vitest.coverage-globs"

const productCoverageExclude = [
  "**/*.test.ts",
  "**/*.test.tsx",
  "**/test/**",
  "**/generated/**",
  "**/*.d.ts",
  "lib/db/client.ts",
  "components/ui/**",
]

const resolveAlias = {
  "@": path.resolve(__dirname, "."),
  "server-only": path.resolve(__dirname, "lib/test/shims/server-only.ts"),
}

/** Reports coverage on lib + features + patterns + shell (no 95% gate until UI suite grows). */
export default defineConfig({
  plugins: [react()],
  resolve: { alias: resolveAlias },
  test: {
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage-product",
      reporter: ["text", "lcov"],
      include: productCoverageInclude,
      exclude: productCoverageExclude,
    },
    projects: [
      {
        extends: true,
        resolve: { alias: resolveAlias },
        test: {
          name: "unit",
          environment: "node",
          setupFiles: ["lib/test/setup.ts"],
          include: ["lib/**/*.test.ts", "lib/**/*.integration.test.ts", "components/**/*.test.ts"],
          exclude: ["node_modules", ".next", "**/generated/**"],
        },
      },
      {
        extends: true,
        plugins: [react()],
        resolve: { alias: resolveAlias },
        test: {
          name: "ui",
          environment: "jsdom",
          setupFiles: ["lib/test/setup.ts", "components/test/setup.tsx"],
          include: ["components/**/*.test.tsx"],
          exclude: ["node_modules", ".next", "**/generated/**"],
        },
      },
    ],
  },
})
