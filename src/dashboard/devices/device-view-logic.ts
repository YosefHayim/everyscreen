import type {
  BrowserName,
  DeviceCutout,
  DevicePlatform,
  FrameShape,
  SafeAreaInsets,
  ViewportMode,
} from "@/devices/devices-logic";

export type DeviceGroup = "phones" | "tablets" | "desktop" | "custom";

export interface DeviceView {
  deviceId: string;
  name: string;
  browserName: BrowserName;
  frameShape: FrameShape;
  platform: DevicePlatform | null;
  cutout: DeviceCutout | null;
  cornerRadius: number | null;
  safeAreaInsets: SafeAreaInsets;
  viewportMode: ViewportMode;
  viewportWidth: number;
  viewportHeight: number;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  hasTouch: boolean;
  isCustom: boolean;
}

export interface GridDeviceReply {
  id: string;
  name: string;
  browserName: BrowserName;
  frameShape: FrameShape;
  platform: DevicePlatform | null;
  cutout: DeviceCutout | null;
  cornerRadius: number | null;
  safeAreaInsets: SafeAreaInsets;
  viewportMode: ViewportMode;
  isCustom: boolean;
  use: {
    viewport?: { width: number; height: number } | null;
    screen?: { width: number; height: number } | null;
    deviceScaleFactor?: number;
    hasTouch?: boolean;
  };
}

export interface DeviceGroupView {
  group: DeviceGroup;
  devices: DeviceView[];
}

const DEVICE_GROUPS: DeviceGroup[] = ["phones", "tablets", "desktop", "custom"];
const DEFAULT_PIXEL_RATIO = 1;

export const createDeviceView = (gridDevice: GridDeviceReply): DeviceView => {
  const { viewport } = gridDevice.use;
  const hasNoViewport = viewport === undefined || viewport === null;
  if (hasNoViewport) {
    throw new Error(`The device ${gridDevice.id} has no viewport`);
  }

  const screen = gridDevice.use.screen ?? viewport;

  return {
    deviceId: gridDevice.id,
    name: gridDevice.name,
    browserName: gridDevice.browserName,
    frameShape: gridDevice.frameShape,
    platform: gridDevice.platform,
    cutout: gridDevice.cutout,
    cornerRadius: gridDevice.cornerRadius,
    safeAreaInsets: gridDevice.safeAreaInsets,
    viewportMode: gridDevice.viewportMode,
    viewportWidth: viewport.width,
    viewportHeight: viewport.height,
    screenWidth: screen.width,
    screenHeight: screen.height,
    pixelRatio: gridDevice.use.deviceScaleFactor ?? DEFAULT_PIXEL_RATIO,
    hasTouch: gridDevice.use.hasTouch === true,
    isCustom: gridDevice.isCustom,
  };
};

export const pickFrameGroup = (frameShape: FrameShape): DeviceGroup => {
  switch (frameShape) {
    case "home-button":
    case "dynamic-island":
    case "punch-hole":
      return "phones";
    case "tablet":
      return "tablets";
    case "laptop":
    case "kiosk":
      return "desktop";
  }
};

export const pickDeviceGroup = (deviceView: DeviceView): DeviceGroup => {
  if (deviceView.isCustom) return "custom";
  return pickFrameGroup(deviceView.frameShape);
};

export const listDeviceGroups = (
  deviceViews: DeviceView[],
): DeviceGroupView[] =>
  DEVICE_GROUPS.map((group) => ({
    group,
    devices: deviceViews.filter(
      (deviceView) => pickDeviceGroup(deviceView) === group,
    ),
  })).filter((groupView) => groupView.devices.length > 0);

export const pickDeviceName = (
  deviceViews: DeviceView[],
  deviceId: string,
): string => {
  const foundDevice = deviceViews.find(
    (deviceView) => deviceView.deviceId === deviceId,
  );
  return foundDevice?.name ?? deviceId;
};
