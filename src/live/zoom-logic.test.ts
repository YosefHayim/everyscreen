import { describe, expect, test } from "vitest";
import { pickZoomChange, pickZoomOwnerId } from "@/live/zoom-logic";

const KNOWN_DEVICE_IDS = ["iphone-17", "pixel-9"];

describe("pickZoomChange", () => {
  test("zooms the first device and restores nothing", () => {
    const zoomChange = pickZoomChange(null, "pixel-9", KNOWN_DEVICE_IDS);

    expect(zoomChange).toEqual({
      restoreDeviceId: null,
      zoomDeviceId: "pixel-9",
    });
  });

  test("restores the old device when another one is zoomed", () => {
    const zoomChange = pickZoomChange("pixel-9", "iphone-17", KNOWN_DEVICE_IDS);

    expect(zoomChange).toEqual({
      restoreDeviceId: "pixel-9",
      zoomDeviceId: "iphone-17",
    });
  });

  test("restores the zoomed device when zoom ends", () => {
    const zoomChange = pickZoomChange("pixel-9", null, KNOWN_DEVICE_IDS);

    expect(zoomChange).toEqual({
      restoreDeviceId: "pixel-9",
      zoomDeviceId: null,
    });
  });

  test("changes nothing when the same device stays zoomed", () => {
    const zoomChange = pickZoomChange("pixel-9", "pixel-9", KNOWN_DEVICE_IDS);

    expect(zoomChange).toEqual({ restoreDeviceId: null, zoomDeviceId: null });
  });

  test("changes nothing when no device is zoomed and none is asked", () => {
    const zoomChange = pickZoomChange(null, null, KNOWN_DEVICE_IDS);

    expect(zoomChange).toEqual({ restoreDeviceId: null, zoomDeviceId: null });
  });

  test("rejects an unknown device with 422", () => {
    const zoomUnknown = () => pickZoomChange(null, "nokia", KNOWN_DEVICE_IDS);

    expect(zoomUnknown).toThrow("no live device with id nokia");
  });
});

describe("pickZoomOwnerId", () => {
  test("names the client as owner when a device is zoomed", () => {
    const zoomOwnerId = pickZoomOwnerId("pixel-9", "tab-1");

    expect(zoomOwnerId).toBe("tab-1");
  });

  test("names no owner when zoom ends", () => {
    const zoomOwnerId = pickZoomOwnerId(null, "tab-1");

    expect(zoomOwnerId).toBeNull();
  });
});
