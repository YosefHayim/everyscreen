import { HTTPException } from "hono/http-exception";
import { describe, expect, test } from "vitest";
import { DEFAULT_GRID_DEVICES, DEVICE_CATALOG } from "@/devices/device-catalog";
import type { CustomDevice } from "@/devices/device-schema";
import {
  type CatalogDevice,
  checkDeviceRemoval,
  checkNewDevice,
  checkViewportModes,
  createCatalogDeviceFromRegistry,
  createPresetFromCatalogDevice,
  createPresetFromCustomDevice,
  findCatalogPreset,
  pickDeviceId,
  pickDeviceScreen,
  pickDeviceViewport,
  pickGridDevices,
  pickRegistryScreen,
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

describe("pickRegistryScreen", () => {
  test("returns the registry screen when there is one", () => {
    const screen = pickRegistryScreen({
      screen: { width: 393, height: 852 },
      viewport: { width: 393, height: 659 },
    });

    expect(screen).toEqual({ width: 393, height: 852 });
  });

  test("returns the viewport when the registry has no screen", () => {
    const screen = pickRegistryScreen({
      viewport: { width: 360, height: 780 },
    });

    expect(screen).toEqual({ width: 360, height: 780 });
  });
});

describe("createCatalogDeviceFromRegistry", () => {
  test("reads sizes and emulation from the registry device", () => {
    const [identityDevice] = DEVICE_CATALOG;

    const catalogDevice = createCatalogDeviceFromRegistry(
      identityDevice,
      "Some phone",
      {
        screen: { width: 400, height: 800 },
        viewport: { width: 400, height: 700 },
        userAgent: "Agent",
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
      },
    );

    expect(catalogDevice).toMatchObject({
      id: identityDevice.id,
      registryName: "Some phone",
      fullScreen: { width: 400, height: 800 },
      browserViewport: { width: 400, height: 700 },
      userAgent: "Agent",
      deviceScaleFactor: 3,
    });
  });
});

describe("createPresetFromCatalogDevice", () => {
  const phone: CatalogDevice = {
    ...DEVICE_CATALOG[0],
    fullScreen: { width: 393, height: 852 },
    browserViewport: { width: 393, height: 659 },
    userAgent: null,
  };

  test("uses the full screen as the viewport and the screen", () => {
    const devicePreset = createPresetFromCatalogDevice(phone, "full-screen");

    expect(devicePreset.viewportMode).toBe("full-screen");
    expect(devicePreset.use.viewport).toEqual({ width: 393, height: 852 });
    expect(devicePreset.use.screen).toEqual({ width: 393, height: 852 });
  });

  test("uses the size inside the browser bars but keeps the full screen as the screen", () => {
    const devicePreset = createPresetFromCatalogDevice(phone, "browser");

    expect(devicePreset.use.viewport).toEqual({ width: 393, height: 659 });
    expect(devicePreset.use.screen).toEqual({ width: 393, height: 852 });
  });

  test("leaves the user agent unset when the device has none", () => {
    const devicePreset = createPresetFromCatalogDevice(phone, "full-screen");

    expect(devicePreset.use.userAgent).toBeUndefined();
  });

  test("passes the user agent on when the device has one", () => {
    const agentPhone = { ...phone, userAgent: "Agent" };

    const devicePreset = createPresetFromCatalogDevice(
      agentPhone,
      "full-screen",
    );

    expect(devicePreset.use.userAgent).toBe("Agent");
  });
});

describe("findCatalogPreset", () => {
  test("finds a catalog device by id", () => {
    const devicePreset = findCatalogPreset("iphone-se", "full-screen");

    expect(devicePreset.id).toBe("iphone-se");
  });

  test("throws for an id that is not in the catalog", () => {
    const findMissing = () => findCatalogPreset("nokia", "full-screen");

    expect(findMissing).toThrow("No catalog device nokia");
  });
});

describe("pickGridDevices", () => {
  test("shows only the default grid when there are no custom devices", () => {
    const gridDevices = pickGridDevices({ devices: [], routes: [], viewportModes: {} });

    const gridIds = gridDevices.map((gridDevice) => gridDevice.id);
    expect(gridIds).toEqual(DEFAULT_GRID_DEVICES.map(({ id }) => id));
    expect(gridDevices.length).toBeLessThanOrEqual(12);
  });

  test("shows custom devices after the presets, in file order", () => {
    const gridDevices = pickGridDevices({
      devices: [TOUCH_KIOSK, MOUSE_SCREEN],
      routes: [], viewportModes: {},
    });

    expect(gridDevices.slice(-2).map((gridDevice) => gridDevice.id)).toEqual([
      "shop-kiosk",
      "wall-screen",
    ]);
  });

  test("uses the browser viewport for a device the file sets to browser", () => {
    const [firstDevice] = DEFAULT_GRID_DEVICES;

    const gridDevices = pickGridDevices({
      devices: [],
      routes: [],
      viewportModes: { [firstDevice.id]: "browser" },
    });

    expect(gridDevices[0].viewportMode).toBe("browser");
    expect(gridDevices[0].use.viewport).toEqual(firstDevice.browserViewport);
    expect(gridDevices[1].viewportMode).toBe("full-screen");
  });

  test("lets a custom device replace a default device with the same id", () => {
    const [firstDevice] = DEFAULT_GRID_DEVICES;
    const sameIdDevice = { ...TOUCH_KIOSK, name: firstDevice.name };

    const gridDevices = pickGridDevices({
      devices: [sameIdDevice],
      routes: [], viewportModes: {},
    });

    const sameIds = gridDevices.filter(({ id }) => id === firstDevice.id);
    expect(sameIds).toHaveLength(1);
    expect(sameIds[0].use.viewport).toEqual({ width: 800, height: 1280 });
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
    const devicesFile = {
      devices: [TOUCH_KIOSK, MOUSE_SCREEN],
      routes: [], viewportModes: {},
    };

    const keptFile = checkDeviceRemoval(devicesFile, "shop-kiosk");

    expect(keptFile).toEqual({ devices: [MOUSE_SCREEN], routes: [], viewportModes: {} });
    expect(devicesFile.devices).toHaveLength(2);
  });

  test("rejects an id that is not a custom device with 404", () => {
    const devicesFile = { devices: [TOUCH_KIOSK], routes: [], viewportModes: {} };

    const presetStatus = readStatus(() =>
      checkDeviceRemoval(devicesFile, "iphone-se"),
    );
    const emptyStatus = readStatus(() =>
      checkDeviceRemoval({ devices: [], routes: [], viewportModes: {} }, "shop-kiosk"),
    );

    expect(presetStatus).toBe(404);
    expect(emptyStatus).toBe(404);
  });
});

describe("checkViewportModes", () => {
  test("returns the file when every id is a catalog device", () => {
    const devicesFile = {
      devices: [],
      viewportModes: { "iphone-se": "browser" as const },
    };

    const checkedFile = checkViewportModes(devicesFile);

    expect(checkedFile).toEqual(devicesFile);
  });

  test("rejects an id that is not a catalog device with 422", () => {
    const devicesFile = {
      devices: [],
      viewportModes: { nokia: "browser" as const },
    };

    const status = readStatus(() => checkViewportModes(devicesFile));

    expect(status).toBe(422);
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
