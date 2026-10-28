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
