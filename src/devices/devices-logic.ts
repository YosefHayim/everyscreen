import { HTTPException } from "hono/http-exception";
import type { BrowserContextOptions } from "playwright";
import { DEVICE_PRESETS } from "@/devices/device-presets";
import {
  type CustomDevice,
  type DevicesFile,
  MAX_DEVICE_SIZE,
  MIN_DEVICE_SIZE,
} from "@/devices/device-schema";
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
const DEVICE_LIMIT_STATUS = 422;

export const customDeviceToPreset = (
  customDevice: CustomDevice,
): DevicePreset => {
  const cpuSlowdown = customDevice.hasTouch
    ? CPU_TIERS.phone
    : CPU_TIERS.desktop;

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
  const customPresets = devicesFile.devices.map(customDeviceToPreset);
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

  const isWidthOutOfLimits =
    customDevice.width < MIN_DEVICE_SIZE ||
    customDevice.width > MAX_DEVICE_SIZE;
  const isHeightOutOfLimits =
    customDevice.height < MIN_DEVICE_SIZE ||
    customDevice.height > MAX_DEVICE_SIZE;
  const isSizeOutOfLimits = isWidthOutOfLimits || isHeightOutOfLimits;
  if (isSizeOutOfLimits) {
    throw new HTTPException(DEVICE_LIMIT_STATUS, {
      message: `Width and height must be between ${MIN_DEVICE_SIZE} and ${MAX_DEVICE_SIZE}`,
    });
  }

  return customDevice;
};
