import { describe, expect, test } from "vitest";
import { flowSchema } from "@/flows/flow-schema";

describe("flowSchema", () => {
  test("accepts every step kind and keeps the device list", () => {
    const flow = {
      name: "All steps",
      devices: ["iphone-se"],
      steps: [
        { open: "http://localhost:5173" },
        { tap: { role: "button", name: "Apply" } },
        { fill: { role: "textbox", name: "Coupon", with: "SPRING" } },
        { scroll: { to: "bottom" } },
        { expect: { text: "Total $66" } },
        { check: null },
        { shot: null },
      ],
    };

    const parsedFlow = flowSchema.parse(flow);

    expect(parsedFlow).toEqual(flow);
  });

  test("sets the device list to null when the flow names none", () => {
    const flow = { name: "No devices", steps: [] };

    const parsedFlow = flowSchema.parse(flow);

    expect(parsedFlow.devices).toBeNull();
  });

  test("rejects a role the commands do not know", () => {
    const flow = {
      name: "Bad role",
      steps: [{ tap: { role: "banner", name: "Hi" } }],
    };

    const parsing = flowSchema.safeParse(flow);

    expect(parsing.success).toBe(false);
  });

  test("rejects a step with an unknown field", () => {
    const flow = {
      name: "Bad field",
      steps: [{ open: "http://localhost:5173", wait: 5 }],
    };

    const parsing = flowSchema.safeParse(flow);

    expect(parsing.success).toBe(false);
  });

  test("rejects a tap step that carries a device list", () => {
    const flow = {
      name: "Device ids in a step",
      steps: [
        { tap: { role: "button", name: "Apply", deviceIds: ["pixel-8"] } },
      ],
    };

    const parsing = flowSchema.safeParse(flow);

    expect(parsing.success).toBe(false);
  });
});
