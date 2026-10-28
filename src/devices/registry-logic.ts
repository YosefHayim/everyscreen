import type {
  CatalogDevice,
  DeviceIdentity,
  DeviceViewport,
} from "@/devices/devices-logic";

export interface RegistrySizes {
  screen?: DeviceViewport;
  viewport: DeviceViewport;
}

export interface RegistryDevice extends RegistrySizes {
  userAgent: string;
  deviceScaleFactor: number;
  isMobile: boolean;
  hasTouch: boolean;
}

// Playwright lists no screen for devices where the viewport already fills the screen.
export const pickRegistryScreen = (
  registrySizes: RegistrySizes,
): DeviceViewport => registrySizes.screen ?? registrySizes.viewport;

export const createCatalogDeviceFromRegistry = (
  identity: DeviceIdentity,
  registryName: string,
  registryDevice: RegistryDevice,
): CatalogDevice => ({
  ...identity,
  registryName,
  fullScreen: pickRegistryScreen(registryDevice),
  browserViewport: registryDevice.viewport,
  userAgent: registryDevice.userAgent,
  deviceScaleFactor: registryDevice.deviceScaleFactor,
  isMobile: registryDevice.isMobile,
  hasTouch: registryDevice.hasTouch,
});
