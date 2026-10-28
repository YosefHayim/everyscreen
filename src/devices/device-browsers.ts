import { readFile } from "node:fs/promises";
import type { BrowserServer } from "playwright";
import { chromium, type Page } from "playwright";
import type { DevicePreset } from "@/devices/devices-logic";
import { HUB_HOST } from "@/environment";
import { startScreencast } from "@/live/screencast";

export type PageWatcher = (
  page: Page,
  deviceId: string,
) => Promise<() => Promise<void>>;

export interface DeviceBrowser {
  deviceId: string;
  wsEndpoint: string;
  cdpUrl: string;
  stop: () => Promise<void>;
}

const DEFAULT_WATCHERS: PageWatcher[] = [startScreencast];
const DEVTOOLS_PORT_FILE = "DevToolsActivePort";
const USER_DATA_DIR_FLAG = "--user-data-dir=";

const readCdpUrl = async (server: BrowserServer): Promise<string> => {
  const launchFlags = server.process().spawnargs;
  const userDataFlag = launchFlags.find((flag) =>
    flag.startsWith(USER_DATA_DIR_FLAG),
  );
  const hasUserDataFlag = userDataFlag !== undefined;
  if (!hasUserDataFlag)
    throw new Error("Device browser started without a user data folder");

  const userDataFolder = userDataFlag.slice(USER_DATA_DIR_FLAG.length);
  const portFile = await readFile(
    `${userDataFolder}/${DEVTOOLS_PORT_FILE}`,
    "utf8",
  );
  const [cdpPort] = portFile.split("\n");
  return `http://${HUB_HOST}:${cdpPort}`;
};

export const startDeviceBrowser = async (
  devicePreset: DevicePreset,
  pageWatchers: PageWatcher[] = DEFAULT_WATCHERS,
): Promise<DeviceBrowser> => {
  const server = await chromium.launchServer({
    headless: true,
    host: HUB_HOST,
    args: ["--remote-debugging-port=0"],
  });
  const wsEndpoint = server.wsEndpoint();
  const cdpUrl = await readCdpUrl(server);
  const watcherBrowser = await chromium.connectOverCDP(cdpUrl);

  const watchedPages = new WeakSet<Page>();
  const stopWatchers: Array<() => Promise<void>> = [];

  const watchPage = async (page: Page): Promise<void> => {
    const isAlreadyWatched = watchedPages.has(page);
    if (isAlreadyWatched) return;
    watchedPages.add(page);

    const session = await page.context().newCDPSession(page);
    await session.send("Emulation.setCPUThrottlingRate", {
      rate: devicePreset.cpuSlowdown,
    });
    for (const pageWatcher of pageWatchers) {
      const stopWatcher = await pageWatcher(page, devicePreset.id);
      stopWatchers.push(stopWatcher);
    }
  };

  const watchPageSafely = (page: Page): void => {
    watchPage(page).catch((error) => {
      console.error({ deviceId: devicePreset.id, error });
    });
  };

  const watchContext = (
    context: ReturnType<typeof watcherBrowser.contexts>[number],
  ): void => {
    context.on("page", watchPageSafely);
    for (const page of context.pages()) watchPageSafely(page);
  };

  for (const context of watcherBrowser.contexts()) watchContext(context);

  const stop = async (): Promise<void> => {
    for (const stopWatcher of stopWatchers)
      try {
        await stopWatcher();
      } catch (error) {
        console.error({ deviceId: devicePreset.id, error });
      }
    await watcherBrowser.close();
    await server.close();
  };

  return { deviceId: devicePreset.id, wsEndpoint, cdpUrl, stop };
};
