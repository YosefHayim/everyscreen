import type { BrowserContextOptions } from "playwright";

export type BrowserName = "chromium" | "webkit" | "firefox";

export type FrameShape =
  | "home-button"
  | "dynamic-island"
  | "punch-hole"
  | "tablet"
  | "laptop"
  | "kiosk";

export interface DevicePreset {
  id: string;
  name: string;
  browserName: BrowserName;
  frameShape: FrameShape;
  cpuSlowdown: number;
  use: BrowserContextOptions;
}
