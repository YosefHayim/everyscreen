import { expect, test } from "@playwright/test";
import type { DeviceBrowser } from "@/devices/device-browsers";
import { startDeviceBrowser } from "@/devices/device-browsers";
import { findCatalogPreset, type ViewportMode } from "@/devices/devices-logic";

const PAGE_URL = `data:text/html,${encodeURIComponent('<meta name="viewport" content="width=device-width"><h1>Hollis Goods</h1>')}`;

const VIEWPORT_CASES: {
  deviceId: string;
  viewportMode: ViewportMode;
}[] = [
  { deviceId: "iphone-15", viewportMode: "full-screen" },
  { deviceId: "iphone-15", viewportMode: "browser" },
  { deviceId: "pixel-8", viewportMode: "full-screen" },
  { deviceId: "pixel-8", viewportMode: "browser" },
];

for (const { deviceId, viewportMode } of VIEWPORT_CASES) {
  test(`${deviceId} in ${viewportMode} mode reports the catalog window and screen sizes`, async () => {
    const devicePreset = findCatalogPreset(deviceId, viewportMode);
    const deviceBrowser: DeviceBrowser = await startDeviceBrowser(devicePreset);

    try {
      const page = await deviceBrowser.openPage();
      await page.goto(PAGE_URL);

      const reportedSizes = await page.evaluate(() => ({
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
      }));

      expect(reportedSizes).toEqual({
        innerWidth: devicePreset.use.viewport?.width,
        innerHeight: devicePreset.use.viewport?.height,
        screenWidth: devicePreset.use.screen?.width,
        screenHeight: devicePreset.use.screen?.height,
      });
    } finally {
      await deviceBrowser.stop();
    }
  });
}
