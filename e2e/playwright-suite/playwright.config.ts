import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";
import { listDevices } from "@/playwright/playwright-devices";

const SUITE_FOLDER = fileURLToPath(new URL(".", import.meta.url));
const REPORTER_PATH = fileURLToPath(
  new URL("../../src/playwright/playwright-reporter.ts", import.meta.url),
);
const deviceIds = process.env.SUITE_DEVICE_IDS?.split(",") ?? null;

export default defineConfig({
  testDir: SUITE_FOLDER,
  outputDir: join(process.cwd(), "test-results"),
  testMatch: "**/*.suite.ts",
  expect: { timeout: 1000 },
  projects: listDevices(deviceIds),
  reporter: [["list"], [REPORTER_PATH]],
});
