import { defineConfig } from "@playwright/test";

// One hub listens on one port, so the suites run one at a time.
export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.e2e.ts",
  workers: 1,
});
