import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    include: ["src/**/*.test.ts"],
    coverage: {
      enabled: true,
      provider: "v8",
      include: ["src/**/*-logic.ts", "src/flows/flow-schema.ts"],
      thresholds: { branches: 100 },
    },
  },
});
