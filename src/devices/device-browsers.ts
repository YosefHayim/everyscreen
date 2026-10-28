import { setTimeout as sleep } from "node:timers/promises";
import type { BrowserContext, BrowserServer, Page } from "playwright";
import { chromium } from "playwright";
import { emulateDevice } from "@/devices/device-emulation";
import type { DevicePreset } from "@/devices/devices-logic";
import type { PageWatcher, StopWatching } from "@/devices/page-watcher";
import { HUB_HOST } from "@/environment";
import { runOneAtATime } from "@/hub/run-one-at-a-time";
import { readStoredFile } from "@/hub/stored-files";
import { startScreencast } from "@/live/screencast";

export interface DeviceBrowser {
  deviceId: string;
  wsEndpoint: string;
  cdpUrl: string;
  stop: () => Promise<void>;
}

const DEFAULT_WATCHERS: PageWatcher[] = [startScreencast];
const DEVTOOLS_PORT_FILE = "DevToolsActivePort";
const USER_DATA_DIR_FLAG = "--user-data-dir=";
const DEVTOOLS_PORT_TIMEOUT_MS = 5000;
const DEVTOOLS_PORT_RETRY_MS = 50;

const readCdpUrl = async (browserServer: BrowserServer): Promise<string> => {
  const launchFlags = browserServer.process().spawnargs;
  const userDataFlag = launchFlags.find((flag) =>
    flag.startsWith(USER_DATA_DIR_FLAG),
  );
  const hasUserDataFlag = userDataFlag !== undefined;
  if (!hasUserDataFlag) {
    throw new Error("Device browser started without a user data folder");
  }

  const userDataFolder = userDataFlag.slice(USER_DATA_DIR_FLAG.length);
  const portFilePath = `${userDataFolder}/${DEVTOOLS_PORT_FILE}`;
  const timeout = AbortSignal.timeout(DEVTOOLS_PORT_TIMEOUT_MS);
  while (!timeout.aborted) {
    const portFile = await readStoredFile(portFilePath);
    const isPortFileThere = portFile !== null;
    if (isPortFileThere) {
      const [cdpPort] = portFile.split("\n");
      return `http://${HUB_HOST}:${cdpPort}`;
    }
    await sleep(DEVTOOLS_PORT_RETRY_MS);
  }
  throw new Error("Device browser did not write its remote debugging port");
};

const stopPageWatchers = async (
  stopWatchers: StopWatching[],
  deviceId: string,
): Promise<void> => {
  for (const stopWatching of stopWatchers) {
    try {
      await stopWatching();
    } catch (error) {
      console.error({ deviceId, error });
    }
  }
};

export const startDeviceBrowser = async (
  devicePreset: DevicePreset,
  pageWatchers: PageWatcher[] = DEFAULT_WATCHERS,
): Promise<DeviceBrowser> => {
  const isChromium = devicePreset.browserName === "chromium";
  if (!isChromium) {
    throw new Error("Live device browsers run on Chromium only");
  }

  const browserServer = await chromium.launchServer({
    headless: true,
    host: HUB_HOST,
    args: ["--remote-debugging-port=0"],
  });
  try {
    const wsEndpoint = browserServer.wsEndpoint();
    const cdpUrl = await readCdpUrl(browserServer);
    const watcherBrowser = await chromium.connectOverCDP(cdpUrl);
    const deviceId = devicePreset.id;

    const openPages: Page[] = [];
    const watchersByPage = new Map<Page, StopWatching[]>();

    const startPageWatchers = async (page: Page): Promise<void> => {
      const stopWatchers: StopWatching[] = [];
      watchersByPage.set(page, stopWatchers);
      for (const pageWatcher of pageWatchers) {
        const stopWatching = await pageWatcher(page, deviceId);
        stopWatchers.push(stopWatching);
      }
    };

    const forgetPage = async (page: Page): Promise<void> => {
      const pageIndex = openPages.indexOf(page);
      const isPageKnown = pageIndex !== -1;
      if (!isPageKnown) return;

      const wasCurrentPage = pageIndex === openPages.length - 1;
      openPages.splice(pageIndex, 1);
      watchersByPage.delete(page);
      const [newestPage] = openPages.slice(-1);
      const isPreviousPageCurrent = wasCurrentPage && newestPage !== undefined;
      if (isPreviousPageCurrent) await startPageWatchers(newestPage);
    };

    const trackPage = async (page: Page): Promise<void> => {
      const isAlreadyTracked = openPages.includes(page);
      if (isAlreadyTracked) return;

      await emulateDevice(page, devicePreset);
      const cdpSession = await page.context().newCDPSession(page);
      await cdpSession.send("Emulation.setCPUThrottlingRate", {
        rate: devicePreset.cpuSlowdown,
      });

      const [currentPage] = openPages.slice(-1);
      const isThereCurrentPage = currentPage !== undefined;
      if (isThereCurrentPage) {
        const currentStopWatchers = watchersByPage.get(currentPage) ?? [];
        watchersByPage.delete(currentPage);
        await stopPageWatchers(currentStopWatchers, deviceId);
      }
      openPages.push(page);
      page.on("close", () => runSafely(() => forgetPage(page)));
      await startPageWatchers(page);
    };

    const runSafely = (task: () => Promise<void>): void => {
      runOneAtATime(cdpUrl, task).catch((error) => {
        console.error({ deviceId, error });
      });
    };

    const watchBrowserContext = (context: BrowserContext): void => {
      context.on("page", (page) => runSafely(() => trackPage(page)));
      for (const page of context.pages()) {
        runSafely(() => trackPage(page));
      }
    };

    for (const context of watcherBrowser.contexts()) {
      watchBrowserContext(context);
    }

    const stop = async (): Promise<void> => {
      try {
        const openWatchedPages = [...watchersByPage.entries()].filter(
          ([page]) => !page.isClosed(),
        );
        const allStopWatchers = openWatchedPages.flatMap(
          ([, stopWatchers]) => stopWatchers,
        );
        await stopPageWatchers(allStopWatchers, deviceId);
        await watcherBrowser.close();
      } finally {
        await browserServer.close();
      }
    };

    return { deviceId, wsEndpoint, cdpUrl, stop };
  } catch (error) {
    await browserServer.close();
    throw new Error("Device browser failed to start", { cause: error });
  }
};
