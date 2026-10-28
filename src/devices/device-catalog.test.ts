import { devices } from "playwright";
import { describe, expect, test } from "vitest";
import { DEFAULT_GRID_DEVICES, DEVICE_CATALOG } from "@/devices/device-catalog";
import type { CatalogDevice } from "@/devices/devices-logic";

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
const MAX_DEFAULT_GRID_DEVICES = 12;

const listSizes = (catalogDevice: CatalogDevice): number[] => [
  catalogDevice.fullScreen.width,
  catalogDevice.fullScreen.height,
  catalogDevice.browserViewport.width,
  catalogDevice.browserViewport.height,
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
    const registryNames = DEVICE_CATALOG.flatMap(({ registryName }) =>
      registryName === null ? [] : [registryName],
    );

    const missingNames = registryNames.filter(
      (registryName) => devices[registryName] === undefined,
    );
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
    const badIds = DEVICE_CATALOG.filter(
      ({ fullScreen, browserViewport }) =>
        fullScreen.width <= 0 ||
        fullScreen.height <= 0 ||
        browserViewport.width > fullScreen.width ||
        browserViewport.height > fullScreen.height,
    ).map(({ id }) => id);

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

describe("DEFAULT_GRID_DEVICES", () => {
  test("holds at most twelve devices", () => {
    expect(DEFAULT_GRID_DEVICES.length).toBeLessThanOrEqual(
      MAX_DEFAULT_GRID_DEVICES,
    );
  });

  test("holds only devices that are in the catalog", () => {
    const catalogIds = DEVICE_CATALOG.map(({ id }) => id);

    const gridIds = DEFAULT_GRID_DEVICES.map(({ id }) => id);

    expect(catalogIds).toEqual(expect.arrayContaining(gridIds));
  });
});
