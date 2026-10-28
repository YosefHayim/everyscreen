import type {
  CatalogDevice,
  CatalogIdentity,
  DeviceViewport,
} from "@/devices/devices-logic";

interface RegistrySizes {
  screen?: DeviceViewport;
  viewport: DeviceViewport;
}

interface RegistryDevice extends RegistrySizes {
  userAgent: string;
  deviceScaleFactor: number;
  isMobile: boolean;
  hasTouch: boolean;
}

// Playwright lists no screen for devices where the viewport already fills the screen.
const pickRegistryScreen = (registrySizes: RegistrySizes): DeviceViewport =>
  registrySizes.screen ?? registrySizes.viewport;

export const createCatalogDeviceFromRegistry = (
  identity: CatalogIdentity,
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
