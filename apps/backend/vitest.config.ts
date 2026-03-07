import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    env: {
      DYNAMODB_ENDPOINT: 'http://localhost:8100',
      DYNAMODB_REGION: 'us-east-1',
      DYNAMODB_TABLE_NAME: 'worktree-local',
      AWS_ACCESS_KEY_ID: 'local',
      AWS_SECRET_ACCESS_KEY: 'local',
      JWT_SECRET: 'wt_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0',
    },
    include: ["src/**/*.test.ts", "src/**/__tests__/**/*.ts"],
    exclude: ["node_modules", "dist"],
    testTimeout: 15000,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "src/**/__tests__/**",
        "src/index.ts",
        "src/ws-server.ts",
        "src/seed.ts",
      ],
      thresholds: {
        lines: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
