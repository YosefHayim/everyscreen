import { describe, expect, test } from "vitest";
import {
  createDeviceView,
  type DeviceView,
  type GridDeviceReply,
  listDeviceGroups,
  pickDeviceGroup,
  pickDeviceName,
  pickPreviewScreenWidth,
} from "@/dashboard/devices/device-view-logic";

const createGridDevice = (
  overrides: Partial<GridDeviceReply> = {},
): GridDeviceReply => ({
  id: "pixel-8",
  name: "Pixel 8",
  browserName: "chromium",
  frameShape: "punch-hole",
  origin: "catalog",
  use: {
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 2.6,
    hasTouch: true,
  },
  ...overrides,
});

const createView = (overrides: Partial<DeviceView> = {}): DeviceView => ({
  deviceId: "pixel-8",
  name: "Pixel 8",
  browserName: "chromium",
  frameShape: "punch-hole",
  viewportWidth: 412,
  viewportHeight: 915,
  pixelRatio: 2.6,
  hasTouch: true,
  isCustom: false,
  ...overrides,
});

describe("createDeviceView", () => {
  test("reads the viewport, pixel ratio and touch of a preset", () => {
    const deviceView = createDeviceView(createGridDevice());

    expect(deviceView).toEqual(createView());
  });

  test("marks a custom device as custom", () => {
    const customGridDevice = createGridDevice({
      id: "store-display",
      origin: "custom",
    });

    const deviceView = createDeviceView(customGridDevice);

    expect(deviceView.isCustom).toBe(true);
  });

  test("uses one pixel ratio and no touch when the device sets none", () => {
    const plainGridDevice = createGridDevice({
      use: { viewport: { width: 1440, height: 900 } },
    });

    const deviceView = createDeviceView(plainGridDevice);

    expect(deviceView.pixelRatio).toBe(1);
    expect(deviceView.hasTouch).toBe(false);
  });

  test("throws when the device has no viewport", () => {
    const noViewportDevice = createGridDevice({ use: { viewport: null } });

    expect(() => createDeviceView(noViewportDevice)).toThrow("no viewport");
  });

  test("throws when the viewport is missing", () => {
    const missingViewportDevice = createGridDevice({ use: {} });

    expect(() => createDeviceView(missingViewportDevice)).toThrow(
      "no viewport",
    );
  });
});

describe("pickDeviceGroup", () => {
  test("puts every phone frame in phones", () => {
    const phoneShapes = [
      "home-button",
      "dynamic-island",
      "punch-hole",
    ] as const;

    const groups = phoneShapes.map((frameShape) =>
      pickDeviceGroup(createView({ frameShape })),
    );

    expect(groups).toEqual(["phones", "phones", "phones"]);
  });

  test("puts a tablet frame in tablets", () => {
    const group = pickDeviceGroup(createView({ frameShape: "tablet" }));

    expect(group).toBe("tablets");
  });

  test("puts laptop and kiosk frames in desktop", () => {
    const groups = (["laptop", "kiosk"] as const).map((frameShape) =>
      pickDeviceGroup(createView({ frameShape })),
    );

    expect(groups).toEqual(["desktop", "desktop"]);
  });

  test("puts a custom device in custom whatever its frame", () => {
    const group = pickDeviceGroup(
      createView({ isCustom: true, frameShape: "tablet" }),
    );

    expect(group).toBe("custom");
  });
});

describe("listDeviceGroups", () => {
  test("returns no groups for no devices", () => {
    expect(listDeviceGroups([])).toEqual([]);
  });

  test("keeps the group order and skips empty groups", () => {
    const laptop = createView({
      deviceId: "laptop-1440",
      frameShape: "laptop",
    });
    const phone = createView();

    const groupViews = listDeviceGroups([laptop, phone]);

    expect(groupViews).toEqual([
      { group: "phones", devices: [phone] },
      { group: "desktop", devices: [laptop] },
    ]);
  });
});

describe("pickDeviceName", () => {
  test("returns the name of a device in the grid", () => {
    expect(pickDeviceName([createView()], "pixel-8")).toBe("Pixel 8");
  });

  test("returns the id of a device that left the grid", () => {
    expect(pickDeviceName([createView()], "iphone-se")).toBe("iphone-se");
  });
});

describe("pickPreviewScreenWidth", () => {
  test("fits a tall phone inside the preview height", () => {
    const previewWidth = pickPreviewScreenWidth(createView());

    expect(previewWidth).toBe(50);
  });

  test("fits a wide laptop inside the preview width", () => {
    const laptop = createView({ viewportWidth: 1440, viewportHeight: 900 });

    expect(pickPreviewScreenWidth(laptop)).toBe(150);
  });
});
