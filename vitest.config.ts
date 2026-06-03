import path from "node:path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

const libCoverageInclude = ["lib/**/*.ts"]

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

export default defineConfig({
  plugins: [react()],
  resolve: { alias: resolveAlias },
  test: {
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
      reporter: ["text", "lcov"],
      include: libCoverageInclude,
      exclude: productCoverageExclude,
      thresholds: {
        statements: 95,
        branches: 95,
        functions: 95,
        lines: 95,
      },
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
        resolve: { alias: resolveAlias },
        test: {
          name: "integration",
          environment: "node",
          setupFiles: ["lib/test/setup.ts"],
          include: ["lib/**/*.integration.test.ts"],
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
