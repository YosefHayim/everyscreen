import type { Page } from "playwright";
import {
  type DevicePreset,
  type FrameShape,
  pickDeviceViewport,
  type SafeAreaInsets,
} from "@/devices/devices-logic";

const NO_INSETS: SafeAreaInsets = { top: 0, bottom: 0, left: 0, right: 0 };

export const SAFE_AREA_INSETS = {
  "home-button": NO_INSETS,
  "dynamic-island": { top: 59, bottom: 34, left: 0, right: 0 },
  "punch-hole": { top: 24, bottom: 0, left: 0, right: 0 },
  tablet: NO_INSETS,
  laptop: NO_INSETS,
  kiosk: NO_INSETS,
} as const satisfies Record<FrameShape, SafeAreaInsets>;

export const emulateDevice = async (
  page: Page,
  devicePreset: DevicePreset,
): Promise<void> => {
  const { deviceScaleFactor, isMobile, hasTouch, userAgent } = devicePreset.use;
  const viewport = pickDeviceViewport(devicePreset);

  const cdpSession = await page.context().newCDPSession(page);
  await cdpSession.send("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: deviceScaleFactor ?? 1,
    mobile: isMobile ?? false,
  });
  await cdpSession.send("Emulation.setTouchEmulationEnabled", {
    enabled: hasTouch ?? false,
  });
  await cdpSession.send("Emulation.setSafeAreaInsetsOverride", {
    insets: SAFE_AREA_INSETS[devicePreset.frameShape],
  });
  const hasUserAgent = userAgent !== undefined;
  if (hasUserAgent) {
    await cdpSession.send("Emulation.setUserAgentOverride", { userAgent });
  }
};
