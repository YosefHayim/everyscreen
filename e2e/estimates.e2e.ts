import { chromium, expect, test } from "@playwright/test";
import { startSampling } from "@/estimates/estimates-sampler";
import { type LiveMessage, subscribe } from "@/live/live-feed";

const ANIMATED_PAGE = `data:text/html,<style>
@keyframes slide { from { transform: translateX(0) } to { transform: translateX(200px) } }
.box { width: 50px; height: 50px; background: tomato; animation: slide 1s infinite alternate linear }
</style><div class="box"></div>`;
const SAMPLING_TIME_MS = 3500;

test.describe("startSampling", () => {
  test("broadcasts an est. estimate with fps above zero and a status", async () => {
    const browser = await chromium.launch({
      args: ["--remote-debugging-address=127.0.0.1"],
    });
    const page = await browser.newPage();
    const liveMessages: LiveMessage[] = [];
    const unsubscribe = subscribe((liveMessage) =>
      liveMessages.push(liveMessage),
    );

    await page.goto(ANIMATED_PAGE);
    const stop = await startSampling(page, "iphone-se");
    await page.waitForTimeout(SAMPLING_TIME_MS);
    stop();
    unsubscribe();
    await browser.close();

    const estimates = liveMessages.flatMap((liveMessage) =>
      liveMessage.kind === "estimate" ? [liveMessage] : [],
    );
    const busyEstimates = estimates.filter(
      (estimate) => estimate.deviceLoad.fps > 0,
    );
    expect(busyEstimates.length).toBeGreaterThan(0);
    expect(busyEstimates[0]?.deviceId).toBe("iphone-se");
    expect(busyEstimates[0]?.deviceLoad.label).toBe("est.");
    expect(["ok", "warn"]).toContain(busyEstimates[0]?.deviceLoad.status);
  });
});
