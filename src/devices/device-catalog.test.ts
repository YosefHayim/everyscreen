import { devices } from "playwright";
import { describe, expect, test } from "vitest";
import { DEFAULT_GRID_IDS } from "@/devices/default-grid-ids";
import { DEVICE_CATALOG } from "@/devices/device-catalog";
import type { CatalogDevice, DeviceViewport } from "@/devices/devices-logic";

interface RegistrySizes {
  screen?: DeviceViewport;
  viewport: DeviceViewport;
}

const LEGACY_IDS = [
  "iphone-se",
  "iphone-15",
  "iphone-15-pro-max",
  "galaxy-s24",
  "pixel-8",
  "ipad-mini",
  "ipad-pro-11",
  "laptop-1440",
  "store-kiosk",
];
const EXPECTED_DEFAULT_GRID_IDS = [
  "iphone-se",
  "iphone-17",
  "iphone-17-pro-max",
  "galaxy-s25",
  "pixel-10",
  "xiaomi-15",
  "ipad-mini",
  "ipad-pro-11",
  "galaxy-tab-s9",
  "macbook-air-13",
  "windows-laptop-1366",
  "linux-1920",
];

const listSizes = (catalogDevice: CatalogDevice): number[] => [
  catalogDevice.fullScreen.width,
  catalogDevice.fullScreen.height,
  catalogDevice.browserViewport?.width ?? 0,
  catalogDevice.browserViewport?.height ?? 0,
  catalogDevice.deviceScaleFactor,
  catalogDevice.cornerRadius ?? 0,
  catalogDevice.cutout.width ?? 0,
  catalogDevice.cutout.height ?? 0,
  catalogDevice.cutout.top ?? 0,
  catalogDevice.cutout.left ?? 0,
  ...Object.values(catalogDevice.safeAreaInsets),
];

describe("DEVICE_CATALOG", () => {
  test("gives every device a unique id", () => {
    const catalogIds = DEVICE_CATALOG.map(({ id }) => id);

    expect(new Set(catalogIds).size).toBe(catalogIds.length);
  });

  test("keeps every id the old presets had", () => {
    const catalogIds = DEVICE_CATALOG.map(({ id }) => id);

    expect(catalogIds).toEqual(expect.arrayContaining(LEGACY_IDS));
  });

  test("only names devices that exist in the installed Playwright registry", () => {
    const registryNames = DEVICE_CATALOG.flatMap(({ registryName }) => {
      const hasRegistryName = registryName !== null;
      return hasRegistryName ? [registryName] : [];
    });

    const missingNames = registryNames.filter((registryName) => {
      const isRegistryDeviceMissing = devices[registryName] === undefined;
      return isRegistryDeviceMissing;
    });
    expect(registryNames.length).toBeGreaterThan(0);
    expect(missingNames).toEqual([]);
  });

  test("keeps every size, inset and radius at zero or more", () => {
    const negativeIds = DEVICE_CATALOG.filter((catalogDevice) =>
      listSizes(catalogDevice).some((size) => size < 0),
    ).map(({ id }) => id);

    expect(negativeIds).toEqual([]);
  });

  test("gives every full screen a positive size and a browser viewport that fits inside it", () => {
    const badIds = DEVICE_CATALOG.filter(({ fullScreen, browserViewport }) => {
      const hasNoFullScreenSize =
        fullScreen.width <= 0 || fullScreen.height <= 0;
      const isBrowserSizeKnown = browserViewport !== null;
      const isBrowserTooBig =
        isBrowserSizeKnown &&
        (browserViewport.width > fullScreen.width ||
          browserViewport.height > fullScreen.height);
      return hasNoFullScreenSize || isBrowserTooBig;
    }).map(({ id }) => id);

    expect(badIds).toEqual([]);
  });

  test("runs Apple phones and tablets on webkit and Android phones on chromium", () => {
    const wrongIds = DEVICE_CATALOG.filter(({ platform, browserName }) => {
      const isAppleMobile = platform === "ios" || platform === "ipados";
      const isWebkitWanted = isAppleMobile && browserName !== "webkit";
      const isChromiumWanted =
        platform === "android" && browserName !== "chromium";
      return isWebkitWanted || isChromiumWanted;
    }).map(({ id }) => id);

    expect(wrongIds).toEqual([]);
  });
});

describe("registry devices", () => {
  test("take their sizes from the Playwright registry", () => {
    const registryDevices = DEVICE_CATALOG.filter(
      ({ registryName }) => registryName !== null,
    );

    const wrongIds = registryDevices
      .filter((catalogDevice) => {
        const registryDevice: RegistrySizes =
          devices[catalogDevice.registryName ?? ""];
        const registryScreen = registryDevice.screen ?? registryDevice.viewport;
        const isFullScreenSame =
          catalogDevice.fullScreen.width === registryScreen.width &&
          catalogDevice.fullScreen.height === registryScreen.height;
        const isBrowserSame =
          catalogDevice.browserViewport?.width ===
            registryDevice.viewport.width &&
          catalogDevice.browserViewport?.height ===
            registryDevice.viewport.height;
        return !isFullScreenSame || !isBrowserSame;
      })
      .map(({ id }) => id);

    expect(registryDevices.length).toBeGreaterThan(0);
    expect(wrongIds).toEqual([]);
  });
});

describe("DEFAULT_GRID_IDS", () => {
  test("lists the twelve default devices in order", () => {
    expect(DEFAULT_GRID_IDS).toEqual(EXPECTED_DEFAULT_GRID_IDS);
  });

  test("holds only devices that are in the catalog", () => {
    const catalogIds = DEVICE_CATALOG.map(({ id }) => id);

    expect(catalogIds).toEqual(expect.arrayContaining(DEFAULT_GRID_IDS));
  });
});
