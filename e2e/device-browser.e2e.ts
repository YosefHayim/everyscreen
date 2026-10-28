import { expect, test } from "@playwright/test";
import type { Browser, Page } from "playwright";
import { chromium } from "playwright";
import type { DeviceBrowser } from "@/devices/device-browsers";
import { startDeviceBrowser } from "@/devices/device-browsers";
import { SAFE_AREA_INSETS } from "@/devices/device-emulation";
import type { DevicePreset } from "@/devices/devices-logic";
import type { LiveMessage } from "@/live/live-feed";
import { subscribe } from "@/live/live-feed";
import { sendStepScreen, startScreencast } from "@/live/screencast";

const PAGE_URL = `data:text/html,${encodeURIComponent('<meta name="viewport" content="width=device-width"><body style=\'background:tomato\'><h1>Hollis Goods</h1></body>')}`;
const ANIMATED_PAGE_URL = `data:text/html,${encodeURIComponent("<style>@keyframes blink{50%{background:blue}}body{animation:blink 200ms infinite}</style><h1>Moving</h1>")}`;
const MOVING_SCREEN_COUNT = 4;
const JPEG_BASE64_PREFIX = "/9j/";
const PHONE_USER_AGENT = "Mozilla/5.0 (Spike phone) Everyscreen";
const PHONE_VIEWPORT = { width: 375, height: 667 };

const devicePreset: DevicePreset = {
  id: "spike-phone",
  name: "Spike phone",
  browserName: "chromium",
  frameShape: "dynamic-island",
  cpuSlowdown: 2,
  use: {
    viewport: PHONE_VIEWPORT,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: PHONE_USER_AGENT,
  },
};

const readEmulation = () => {
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:fixed;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)";
  document.body.append(probe);
  const probeStyle = getComputedStyle(probe);
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    userAgent: navigator.userAgent,
    hasTouch: navigator.maxTouchPoints > 0,
    insetPaddings: [probeStyle.paddingTop, probeStyle.paddingBottom],
  };
};

const listScreenMessages = (
  liveMessages: LiveMessage[],
  deviceId: string,
): Extract<LiveMessage, { kind: "screen" }>[] =>
  liveMessages.flatMap((liveMessage) => {
    const isScreenOfDevice =
      liveMessage.kind === "screen" && liveMessage.deviceId === deviceId;
    return isScreenOfDevice ? [liveMessage] : [];
  });

interface WatchedDevice {
  deviceBrowser: DeviceBrowser;
  otherClient: Browser;
}

test.describe("startDeviceBrowser", () => {
  const liveMessages: LiveMessage[] = [];
  const cleanups: Array<() => Promise<void>> = [];

  const startWatchedDevice = async (
    deviceId: string,
    watchedPages: Page[] = [],
  ): Promise<WatchedDevice> => {
    const recordingWatcher = async (page: Page) => {
      watchedPages.push(page);
      return async () => undefined;
    };
    const deviceBrowser = await startDeviceBrowser(
      { ...devicePreset, id: deviceId },
      [recordingWatcher, startScreencast],
    );
    const otherClient = await chromium.connect(deviceBrowser.wsEndpoint);
    cleanups.push(() => otherClient.close());
    cleanups.push(() => deviceBrowser.stop());
    return { deviceBrowser, otherClient };
  };

  test.beforeEach(() => {
    liveMessages.length = 0;
    const unsubscribe = subscribe((liveMessage) => {
      liveMessages.push(liveMessage);
    });
    cleanups.push(async () => unsubscribe());
  });

  test.afterEach(async () => {
    for (const cleanup of cleanups.reverse()) {
      await cleanup();
    }
    cleanups.length = 0;
  });

  test("watches a page from a new context of a second client and streams its screen image", async () => {
    const watchedPages: Page[] = [];
    const { otherClient } = await startWatchedDevice(
      "spike-phone",
      watchedPages,
    );
    const context = await otherClient.newContext();
    const page = await context.newPage();

    await page.goto(PAGE_URL);
    await expect.poll(() => watchedPages.length).toBe(1);
    await expect
      .poll(() => listScreenMessages(liveMessages, "spike-phone").length)
      .toBeGreaterThan(0);

    const [firstScreen] = listScreenMessages(liveMessages, "spike-phone");
    expect(firstScreen.imageBase64.startsWith(JPEG_BASE64_PREFIX)).toBe(true);
  });

  test("applies the viewport, user agent, touch and safe area insets to a bare new page", async () => {
    const { otherClient } = await startWatchedDevice("emulated-phone");
    const page = await otherClient.newPage();
    await page.goto(PAGE_URL);

    await expect
      .poll(() => page.evaluate(readEmulation))
      .toEqual({
        width: PHONE_VIEWPORT.width,
        height: PHONE_VIEWPORT.height,
        userAgent: PHONE_USER_AGENT,
        hasTouch: true,
        insetPaddings: [
          `${SAFE_AREA_INSETS["dynamic-island"].top}px`,
          `${SAFE_AREA_INSETS["dynamic-island"].bottom}px`,
        ],
      });
  });

  test("streams several screen images while the page moves", async () => {
    const { otherClient } = await startWatchedDevice("moving-phone");
    const page = await otherClient.newPage();

    await page.goto(ANIMATED_PAGE_URL);

    await expect
      .poll(() => listScreenMessages(liveMessages, "moving-phone").length)
      .toBeGreaterThanOrEqual(MOVING_SCREEN_COUNT);
  });

  test("moves the watchers back to the previous page when the newest page closes", async () => {
    const watchedPages: Page[] = [];
    const { otherClient } = await startWatchedDevice(
      "two-page-phone",
      watchedPages,
    );
    const firstPage = await otherClient.newPage();
    await firstPage.goto(PAGE_URL);
    await expect.poll(() => watchedPages.length).toBe(1);
    const secondPage = await otherClient.newPage();
    await secondPage.goto(ANIMATED_PAGE_URL);
    await expect.poll(() => watchedPages.length).toBe(2);

    await secondPage.close();

    await expect.poll(() => watchedPages.length).toBe(3);
  });

  test("opens a webkit page at the preset viewport and sends one step screen", async () => {
    const webkitPreset: DevicePreset = {
      id: "webkit-phone",
      name: "WebKit phone",
      browserName: "webkit",
      frameShape: "dynamic-island",
      cpuSlowdown: 1,
      use: {
        viewport: { width: 393, height: 852 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
      },
    };
    const deviceBrowser = await startDeviceBrowser(webkitPreset);
    cleanups.push(() => deviceBrowser.stop());

    const page = await deviceBrowser.openPage();
    await page.goto(PAGE_URL);
    const innerSize = await page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
    }));
    await sendStepScreen(page, "webkit-phone");

    expect(deviceBrowser.cdpUrl).toBeNull();
    expect(innerSize).toEqual({ width: 393, height: 852 });
    const screenMessages = listScreenMessages(liveMessages, "webkit-phone");
    expect(screenMessages).toHaveLength(1);
    expect(screenMessages[0].imageBase64.startsWith(JPEG_BASE64_PREFIX)).toBe(
      true,
    );
  });
});
