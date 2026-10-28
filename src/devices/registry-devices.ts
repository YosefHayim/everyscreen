import { devices } from "playwright";
import type {
  CatalogDevice,
  CatalogIdentity,
  DeviceCutout,
  SafeAreaInsets,
} from "@/devices/devices-logic";
import { FRAME_SHAPE_INSETS } from "@/devices/frame-shape-insets";
import { createCatalogDeviceFromRegistry } from "@/devices/registry-logic";
import { CPU_TIERS } from "@/environment";

interface RegistryDeviceSpec {
  registryName: string;
  identity: CatalogIdentity;
}

type DeviceBase = Omit<
  CatalogIdentity,
  "id" | "name" | "cornerRadius" | "safeAreaInsets" | "cutout"
>;

// Playwright's own registry: https://playwright.dev/docs/emulation#devices
// Corner radius for iPhones: https://github.com/kylebshr/ScreenCorners
// Insets for iPhones: https://www.useyourloaf.com/blog/iphone-16-screen-sizes/ and the iPhone 15 and 17 posts there.
// Apple publishes no Dynamic Island, notch or home button size, so those sizes stay null.
// Pixel frame numbers come from the AOSP device overlays (config.xml and dimens.xml), divided by the screen density:
// https://android.googlesource.com/device/google/shusky/+/refs/heads/main/shiba/overlay/frameworks/base/core/res/res/values/
// A device without a published value takes the default insets of its frame shape.
const IPHONE_BASE: DeviceBase = {
  browserName: "webkit",
  frameShape: "dynamic-island",
  cpuSlowdown: CPU_TIERS.phone,
  platform: "ios",
  maker: "apple",
};

const ANDROID_BASE: DeviceBase = {
  browserName: "chromium",
  frameShape: "punch-hole",
  cpuSlowdown: CPU_TIERS.phone,
  platform: "android",
  maker: "google",
};

const SAMSUNG_BASE: DeviceBase = { ...ANDROID_BASE, maker: "samsung" };

const TABLET_BASE: DeviceBase = {
  browserName: "webkit",
  frameShape: "tablet",
  cpuSlowdown: CPU_TIERS.tablet,
  platform: "ipados",
  maker: "apple",
};

const DYNAMIC_ISLAND: DeviceCutout = {
  kind: "dynamic-island",
  width: null,
  height: null,
  top: null,
  left: null,
};

const NOTCH: DeviceCutout = { ...DYNAMIC_ISLAND, kind: "notch" };

const UNMEASURED_PUNCH_HOLE: DeviceCutout = {
  ...DYNAMIC_ISLAND,
  kind: "punch-hole-center",
};

const NO_CUTOUT: DeviceCutout = { ...DYNAMIC_ISLAND, kind: "none" };

const ISLAND_INSETS_IPHONE_15: SafeAreaInsets = {
  top: 59,
  bottom: 34,
  left: 0,
  right: 0,
};
const ISLAND_INSETS_IPHONE_16_PRO: SafeAreaInsets = {
  ...ISLAND_INSETS_IPHONE_15,
  top: 62,
};
const ISLAND_INSETS_IPHONE_AIR: SafeAreaInsets = {
  ...ISLAND_INSETS_IPHONE_15,
  top: 68,
};
// iPhone 16e and 17e share the screen size of the iPhone 13 and 14, which report these insets.
const NOTCH_INSETS_IPHONE_13: SafeAreaInsets = {
  ...ISLAND_INSETS_IPHONE_15,
  top: 47,
};

const createPunchHole = (hole: {
  diameter: number;
  top: number;
  left: number;
}): DeviceCutout => ({
  kind: "punch-hole-center",
  width: hole.diameter,
  height: hole.diameter,
  top: hole.top,
  left: hole.left,
});

const createTopInset = (top: number): SafeAreaInsets => ({
  ...FRAME_SHAPE_INSETS["punch-hole"],
  top,
});

const REGISTRY_DEVICE_SPECS: RegistryDeviceSpec[] = [
  {
    registryName: "iPhone SE (3rd gen)",
    identity: {
      ...IPHONE_BASE,
      id: "iphone-se",
      name: "iPhone SE",
      frameShape: "home-button",
      cpuSlowdown: CPU_TIERS.budgetPhone,
      cornerRadius: null,
      cutout: { ...NO_CUTOUT, kind: "home-button" },
      safeAreaInsets: FRAME_SHAPE_INSETS["home-button"],
    },
  },
  {
    registryName: "iPhone 15",
    identity: {
      ...IPHONE_BASE,
      id: "iphone-15",
      name: "iPhone 15",
      cornerRadius: 55,
      cutout: DYNAMIC_ISLAND,
      safeAreaInsets: ISLAND_INSETS_IPHONE_15,
    },
  },
  {
    registryName: "iPhone 15 Plus",
    identity: {
      ...IPHONE_BASE,
      id: "iphone-15-plus",
      name: "iPhone 15 Plus",
      cornerRadius: 55,
      cutout: DYNAMIC_ISLAND,
      safeAreaInsets: ISLAND_INSETS_IPHONE_15,
    },
  },
  {
    registryName: "iPhone 15 Pro",
    identity: {
      ...IPHONE_BASE,
      id: "iphone-15-pro",
      name: "iPhone 15 Pro",
      cornerRadius: 55,
      cutout: DYNAMIC_ISLAND,
      safeAreaInsets: ISLAND_INSETS_IPHONE_15,
    },
  },
  {
    registryName: "iPhone 15 Pro Max",
    identity: {
      ...IPHONE_BASE,
      id: "iphone-15-pro-max",
      name: "iPhone 15 Pro Max",
      cornerRadius: 55,
      cutout: DYNAMIC_ISLAND,
      safeAreaInsets: ISLAND_INSETS_IPHONE_15,
    },
  },
  {
    registryName: "iPhone 16",
    identity: {
      ...IPHONE_BASE,
      id: "iphone-16",
      name: "iPhone 16",
      cornerRadius: 55,
      cutout: DYNAMIC_ISLAND,
      safeAreaInsets: ISLAND_INSETS_IPHONE_15,
    },
  },
  {
    registryName: "iPhone 16 Plus",
    identity: {
      ...IPHONE_BASE,
      id: "iphone-16-plus",
      name: "iPhone 16 Plus",
      cornerRadius: 55,
      cutout: DYNAMIC_ISLAND,
      safeAreaInsets: ISLAND_INSETS_IPHONE_15,
    },
  },
  {
    registryName: "iPhone 16 Pro",
    identity: {
      ...IPHONE_BASE,
      id: "iphone-16-pro",
      name: "iPhone 16 Pro",
      cornerRadius: 62,
      cutout: DYNAMIC_ISLAND,
      safeAreaInsets: ISLAND_INSETS_IPHONE_16_PRO,
    },
  },
  {
    registryName: "iPhone 16 Pro Max",
    identity: {
      ...IPHONE_BASE,
      id: "iphone-16-pro-max",
      name: "iPhone 16 Pro Max",
      cornerRadius: 62,
      cutout: DYNAMIC_ISLAND,
      safeAreaInsets: ISLAND_INSETS_IPHONE_16_PRO,
    },
  },
  {
    registryName: "iPhone 16e",
    identity: {
      ...IPHONE_BASE,
      id: "iphone-16e",
      name: "iPhone 16e",
      cornerRadius: 47.33,
      cutout: NOTCH,
      safeAreaInsets: NOTCH_INSETS_IPHONE_13,
    },
  },
  {
    registryName: "iPhone 17",
    identity: {
      ...IPHONE_BASE,
      id: "iphone-17",
      name: "iPhone 17",
      cornerRadius: 62,
      cutout: DYNAMIC_ISLAND,
      safeAreaInsets: ISLAND_INSETS_IPHONE_16_PRO,
    },
  },
  {
    registryName: "iPhone Air",
    identity: {
      ...IPHONE_BASE,
      id: "iphone-air",
      name: "iPhone Air",
      cornerRadius: 62,
      cutout: DYNAMIC_ISLAND,
      safeAreaInsets: ISLAND_INSETS_IPHONE_AIR,
    },
  },
  {
    registryName: "iPhone 17 Pro",
    identity: {
      ...IPHONE_BASE,
      id: "iphone-17-pro",
      name: "iPhone 17 Pro",
      cornerRadius: 62,
      cutout: DYNAMIC_ISLAND,
      safeAreaInsets: ISLAND_INSETS_IPHONE_16_PRO,
    },
  },
  {
    registryName: "iPhone 17 Pro Max",
    identity: {
      ...IPHONE_BASE,
      id: "iphone-17-pro-max",
      name: "iPhone 17 Pro Max",
      cornerRadius: 62,
      cutout: DYNAMIC_ISLAND,
      safeAreaInsets: ISLAND_INSETS_IPHONE_16_PRO,
    },
  },
  {
    registryName: "iPhone 17e",
    identity: {
      ...IPHONE_BASE,
      id: "iphone-17e",
      name: "iPhone 17e",
      cornerRadius: null,
      cutout: NOTCH,
      safeAreaInsets: NOTCH_INSETS_IPHONE_13,
    },
  },
  {
    registryName: "Pixel 8",
    identity: {
      ...ANDROID_BASE,
      id: "pixel-8",
      name: "Pixel 8",
      cornerRadius: 38.86,
      cutout: createPunchHole({ diameter: 27.62, top: 11.24, left: 191.81 }),
      safeAreaInsets: createTopInset(50.29),
    },
  },
  {
    registryName: "Pixel 8 Pro",
    identity: {
      ...ANDROID_BASE,
      id: "pixel-8-pro",
      name: "Pixel 8 Pro",
      cornerRadius: 30.33,
      cutout: createPunchHole({ diameter: 28.83, top: 10.58, left: 209.58 }),
      safeAreaInsets: createTopInset(50.33),
    },
  },
  {
    registryName: "Pixel 8a",
    identity: {
      ...ANDROID_BASE,
      id: "pixel-8a",
      name: "Pixel 8a",
      cornerRadius: 48.76,
      cutout: createPunchHole({ diameter: 25.69, top: 13.33, left: 192.69 }),
      safeAreaInsets: createTopInset(46.1),
    },
  },
  {
    registryName: "Pixel 9",
    identity: {
      ...ANDROID_BASE,
      id: "pixel-9",
      name: "Pixel 9",
      cornerRadius: 44,
      cutout: createPunchHole({ diameter: 28, top: 14.83, left: 165.83 }),
      safeAreaInsets: createTopInset(57.67),
    },
  },
  {
    registryName: "Pixel 9 Pro",
    identity: {
      ...ANDROID_BASE,
      id: "pixel-9-pro",
      name: "Pixel 9 Pro",
      cornerRadius: 52.33,
      cutout: createPunchHole({ diameter: 32.67, top: 17.67, left: 197 }),
      safeAreaInsets: createTopInset(68),
    },
  },
  {
    registryName: "Pixel 9 Pro XL",
    identity: {
      ...ANDROID_BASE,
      id: "pixel-9-pro-xl",
      name: "Pixel 9 Pro XL",
      cornerRadius: 51,
      cutout: createPunchHole({ diameter: 31.33, top: 17.5, left: 208.33 }),
      safeAreaInsets: createTopInset(66.33),
    },
  },
  // The Pixel 10 phones are not in public AOSP, so their frame numbers are unpublished.
  {
    registryName: "Pixel 10",
    identity: {
      ...ANDROID_BASE,
      id: "pixel-10",
      name: "Pixel 10",
      cornerRadius: null,
      cutout: UNMEASURED_PUNCH_HOLE,
      safeAreaInsets: FRAME_SHAPE_INSETS["punch-hole"],
    },
  },
  {
    registryName: "Pixel 10 Pro",
    identity: {
      ...ANDROID_BASE,
      id: "pixel-10-pro",
      name: "Pixel 10 Pro",
      cornerRadius: null,
      cutout: UNMEASURED_PUNCH_HOLE,
      safeAreaInsets: FRAME_SHAPE_INSETS["punch-hole"],
    },
  },
  {
    registryName: "Pixel 10 Pro XL",
    identity: {
      ...ANDROID_BASE,
      id: "pixel-10-pro-xl",
      name: "Pixel 10 Pro XL",
      cornerRadius: null,
      cutout: UNMEASURED_PUNCH_HOLE,
      safeAreaInsets: FRAME_SHAPE_INSETS["punch-hole"],
    },
  },
  // Samsung publishes no corner radius, cutout size or insets.
  {
    registryName: "Galaxy S24",
    identity: {
      ...SAMSUNG_BASE,
      id: "galaxy-s24",
      name: "Galaxy S24",
      cornerRadius: null,
      cutout: UNMEASURED_PUNCH_HOLE,
      safeAreaInsets: FRAME_SHAPE_INSETS["punch-hole"],
    },
  },
  {
    registryName: "Galaxy A55",
    identity: {
      ...SAMSUNG_BASE,
      id: "galaxy-a55",
      name: "Galaxy A55",
      cornerRadius: null,
      cutout: UNMEASURED_PUNCH_HOLE,
      safeAreaInsets: FRAME_SHAPE_INSETS["punch-hole"],
    },
  },
  {
    registryName: "Galaxy Z Fold 7",
    identity: {
      ...SAMSUNG_BASE,
      id: "galaxy-z-fold-7",
      name: "Galaxy Z Fold 7 (open)",
      frameShape: "tablet",
      cpuSlowdown: CPU_TIERS.tablet,
      cornerRadius: null,
      cutout: UNMEASURED_PUNCH_HOLE,
      safeAreaInsets: FRAME_SHAPE_INSETS.tablet,
    },
  },
  {
    registryName: "Galaxy Z Fold 7 Cover",
    identity: {
      ...SAMSUNG_BASE,
      id: "galaxy-z-fold-7-cover",
      name: "Galaxy Z Fold 7 (cover)",
      cornerRadius: null,
      cutout: UNMEASURED_PUNCH_HOLE,
      safeAreaInsets: FRAME_SHAPE_INSETS["punch-hole"],
    },
  },
  {
    registryName: "Galaxy Z Flip 7",
    identity: {
      ...SAMSUNG_BASE,
      id: "galaxy-z-flip-7",
      name: "Galaxy Z Flip 7 (open)",
      cornerRadius: null,
      cutout: UNMEASURED_PUNCH_HOLE,
      safeAreaInsets: FRAME_SHAPE_INSETS["punch-hole"],
    },
  },
  {
    registryName: "Galaxy Z Flip 7 Cover",
    identity: {
      ...SAMSUNG_BASE,
      id: "galaxy-z-flip-7-cover",
      name: "Galaxy Z Flip 7 (cover)",
      cornerRadius: null,
      cutout: NO_CUTOUT,
      safeAreaInsets: FRAME_SHAPE_INSETS.tablet,
    },
  },
  {
    registryName: "iPad Pro 11",
    identity: {
      ...TABLET_BASE,
      id: "ipad-pro-11",
      name: "iPad Pro 11",
      // https://github.com/kylebshr/ScreenCorners
      cornerRadius: 18,
      cutout: NO_CUTOUT,
      safeAreaInsets: FRAME_SHAPE_INSETS.tablet,
    },
  },
  {
    registryName: "iPad (gen 11)",
    identity: {
      ...TABLET_BASE,
      id: "ipad-11",
      name: "iPad (11th gen)",
      cornerRadius: null,
      cutout: NO_CUTOUT,
      safeAreaInsets: FRAME_SHAPE_INSETS.tablet,
    },
  },
  {
    registryName: "Galaxy Tab S9",
    identity: {
      ...SAMSUNG_BASE,
      id: "galaxy-tab-s9",
      name: "Galaxy Tab S9",
      frameShape: "tablet",
      cpuSlowdown: CPU_TIERS.tablet,
      cornerRadius: null,
      cutout: NO_CUTOUT,
      safeAreaInsets: FRAME_SHAPE_INSETS.tablet,
    },
  },
];

const createRegistryCatalogDevice = (
  deviceSpec: RegistryDeviceSpec,
): CatalogDevice => {
  const registryDevice = devices[deviceSpec.registryName];
  const isRegistryDeviceMissing = registryDevice === undefined;
  if (isRegistryDeviceMissing) {
    throw new Error(
      `Playwright has no device ${deviceSpec.registryName}; update the catalog`,
    );
  }
  return createCatalogDeviceFromRegistry(
    deviceSpec.identity,
    deviceSpec.registryName,
    registryDevice,
  );
};

export const REGISTRY_DEVICES: CatalogDevice[] = REGISTRY_DEVICE_SPECS.map(
  createRegistryCatalogDevice,
);
