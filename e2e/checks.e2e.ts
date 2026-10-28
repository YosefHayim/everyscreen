import { pathToFileURL } from "node:url";
import { type Browser, chromium, expect, test } from "@playwright/test";
import { measurePage } from "@/checks/check-probes";
import { type Finding, listFindings } from "@/checks/checks-logic";
import { watchPage } from "@/checks/page-watch";
import { subscribe } from "@/live/live-feed";

const FIXTURE_URL = pathToFileURL("e2e/hollis-goods.html").href;
const WATCH_SETTLE_MS = 500;

interface Viewing {
  deviceId: string;
  width: number;
  height: number;
  hasTouch: boolean;
}

const PHONE: Viewing = {
  deviceId: "iphone-se",
  width: 375,
  height: 667,
  hasTouch: true,
};
const LAPTOP: Viewing = {
  deviceId: "laptop",
  width: 1280,
  height: 800,
  hasTouch: false,
};

let browser: Browser;

test.beforeAll(async () => {
  browser = await chromium.launch();
});

test.afterAll(async () => {
  await browser.close();
});

const openAndCheck = async (viewing: Viewing) => {
  const { deviceId, width, height, hasTouch } = viewing;
  const context = await browser.newContext({
    viewport: { width, height },
    hasTouch,
  });
  const page = await context.newPage();
  const watchedFindings: Finding[] = [];
  const unsubscribe = subscribe((liveMessage) => {
    if (liveMessage.kind === "finding") {
      watchedFindings.push(liveMessage.finding);
    }
  });
  const stopWatching = watchPage(page, deviceId);

  await page.goto(FIXTURE_URL);
  await page.waitForTimeout(WATCH_SETTLE_MS);
  const measurements = await measurePage(page);
  const checkFindings = listFindings(measurements, { id: deviceId, hasTouch });

  stopWatching();
  unsubscribe();
  await context.close();
  return { watchedFindings, checkFindings };
};

test("finds the four layout and page problems on a 375px touch screen", async () => {
  const { watchedFindings, checkFindings } = await openAndCheck(PHONE);

  expect(checkFindings.map((finding) => finding.message)).toEqual([
    ".cart-total is 121px past the edge",
    ".label cuts its text off",
    ".small-button is 30x30, under 44x44",
  ]);
  expect(watchedFindings.map((finding) => finding.message)).toEqual([
    "Cart total failed to load",
    "/api/cart net::ERR_CONNECTION_REFUSED",
  ]);
});

test("finds only the clipped labels and the page problems on a laptop", async () => {
  const { watchedFindings, checkFindings } = await openAndCheck(LAPTOP);

  expect(checkFindings.map((finding) => finding.message)).toEqual([
    ".label cuts its text off",
  ]);
  expect(watchedFindings.map((finding) => finding.message)).toEqual([
    "Cart total failed to load",
    "/api/cart net::ERR_CONNECTION_REFUSED",
  ]);
});
