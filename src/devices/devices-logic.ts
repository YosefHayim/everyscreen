import { HTTPException } from "hono/http-exception";
import type { BrowserContextOptions } from "playwright";
import { DEVICE_PRESETS } from "@/devices/device-presets";
import type { CustomDevice, DevicesFile } from "@/devices/device-schema";
import { CPU_TIERS } from "@/environment";

export type BrowserName = "chromium" | "webkit" | "firefox";

export type FrameShape =
  | "home-button"
  | "dynamic-island"
  | "punch-hole"
  | "tablet"
  | "laptop"
  | "kiosk";

export interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface DevicePreset {
  id: string;
  name: string;
  browserName: BrowserName;
  frameShape: FrameShape;
  cpuSlowdown: number;
  use: BrowserContextOptions;
}

const DEVICE_ID_CLASH_STATUS = 409;
const DEVICE_MISSING_STATUS = 404;

export const createPresetFromCustomDevice = (
  customDevice: CustomDevice,
): DevicePreset => {
  const isTouchDevice = customDevice.hasTouch;
  const cpuSlowdown = isTouchDevice ? CPU_TIERS.phone : CPU_TIERS.desktop;

  return {
    id: customDevice.id,
    name: customDevice.name,
    browserName: "chromium",
    frameShape: customDevice.frameShape,
    cpuSlowdown,
    use: {
      viewport: { width: customDevice.width, height: customDevice.height },
      deviceScaleFactor: customDevice.pixelRatio,
      isMobile: customDevice.hasTouch,
      hasTouch: customDevice.hasTouch,
    },
  };
};

export const pickGridDevices = (devicesFile: DevicesFile): DevicePreset[] => {
  const customPresets = devicesFile.devices.map(createPresetFromCustomDevice);
  return [...DEVICE_PRESETS, ...customPresets];
};

export const checkNewDevice = (
  customDevice: CustomDevice,
  gridDevices: DevicePreset[],
): CustomDevice => {
  const isIdTaken = gridDevices.some(
    (gridDevice) => gridDevice.id === customDevice.id,
  );
  if (isIdTaken) {
    throw new HTTPException(DEVICE_ID_CLASH_STATUS, {
      message: `A device with id ${customDevice.id} already exists`,
    });
  }

  return customDevice;
};

export const checkDeviceRemoval = (
  devicesFile: DevicesFile,
  deviceId: string,
): DevicesFile => {
  const isCustomDeviceMissing = devicesFile.devices.every(
    (customDevice) => customDevice.id !== deviceId,
  );
  if (isCustomDeviceMissing) {
    throw new HTTPException(DEVICE_MISSING_STATUS, {
      message: `No custom device with id ${deviceId}`,
    });
  }

  const keptDevices = devicesFile.devices.filter(
    (customDevice) => customDevice.id !== deviceId,
  );
  return { devices: keptDevices };
};
