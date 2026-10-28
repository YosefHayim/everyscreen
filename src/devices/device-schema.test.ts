import { describe, expect, test } from "vitest";
import { customDeviceSchema } from "@/devices/device-schema";

describe("customDeviceSchema", () => {
  test("fills pixel ratio, touch and frame shape when the file leaves them out", () => {
    const customDevice = { name: "Store kiosk", width: 1080, height: 1920 };

    const parsedDevice = customDeviceSchema.parse(customDevice);

    expect(parsedDevice).toEqual({
      name: "Store kiosk",
      width: 1080,
      height: 1920,
      pixelRatio: 1,
      hasTouch: false,
      frameShape: "kiosk",
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
