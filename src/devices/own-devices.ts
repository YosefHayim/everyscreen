import { devices } from "playwright";
import { createDesktopUserAgent } from "@/devices/desktop-user-agent-logic";
import type {
  CatalogDevice,
  DeviceCutout,
  DeviceIdentity,
  DeviceViewport,
  SafeAreaInsets,
} from "@/devices/devices-logic";
import { FRAME_SHAPE_INSETS } from "@/devices/frame-shape-insets";
import { CPU_TIERS } from "@/environment";

// Devices Playwright's registry lacks. Each device has a source comment for its size.
// A size is the full screen; no browser size is published, so browserViewport is null.
type OwnBase = Omit<
  CatalogDevice,
  | "id"
  | "name"
  | "fullScreen"
  | "browserViewport"
  | "deviceScaleFactor"
  | "cornerRadius"
  | "cutout"
  | "safeAreaInsets"
>;

interface OwnDeviceSpec {
  id: string;
  name: string;
  size: DeviceViewport;
  deviceScaleFactor: number;
  cornerRadius: number | null;
  cutout: DeviceCutout;
  safeAreaInsets: SafeAreaInsets;
}

// Chrome on Android reports a fixed model, "K", and a fixed Android version in its reduced user agent.
const REDUCED_ANDROID_MODEL = /Android [\d.]+; [^)]+\)/;
const REDUCED_ANDROID_MODEL_TEXT = "Android 10; K)";

const ANDROID_USER_AGENT = devices["Pixel 10"].userAgent.replace(
  REDUCED_ANDROID_MODEL,
  REDUCED_ANDROID_MODEL_TEXT,
);

const IPAD_USER_AGENT = devices["iPad Pro 11"].userAgent;
const REGISTRY_DESKTOP_USER_AGENT = devices["Desktop Chrome"].userAgent;

const UNMEASURED_CUTOUT: DeviceCutout = {
  kind: "punch-hole-center",
  width: null,
  height: null,
  top: null,
  left: null,
};

const NO_CUTOUT: DeviceCutout = { ...UNMEASURED_CUTOUT, kind: "none" };

const NOTCH: DeviceCutout = { ...UNMEASURED_CUTOUT, kind: "notch" };

const ANDROID_BASE: OwnBase = {
  registryName: null,
  browserName: "chromium",
  frameShape: "punch-hole",
  cpuSlowdown: CPU_TIERS.phone,
  platform: "android",
  maker: "samsung",
  userAgent: ANDROID_USER_AGENT,
  isMobile: true,
  hasTouch: true,
};

const IPAD_BASE: OwnBase = {
  registryName: null,
  browserName: "webkit",
  frameShape: "tablet",
  cpuSlowdown: CPU_TIERS.tablet,
  platform: "ipados",
  maker: "apple",
  userAgent: IPAD_USER_AGENT,
  isMobile: true,
  hasTouch: true,
};

const MAC_BASE: OwnBase = {
  registryName: null,
  browserName: "chromium",
  frameShape: "laptop",
  cpuSlowdown: CPU_TIERS.desktop,
  platform: "macos",
  maker: "apple",
  userAgent: createDesktopUserAgent("macos", REGISTRY_DESKTOP_USER_AGENT),
  isMobile: false,
  hasTouch: false,
};

const WINDOWS_BASE: OwnBase = {
  ...MAC_BASE,
  platform: "windows",
  maker: "generic",
  userAgent: createDesktopUserAgent("windows", REGISTRY_DESKTOP_USER_AGENT),
};

const LINUX_BASE: OwnBase = {
  ...MAC_BASE,
  platform: "linux",
  maker: "generic",
  userAgent: createDesktopUserAgent("linux", REGISTRY_DESKTOP_USER_AGENT),
};

const createOwnDevice = (
  base: OwnBase,
  spec: OwnDeviceSpec,
): CatalogDevice => ({
  ...base,
  id: spec.id,
  name: spec.name,
  fullScreen: spec.size,
  browserViewport: null,
  deviceScaleFactor: spec.deviceScaleFactor,
  cornerRadius: spec.cornerRadius,
  cutout: spec.cutout,
  safeAreaInsets: spec.safeAreaInsets,
});

const createTabletSpec = (
  identity: Pick<DeviceIdentity, "id" | "name" | "cornerRadius">,
  size: DeviceViewport,
): OwnDeviceSpec => ({
  ...identity,
  size,
  deviceScaleFactor: 2,
  cutout: NO_CUTOUT,
  safeAreaInsets: FRAME_SHAPE_INSETS.tablet,
});

const createPhoneSpec = (
  identity: Pick<DeviceIdentity, "id" | "name">,
  screen: { size: DeviceViewport; deviceScaleFactor: number },
): OwnDeviceSpec => ({
  ...identity,
  size: screen.size,
  deviceScaleFactor: screen.deviceScaleFactor,
  cornerRadius: null,
  cutout: UNMEASURED_CUTOUT,
  safeAreaInsets: FRAME_SHAPE_INSETS["punch-hole"],
});

const createDesktopSpec = (
  identity: Pick<DeviceIdentity, "id" | "name">,
  size: DeviceViewport,
): OwnDeviceSpec => ({
  ...identity,
  size,
  deviceScaleFactor: 1,
  cornerRadius: 0,
  cutout: NO_CUTOUT,
  safeAreaInsets: FRAME_SHAPE_INSETS.laptop,
});

// Sizes: https://www.useyourloaf.com/blog/ipad-2024-screen-sizes/ and https://www.ios-resolution.com/
// Corner radius for Air and Pro 11: https://github.com/kylebshr/ScreenCorners
const IPAD_DEVICES: CatalogDevice[] = [
  createOwnDevice(
    IPAD_BASE,
    createTabletSpec(
      { id: "ipad-mini", name: "iPad mini", cornerRadius: null },
      { width: 744, height: 1133 },
    ),
  ),
  createOwnDevice(
    IPAD_BASE,
    createTabletSpec(
      { id: "ipad-air-11", name: "iPad Air 11", cornerRadius: 18 },
      { width: 820, height: 1180 },
    ),
  ),
  createOwnDevice(
    IPAD_BASE,
    createTabletSpec(
      { id: "ipad-air-13", name: "iPad Air 13", cornerRadius: 18 },
      { width: 1024, height: 1366 },
    ),
  ),
  createOwnDevice(
    IPAD_BASE,
    createTabletSpec(
      { id: "ipad-pro-13", name: "iPad Pro 13", cornerRadius: null },
      { width: 1032, height: 1376 },
    ),
  ),
];

// Sizes: https://yesviz.com/devices.php
// Samsung publishes no corner radius, cutout size or insets.
const SAMSUNG_DEVICES: CatalogDevice[] = [
  createOwnDevice(
    ANDROID_BASE,
    createPhoneSpec(
      { id: "galaxy-s25", name: "Galaxy S25" },
      { size: { width: 360, height: 780 }, deviceScaleFactor: 3 },
    ),
  ),
  createOwnDevice(
    ANDROID_BASE,
    createPhoneSpec(
      { id: "galaxy-s25-plus", name: "Galaxy S25+" },
      { size: { width: 412, height: 891 }, deviceScaleFactor: 3.5 },
    ),
  ),
  createOwnDevice(
    ANDROID_BASE,
    createPhoneSpec(
      { id: "galaxy-s25-ultra", name: "Galaxy S25 Ultra" },
      { size: { width: 412, height: 891 }, deviceScaleFactor: 3.5 },
    ),
  ),
  createOwnDevice(
    ANDROID_BASE,
    createPhoneSpec(
      { id: "galaxy-s26", name: "Galaxy S26" },
      { size: { width: 360, height: 780 }, deviceScaleFactor: 3 },
    ),
  ),
  createOwnDevice(
    ANDROID_BASE,
    createPhoneSpec(
      { id: "galaxy-s26-plus", name: "Galaxy S26+" },
      { size: { width: 412, height: 891 }, deviceScaleFactor: 3.5 },
    ),
  ),
  createOwnDevice(
    ANDROID_BASE,
    createPhoneSpec(
      { id: "galaxy-s26-ultra", name: "Galaxy S26 Ultra" },
      { size: { width: 412, height: 891 }, deviceScaleFactor: 3.5 },
    ),
  ),
];

const XIAOMI_BASE: OwnBase = { ...ANDROID_BASE, maker: "xiaomi" };
const ONEPLUS_BASE: OwnBase = { ...ANDROID_BASE, maker: "oneplus" };

// Sizes: https://www.whatismyscreensize.com/device/xiaomi-14 (derived from the resolution, not measured)
// Xiaomi 14 corner radius and top inset: third-party tree https://github.com/lolipuru/android_device_xiaomi_houji
const XIAOMI_DEVICES: CatalogDevice[] = [
  createOwnDevice(XIAOMI_BASE, {
    ...createPhoneSpec(
      { id: "xiaomi-14", name: "Xiaomi 14" },
      { size: { width: 400, height: 890 }, deviceScaleFactor: 3 },
    ),
    cornerRadius: 41.33,
    safeAreaInsets: { ...FRAME_SHAPE_INSETS["punch-hole"], top: 49 },
  }),
  createOwnDevice(
    XIAOMI_BASE,
    createPhoneSpec(
      { id: "xiaomi-15", name: "Xiaomi 15" },
      { size: { width: 400, height: 890 }, deviceScaleFactor: 3 },
    ),
  ),
  // https://www.whatismyscreensize.com/device/redmi-note-13 (the page does not say 4G or 5G)
  createOwnDevice(
    XIAOMI_BASE,
    createPhoneSpec(
      { id: "redmi-note-13", name: "Redmi Note 13" },
      { size: { width: 393, height: 873 }, deviceScaleFactor: 2.748 },
    ),
  ),
  // https://www.whatismyscreensize.com/device/redmi-note-14
  createOwnDevice(
    XIAOMI_BASE,
    createPhoneSpec(
      { id: "redmi-note-14", name: "Redmi Note 14" },
      { size: { width: 393, height: 873 }, deviceScaleFactor: 2.748 },
    ),
  ),
];

// Size: https://yesviz.com/devices.php
// Frame numbers: third-party LineageOS tree https://github.com/LineageOS/android_device_oneplus_dodge
const ONEPLUS_13: CatalogDevice = createOwnDevice(ONEPLUS_BASE, {
  id: "oneplus-13",
  name: "OnePlus 13",
  size: { width: 412, height: 905 },
  deviceScaleFactor: 3.5,
  cornerRadius: 32,
  cutout: {
    kind: "punch-hole-center",
    width: 19.43,
    height: 19.43,
    top: 13.14,
    left: 196,
  },
  safeAreaInsets: { ...FRAME_SHAPE_INSETS["punch-hole"], top: 45.67 },
});

// Default scaled sizes: https://9to5mac.com/2021/10/19/new-macbook-pro-screen-resolution-options/
// Apple publishes no corner radius or notch size for Macs.
const MAC_DEVICES: CatalogDevice[] = [
  // Default scaled size: https://discussions.apple.com/thread/256018588 (forum report)
  createOwnDevice(MAC_BASE, {
    ...createDesktopSpec(
      { id: "macbook-air-13", name: "MacBook Air 13" },
      { width: 1470, height: 956 },
    ),
    cornerRadius: null,
    cutout: NOTCH,
  }),
  // Default scaled size: https://forums.macrumors.com/threads/why-the-default-resolution-for-the-macbook-air-15-2023-is-1710x1107.2392843
  createOwnDevice(MAC_BASE, {
    ...createDesktopSpec(
      { id: "macbook-air-15", name: "MacBook Air 15" },
      { width: 1710, height: 1107 },
    ),
    cornerRadius: null,
    cutout: NOTCH,
  }),
  createOwnDevice(MAC_BASE, {
    ...createDesktopSpec(
      { id: "macbook-pro-14", name: "MacBook Pro 14" },
      { width: 1512, height: 982 },
    ),
    cornerRadius: null,
    cutout: NOTCH,
  }),
  createOwnDevice(MAC_BASE, {
    ...createDesktopSpec(
      { id: "macbook-pro-16", name: "MacBook Pro 16" },
      { width: 1728, height: 1117 },
    ),
    cornerRadius: null,
    cutout: NOTCH,
  }),
];

// Sizes: most used desktop resolutions at https://gs.statcounter.com/screen-resolution-stats/desktop/worldwide
// 1536x864 is 1920x1080 at the 125 percent Windows scale (https://learn.microsoft.com/en-us/uwp/api/windows.graphics.display.resolutionscale).
// StatCounter lists no Linux-only sizes, so the Linux monitor uses the overall top size.
const MONITOR_DEVICES: CatalogDevice[] = [
  createOwnDevice(
    WINDOWS_BASE,
    createDesktopSpec(
      { id: "windows-laptop-1366", name: "Windows laptop 1366" },
      { width: 1366, height: 768 },
    ),
  ),
  createOwnDevice(
    WINDOWS_BASE,
    createDesktopSpec(
      { id: "windows-laptop-1536", name: "Windows laptop 1536" },
      { width: 1536, height: 864 },
    ),
  ),
  createOwnDevice(
    WINDOWS_BASE,
    createDesktopSpec(
      { id: "monitor-1920", name: "Windows monitor 1920" },
      { width: 1920, height: 1080 },
    ),
  ),
  createOwnDevice(
    WINDOWS_BASE,
    createDesktopSpec(
      { id: "monitor-2560", name: "Windows monitor 2560" },
      { width: 2560, height: 1440 },
    ),
  ),
  createOwnDevice(
    LINUX_BASE,
    createDesktopSpec(
      { id: "linux-1920", name: "Linux monitor 1920" },
      { width: 1920, height: 1080 },
    ),
  ),
];

// Presets from before the catalog existed. They are sizes, not real models, so they keep their ids.
const LEGACY_DEVICES: CatalogDevice[] = [
  createOwnDevice(MAC_BASE, {
    ...createDesktopSpec(
      { id: "laptop-1440", name: "Laptop 1440" },
      { width: 1440, height: 900 },
    ),
    cutout: NO_CUTOUT,
  }),
  createOwnDevice(
    { ...LINUX_BASE, frameShape: "kiosk", hasTouch: true },
    createDesktopSpec(
      { id: "store-kiosk", name: "Store kiosk" },
      { width: 1080, height: 1920 },
    ),
  ),
];

export const OWN_DEVICES: CatalogDevice[] = [
  ...IPAD_DEVICES,
  ...SAMSUNG_DEVICES,
  ...XIAOMI_DEVICES,
  ONEPLUS_13,
  ...MAC_DEVICES,
  ...MONITOR_DEVICES,
  ...LEGACY_DEVICES,
];
