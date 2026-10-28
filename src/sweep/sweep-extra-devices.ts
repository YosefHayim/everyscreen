import type { Browser } from "playwright";
import {
  BROWSER_TYPES,
  type DevicePage,
  NAME_HELPER_SCRIPT,
} from "@/devices/device-browsers";
import { emulateDevice } from "@/devices/device-emulation";
import type { BrowserName, DevicePreset } from "@/devices/devices-logic";

export type ExtraBrowsers = Map<BrowserName, Browser>;

const closeExtraBrowsers = async (
  extraBrowsers: ExtraBrowsers,
): Promise<void> => {
  const closeReplies = await Promise.allSettled(
    [...extraBrowsers.values()].map((extraBrowser) => extraBrowser.close()),
  );
  for (const closeReply of closeReplies) {
    const hasCloseFailed = closeReply.status === "rejected";
    if (hasCloseFailed) console.error({ error: closeReply.reason });
  }
};

// One shared browser per engine; they close at the end, even after a failure.
export const withExtraBrowsers = async <Visit>(
  extraPresets: DevicePreset[],
  visitWithBrowsers: (extraBrowsers: ExtraBrowsers) => Promise<Visit>,
): Promise<Visit> => {
  const extraBrowsers: ExtraBrowsers = new Map();
  const browserNames = new Set(
    extraPresets.map(({ browserName }) => browserName),
  );
  try {
    for (const browserName of browserNames) {
      const extraBrowser = await BROWSER_TYPES[browserName].launch({
        headless: true,
      });
      extraBrowsers.set(browserName, extraBrowser);
    }
    return await visitWithBrowsers(extraBrowsers);
  } finally {
    await closeExtraBrowsers(extraBrowsers);
  }
};

// The context lives only while one device is swept.
export const withExtraDevicePage = async <Visit>(
  extraBrowsers: ExtraBrowsers,
  devicePreset: DevicePreset,
  visitDevicePage: (devicePage: DevicePage) => Promise<Visit>,
): Promise<Visit> => {
  const extraBrowser = extraBrowsers.get(devicePreset.browserName);
  const isBrowserMissing = extraBrowser === undefined;
  if (isBrowserMissing) {
    throw new Error(`No sweep browser for ${devicePreset.browserName}`);
  }
  const browserContext = await extraBrowser.newContext(devicePreset.use);
  try {
    await browserContext.addInitScript(NAME_HELPER_SCRIPT);
    const page = await browserContext.newPage();
    const isChromium = devicePreset.browserName === "chromium";
    if (isChromium) await emulateDevice(page, devicePreset);
    return await visitDevicePage({
      device: devicePreset,
      page,
      hasLiveScreen: true,
    });
  } finally {
    await browserContext.close();
  }
};
