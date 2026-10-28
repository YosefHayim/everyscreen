import { setTimeout as sleep } from "node:timers/promises";
import type {
  Browser,
  BrowserContext,
  BrowserServer,
  BrowserType,
  Page,
} from "playwright";
import { chromium, firefox, webkit } from "playwright";
import { watchPage } from "@/checks/page-watch";
import { emulateDevice } from "@/devices/device-emulation";
import type { BrowserName, DevicePreset } from "@/devices/devices-logic";
import { HUB_HOST } from "@/environment";
import { startSampling } from "@/estimates/estimates-sampler";
import { runOneAtATime } from "@/hub/run-one-at-a-time";
import { readStoredFile } from "@/hub/stored-files";
import { startScreencast } from "@/live/screencast";

export type StopWatching = () => Promise<void>;

export type PageWatcher = (
  page: Page,
  deviceId: string,
) => Promise<StopWatching>;

export interface DevicePage {
  device: DevicePreset;
  page: Page;
  hasLiveScreen: boolean;
}

export interface DeviceBrowser {
  deviceId: string;
  browserName: BrowserName;
  wsEndpoint: string;
  cdpUrl: string | null;
  openPage: () => Promise<Page>;
  stop: () => Promise<void>;
}

const DEFAULT_PAGE_WATCHERS: Record<BrowserName, PageWatcher[]> = {
  chromium: [startScreencast, startSampling, watchPage],
  webkit: [],
  firefox: [],
};
const BROWSER_TYPES: Record<BrowserName, BrowserType> = {
  chromium,
  webkit,
  firefox,
};
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

const launchBrowserServer = async (
  browserName: BrowserName,
): Promise<BrowserServer> => {
  const isChromium = browserName === "chromium";
  if (isChromium) {
    return chromium.launchServer({
      headless: true,
      host: HUB_HOST,
      args: ["--remote-debugging-port=0"],
    });
  }
  return BROWSER_TYPES[browserName].launchServer({
    headless: true,
    host: HUB_HOST,
  });
};

const connectHubBrowser = async (
  browserName: BrowserName,
  wsEndpoint: string,
  cdpUrl: string | null,
): Promise<Browser> => {
  const isThereCdpUrl = cdpUrl !== null;
  if (isThereCdpUrl) return chromium.connectOverCDP(cdpUrl);
  return BROWSER_TYPES[browserName].connect(wsEndpoint);
};

export const startDeviceBrowser = async (
  devicePreset: DevicePreset,
  pageWatchers: PageWatcher[] = DEFAULT_PAGE_WATCHERS[devicePreset.browserName],
): Promise<DeviceBrowser> => {
  const { browserName } = devicePreset;
  const isChromium = browserName === "chromium";

  const browserServer = await launchBrowserServer(browserName);
  try {
    const wsEndpoint = browserServer.wsEndpoint();
    const cdpUrl = isChromium ? await readCdpUrl(browserServer) : null;
    const hubBrowser = await connectHubBrowser(browserName, wsEndpoint, cdpUrl);
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

      if (isChromium) {
        await emulateDevice(page, devicePreset);
        const cdpSession = await page.context().newCDPSession(page);
        await cdpSession.send("Emulation.setCPUThrottlingRate", {
          rate: devicePreset.cpuSlowdown,
        });
      }

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
      runOneAtATime(wsEndpoint, task).catch((error) => {
        console.error({ deviceId, error });
      });
    };

    const watchBrowserContext = (browserContext: BrowserContext): void => {
      browserContext.on("page", (page) => runSafely(() => trackPage(page)));
      for (const page of browserContext.pages()) {
        runSafely(() => trackPage(page));
      }
    };

    // WebKit and Firefox servers hide pages that other processes open, so only the hub's own pages are watched.
    if (isChromium) {
      for (const browserContext of hubBrowser.contexts()) {
        watchBrowserContext(browserContext);
      }
    }

    const openPage = async (): Promise<Page> => {
      const browserContext = await hubBrowser.newContext(devicePreset.use);
      const page = await browserContext.newPage();
      await runOneAtATime(wsEndpoint, () => trackPage(page));
      return page;
    };

    const stop = async (): Promise<void> => {
      try {
        const openWatchedPages = [...watchersByPage.entries()].filter(
          ([page]) => !page.isClosed(),
        );
        const allStopWatchers = openWatchedPages.flatMap(
          ([, stopWatchers]) => stopWatchers,
        );
        await stopPageWatchers(allStopWatchers, deviceId);
        await hubBrowser.close();
      } finally {
        await browserServer.close();
      }
    };

    return { deviceId, browserName, wsEndpoint, cdpUrl, openPage, stop };
  } catch (error) {
    await browserServer.close();
    throw new Error("Device browser failed to start", { cause: error });
  }
};
