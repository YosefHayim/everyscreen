import { describe, expect, test } from "vitest";
import { DEVICE_CATALOG } from "@/devices/device-catalog";
import { createCatalogDeviceFromRegistry } from "@/devices/registry-logic";

describe("createCatalogDeviceFromRegistry", () => {
  test("reads sizes and emulation from the registry device", () => {
    const [identityDevice] = DEVICE_CATALOG;

    const catalogDevice = createCatalogDeviceFromRegistry(
      identityDevice,
      "Some phone",
      {
        screen: { width: 400, height: 800 },
        viewport: { width: 400, height: 700 },
        userAgent: "Agent",
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
      },
    );

    expect(catalogDevice).toMatchObject({
      id: identityDevice.id,
      registryName: "Some phone",
      fullScreen: { width: 400, height: 800 },
      browserViewport: { width: 400, height: 700 },
      userAgent: "Agent",
      deviceScaleFactor: 3,
    });
  });

  test("uses the viewport as the full screen when the registry has no screen", () => {
    const [identityDevice] = DEVICE_CATALOG;

    const catalogDevice = createCatalogDeviceFromRegistry(
      identityDevice,
      "Some phone",
      {
        viewport: { width: 360, height: 780 },
        userAgent: "Agent",
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
      },
    );

    expect(catalogDevice.fullScreen).toEqual({ width: 360, height: 780 });
  });
});
