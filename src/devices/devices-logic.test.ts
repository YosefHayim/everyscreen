import { HTTPException } from "hono/http-exception";
import { describe, expect, test } from "vitest";
import { DEVICE_PRESETS } from "@/devices/device-presets";
import type { CustomDevice } from "@/devices/device-schema";
import {
  checkDeviceRemoval,
  checkNewDevice,
  createPresetFromCustomDevice,
  pickGridDevices,
} from "@/devices/devices-logic";
import { CPU_TIERS } from "@/environment";

const TOUCH_KIOSK: CustomDevice = {
  id: "shop-kiosk",
  name: "Shop kiosk",
  width: 800,
  height: 1280,
  pixelRatio: 2,
  hasTouch: true,
  frameShape: "kiosk",
};

const MOUSE_SCREEN: CustomDevice = {
  ...TOUCH_KIOSK,
  id: "wall-screen",
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

describe("createPresetFromCustomDevice", () => {
  test("makes a touch device a mobile phone-speed preset", () => {
    const devicePreset = createPresetFromCustomDevice(TOUCH_KIOSK);

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

  test("rejects an id that a preset already uses with 409", () => {
    const clashingDevice = { ...TOUCH_KIOSK, id: "iphone-se" };

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
