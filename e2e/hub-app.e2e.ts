import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { createHubApp } from "@/hub/hub-app";

test.describe("createHubApp", () => {
  let rootFolder = "";

  test.beforeEach(async () => {
    rootFolder = await mkdtemp(join(tmpdir(), "everyscreen-hub-app-"));
  });

  test.afterEach(async () => {
    await rm(rootFolder, { recursive: true, force: true });
  });

  test("serves the device grid under /api/devices", async () => {
    const hubApp = createHubApp(rootFolder);

    const devicesReply = await hubApp.request("/api/devices");

    expect(devicesReply.status).toBe(200);
  });

  test("answers a missing run with a problem reply", async () => {
    const hubApp = createHubApp(rootFolder);

    const runReply = await hubApp.request("/api/runs/run-404");

    expect(runReply.status).toBe(404);
    expect(runReply.headers.get("Content-Type")).toBe(
      "application/problem+json",
    );
  });
});
