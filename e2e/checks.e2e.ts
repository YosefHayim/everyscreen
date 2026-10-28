import { pathToFileURL } from "node:url";
import {
  type Browser,
  type BrowserType,
  chromium,
  expect,
  test,
  webkit,
} from "@playwright/test";
import { measurePage } from "@/checks/check-probes";
import { type Finding, listFindings } from "@/checks/checks-logic";
import { watchPage } from "@/checks/page-watch";
import type { SafeAreaInsets } from "@/devices/devices-logic";
import { subscribe } from "@/live/live-feed";

const FIXTURE_URL = pathToFileURL("e2e/hollis-goods.html").href;
const SAFE_AREA_HEADER_URL = pathToFileURL("e2e/safe-area-header.html").href;
const PAGE_FINDING_COUNT = 2;
const PAGE_MESSAGES = [
  "Cart total failed to load",
  "/api/cart net::ERR_CONNECTION_REFUSED",
];
const LABEL_MESSAGE =
  "div.products:nth-of-type(2) > div.product:nth-of-type(1) > div.label:nth-of-type(1) cuts its text off";

interface Viewing {
  deviceId: string;
  width: number;
  height: number;
  hasTouch: boolean;
  safeArea: SafeAreaInsets;
}

const PHONE: Viewing = {
  deviceId: "iphone-se",
  width: 375,
  height: 667,
  hasTouch: true,
  safeArea: { top: 59, bottom: 34, left: 0, right: 0 },
};
const LAPTOP: Viewing = {
  deviceId: "laptop",
  width: 1280,
  height: 800,
  hasTouch: false,
  safeArea: { top: 0, bottom: 0, left: 0, right: 0 },
};

let browser: Browser;
let unsubscribe: () => void;
const watchedFindings: Finding[] = [];

test.beforeEach(async () => {
  watchedFindings.length = 0;
  browser = await chromium.launch();
  unsubscribe = subscribe((liveMessage) => {
    const isFindingMessage = liveMessage.kind === "finding";
    if (isFindingMessage) watchedFindings.push(liveMessage.finding);
  });
});

test.afterEach(async () => {
  unsubscribe();
  await browser.close();
});

const openAndCheck = async (viewing: Viewing) => {
  const { deviceId, width, height, hasTouch, safeArea } = viewing;
  const browserContext = await browser.newContext({
    viewport: { width, height },
    hasTouch,
  });
  const page = await browserContext.newPage();
  await watchPage(page, deviceId);

  await page.goto(FIXTURE_URL);
  await expect.poll(() => watchedFindings.length).toBe(PAGE_FINDING_COUNT);
  const measurements = await measurePage(page);
  const checkFindings = listFindings(measurements, {
    id: deviceId,
    hasTouch,
    safeAreaInsets: safeArea,
  });
  return { page, checkFindings };
};

const listMessages = (findings: Finding[]) =>
  findings.map((finding) => finding.message);

test("a 375px touch screen with insets shows overflow, a clipped label, the home bar and a small tap target", async () => {
  const { checkFindings } = await openAndCheck(PHONE);

  expect(listMessages(checkFindings)).toEqual([
    "div.cart-total:nth-of-type(3) is 121px past the edge",
    LABEL_MESSAGE,
    "button.checkout-bar:nth-of-type(2) sits under the notch or home bar",
    "button.md\\:flex:nth-of-type(1) is 30x30, under 44x44",
  ]);
  expect(listMessages(watchedFindings)).toEqual(PAGE_MESSAGES);
});

test("a 1280px screen without touch or insets shows only the clipped label", async () => {
  const { checkFindings } = await openAndCheck(LAPTOP);

  expect(listMessages(checkFindings)).toEqual([LABEL_MESSAGE]);
  expect(listMessages(watchedFindings)).toEqual(PAGE_MESSAGES);
});

test("every selector, with its escaped Tailwind class, finds exactly one element", async () => {
  const { page, checkFindings } = await openAndCheck(PHONE);

  const selectors = checkFindings.flatMap((finding) => finding.selector ?? []);
  const counts = await Promise.all(
    selectors.map((selector) => page.locator(selector).count()),
  );

  expect(counts).toEqual([1, 1, 1, 1]);
});

interface SafeAreaEngine {
  name: string;
  engine: BrowserType;
}

const SAFE_AREA_ENGINES: SafeAreaEngine[] = [
  { name: "WebKit iphone-se", engine: webkit },
  { name: "Chromium phone", engine: chromium },
];

for (const { name, engine } of SAFE_AREA_ENGINES) {
  test(`a header padded by env(safe-area-inset-top) gets no safe-area finding on ${name}`, async () => {
    const engineBrowser = await engine.launch();
    const browserContext = await engineBrowser.newContext({
      viewport: { width: PHONE.width, height: PHONE.height },
      hasTouch: true,
    });
    const page = await browserContext.newPage();

    await page.goto(SAFE_AREA_HEADER_URL);
    const measurements = await measurePage(page);
    const checkFindings = listFindings(measurements, {
      id: PHONE.deviceId,
      hasTouch: true,
      safeAreaInsets: PHONE.safeArea,
    });
    await engineBrowser.close();

    expect(measurements.isViewportCover).toBe(true);
    expect(measurements.pinnedBoxes[0]?.cssSafeAreaSides).toEqual({
      top: true,
      bottom: false,
    });
    expect(checkFindings.map((finding) => finding.kind)).not.toContain(
      "safe-area",
    );
  });
}
