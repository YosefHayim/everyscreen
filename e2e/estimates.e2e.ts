import { type Browser, chromium, expect, test } from "@playwright/test";
import { startSampling } from "@/estimates/estimates-sampler";
import { type LiveMessage, subscribe } from "@/live/live-feed";

const ANIMATED_PAGE = `data:text/html,<style>
@keyframes slide { from { transform: translateX(0) } to { transform: translateX(200px) } }
.box { width: 50px; height: 50px; background: tomato; animation: slide 1s infinite alternate linear }
</style><div class="box"></div>`;
const SECOND_PAGE = `${ANIMATED_PAGE}<p>second page</p>`;
const NAVIGATION_POLL_TIMEOUT_MS = 10_000;

type EstimateMessage = Extract<LiveMessage, { kind: "estimate" }>;

const isEstimateMessage = (
  liveMessage: LiveMessage,
): liveMessage is EstimateMessage => liveMessage.kind === "estimate";

let browser: Browser | null = null;

test.afterEach(async () => {
  await browser?.close();
  browser = null;
});

test.describe("startSampling", () => {
  test("broadcasts an est. estimate with fps above zero and a status", async () => {
    browser = await chromium.launch();
    const page = await browser.newPage();
    const liveMessages: LiveMessage[] = [];
    const unsubscribe = subscribe((liveMessage) =>
      liveMessages.push(liveMessage),
    );

    await page.goto(ANIMATED_PAGE);
    const stopSampling = await startSampling(page, "iphone-se");
    const listBusyEstimates = () =>
      liveMessages
        .filter(isEstimateMessage)
        .filter((estimateMessage) => estimateMessage.deviceLoad.fps > 0);
    await expect.poll(() => listBusyEstimates().length).toBeGreaterThan(0);
    await stopSampling();
    unsubscribe();

    const [firstEstimate] = listBusyEstimates();
    expect(firstEstimate?.deviceId).toBe("iphone-se");
    expect(firstEstimate?.deviceLoad.label).toBe("est.");
    expect(["ok", "warn"]).toContain(firstEstimate?.deviceLoad.status);
  });

  test("keeps sampling after the page navigates, with no negative fps", async () => {
    browser = await chromium.launch();
    const page = await browser.newPage();
    const liveMessages: LiveMessage[] = [];
    const unsubscribe = subscribe((liveMessage) =>
      liveMessages.push(liveMessage),
    );

    await page.goto(ANIMATED_PAGE);
    const stopSampling = await startSampling(page, "pixel-8");
    await page.goto(SECOND_PAGE);
    const countEstimates = () => liveMessages.filter(isEstimateMessage).length;
    const estimatesAfterNavigation = countEstimates();
    await expect
      .poll(() => countEstimates(), { timeout: NAVIGATION_POLL_TIMEOUT_MS })
      .toBeGreaterThan(estimatesAfterNavigation + 1);
    await stopSampling();
    unsubscribe();

    const negativeEstimates = liveMessages
      .filter(isEstimateMessage)
      .filter((estimateMessage) => estimateMessage.deviceLoad.fps < 0);
    expect(negativeEstimates).toEqual([]);
  });
});
