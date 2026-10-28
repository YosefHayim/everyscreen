import { describe, expect, test } from "vitest";
import { DEVICE_CATALOG } from "@/devices/device-catalog";
import {
  createCatalogDeviceFromRegistry,
  pickRegistryScreen,
} from "@/devices/registry-logic";

describe("pickRegistryScreen", () => {
  test("returns the registry screen when there is one", () => {
    const screen = pickRegistryScreen({
      screen: { width: 393, height: 852 },
      viewport: { width: 393, height: 659 },
    });

    expect(screen).toEqual({ width: 393, height: 852 });
  });

  test("returns the viewport when the registry has no screen", () => {
    const screen = pickRegistryScreen({
      viewport: { width: 360, height: 780 },
    });

    expect(screen).toEqual({ width: 360, height: 780 });
  });
});

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
});
