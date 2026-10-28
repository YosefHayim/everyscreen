import { describe, expect, test } from "vitest";
import { sweepCommandSchema } from "@/commands/commands-schema";

const SWEEP_URL = "http://127.0.0.1:3000/";

describe("sweepCommandSchema", () => {
  test("fills every device and 50 routes by default", () => {
    const sweepCommand = sweepCommandSchema.parse({
      commandName: "sweep",
      url: SWEEP_URL,
    });

    expect(sweepCommand.deviceIds).toBeNull();
    expect(sweepCommand.maxRoutes).toBe(50);
    expect(sweepCommand.beforeSteps).toBeNull();
  });

  test("accepts all as the device ids", () => {
    const sweepCommand = sweepCommandSchema.parse({
      commandName: "sweep",
      url: SWEEP_URL,
      deviceIds: "all",
    });

    expect(sweepCommand.deviceIds).toBe("all");
  });

  test("accepts flow steps to run before the routes", () => {
    const sweepCommand = sweepCommandSchema.parse({
      commandName: "sweep",
      url: SWEEP_URL,
      beforeSteps: [
        { commandName: "open", url: `${SWEEP_URL}login`, deviceIds: null },
      ],
    });

    expect(sweepCommand.beforeSteps).toHaveLength(1);
  });

  test("rejects a sweep step inside the before steps", () => {
    const parsing = sweepCommandSchema.safeParse({
      commandName: "sweep",
      url: SWEEP_URL,
      beforeSteps: [{ commandName: "sweep", url: SWEEP_URL, deviceIds: null }],
    });

    expect(parsing.success).toBe(false);
  });

  test("rejects an empty device list", () => {
    const parsing = sweepCommandSchema.safeParse({
      commandName: "sweep",
      url: SWEEP_URL,
      deviceIds: [],
    });

    expect(parsing.success).toBe(false);
  });

  test("rejects more than 500 routes", () => {
    const parsing = sweepCommandSchema.safeParse({
      commandName: "sweep",
      url: SWEEP_URL,
      maxRoutes: 501,
    });

    expect(parsing.success).toBe(false);
  });
});
