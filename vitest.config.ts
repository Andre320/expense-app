import path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["lib/test/setup.ts"],
    include: [
      "lib/**/*.test.ts",
      "lib/**/*.integration.test.ts",
      "components/features/**/*.test.ts",
    ],
    exclude: ["node_modules", ".next", "**/generated/**"],
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
      reporter: ["text", "lcov"],
      include: ["lib/**/*.ts"],
      exclude: ["**/*.test.ts", "**/test/**", "**/generated/**", "**/*.d.ts", "lib/db/client.ts"],
      thresholds: {
        statements: 85,
        branches: 85,
        functions: 85,
        lines: 85,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "server-only": path.resolve(__dirname, "lib/test/shims/server-only.ts"),
    },
  },
})
