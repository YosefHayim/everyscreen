import { once } from "node:events";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { chromium } from "playwright";
import { createServer } from "vite";
import { WebSocket } from "ws";
import { LIVE_PATH, LIVE_TESTS_PATH } from "@/environment";
import { type RunningHub, startHub } from "@/hub/hub-server";
import type { LiveMessage } from "@/live/live-feed";
import { STEP_TITLE_SEPARATOR } from "@/playwright/playwright-logic";
import { LIVE_DEVICE_IDS } from "./live-device-ids";
import { runSuite } from "./run-suite";
import { readCenterColor, type ScreenColor } from "./screen-color";

const SUITE_CONFIG_PATH = fileURLToPath(
  new URL("live-suite/playwright.config.ts", import.meta.url),
);
const STARTUP_TIMEOUT_MS = 240_000;
const RUN_SILENCE_WAIT_MS = 30_000;
const BLANK_FRAME_WAIT_MS = 3000;
const PASSING_TITLE = "shows the green page";
const FAILING_TITLE = "fails on purpose";
const GREEN_CHANNELS = { red: 34, green: 170, blue: 102 };
const COLOR_TOLERANCE = 20;
// WebKit tests send a screen image every tick; Chromium sends one per load and per switch back to the hub page.
const SCREEN_EXPECTATIONS = [
  { deviceId: "iphone-se", minScreenCount: 3 },
  { deviceId: "pixel-10", minScreenCount: 1 },
];

type ScreenMessage = Extract<LiveMessage, { kind: "screen" }>;
type TestMessage = Extract<LiveMessage, { kind: "test" }>;

interface HubFolders {
  runningHub: RunningHub;
  rootFolder: string;
}

const isGreen = (screenColor: ScreenColor): boolean =>
  Math.abs(screenColor.red - GREEN_CHANNELS.red) < COLOR_TOLERANCE &&
  Math.abs(screenColor.green - GREEN_CHANNELS.green) < COLOR_TOLERANCE &&
  Math.abs(screenColor.blue - GREEN_CHANNELS.blue) < COLOR_TOLERANCE;

const isScreenMessage = (
  liveMessage: LiveMessage,
): liveMessage is ScreenMessage => liveMessage.kind === "screen";

const isTestMessage = (liveMessage: LiveMessage): liveMessage is TestMessage =>
  liveMessage.kind === "test";

const listTestMessages = (
  liveMessages: LiveMessage[],
  deviceId: string,
): TestMessage[] =>
  liveMessages
    .filter(isTestMessage)
    .filter((testMessage) => testMessage.deviceId === deviceId);

const isRunningMessage = (
  liveMessage: LiveMessage,
  deviceId: string,
  testTitle: string,
): boolean =>
  isTestMessage(liveMessage) &&
  liveMessage.deviceId === deviceId &&
  liveMessage.status === "running" &&
  liveMessage.title.endsWith(testTitle);

const isFinishedMessage = (
  liveMessage: LiveMessage,
  deviceId: string,
  testTitle: string,
): boolean =>
  isTestMessage(liveMessage) &&
  liveMessage.deviceId === deviceId &&
  liveMessage.status !== "running" &&
  liveMessage.title.endsWith(testTitle);

const listScreensWhileRunning = (
  liveMessages: LiveMessage[],
  deviceId: string,
  testTitle: string,
): ScreenMessage[] => {
  const runningIndex = liveMessages.findIndex((liveMessage) =>
    isRunningMessage(liveMessage, deviceId, testTitle),
  );
  const finishedIndex = liveMessages.findIndex((liveMessage) =>
    isFinishedMessage(liveMessage, deviceId, testTitle),
  );
  const isRunningMissing = runningIndex === -1;
  const isFinishedMissing = finishedIndex === -1;
  if (isRunningMissing || isFinishedMissing) return [];

  return liveMessages
    .slice(runningIndex, finishedIndex)
    .filter(isScreenMessage)
    .filter((screenMessage) => screenMessage.deviceId === deviceId);
};

const IMAGE_URL_PREFIX = "data:image/jpeg;base64,";

const expectTileShowsTestPage = async (
  decoderPage: Page,
  deviceTile: Locator,
): Promise<void> => {
  await expect
    .poll(async () => {
      const imageUrl = await deviceTile
        .locator("img")
        .first()
        .getAttribute("src");
      const hasNoImage = imageUrl === null;
      if (hasNoImage) return false;
      const imageBase64 = imageUrl.replace(IMAGE_URL_PREFIX, "");
      const screenColor = await readCenterColor(decoderPage, imageBase64);
      return isGreen(screenColor);
    })
    .toBe(true);
};

const HOST = "127.0.0.1";
const DESKTOP_VIEWPORT = { width: 1440, height: 900 };

const startDashboard = async (hubUrl: string) => {
  const viteServer = await createServer({
    server: {
      host: HOST,
      port: 0,
      proxy: { "/api": { target: hubUrl, ws: true } },
    },
    logLevel: "silent",
  });
  await viteServer.listen();
  const dashboardAddress = viteServer.httpServer?.address() ?? null;
  const isDashboardAddressMissing =
    dashboardAddress === null || typeof dashboardAddress === "string";
  if (isDashboardAddressMissing) throw new Error("dashboard did not start");
  return {
    viteServer,
    dashboardUrl: `http://${HOST}:${dashboardAddress.port}`,
  };
};

const postToLiveTests = async (
  hubUrl: string,
  routePath: string,
  message: object,
): Promise<void> => {
  const hubReply = await fetch(`${hubUrl}${LIVE_TESTS_PATH}${routePath}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });
  expect(hubReply.status).toBe(204);
};

const createRunTotals = (changes: object = {}) => ({
  phase: "update",
  totalTests: 1,
  startedAt: Date.now(),
  endedAt: null,
  okCount: 0,
  failedCount: 0,
  outcome: null,
  endReason: null,
  ...changes,
});

const LATE_TEST = {
  deviceId: "iphone-se",
  testId: "late-1",
  title: "pays",
  specFile: "shop.spec.ts",
  errorLine: null,
};
const LATE_STEP_TITLES = ["Go to the cart", "Click Apply", "Click Pay"];

const liveTest = test.extend<object, { hubFolders: HubFolders }>({
  hubFolders: [
    // biome-ignore lint/correctness/noEmptyPattern: Playwright requires a destructuring pattern here
    async ({}, use) => {
      const rootFolder = await mkdtemp(join(tmpdir(), "everyscreen-live-"));
      const dashboardFolder = await mkdtemp(
        join(tmpdir(), "everyscreen-dashboard-"),
      );
      await writeFile(join(dashboardFolder, "index.html"), "<!doctype html>");
      const runningHub = await startHub({
        rootFolder,
        port: 0,
        dashboardFolder,
      });
      await use({ runningHub, rootFolder });
      await runningHub.stop();
      await rm(rootFolder, { recursive: true, force: true });
      await rm(dashboardFolder, { recursive: true, force: true });
    },
    { scope: "worker", timeout: STARTUP_TIMEOUT_MS },
  ],
});

liveTest.describe("live test runs", () => {
  liveTest(
    "streams screens and test events for a WebKit and a Chromium device",
    async ({ hubFolders }) => {
      liveTest.setTimeout(STARTUP_TIMEOUT_MS);
      const { runningHub, rootFolder } = hubFolders;
      const liveMessages: LiveMessage[] = [];
      const liveSocket = new WebSocket(
        `${runningHub.url.replace("http", "ws")}${LIVE_PATH}`,
      );
      liveSocket.on("message", (messageBytes) => {
        liveMessages.push(JSON.parse(messageBytes.toString()));
      });
      await once(liveSocket, "open");

      const suiteRun = await runSuite(SUITE_CONFIG_PATH, rootFolder);
      liveSocket.terminate();

      expect(suiteRun.exitCode).toBe(1);
      for (const deviceId of LIVE_DEVICE_IDS) {
        const testMessages = listTestMessages(liveMessages, deviceId);
        const eventSummaries = testMessages.map(
          ({ title, status }) =>
            `${status} ${title.split(STEP_TITLE_SEPARATOR).at(-1)}`,
        );
        expect(eventSummaries).toContain(`running ${PASSING_TITLE}`);
        expect(eventSummaries).toContain(`ok ${PASSING_TITLE}`);
        expect(eventSummaries).toContain(`running ${FAILING_TITLE}`);
        expect(eventSummaries).toContain(`failed ${FAILING_TITLE}`);
      }

      const browser = await chromium.launch();
      const decoderPage = await browser.newPage();
      try {
        for (const { deviceId, minScreenCount } of SCREEN_EXPECTATIONS) {
          const screenMessages = listScreensWhileRunning(
            liveMessages,
            deviceId,
            PASSING_TITLE,
          );
          expect(screenMessages.length).toBeGreaterThanOrEqual(minScreenCount);
          const centerColors = await Promise.all(
            screenMessages.map(({ imageBase64 }) =>
              readCenterColor(decoderPage, imageBase64),
            ),
          );
          expect(centerColors.some(isGreen)).toBe(true);
        }
      } finally {
        await browser.close();
      }
    },
  );

  liveTest(
    "shows the run bar and each tile's steps in the dashboard while the tests run",
    async ({ hubFolders, page }) => {
      liveTest.setTimeout(STARTUP_TIMEOUT_MS);
      const { runningHub, rootFolder } = hubFolders;
      const { viteServer, dashboardUrl } = await startDashboard(runningHub.url);
      try {
        await page.setViewportSize(DESKTOP_VIEWPORT);
        await page.goto(dashboardUrl);
        const runBar = page.getByRole("region", { name: "Test run" });
        const pixelTile = page
          .getByRole("article")
          .filter({ hasText: /Pixel 10(?! Pro)/ });
        const iphoneTile = page
          .getByRole("article")
          .filter({ hasText: "iPhone SE" });

        const suiteRun = runSuite(SUITE_CONFIG_PATH, rootFolder);

        await expect(
          runBar.getByText("Running", { exact: true }).first(),
        ).toBeVisible();
        await expect(pixelTile).toContainText(/step 2 · Wait for timeout/);
        await expect(iphoneTile).toContainText(/step 2 · Wait for timeout/);
        await expect(runBar).toContainText("live.suite.ts");
        await expectTileShowsTestPage(page, pixelTile);
        await expectTileShowsTestPage(page, iphoneTile);
        await suiteRun;

        await expect(
          runBar.getByText("Failed", { exact: true }).first(),
        ).toBeVisible();
        const counters = runBar.locator("dd");
        await expect(counters).toHaveText([
          "4 / 4",
          "2",
          "2",
          "0",
          /^\d+:\d\d$/,
        ]);
        await page.waitForTimeout(BLANK_FRAME_WAIT_MS);
        for (const deviceTile of [pixelTile, iphoneTile]) {
          await expectTileShowsTestPage(page, deviceTile);
          await expect(deviceTile).toContainText("fails on purpose");
          await expect(deviceTile).toContainText("toHaveTitle");
          await expect(deviceTile).toHaveClass(/bg-failed-soft/);
        }
      } finally {
        await viteServer.close();
      }
    },
  );

  liveTest(
    "shows step n of m on a dashboard that opens after the test finished",
    async ({ hubFolders, page }) => {
      const { runningHub } = hubFolders;
      const hubUrl = runningHub.url;
      await postToLiveTests(
        hubUrl,
        "/run",
        createRunTotals({ phase: "start" }),
      );
      await postToLiveTests(hubUrl, "/events", {
        ...LATE_TEST,
        status: "running",
      });
      for (const [stepPosition, stepTitle] of LATE_STEP_TITLES.entries()) {
        const stepEvent = {
          deviceId: LATE_TEST.deviceId,
          testId: LATE_TEST.testId,
          stepIndex: stepPosition + 1,
          stepTitle,
          errorLine: null,
        };
        await postToLiveTests(hubUrl, "/steps", {
          ...stepEvent,
          status: "running",
        });
        await postToLiveTests(hubUrl, "/steps", { ...stepEvent, status: "ok" });
      }
      await postToLiveTests(hubUrl, "/events", { ...LATE_TEST, status: "ok" });
      await postToLiveTests(
        hubUrl,
        "/run",
        createRunTotals({
          okCount: 1,
          endedAt: Date.now(),
          outcome: "ok",
          endReason: "reported",
        }),
      );
      const { viteServer, dashboardUrl } = await startDashboard(hubUrl);
      try {
        await page.setViewportSize(DESKTOP_VIEWPORT);
        await page.goto(dashboardUrl);

        const iphoneTile = page
          .getByRole("article")
          .filter({ hasText: "iPhone SE" });

        await expect(iphoneTile).toContainText(/step 3\/3 · Click Pay/);
      } finally {
        await viteServer.close();
      }
    },
  );

  liveTest(
    "ends a run that went silent as failed and says it stopped",
    async ({ hubFolders, page }) => {
      liveTest.setTimeout(STARTUP_TIMEOUT_MS);
      const { runningHub } = hubFolders;
      await postToLiveTests(
        runningHub.url,
        "/run",
        createRunTotals({ phase: "start" }),
      );
      await postToLiveTests(runningHub.url, "/events", {
        ...LATE_TEST,
        testId: "stuck-1",
        status: "running",
      });
      const { viteServer, dashboardUrl } = await startDashboard(runningHub.url);
      try {
        await page.setViewportSize(DESKTOP_VIEWPORT);
        await page.goto(dashboardUrl);
        const runBar = page.getByRole("region", { name: "Test run" });
        const iphoneTile = page
          .getByRole("article")
          .filter({ hasText: "iPhone SE" });
        await expect(
          runBar.getByText("Running", { exact: true }).first(),
        ).toBeVisible();
        await expect(iphoneTile).toContainText("running");

        await expect(runBar).toContainText("Run stopped without a report", {
          timeout: RUN_SILENCE_WAIT_MS,
        });
        await expect(
          runBar.getByText("Failed", { exact: true }).first(),
        ).toBeVisible();
        const failedCounter = runBar
          .locator("dt", { hasText: "Failed" })
          .locator("xpath=following-sibling::dd");
        await expect(failedCounter).toHaveText("1");
        await expect(iphoneTile).toContainText("failed");
        await expect(iphoneTile).toContainText("Run stopped without a report");
        await expect(iphoneTile).not.toContainText("running");
      } finally {
        await viteServer.close();
      }
    },
  );
});
