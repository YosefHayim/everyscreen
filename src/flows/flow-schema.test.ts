import { describe, expect, test } from "vitest";
import { flowSchema, flowsPerBatchSchema } from "@/flows/flow-schema";

describe("flowSchema", () => {
  test("turns every step kind into its command and keeps the device list", () => {
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

    expect(parsedFlow).toEqual({
      name: "All steps",
      devices: ["iphone-se"],
      steps: [
        { commandName: "open", url: "http://localhost:5173" },
        { commandName: "tap", role: "button", name: "Apply" },
        {
          commandName: "fill",
          role: "textbox",
          name: "Coupon",
          with: "SPRING",
        },
        { commandName: "scroll", to: "bottom" },
        { commandName: "expect", text: "Total $66" },
        { commandName: "check" },
        { commandName: "shot" },
      ],
    });
  });

  test("sets the device list to null when the flow names none", () => {
    const flow = { name: "No devices", steps: [] };

    const parsedFlow = flowSchema.parse(flow);

    expect(parsedFlow.devices).toBeNull();
  });

  test("rejects an empty device list", () => {
    const flow = { name: "No devices named", devices: [], steps: [] };

    const parsing = flowSchema.safeParse(flow);

    expect(parsing.success).toBe(false);
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

describe("flowsPerBatchSchema", () => {
  test("rejects 0", () => {
    const parsing = flowsPerBatchSchema.safeParse(0);

    expect(parsing.success).toBe(false);
  });

  test("accepts 1", () => {
    const parsing = flowsPerBatchSchema.safeParse(1);

    expect(parsing.success).toBe(true);
  });

  test("accepts many and rejects a fraction", () => {
    const manyParsing = flowsPerBatchSchema.safeParse(8);
    const fractionParsing = flowsPerBatchSchema.safeParse(1.5);

    expect(manyParsing.success).toBe(true);
    expect(fractionParsing.success).toBe(false);
  });
});
