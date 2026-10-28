import type { BrowserName } from "@/devices/devices-logic";

export type ScreenUpdate = "live" | "perStep";

export const pickScreenUpdate = (browserName: BrowserName): ScreenUpdate => {
  const isLiveVideoEngine = browserName === "chromium";
  if (isLiveVideoEngine) return "live";
  return "perStep";
};
