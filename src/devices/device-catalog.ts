import type { CatalogDevice } from "@/devices/devices-logic";
import { OWN_DEVICES } from "@/devices/own-devices";
import { REGISTRY_DEVICES } from "@/devices/registry-devices";

export const DEVICE_CATALOG: CatalogDevice[] = [
  ...REGISTRY_DEVICES,
  ...OWN_DEVICES,
];
