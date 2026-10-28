import type { CatalogDevice } from "@/devices/devices-logic";
import { OWN_DEVICES } from "@/devices/own-devices";
import { REGISTRY_DEVICES } from "@/devices/registry-devices";

// One device per size class and engine, newer models first. At most 12 browsers start by default.
const DEFAULT_GRID_IDS = [
  "iphone-se",
  "iphone-17",
  "iphone-17-pro-max",
  "galaxy-s25",
  "pixel-10",
  "xiaomi-15",
  "ipad-mini",
  "ipad-pro-11",
  "galaxy-tab-s9",
  "macbook-air-13",
  "windows-laptop-1366",
  "store-kiosk",
];

export const DEVICE_CATALOG: CatalogDevice[] = [
  ...REGISTRY_DEVICES,
  ...OWN_DEVICES,
];

export const DEFAULT_GRID_DEVICES: CatalogDevice[] = DEFAULT_GRID_IDS.map(
  (gridId) => {
    const gridDevice = DEVICE_CATALOG.find(({ id }) => id === gridId);
    const isGridDeviceMissing = gridDevice === undefined;
    if (isGridDeviceMissing) {
      throw new Error(`Default grid device ${gridId} is not in the catalog`);
    }
    return gridDevice;
  },
);
