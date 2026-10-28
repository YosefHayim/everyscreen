import { HTTPException } from "hono/http-exception";
import type { BrowserContextOptions } from "playwright";
import { DEFAULT_GRID_DEVICES, DEVICE_CATALOG } from "@/devices/device-catalog";
import type { CustomDevice, DevicesFile } from "@/devices/device-schema";
import { FRAME_SHAPE_INSETS } from "@/devices/frame-shape-insets";
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

export type DevicePlatform =
  | "ios"
  | "ipados"
  | "android"
  | "macos"
  | "windows"
  | "linux";

export type DeviceMaker =
  | "apple"
  | "samsung"
  | "google"
  | "xiaomi"
  | "oneplus"
  | "generic";

export type CutoutKind =
  | "none"
  | "notch"
  | "dynamic-island"
  | "punch-hole-center"
  | "punch-hole-corner"
  | "home-button";

// Full screen fills the display like an installed app; browser is the area inside the browser bars.
export type ViewportMode = "full-screen" | "browser";

export interface DeviceViewport {
  width: number;
  height: number;
}

// Sizes and positions are CSS px on the portrait screen; left and top count from its top left corner.
// A size or position is null when the maker has not published it.
export interface DeviceCutout {
  kind: CutoutKind;
  width: number | null;
  height: number | null;
  top: number | null;
  left: number | null;
}

export interface DeviceIdentity {
  id: string;
  name: string;
  browserName: BrowserName;
  frameShape: FrameShape;
  cpuSlowdown: number;
  platform: DevicePlatform;
  maker: DeviceMaker;
  cornerRadius: number | null;
  cutout: DeviceCutout;
  safeAreaInsets: SafeAreaInsets;
}

export interface CatalogDevice extends DeviceIdentity {
  registryName: string | null;
  fullScreen: DeviceViewport;
  browserViewport: DeviceViewport;
  userAgent: string | null;
  deviceScaleFactor: number;
  isMobile: boolean;
  hasTouch: boolean;
}

export interface DevicePreset extends DeviceIdentity {
  viewportMode: ViewportMode;
  use: BrowserContextOptions;
}

const DEVICE_ID_CLASH_STATUS = 409;
const DEVICE_MISSING_STATUS = 404;
const BAD_VIEWPORT_MODE_STATUS = 422;
const NON_ID_CHARACTERS = /[^\p{L}\p{N}]+/gu;
const EDGE_DASHES = /^-|-$/g;

export const pickDeviceId = (deviceName: string): string =>
  deviceName
    .toLowerCase()
    .replace(NON_ID_CHARACTERS, "-")
    .replace(EDGE_DASHES, "");

const hasDeviceId = (customDevice: CustomDevice, deviceId: string): boolean =>
  pickDeviceId(customDevice.name) === deviceId;

const FRAME_SHAPE_PLATFORMS = {
  "home-button": "ios",
  "dynamic-island": "ios",
  "punch-hole": "android",
  tablet: "ipados",
  laptop: "macos",
  kiosk: "linux",
} as const satisfies Record<FrameShape, DevicePlatform>;

const FRAME_SHAPE_CUTOUT_KINDS = {
  "home-button": "home-button",
  "dynamic-island": "dynamic-island",
  "punch-hole": "punch-hole-center",
  tablet: "none",
  laptop: "none",
  kiosk: "none",
} as const satisfies Record<FrameShape, CutoutKind>;

// A custom device has no measured frame, so the cutout has no size and the dashboard draws the shape's default.
const createCutoutOfKind = (kind: CutoutKind): DeviceCutout => ({
  kind,
  width: null,
  height: null,
  top: null,
  left: null,
});

export const createPresetFromCustomDevice = (
  customDevice: CustomDevice,
): DevicePreset => {
  const isTouchDevice = customDevice.hasTouch;
  const isFirefoxDevice = customDevice.browserName === "firefox";
  const isMobile = isTouchDevice && !isFirefoxDevice;
  const cpuSlowdown = isTouchDevice ? CPU_TIERS.phone : CPU_TIERS.desktop;
  const { frameShape } = customDevice;

  return {
    id: pickDeviceId(customDevice.name),
    name: customDevice.name,
    browserName: customDevice.browserName,
    frameShape,
    cpuSlowdown,
    platform: FRAME_SHAPE_PLATFORMS[frameShape],
    maker: "generic",
    cornerRadius: null,
    cutout: createCutoutOfKind(FRAME_SHAPE_CUTOUT_KINDS[frameShape]),
    safeAreaInsets: FRAME_SHAPE_INSETS[frameShape],
    viewportMode: "full-screen",
    use: {
      viewport: { width: customDevice.width, height: customDevice.height },
      deviceScaleFactor: customDevice.pixelRatio,
      isMobile,
      hasTouch: customDevice.hasTouch,
    },
  };
};

const pickModeViewport = (
  catalogDevice: CatalogDevice,
  viewportMode: ViewportMode,
): DeviceViewport => {
  switch (viewportMode) {
    case "full-screen":
      return catalogDevice.fullScreen;
    case "browser":
      return catalogDevice.browserViewport;
  }
};

export const createPresetFromCatalogDevice = (
  catalogDevice: CatalogDevice,
  viewportMode: ViewportMode,
): DevicePreset => {
  return {
    id: catalogDevice.id,
    name: catalogDevice.name,
    browserName: catalogDevice.browserName,
    frameShape: catalogDevice.frameShape,
    cpuSlowdown: catalogDevice.cpuSlowdown,
    platform: catalogDevice.platform,
    maker: catalogDevice.maker,
    cornerRadius: catalogDevice.cornerRadius,
    cutout: catalogDevice.cutout,
    safeAreaInsets: catalogDevice.safeAreaInsets,
    viewportMode,
    use: {
      viewport: pickModeViewport(catalogDevice, viewportMode),
      screen: catalogDevice.fullScreen,
      userAgent: catalogDevice.userAgent ?? undefined,
      deviceScaleFactor: catalogDevice.deviceScaleFactor,
      isMobile: catalogDevice.isMobile,
      hasTouch: catalogDevice.hasTouch,
    },
  };
};

export const findCatalogPreset = (
  deviceId: string,
  viewportMode: ViewportMode,
): DevicePreset => {
  const catalogDevice = DEVICE_CATALOG.find(({ id }) => id === deviceId);
  const isCatalogDeviceMissing = catalogDevice === undefined;
  if (isCatalogDeviceMissing) {
    throw new Error(`No catalog device ${deviceId}`);
  }
  return createPresetFromCatalogDevice(catalogDevice, viewportMode);
};

export const pickGridDevices = (devicesFile: DevicesFile): DevicePreset[] => {
  const customPresets = devicesFile.devices.map(createPresetFromCustomDevice);
  const customIds = customPresets.map((customPreset) => customPreset.id);
  const defaultPresets = DEFAULT_GRID_DEVICES.filter(
    (defaultDevice) => !customIds.includes(defaultDevice.id),
  ).map((defaultDevice) =>
    createPresetFromCatalogDevice(
      defaultDevice,
      devicesFile.viewportModes[defaultDevice.id] ?? "full-screen",
    ),
  );
  return [...defaultPresets, ...customPresets];
};

export const checkNewDevice = (
  customDevice: CustomDevice,
  takenDevices: { id: string }[],
): CustomDevice => {
  const newDeviceId = pickDeviceId(customDevice.name);
  const isIdTaken = takenDevices.some(
    (takenDevice) => takenDevice.id === newDeviceId,
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
  return { ...devicesFile, devices: keptDevices };
};

export const checkViewportModes = (devicesFile: DevicesFile): DevicesFile => {
  const catalogIds = DEVICE_CATALOG.map((catalogDevice) => catalogDevice.id);
  const unknownIds = Object.keys(devicesFile.viewportModes).filter(
    (deviceId) => !catalogIds.includes(deviceId),
  );
  const hasUnknownId = unknownIds.length > 0;
  if (hasUnknownId) {
    throw new HTTPException(BAD_VIEWPORT_MODE_STATUS, {
      message: `viewportModes: no catalog device ${unknownIds.join(", ")}`,
    });
  }
  return devicesFile;
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

export const pickDeviceScreen = (
  devicePreset: DevicePreset,
): DeviceViewport => {
  const { screen } = devicePreset.use;
  const isScreenMissing = screen === undefined;
  if (isScreenMissing) return pickDeviceViewport(devicePreset);
  return { width: screen.width, height: screen.height };
};
