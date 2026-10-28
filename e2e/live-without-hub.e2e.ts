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

test.describe("live suite without a hub", () => {
  test.setTimeout(SUITE_TIMEOUT_MS);

  let rootFolder = "";

  test.beforeEach(async () => {
    rootFolder = await mkdtemp(join(tmpdir(), "everyscreen-no-hub-"));
  });

  test.afterEach(async () => {
    await rm(rootFolder, { recursive: true, force: true });
  });

  test("still runs every test and reports the missing hub once per process", async () => {
    const suiteRun = await runSuite(SUITE_CONFIG_PATH, rootFolder);

    expect(suiteRun.exitCode).toBe(1);
    expect(suiteRun.stdout).toContain("2 passed");
    expect(suiteRun.stdout).toContain("2 failed");
    expect(suiteRun.stderr).toContain("could not reach the hub");
  });
});
