import { HTTPException } from "hono/http-exception";
import { describe, expect, test } from "vitest";
import { DEFAULT_GRID_IDS } from "@/devices/default-grid-ids";
import { DEVICE_CATALOG } from "@/devices/device-catalog";
import type { CustomDevice, DevicesFile } from "@/devices/device-schema";
import {
  checkDeviceIds,
  checkDeviceRemoval,
  checkNewDevice,
  createPresetFromCustomDevice,
  findCatalogPreset,
  listCatalogReplies,
  pickDeviceId,
  pickDeviceScreen,
  pickDeviceViewport,
  pickGridChanges,
  pickGridDevices,
  replaceGrid,
} from "@/devices/devices-logic";
import { CPU_TIERS } from "@/environment";

const TOUCH_KIOSK: CustomDevice = {
  name: "Shop kiosk",
  width: 800,
  height: 1280,
  pixelRatio: 2,
  hasTouch: true,
  frameShape: "kiosk",
  browserName: "chromium",
};

const MOUSE_SCREEN: CustomDevice = {
  ...TOUCH_KIOSK,
  name: "Wall screen",
  hasTouch: false,
};

const readStatus = (action: () => void): number | null => {
  try {
    action();
  } catch (error) {
    const isHttpError = error instanceof HTTPException;
    if (isHttpError) return error.status;
  }
  return null;
};

describe("pickDeviceId", () => {
  test("turns the name into a kebab-case id", () => {
    const deviceId = pickDeviceId("iPhone 15 Pro Max");

    expect(deviceId).toBe("iphone-15-pro-max");
  });

  test("drops symbols and dashes at the edges", () => {
    const deviceId = pickDeviceId("  Store kiosk (lobby)! ");

    expect(deviceId).toBe("store-kiosk-lobby");
  });

  test("keeps Hebrew letters in the id", () => {
    const deviceId = pickDeviceId("קיוסק 2");

    expect(deviceId).toBe("קיוסק-2");
  });
});

describe("createPresetFromCustomDevice", () => {
  test("makes a touch device a mobile phone-speed preset", () => {
    const devicePreset = createPresetFromCustomDevice(TOUCH_KIOSK);

    expect(devicePreset.id).toBe("shop-kiosk");
    expect(devicePreset.cpuSlowdown).toBe(CPU_TIERS.phone);
    expect(devicePreset.use).toEqual({
      viewport: { width: 800, height: 1280 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
  });

  test("makes a device without touch a desktop-speed preset", () => {
    const devicePreset = createPresetFromCustomDevice(MOUSE_SCREEN);

    expect(devicePreset.cpuSlowdown).toBe(CPU_TIERS.desktop);
    expect(devicePreset.use.isMobile).toBe(false);
  });

  test("keeps webkit for a webkit custom device", () => {
    const webkitDevice: CustomDevice = {
      ...TOUCH_KIOSK,
      browserName: "webkit",
    };

    const devicePreset = createPresetFromCustomDevice(webkitDevice);

    expect(devicePreset.browserName).toBe("webkit");
    expect(devicePreset.use.isMobile).toBe(true);
  });

  test("gives a firefox touch device no mobile mode but keeps touch", () => {
    const firefoxDevice: CustomDevice = {
      ...TOUCH_KIOSK,
      browserName: "firefox",
    };

    const devicePreset = createPresetFromCustomDevice(firefoxDevice);

    expect(devicePreset.browserName).toBe("firefox");
    expect(devicePreset.use.isMobile).toBe(false);
    expect(devicePreset.use.hasTouch).toBe(true);
  });
});

describe("findCatalogPreset", () => {
  test("uses the full screen as the viewport and the screen", () => {
    const devicePreset = findCatalogPreset("iphone-15", "full-screen");

    expect(devicePreset.viewportMode).toBe("full-screen");
    expect(devicePreset.use.viewport).toEqual({ width: 393, height: 852 });
    expect(devicePreset.use.screen).toEqual({ width: 393, height: 852 });
    expect(devicePreset.isCustom).toBe(false);
  });

  test("uses the size inside the browser bars but keeps the full screen as the screen", () => {
    const devicePreset = findCatalogPreset("iphone-15", "browser");

    expect(devicePreset.use.viewport).toEqual({ width: 393, height: 659 });
    expect(devicePreset.use.screen).toEqual({ width: 393, height: 852 });
  });

  test("falls back to the full screen when no browser size is published", () => {
    const devicePreset = findCatalogPreset("ipad-mini", "browser");

    expect(devicePreset.use.viewport).toEqual({ width: 744, height: 1133 });
  });

  test("sends the user agent of the device", () => {
    const devicePreset = findCatalogPreset("macbook-air-13", "full-screen");

    expect(devicePreset.use.userAgent).toContain("Macintosh");
  });

  test("finds a catalog device by id", () => {
    const devicePreset = findCatalogPreset("iphone-se", "full-screen");

    expect(devicePreset.id).toBe("iphone-se");
  });

  test("throws for an id that is not in the catalog", () => {
    const findMissing = () => findCatalogPreset("nokia", "full-screen");

    expect(findMissing).toThrow("No catalog device nokia");
  });
});

const createDevicesFile = (changes: Partial<DevicesFile>): DevicesFile => ({
  devices: [],
  routes: [],
  grid: DEFAULT_GRID_IDS,
  viewportModes: {},
  ...changes,
});

describe("pickGridDevices", () => {
  test("shows the twelve default devices when the file sets no grid", () => {
    const gridDevices = pickGridDevices(createDevicesFile({}));

    const gridIds = gridDevices.map((gridDevice) => gridDevice.id);
    expect(gridIds).toEqual(DEFAULT_GRID_IDS);
    expect(gridIds).toHaveLength(12);
  });

  test("shows custom devices after the grid, in file order", () => {
    const gridDevices = pickGridDevices(
      createDevicesFile({ devices: [TOUCH_KIOSK, MOUSE_SCREEN] }),
    );

    expect(gridDevices.slice(-2).map((gridDevice) => gridDevice.id)).toEqual([
      "shop-kiosk",
      "wall-screen",
    ]);
  });

  test("puts a catalog device outside the default twelve on the grid", () => {
    const isOutsideDefaults = !DEFAULT_GRID_IDS.includes("pixel-9");

    const gridDevices = pickGridDevices(
      createDevicesFile({ grid: ["iphone-se", "pixel-9"] }),
    );

    expect(isOutsideDefaults).toBe(true);
    expect(gridDevices.map(({ id }) => id)).toEqual(["iphone-se", "pixel-9"]);
  });

  test("applies the viewport mode to a device outside the default twelve", () => {
    const gridDevices = pickGridDevices(
      createDevicesFile({
        grid: ["pixel-9", "iphone-se"],
        viewportModes: { "pixel-9": "browser" },
      }),
    );

    const [pixelDevice, iphoneDevice] = gridDevices;
    expect(pixelDevice.viewportMode).toBe("browser");
    expect(pixelDevice.use.viewport).toEqual({ width: 360, height: 732 });
    expect(iphoneDevice.viewportMode).toBe("full-screen");
  });

  test("lets a custom device replace a catalog device with the same id", () => {
    const sameIdDevice = { ...TOUCH_KIOSK, name: "iPhone SE" };

    const gridDevices = pickGridDevices(
      createDevicesFile({ devices: [sameIdDevice] }),
    );

    const sameIds = gridDevices.filter(({ id }) => id === "iphone-se");
    expect(sameIds).toHaveLength(1);
    expect(sameIds[0].isCustom).toBe(true);
    expect(sameIds[0].use.viewport).toEqual({ width: 800, height: 1280 });
  });
});

describe("listCatalogReplies", () => {
  test("marks a catalog device hidden by a custom device with the same id", () => {
    const sameIdDevice = { ...TOUCH_KIOSK, name: "iPhone SE" };

    const catalogReplies = listCatalogReplies(
      createDevicesFile({ devices: [sameIdDevice] }),
    );

    const hiddenIds = catalogReplies
      .filter(({ isHiddenByCustomDevice }) => isHiddenByCustomDevice)
      .map(({ id }) => id);
    expect(hiddenIds).toEqual(["iphone-se"]);
    expect(catalogReplies).toHaveLength(DEVICE_CATALOG.length);
  });
});

describe("checkNewDevice", () => {
  test("returns the custom device when it is new and in limits", () => {
    const checkedDevice = checkNewDevice(TOUCH_KIOSK, DEVICE_CATALOG);

    expect(checkedDevice).toEqual(TOUCH_KIOSK);
  });

  test("rejects a name whose id a preset already uses with 409", () => {
    const clashingDevice = { ...TOUCH_KIOSK, name: "iPhone SE" };

    const status = readStatus(() =>
      checkNewDevice(clashingDevice, DEVICE_CATALOG),
    );

    expect(status).toBe(409);
  });
});

describe("checkDeviceRemoval", () => {
  test("returns the devices file without the removed custom device", () => {
    const devicesFile = createDevicesFile({
      devices: [TOUCH_KIOSK, MOUSE_SCREEN],
      routes: ["/orders/123"],
    });

    const keptFile = checkDeviceRemoval(devicesFile, "shop-kiosk");

    expect(keptFile.devices).toEqual([MOUSE_SCREEN]);
    expect(keptFile.routes).toEqual(["/orders/123"]);
    expect(devicesFile.devices).toHaveLength(2);
  });

  test("drops the removed custom device from the grid", () => {
    const devicesFile = createDevicesFile({
      devices: [TOUCH_KIOSK],
      grid: ["iphone-se", "shop-kiosk"],
    });

    const keptFile = checkDeviceRemoval(devicesFile, "shop-kiosk");

    expect(keptFile.grid).toEqual(["iphone-se"]);
  });

  test("keeps a catalog id on the grid when its custom twin is removed", () => {
    const sameIdDevice = { ...TOUCH_KIOSK, name: "iPhone SE" };
    const devicesFile = createDevicesFile({ devices: [sameIdDevice] });

    const keptFile = checkDeviceRemoval(devicesFile, "iphone-se");

    expect(keptFile.grid).toEqual(DEFAULT_GRID_IDS);
  });

  test("rejects an id that is not a custom device with 404", () => {
    const devicesFile = createDevicesFile({ devices: [TOUCH_KIOSK] });

    const presetStatus = readStatus(() =>
      checkDeviceRemoval(devicesFile, "iphone-se"),
    );
    const emptyStatus = readStatus(() =>
      checkDeviceRemoval(createDevicesFile({}), "shop-kiosk"),
    );

    expect(presetStatus).toBe(404);
    expect(emptyStatus).toBe(404);
  });
});

describe("checkDeviceIds", () => {
  test("returns the file when every id is a catalog or custom device", () => {
    const devicesFile = createDevicesFile({
      devices: [TOUCH_KIOSK],
      grid: ["pixel-9", "shop-kiosk"],
      viewportModes: { "iphone-se": "browser" },
    });

    const checkedFile = checkDeviceIds(devicesFile);

    expect(checkedFile).toEqual(devicesFile);
  });

  test("rejects an unknown viewport mode id with 422 naming the id", () => {
    const devicesFile = createDevicesFile({
      viewportModes: { nokia: "browser" },
    });

    const checkDevicesFile = () => checkDeviceIds(devicesFile);

    expect(checkDevicesFile).toThrow("viewportModes: no device with id nokia");
    expect(readStatus(checkDevicesFile)).toBe(422);
  });

  test("rejects an unknown grid id with 422 naming the id", () => {
    const devicesFile = createDevicesFile({ grid: ["iphone-se", "nokia"] });

    const checkDevicesFile = () => checkDeviceIds(devicesFile);

    expect(checkDevicesFile).toThrow("grid: no device with id nokia");
    expect(readStatus(checkDevicesFile)).toBe(422);
  });
});

describe("pickDeviceViewport", () => {
  test("returns the width and height of the preset viewport", () => {
    const pixelPreset = findCatalogPreset("pixel-8", "full-screen");

    const deviceViewport = pickDeviceViewport(pixelPreset);

    expect(deviceViewport).toEqual({ width: 412, height: 915 });
  });

  test("throws when the preset has no viewport", () => {
    const presetWithoutViewport = {
      ...findCatalogPreset("pixel-8", "full-screen"),
      use: {},
    };

    const pickMissingViewport = () => pickDeviceViewport(presetWithoutViewport);

    expect(pickMissingViewport).toThrow("has no viewport");
  });
});

describe("pickDeviceScreen", () => {
  test("returns the screen when the browser viewport is smaller", () => {
    const iphonePreset = findCatalogPreset("iphone-15", "browser");

    const deviceScreen = pickDeviceScreen(iphonePreset);

    expect(deviceScreen).toEqual({ width: 393, height: 852 });
  });

  test("returns the viewport when the preset has no screen", () => {
    const customPreset = createPresetFromCustomDevice(TOUCH_KIOSK);

    const deviceScreen = pickDeviceScreen(customPreset);

    expect(deviceScreen).toEqual({ width: 800, height: 1280 });
  });
});

describe("replaceGrid", () => {
  test("replaces the grid and drops repeated ids", () => {
    const devicesFile = createDevicesFile({ grid: ["iphone-se"] });

    const changedFile = replaceGrid(devicesFile, [
      "pixel-9",
      "iphone-17",
      "pixel-9",
    ]);

    expect(changedFile.grid).toEqual(["pixel-9", "iphone-17"]);
  });

  test("rejects an unknown id with 422 naming the id", () => {
    const devicesFile = createDevicesFile({});

    const changeGrid = () => replaceGrid(devicesFile, ["iphone-se", "nokia"]);

    expect(changeGrid).toThrow("grid: no device with id nokia");
    expect(readStatus(changeGrid)).toBe(422);
  });
});

describe("pickGridChanges", () => {
  const phonePreset = createPresetFromCustomDevice(TOUCH_KIOSK);
  const screenPreset = createPresetFromCustomDevice(MOUSE_SCREEN);

  test("adds a grid device that has no browser yet", () => {
    const gridChanges = pickGridChanges(
      [phonePreset.id],
      [phonePreset, screenPreset],
    );

    expect(gridChanges.addDevices).toEqual([screenPreset]);
    expect(gridChanges.removeDeviceIds).toEqual([]);
  });

  test("removes a running device that left the grid", () => {
    const gridChanges = pickGridChanges(
      [phonePreset.id, screenPreset.id],
      [screenPreset],
    );

    expect(gridChanges.addDevices).toEqual([]);
    expect(gridChanges.removeDeviceIds).toEqual([phonePreset.id]);
  });

  test("changes nothing when the grid already runs", () => {
    const gridChanges = pickGridChanges([phonePreset.id], [phonePreset]);

    expect(gridChanges).toEqual({ addDevices: [], removeDeviceIds: [] });
  });
});
