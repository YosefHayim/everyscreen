import type { Page } from "playwright";
import {
  type DevicePreset,
  pickDeviceScreen,
  pickDeviceViewport,
} from "@/devices/devices-logic";

export const emulateDevice = async (
  page: Page,
  devicePreset: DevicePreset,
): Promise<void> => {
  const { deviceScaleFactor, isMobile, hasTouch, userAgent } = devicePreset.use;
  const viewport = pickDeviceViewport(devicePreset);
  const screen = pickDeviceScreen(devicePreset);

  const { bottom, left, right } = devicePreset.safeAreaInsets;
  // Chrome accepts whole CSS px only, and AOSP numbers are fractional.
  // The page always sits below the status bar, so no top inset reaches it.
  const wholeInsets = {
    top: 0,
    bottom: Math.round(bottom),
    left: Math.round(left),
    right: Math.round(right),
  };

  const cdpSession = await page.context().newCDPSession(page);
  await cdpSession.send("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    screenWidth: screen.width,
    screenHeight: screen.height,
    deviceScaleFactor: deviceScaleFactor ?? 1,
    mobile: isMobile ?? false,
  });
  await cdpSession.send("Emulation.setTouchEmulationEnabled", {
    enabled: hasTouch ?? false,
  });
  await cdpSession.send("Emulation.setSafeAreaInsetsOverride", {
    insets: wholeInsets,
  });
  const hasUserAgent = userAgent !== undefined;
  if (hasUserAgent) {
    await cdpSession.send("Emulation.setUserAgentOverride", { userAgent });
  }
};
