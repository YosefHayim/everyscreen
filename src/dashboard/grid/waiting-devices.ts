import type { BrowserName, FrameShape } from "@/devices/devices-logic";

export interface WaitingDevice {
  deviceId: string;
  name: string;
  browserName: BrowserName;
  frameShape: FrameShape;
  viewportWidth: number;
  viewportHeight: number;
}

// The device presets the grid shows before an app is open. GET /api/devices replaces it in wave 2.
export const WAITING_DEVICES: WaitingDevice[] = [
  {
    deviceId: "iphone-se",
    name: "iPhone SE",
    browserName: "webkit",
    frameShape: "home-button",
    viewportWidth: 375,
    viewportHeight: 667,
  },
  {
    deviceId: "iphone-15",
    name: "iPhone 15",
    browserName: "webkit",
    frameShape: "dynamic-island",
    viewportWidth: 393,
    viewportHeight: 852,
  },
  {
    deviceId: "galaxy-s24",
    name: "Galaxy S24",
    browserName: "chromium",
    frameShape: "punch-hole",
    viewportWidth: 360,
    viewportHeight: 780,
  },
  {
    deviceId: "pixel-8",
    name: "Pixel 8",
    browserName: "chromium",
    frameShape: "punch-hole",
    viewportWidth: 412,
    viewportHeight: 915,
  },
  {
    deviceId: "ipad-mini",
    name: "iPad mini",
    browserName: "webkit",
    frameShape: "tablet",
    viewportWidth: 744,
    viewportHeight: 1133,
  },
  {
    deviceId: "laptop-1440",
    name: "Laptop 1440",
    browserName: "chromium",
    frameShape: "laptop",
    viewportWidth: 1440,
    viewportHeight: 900,
  },
];
