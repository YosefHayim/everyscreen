import { describe, expect, test } from "vitest";
import type { DeviceView } from "@/dashboard/devices/device-view-logic";
import {
  createZoomView,
  pickArrowStep,
  pickNeighborDeviceId,
  pickZoomBox,
  pickZoomScale,
} from "@/dashboard/zoom/zoom-logic";

describe("pickZoomBox", () => {
  test("leaves room for the dialog padding, header and footer", () => {
    const zoomBox = pickZoomBox({ width: 1440, height: 900 });

    expect(zoomBox).toEqual({ width: 1376, height: 670 });
  });

  test("never shrinks below the minimum box", () => {
    const zoomBox = pickZoomBox({ width: 100, height: 100 });

    expect(zoomBox).toEqual({ width: 200, height: 200 });
  });
});

describe("pickZoomScale", () => {
  test("fits a tall phone frame into the window height", () => {
    const zoomScale = pickZoomScale(
      { width: 421, height: 878 },
      { width: 1440, height: 900 },
      "fit",
    );

    expect(zoomScale).toBeCloseTo(670 / 878, 5);
  });

  test("never grows a small frame past true size", () => {
    const zoomScale = pickZoomScale(
      { width: 300, height: 300 },
      { width: 1440, height: 900 },
      "fit",
    );

    expect(zoomScale).toBe(1);
  });

  test("draws true size at one to one whatever the window", () => {
    const zoomScale = pickZoomScale(
      { width: 1440, height: 952 },
      { width: 800, height: 600 },
      "true-size",
    );

    expect(zoomScale).toBe(1);
  });
});

describe("pickNeighborDeviceId", () => {
  const deviceIds = ["iphone-17", "pixel-9", "ipad-mini"];

  test("moves to the next and previous device", () => {
    expect(pickNeighborDeviceId(deviceIds, "pixel-9", 1)).toBe("ipad-mini");
    expect(pickNeighborDeviceId(deviceIds, "pixel-9", -1)).toBe("iphone-17");
  });

  test("wraps around at both ends", () => {
    expect(pickNeighborDeviceId(deviceIds, "ipad-mini", 1)).toBe("iphone-17");
    expect(pickNeighborDeviceId(deviceIds, "iphone-17", -1)).toBe("ipad-mini");
  });

  test("returns null when the device left the grid", () => {
    expect(pickNeighborDeviceId(deviceIds, "nokia", 1)).toBeNull();
  });
});

const PLAIN_RIGHT = {
  key: "ArrowRight",
  direction: "ltr",
  isModified: false,
} as const;

describe("pickArrowStep", () => {
  test("follows the screen side in left-to-right pages", () => {
    expect(pickArrowStep(PLAIN_RIGHT)).toBe(1);
    expect(pickArrowStep({ ...PLAIN_RIGHT, key: "ArrowLeft" })).toBe(-1);
  });

  test("follows the reading direction in right-to-left pages", () => {
    expect(pickArrowStep({ ...PLAIN_RIGHT, direction: "rtl" })).toBe(-1);
    expect(
      pickArrowStep({ key: "ArrowLeft", direction: "rtl", isModified: false }),
    ).toBe(1);
  });

  test("ignores other keys", () => {
    expect(pickArrowStep({ ...PLAIN_RIGHT, key: "Enter" })).toBeNull();
  });

  test("ignores an arrow pressed with alt, cmd, ctrl or shift", () => {
    expect(pickArrowStep({ ...PLAIN_RIGHT, isModified: true })).toBeNull();
  });
});

describe("createZoomView", () => {
  const phone: DeviceView = {
    deviceId: "iphone-17",
    name: "iPhone 17",
    browserName: "webkit",
    frameShape: "dynamic-island",
    platform: "ios",
    cutout: null,
    cornerRadius: 55,
    safeAreaInsets: { top: 59, bottom: 34, left: 0, right: 0 },
    viewportMode: "full-screen",
    viewportWidth: 393,
    viewportHeight: 852,
    screenWidth: 393,
    screenHeight: 852,
    pixelRatio: 3,
    hasTouch: true,
    isCustom: false,
  };

  test("returns null when nothing is zoomed", () => {
    const zoomView = createZoomView(
      [phone],
      null,
      { width: 1440, height: 900 },
      "fit",
    );

    expect(zoomView).toBeNull();
  });

  test("returns the zoomed device with its frame and fit scale", () => {
    const zoomView = createZoomView(
      [phone],
      "iphone-17",
      { width: 1440, height: 900 },
      "fit",
    );

    expect(zoomView?.device.deviceId).toBe("iphone-17");
    expect(zoomView?.frameLayout.family).toBe("phone-island");
    expect(zoomView?.frameScale).toBeCloseTo(670 / 878, 5);
  });
});
