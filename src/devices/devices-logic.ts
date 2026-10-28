import { HTTPException } from "hono/http-exception";
import type { BrowserContextOptions } from "playwright";
import { DEVICE_CATALOG } from "@/devices/device-catalog";
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
  platform: DevicePlatform | null;
  maker: DeviceMaker;
  cornerRadius: number | null;
  cutout: DeviceCutout | null;
  safeAreaInsets: SafeAreaInsets;
}

// A custom device has no platform and no cutout; the frame draws its shape's default.
export interface CatalogIdentity extends DeviceIdentity {
  platform: DevicePlatform;
  cutout: DeviceCutout;
}

export interface CatalogDevice extends CatalogIdentity {
  registryName: string | null;
  fullScreen: DeviceViewport;
  browserViewport: DeviceViewport | null;
  userAgent: string;
  deviceScaleFactor: number;
  isMobile: boolean;
  hasTouch: boolean;
}

export interface CatalogDeviceReply extends CatalogDevice {
  isHiddenByCustomDevice: boolean;
}

export interface DevicePreset extends DeviceIdentity {
  isCustom: boolean;
  viewportMode: ViewportMode;
  use: BrowserContextOptions;
}

const DEVICE_ID_CLASH_STATUS = 409;
const DEVICE_MISSING_STATUS = 404;
const UNKNOWN_DEVICE_STATUS = 422;
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
  const { frameShape } = customDevice;
  const safeAreaInsets = FRAME_SHAPE_INSETS[frameShape];
  const statusBarHeight = pickStatusBarHeight({
    frameShape,
    platform: null,
    cutout: null,
    safeAreaInsets,
  });
  const hasStatusBar = statusBarHeight > 0;
  const screen = { width: customDevice.width, height: customDevice.height };

  return {
    id: pickDeviceId(customDevice.name),
    name: customDevice.name,
    browserName: customDevice.browserName,
    frameShape,
    cpuSlowdown,
    platform: null,
    maker: "generic",
    cornerRadius: null,
    cutout: null,
    safeAreaInsets,
    isCustom: true,
    viewportMode: "full-screen",
    use: {
      viewport: {
        width: screen.width,
        height: screen.height - statusBarHeight,
      },
      ...(hasStatusBar && { screen }),
      deviceScaleFactor: customDevice.pixelRatio,
      isMobile,
      hasTouch: customDevice.hasTouch,
    },
  };
};

const STATUS_BAR_HEIGHTS_BY_SHAPE = {
  "home-button": 20,
  "dynamic-island": 59,
  "punch-hole": 24,
  tablet: 24,
  laptop: 0,
  kiosk: 0,
} as const satisfies Record<FrameShape, number>;

const STATUS_BAR_HEIGHTS_BY_CUTOUT = {
  none: null,
  notch: 47,
  "dynamic-island": 59,
  "punch-hole-center": null,
  "punch-hole-corner": null,
  "home-button": 20,
} as const satisfies Record<CutoutKind, number | null>;

const STATUS_BAR_PLATFORMS: DevicePlatform[] = ["ios", "ipados", "android"];
const PHONE_SHAPES: FrameShape[] = [
  "home-button",
  "dynamic-island",
  "punch-hole",
];

// The page sits below this strip in full-screen mode, so the strip never covers it.
export const pickStatusBarHeight = (
  deviceIdentity: Pick<
    DeviceIdentity,
    "frameShape" | "platform" | "cutout" | "safeAreaInsets"
  >,
): number => {
  const { frameShape, platform, cutout, safeAreaInsets } = deviceIdentity;
  const isPlatformKnown = platform !== null;
  const isMobilePlatform =
    isPlatformKnown && STATUS_BAR_PLATFORMS.includes(platform);
  const isPhoneShape = PHONE_SHAPES.includes(frameShape);
  const isWindowShape = frameShape === "laptop" || frameShape === "kiosk";
  const isStatusBarShown =
    !isWindowShape && (isPlatformKnown ? isMobilePlatform : isPhoneShape);
  if (!isStatusBarShown) return 0;

  const publishedHeight = Math.round(safeAreaInsets.top);
  const isHeightPublished = publishedHeight > 0;
  if (isHeightPublished) return publishedHeight;

  const isCutoutMissing = cutout === null;
  const cutoutHeight = isCutoutMissing
    ? null
    : STATUS_BAR_HEIGHTS_BY_CUTOUT[cutout.kind];
  return cutoutHeight ?? STATUS_BAR_HEIGHTS_BY_SHAPE[frameShape];
};

const pickModeViewport = (
  catalogDevice: CatalogDevice,
  viewportMode: ViewportMode,
): DeviceViewport => {
  switch (viewportMode) {
    case "full-screen": {
      const { width, height } = catalogDevice.fullScreen;
      return { width, height: height - pickStatusBarHeight(catalogDevice) };
    }
    case "browser":
      return catalogDevice.browserViewport ?? catalogDevice.fullScreen;
  }
};

const createPresetFromCatalogDevice = (
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
    isCustom: false,
    viewportMode,
    use: {
      viewport: pickModeViewport(catalogDevice, viewportMode),
      screen: catalogDevice.fullScreen,
      userAgent: catalogDevice.userAgent,
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

const pickGridPreset = (
  devicesFile: DevicesFile,
  gridId: string,
): DevicePreset => {
  const customDevice = devicesFile.devices.find((device) =>
    hasDeviceId(device, gridId),
  );
  const isCustomDeviceFound = customDevice !== undefined;
  if (isCustomDeviceFound) return createPresetFromCustomDevice(customDevice);
  return findCatalogPreset(
    gridId,
    devicesFile.viewportModes[gridId] ?? "full-screen",
  );
};

// A custom device with a catalog id hides the catalog device everywhere.
export const pickGridDevices = (devicesFile: DevicesFile): DevicePreset[] => {
  const gridPresets = devicesFile.grid.map((gridId) =>
    pickGridPreset(devicesFile, gridId),
  );
  const gridIds = gridPresets.map(({ id }) => id);
  const otherCustomPresets = devicesFile.devices
    .map(createPresetFromCustomDevice)
    .filter((customPreset) => !gridIds.includes(customPreset.id));
  return [...gridPresets, ...otherCustomPresets];
};

export const listCatalogReplies = (
  devicesFile: DevicesFile,
): CatalogDeviceReply[] => {
  const customIds = devicesFile.devices.map((customDevice) =>
    pickDeviceId(customDevice.name),
  );
  return DEVICE_CATALOG.map((catalogDevice) => ({
    ...catalogDevice,
    isHiddenByCustomDevice: customIds.includes(catalogDevice.id),
  }));
};

export const checkNewDevice = (
  customDevice: CustomDevice,
  takenDevices: Pick<DevicePreset, "id">[],
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
  const isCatalogDevice = DEVICE_CATALOG.some(({ id }) => id === deviceId);
  const keptGrid = devicesFile.grid.filter(
    (gridId) => isCatalogDevice || gridId !== deviceId,
  );
  return { ...devicesFile, devices: keptDevices, grid: keptGrid };
};

const listUnknownIds = (devicesFile: DevicesFile, deviceIds: string[]) => {
  const knownIds = [
    ...DEVICE_CATALOG.map(({ id }) => id),
    ...devicesFile.devices.map((customDevice) =>
      pickDeviceId(customDevice.name),
    ),
  ];
  return deviceIds.filter((deviceId) => !knownIds.includes(deviceId));
};

export const checkDeviceIds = (devicesFile: DevicesFile): DevicesFile => {
  const fieldIds = {
    grid: devicesFile.grid,
    viewportModes: Object.keys(devicesFile.viewportModes),
  };
  for (const [field, deviceIds] of Object.entries(fieldIds)) {
    const [unknownId] = listUnknownIds(devicesFile, deviceIds);
    const isUnknownIdFound = unknownId !== undefined;
    if (isUnknownIdFound) {
      throw new HTTPException(UNKNOWN_DEVICE_STATUS, {
        message: `${field}: no device with id ${unknownId}`,
      });
    }
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

export const replaceGrid = (
  devicesFile: DevicesFile,
  deviceIds: string[],
): DevicesFile => {
  const uniqueIds = [...new Set(deviceIds)];
  return checkDeviceIds({ ...devicesFile, grid: uniqueIds });
};

export type GridSync = (gridDevices: DevicePreset[]) => Promise<void>;

export interface GridChanges {
  addDevices: DevicePreset[];
  removeDeviceIds: string[];
}

export const pickGridChanges = (
  runningDeviceIds: string[],
  gridDevices: DevicePreset[],
): GridChanges => {
  const gridDeviceIds = gridDevices.map(({ id }) => id);
  const addDevices = gridDevices.filter(
    ({ id }) => !runningDeviceIds.includes(id),
  );
  const removeDeviceIds = runningDeviceIds.filter(
    (runningDeviceId) => !gridDeviceIds.includes(runningDeviceId),
  );
  return { addDevices, removeDeviceIds };
};
