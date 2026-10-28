import type { BrowserContextOptions } from "playwright";
import { devices } from "playwright";
import type { DevicePreset } from "@/devices/devices-logic";
import { CPU_TIERS } from "@/environment";

type RegistryDevice = (typeof devices)[string];

interface Viewport {
  width: number;
  height: number;
}

// Playwright's own registry: https://playwright.dev/docs/emulation#devices
// The registry viewport is the browser window; presets use the full screen size.
const createContextOptions = (
  registryDevice: RegistryDevice,
  viewport: Viewport,
): BrowserContextOptions => ({
  viewport,
  userAgent: registryDevice.userAgent,
  deviceScaleFactor: registryDevice.deviceScaleFactor,
  isMobile: registryDevice.isMobile,
  hasTouch: registryDevice.hasTouch,
});

export const DEVICE_PRESETS: DevicePreset[] = [
  {
    id: "iphone-se",
    name: "iPhone SE",
    browserName: "chromium",
    frameShape: "home-button",
    cpuSlowdown: CPU_TIERS.budgetPhone,
    use: createContextOptions(devices["iPhone SE (3rd gen)"], {
      width: 375,
      height: 667,
    }),
  },
  {
    id: "iphone-15",
    name: "iPhone 15",
    browserName: "chromium",
    frameShape: "dynamic-island",
    cpuSlowdown: CPU_TIERS.phone,
    use: createContextOptions(devices["iPhone 15"], {
      width: 393,
      height: 852,
    }),
  },
  {
    id: "iphone-15-pro-max",
    name: "iPhone 15 Pro Max",
    browserName: "chromium",
    frameShape: "dynamic-island",
    cpuSlowdown: CPU_TIERS.phone,
    use: createContextOptions(devices["iPhone 15 Pro Max"], {
      width: 430,
      height: 932,
    }),
  },
  {
    id: "galaxy-s24",
    name: "Galaxy S24",
    browserName: "chromium",
    frameShape: "punch-hole",
    cpuSlowdown: CPU_TIERS.phone,
    use: createContextOptions(devices["Galaxy S24"], {
      width: 360,
      height: 780,
    }),
  },
  {
    id: "pixel-8",
    name: "Pixel 8",
    browserName: "chromium",
    frameShape: "punch-hole",
    cpuSlowdown: CPU_TIERS.phone,
    use: createContextOptions(devices["Pixel 8"], {
      width: 412,
      height: 915,
    }),
  },
  {
    id: "ipad-mini",
    name: "iPad Mini",
    browserName: "chromium",
    frameShape: "tablet",
    cpuSlowdown: CPU_TIERS.tablet,
    use: createContextOptions(devices["iPad Mini"], {
      width: 744,
      height: 1133,
    }),
  },
  {
    id: "ipad-pro-11",
    name: "iPad Pro 11",
    browserName: "chromium",
    frameShape: "tablet",
    cpuSlowdown: CPU_TIERS.tablet,
    use: createContextOptions(devices["iPad Pro 11"], {
      width: 834,
      height: 1194,
    }),
  },
  {
    id: "laptop-1440",
    name: "Laptop 1440",
    browserName: "chromium",
    frameShape: "laptop",
    cpuSlowdown: CPU_TIERS.desktop,
    use: {
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
    },
  },
  {
    id: "store-kiosk",
    name: "Store kiosk",
    browserName: "chromium",
    frameShape: "kiosk",
    cpuSlowdown: CPU_TIERS.desktop,
    use: {
      viewport: { width: 1080, height: 1920 },
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: true,
    },
  },
];
