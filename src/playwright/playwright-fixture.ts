import { test as base, type Page } from "@playwright/test";
import { SCREENCAST } from "@/environment";
import { readHubFile } from "@/playwright/hub-link";
import { postToHub, reportHubTroubleOnce } from "@/playwright/hub-post";
import {
  type DeviceProjectOptions,
  isScreenSentByTest,
} from "@/playwright/playwright-logic";

const SCREEN_INTERVAL_MS = 300;
const SCREENSHOT_TIMEOUT_MS = 2000;

type StopSendingScreens = () => Promise<void>;

const sendScreenImage = async (page: Page, deviceId: string): Promise<void> => {
  const screenImage = await page.screenshot({
    type: SCREENCAST.format,
    quality: SCREENCAST.quality,
    scale: "css",
    timeout: SCREENSHOT_TIMEOUT_MS,
  });
  await postToHub("/screens", {
    deviceId,
    imageBase64: screenImage.toString("base64"),
  });
};

const startSendingScreens = (
  page: Page,
  deviceId: string,
): StopSendingScreens => {
  const sending: { screenSend: Promise<void> | null } = { screenSend: null };

  const sendSafely = async (): Promise<void> => {
    try {
      await sendScreenImage(page, deviceId);
    } catch (error) {
      const isPageOpen = !page.isClosed();
      if (isPageOpen) reportHubTroubleOnce(error);
    } finally {
      sending.screenSend = null;
    }
  };

  const sendOnTick = (): void => {
    const isPreviousImageInFlight = sending.screenSend !== null;
    if (isPreviousImageInFlight) return;
    sending.screenSend = sendSafely();
  };

  const tickTimer = setInterval(sendOnTick, SCREEN_INTERVAL_MS);
  return async () => {
    clearInterval(tickTimer);
    await sending.screenSend;
  };
};

export const test = base.extend<DeviceProjectOptions>({
  everyscreenDeviceId: [null, { option: true }],
  page: async ({ page, everyscreenDeviceId }, use) => {
    const isDeviceIdMissing = everyscreenDeviceId === null;
    if (isDeviceIdMissing) {
      await use(page);
      return;
    }

    const isSendingScreens = isScreenSentByTest(
      readHubFile(),
      everyscreenDeviceId,
    );
    const isHubWatching = !isSendingScreens;
    if (isHubWatching) {
      await use(page);
      return;
    }

    const stopSendingScreens = startSendingScreens(page, everyscreenDeviceId);
    try {
      await use(page);
    } finally {
      await stopSendingScreens();
    }
  },
});

export const expect = base.expect;
