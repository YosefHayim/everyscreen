import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { runSuite } from "./run-suite";

const SUITE_CONFIG_PATH = fileURLToPath(
  new URL("live-suite/playwright.config.ts", import.meta.url),
);
const SUITE_TIMEOUT_MS = 180_000;

const noHubTest = test.extend<{ rootFolder: string }>({
  // biome-ignore lint/correctness/noEmptyPattern: Playwright requires a destructuring pattern here
  rootFolder: async ({}, use) => {
    const rootFolder = await mkdtemp(join(tmpdir(), "everyscreen-no-hub-"));
    await use(rootFolder);
    await rm(rootFolder, { recursive: true, force: true });
  },
});

noHubTest.describe("live suite without a hub", () => {
  noHubTest.setTimeout(SUITE_TIMEOUT_MS);

  noHubTest(
    "still runs every test and reports the missing hub once per process",
    async ({ rootFolder }) => {
      const suiteRun = await runSuite(SUITE_CONFIG_PATH, rootFolder);

      expect(suiteRun.exitCode).toBe(1);
      expect(suiteRun.stdout).toContain("2 passed");
      expect(suiteRun.stdout).toContain("2 failed");
      expect(suiteRun.stderr).toContain("could not reach the hub");
    },
  );
});
