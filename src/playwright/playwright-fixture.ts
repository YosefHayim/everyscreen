import { test as base, type Page } from "@playwright/test";
import { SCREENCAST } from "@/environment";
import type { HubFile } from "@/hub/hub-file";
import {
  type DeviceProjectOptions,
  pickScreenHubUrl,
} from "@/playwright/playwright-logic";
import { type HubTarget, postToHub } from "@/playwright/post-to-hub";
import { readHubFileSafely } from "@/playwright/read-hub-file";
import {
  createHubTroubleReporter,
  type ReportHubTrouble,
} from "@/playwright/report-hub-trouble";

const SCREEN_INTERVAL_MS = 300;
const SCREENSHOT_TIMEOUT_MS = 2000;

type StopSendingScreens = () => Promise<void>;

interface WorkerHub {
  hubFile: HubFile | null;
  reportTrouble: ReportHubTrouble;
}

const sendScreenImage = async (
  page: Page,
  deviceId: string,
  hubTarget: HubTarget,
): Promise<void> => {
  const screenImage = await page.screenshot({
    type: SCREENCAST.format,
    quality: SCREENCAST.quality,
    scale: "css",
    timeout: SCREENSHOT_TIMEOUT_MS,
  });
  await postToHub(hubTarget, "/screens", {
    deviceId,
    imageBase64: screenImage.toString("base64"),
  });
};

const startSendingScreens = (
  page: Page,
  deviceId: string,
  hubTarget: HubTarget,
): StopSendingScreens => {
  const sending: { screenSend: Promise<void> | null } = { screenSend: null };

  const sendSafely = async (): Promise<void> => {
    try {
      await sendScreenImage(page, deviceId, hubTarget);
    } catch (error) {
      const isPageOpen = !page.isClosed();
      if (isPageOpen) hubTarget.reportTrouble(error);
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

export const test = base.extend<
  DeviceProjectOptions,
  { everyscreenHub: WorkerHub }
>({
  everyscreenDeviceId: [null, { option: true }],
  everyscreenHub: [
    // biome-ignore lint/correctness/noEmptyPattern: Playwright requires a destructuring pattern here
    async ({}, use) => {
      const reportTrouble = createHubTroubleReporter();
      const hubFile = readHubFileSafely(reportTrouble);
      await use({ hubFile, reportTrouble });
    },
    { scope: "worker" },
  ],
  page: async ({ page, everyscreenDeviceId, everyscreenHub }, use) => {
    const { hubFile, reportTrouble } = everyscreenHub;
    const screenHubUrl = pickScreenHubUrl(hubFile, everyscreenDeviceId);
    const isScreenSent = screenHubUrl !== null && everyscreenDeviceId !== null;
    if (isScreenSent) {
      const hubTarget = { hubUrl: screenHubUrl, reportTrouble };
      const stopSendingScreens = startSendingScreens(
        page,
        everyscreenDeviceId,
        hubTarget,
      );
      try {
        await use(page);
      } finally {
        await stopSendingScreens();
      }
      return;
    }
    await use(page);
  },
});

export const expect = base.expect;
