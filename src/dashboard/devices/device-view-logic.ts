import type { BrowserName, FrameShape } from "@/devices/devices-logic";

export type DeviceGroup = "phones" | "tablets" | "desktop" | "custom";

export interface DeviceView {
  deviceId: string;
  name: string;
  browserName: BrowserName;
  frameShape: FrameShape;
  viewportWidth: number;
  viewportHeight: number;
  pixelRatio: number;
  hasTouch: boolean;
  isCustom: boolean;
}

export interface GridDeviceReply {
  id: string;
  name: string;
  browserName: BrowserName;
  frameShape: FrameShape;
  origin: "catalog" | "custom";
  use: {
    viewport?: { width: number; height: number } | null;
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

  return {
    deviceId: gridDevice.id,
    name: gridDevice.name,
    browserName: gridDevice.browserName,
    frameShape: gridDevice.frameShape,
    viewportWidth: viewport.width,
    viewportHeight: viewport.height,
    pixelRatio: gridDevice.use.deviceScaleFactor ?? DEFAULT_PIXEL_RATIO,
    hasTouch: gridDevice.use.hasTouch === true,
    isCustom: gridDevice.origin === "custom",
  };
};

const pickFrameGroup = (frameShape: FrameShape): DeviceGroup => {
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

const PREVIEW_BOX_WIDTH = 150;
const PREVIEW_BOX_HEIGHT = 110;

export const pickPreviewScreenWidth = (deviceView: DeviceView): number => {
  const widthScale = PREVIEW_BOX_WIDTH / deviceView.viewportWidth;
  const heightScale = PREVIEW_BOX_HEIGHT / deviceView.viewportHeight;
  return Math.round(
    deviceView.viewportWidth * Math.min(widthScale, heightScale),
  );
};
