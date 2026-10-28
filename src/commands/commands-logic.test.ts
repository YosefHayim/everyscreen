import { describe, expect, test } from "vitest";
import { type DeviceAnswer, summarizeCommand } from "@/commands/commands-logic";

const createOkAnswer = (deviceId: string): DeviceAnswer => ({
  status: "ok",
  deviceId,
  durationMs: 180,
});

const createFailedAnswer = (deviceId: string): DeviceAnswer => ({
  status: "failed",
  deviceId,
  durationMs: 412,
  message: 'cookie bar covers "Checkout"',
  shotPath: null,
});

describe("summarizeCommand", () => {
  test("returns ok with no failures when every device passes", () => {
    const deviceAnswers = [
      createOkAnswer("iphone-se"),
      createOkAnswer("pixel-8"),
    ];

    const reply = summarizeCommand("tap", deviceAnswers, null);

    expect(reply.status).toBe("ok");
    expect(reply.failures).toEqual([]);
    expect(reply.line).toBe("tap: 2 ok");
    expect(reply.runId).toBeNull();
  });

  test("lists the failed device with its message", () => {
    const okAnswers = ["pixel-8", "ipad-mini"].map(createOkAnswer);
    const deviceAnswers = [...okAnswers, createFailedAnswer("iphone-se")];

    const reply = summarizeCommand("tap", deviceAnswers, null);

    expect(reply.status).toBe("failed");
    expect(reply.line).toBe(
      'tap: 2 ok, 1 failed (iphone-se: cookie bar covers "Checkout")',
    );
    expect(reply.failures.map((failure) => failure.deviceId)).toEqual([
      "iphone-se",
    ]);
  });

  test("lists every failed device and ends with the report id", () => {
    const deviceAnswers = [
      createFailedAnswer("iphone-se"),
      createFailedAnswer("galaxy-s24"),
    ];

    const reply = summarizeCommand("expect", deviceAnswers, "run-0412");

    expect(reply.line).toContain("0 ok, 2 failed (iphone-se: ");
    expect(reply.line).toContain(", galaxy-s24: ");
    expect(reply.line.endsWith(" · report run-0412")).toBe(true);
    expect(reply.runId).toBe("run-0412");
  });

  test("handles an empty device list", () => {
    const reply = summarizeCommand("check", [], null);

    expect(reply.status).toBe("ok");
    expect(reply.line).toBe("check: 0 ok");
  });
});
