import { describe, expect, test } from "vitest";
import { customDeviceSchema, devicesFileSchema } from "@/devices/device-schema";

describe("customDeviceSchema", () => {
  test("fills pixel ratio, touch, frame shape and browser name when the file leaves them out", () => {
    const customDevice = { name: "Store kiosk", width: 1080, height: 1920 };

    const parsedDevice = customDeviceSchema.parse(customDevice);

    expect(parsedDevice).toEqual({
      name: "Store kiosk",
      width: 1080,
      height: 1920,
      pixelRatio: 1,
      hasTouch: false,
      frameShape: "kiosk",
      browserName: "chromium",
    });
  });

  test("rejects a name with no letter or digit", () => {
    const customDevice = { name: "--", width: 1080, height: 1920 };

    const parsing = customDeviceSchema.safeParse(customDevice);

    expect(parsing.success).toBe(false);
  });

  test("rejects a width below 240", () => {
    const customDevice = { name: "Watch", width: 200, height: 240 };

    const parsing = customDeviceSchema.safeParse(customDevice);

    expect(parsing.success).toBe(false);
  });
});

describe("devicesFileSchema", () => {
  test("fills devices and routes with empty lists", () => {
    expect(devicesFileSchema.parse({})).toEqual({ devices: [], routes: [] });
  });

  test("keeps routes that start with a slash", () => {
    const devicesFile = devicesFileSchema.parse({ routes: ["/orders/123"] });

    expect(devicesFile.routes).toEqual(["/orders/123"]);
  });

  test("rejects a route that starts with two slashes", () => {
    const parsing = devicesFileSchema.safeParse({ routes: ["//evil.com/x"] });

    expect(parsing.success).toBe(false);
  });

  test("rejects a route that does not start with a slash", () => {
    const parsing = devicesFileSchema.safeParse({ routes: ["orders/123"] });

    expect(parsing.success).toBe(false);
  });
});
