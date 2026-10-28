import { describe, expect, test } from "vitest";
import type { DeviceView } from "@/dashboard/devices/device-view-logic";
import { pickMatchingDevices } from "@/dashboard/grid/device-search-logic";

const createView = (name: string): DeviceView => ({
  deviceId: name.toLowerCase().replaceAll(" ", "-"),
  name,
  browserName: "chromium",
  frameShape: "punch-hole",
  platform: "android",
  cutout: null,
  cornerRadius: null,
  safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 },
  viewportMode: "full-screen",
  viewportWidth: 412,
  viewportHeight: 915,
  screenWidth: 412,
  screenHeight: 915,
  pixelRatio: 2,
  hasTouch: true,
  isCustom: false,
});

const DEVICE_VIEWS = [
  createView("iPhone 17"),
  createView("Pixel 9"),
  createView("Galaxy S25"),
];

describe("pickMatchingDevices", () => {
  test("keeps every device for an empty search", () => {
    expect(pickMatchingDevices(DEVICE_VIEWS, "  ")).toEqual(DEVICE_VIEWS);
  });

  test("matches a part of the name in any letter case", () => {
    const matchingViews = pickMatchingDevices(DEVICE_VIEWS, " PIX");

    expect(matchingViews).toEqual([DEVICE_VIEWS[1]]);
  });

  test("returns no device when nothing matches", () => {
    expect(pickMatchingDevices(DEVICE_VIEWS, "nokia")).toEqual([]);
  });
});
