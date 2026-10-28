import { expect, test } from "@playwright/test";
import { chromium, type Page } from "playwright";
import { startDeviceBrowser } from "@/devices/device-browsers";
import type { DevicePreset } from "@/devices/devices-logic";
import { type LiveMessage, subscribe } from "@/live/live-feed";
import { startScreencast } from "@/live/screencast";

const PAGE_URL = `data:text/html,${encodeURIComponent("<body style='background:tomato'><h1>Hollis Goods</h1></body>")}`;
const ANIMATED_PAGE_URL = `data:text/html,${encodeURIComponent("<style>@keyframes blink{50%{background:blue}}body{animation:blink 200ms infinite}</style><h1>Moving</h1>")}`;
const MOVING_SCREEN_COUNT = 4;
const JPEG_BASE64_PREFIX = "/9j/";

const devicePreset: DevicePreset = {
  id: "spike-phone",
  name: "Spike phone",
  browserName: "chromium",
  frameShape: "punch-hole",
  cpuSlowdown: 2,
  use: {
    viewport: { width: 375, height: 667 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
};

test.describe("startDeviceBrowser", () => {
  test("watches a page that a second client opens and streams its screen image", async () => {
    const watchedPages: Page[] = [];
    const screenMessages: LiveMessage[] = [];
    const unsubscribe = subscribe((message) => {
      if (message.kind === "screen") screenMessages.push(message);
    });
    const recordingWatcher = async (page: Page) => {
      watchedPages.push(page);
      return async () => undefined;
    };
    const deviceBrowser = await startDeviceBrowser(devicePreset, [
      recordingWatcher,
      startScreencast,
    ]);
    const otherClient = await chromium.connect(deviceBrowser.wsEndpoint);
    const context = await otherClient.newContext(devicePreset.use);
    const page = await context.newPage();

    await page.goto(PAGE_URL);
    await expect.poll(() => watchedPages.length).toBe(1);
    await expect.poll(() => screenMessages.length).toBeGreaterThan(0);

    const [firstScreen] = screenMessages;
    const isScreenKind = firstScreen.kind === "screen";
    expect(isScreenKind && firstScreen.deviceId).toBe("spike-phone");
    expect(
      isScreenKind && firstScreen.imageBase64.startsWith(JPEG_BASE64_PREFIX),
    ).toBe(true);

    await otherClient.close();
    unsubscribe();
    await deviceBrowser.stop();
  });

  test("streams several screen images while the page moves", async () => {
    const screenMessages: LiveMessage[] = [];
    const unsubscribe = subscribe((message) => {
      if (message.kind === "screen" && message.deviceId === "moving-phone")
        screenMessages.push(message);
    });
    const deviceBrowser = await startDeviceBrowser({
      ...devicePreset,
      id: "moving-phone",
    });
    const otherClient = await chromium.connect(deviceBrowser.wsEndpoint);
    const page = await otherClient.newPage();

    await page.goto(ANIMATED_PAGE_URL);
    await expect
      .poll(() => screenMessages.length)
      .toBeGreaterThanOrEqual(MOVING_SCREEN_COUNT);

    await otherClient.close();
    unsubscribe();
    await deviceBrowser.stop();
  });
});
