import { HTTPException } from "hono/http-exception";
import { describe, expect, test } from "vitest";
import { DEVICE_PRESETS } from "@/devices/device-presets";
import type { CustomDevice } from "@/devices/device-schema";
import {
  checkDeviceRemoval,
  checkNewDevice,
  createPresetFromCustomDevice,
  pickDeviceId,
  pickDeviceViewport,
  pickGridDevices,
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

describe("DEVICE_PRESETS", () => {
  test("uses webkit for exactly the iPhone and iPad presets", () => {
    const webkitIds = DEVICE_PRESETS.filter(
      (devicePreset) => devicePreset.browserName === "webkit",
    ).map((devicePreset) => devicePreset.id);

    expect(webkitIds).toEqual([
      "iphone-se",
      "iphone-15",
      "iphone-15-pro-max",
      "ipad-mini",
      "ipad-pro-11",
    ]);
  });
});

describe("pickGridDevices", () => {
  test("shows only the nine presets when there are no custom devices", () => {
    const gridDevices = pickGridDevices({ devices: [] });

    expect(gridDevices).toEqual(DEVICE_PRESETS);
    expect(gridDevices).toHaveLength(9);
  });

  test("shows custom devices after the presets, in file order", () => {
    const gridDevices = pickGridDevices({
      devices: [TOUCH_KIOSK, MOUSE_SCREEN],
    });

    expect(gridDevices.slice(-2).map((gridDevice) => gridDevice.id)).toEqual([
      "shop-kiosk",
      "wall-screen",
    ]);
  });
});

describe("checkNewDevice", () => {
  test("returns the custom device when it is new and in limits", () => {
    const checkedDevice = checkNewDevice(TOUCH_KIOSK, DEVICE_PRESETS);

    expect(checkedDevice).toEqual(TOUCH_KIOSK);
  });

  test("rejects a name whose id a preset already uses with 409", () => {
    const clashingDevice = { ...TOUCH_KIOSK, name: "iPhone SE" };

    const status = readStatus(() =>
      checkNewDevice(clashingDevice, DEVICE_PRESETS),
    );

    expect(status).toBe(409);
  });
});

describe("checkDeviceRemoval", () => {
  test("returns the devices file without the removed custom device", () => {
    const devicesFile = { devices: [TOUCH_KIOSK, MOUSE_SCREEN] };

    const keptFile = checkDeviceRemoval(devicesFile, "shop-kiosk");

    expect(keptFile).toEqual({ devices: [MOUSE_SCREEN] });
    expect(devicesFile.devices).toHaveLength(2);
  });

  test("rejects an id that is not a custom device with 404", () => {
    const devicesFile = { devices: [TOUCH_KIOSK] };

    const presetStatus = readStatus(() =>
      checkDeviceRemoval(devicesFile, "iphone-se"),
    );
    const emptyStatus = readStatus(() =>
      checkDeviceRemoval({ devices: [] }, "shop-kiosk"),
    );

    expect(presetStatus).toBe(404);
    expect(emptyStatus).toBe(404);
  });
});

describe("pickDeviceViewport", () => {
  test("returns the width and height of the preset viewport", () => {
    const pixelPreset = DEVICE_PRESETS.find(
      (preset) => preset.id === "pixel-8",
    );
    const isPixelPresetMissing = pixelPreset === undefined;
    if (isPixelPresetMissing) throw new Error("No pixel-8 preset");

    const deviceViewport = pickDeviceViewport(pixelPreset);

    expect(deviceViewport).toEqual({ width: 412, height: 915 });
  });

  test("throws when the preset has no viewport", () => {
    const [firstPreset] = DEVICE_PRESETS;
    const isFirstPresetMissing = firstPreset === undefined;
    if (isFirstPresetMissing) throw new Error("No presets");
    const presetWithoutViewport = { ...firstPreset, use: {} };

    const pickMissingViewport = () => pickDeviceViewport(presetWithoutViewport);

    expect(pickMissingViewport).toThrow("has no viewport");
  });
});
