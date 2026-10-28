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

export interface DeviceViewport {
  width: number;
  height: number;
}

const DEVICE_ID_CLASH_STATUS = 409;
const DEVICE_MISSING_STATUS = 404;
const NON_ID_CHARACTERS = /[^\p{L}\p{N}]+/gu;
const EDGE_DASHES = /^-|-$/g;

export const pickDeviceId = (deviceName: string): string =>
  deviceName
    .toLowerCase()
    .replace(NON_ID_CHARACTERS, "-")
    .replace(EDGE_DASHES, "");

const hasDeviceId = (customDevice: CustomDevice, deviceId: string): boolean =>
  pickDeviceId(customDevice.name) === deviceId;

export const createPresetFromCustomDevice = (
  customDevice: CustomDevice,
): DevicePreset => {
  const isTouchDevice = customDevice.hasTouch;
  const isFirefoxDevice = customDevice.browserName === "firefox";
  const isMobile = isTouchDevice && !isFirefoxDevice;
  const cpuSlowdown = isTouchDevice ? CPU_TIERS.phone : CPU_TIERS.desktop;

  return {
    id: pickDeviceId(customDevice.name),
    name: customDevice.name,
    browserName: customDevice.browserName,
    frameShape: customDevice.frameShape,
    cpuSlowdown,
    use: {
      viewport: { width: customDevice.width, height: customDevice.height },
      deviceScaleFactor: customDevice.pixelRatio,
      isMobile,
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
  const newDeviceId = pickDeviceId(customDevice.name);
  const isIdTaken = gridDevices.some(
    (gridDevice) => gridDevice.id === newDeviceId,
  );
  if (isIdTaken) {
    throw new HTTPException(DEVICE_ID_CLASH_STATUS, {
      message: `A device with id ${newDeviceId} already exists`,
    });
  }

  return customDevice;
};

export const checkDeviceRemoval = (
  devicesFile: DevicesFile,
  deviceId: string,
): DevicesFile => {
  const isCustomDeviceMissing = !devicesFile.devices.some((customDevice) =>
    hasDeviceId(customDevice, deviceId),
  );
  if (isCustomDeviceMissing) {
    throw new HTTPException(DEVICE_MISSING_STATUS, {
      message: `No custom device with id ${deviceId}`,
    });
  }

  const keptDevices = devicesFile.devices.filter(
    (customDevice) => !hasDeviceId(customDevice, deviceId),
  );
  return { devices: keptDevices };
};

export const pickDeviceViewport = (
  devicePreset: DevicePreset,
): DeviceViewport => {
  const { viewport } = devicePreset.use;
  const isViewportMissing = viewport === undefined || viewport === null;
  if (isViewportMissing) {
    throw new Error(`Device ${devicePreset.id} has no viewport`);
  }
  return { width: viewport.width, height: viewport.height };
};
