import { describe, expect, test } from "vitest";
import {
  createReplyLine,
  type DeviceAnswer,
  summarizeCommand,
} from "@/commands/commands-logic";

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

describe("createReplyLine", () => {
  test("counts devices and ok answers with the report", () => {
    const replyTally = {
      unit: "device",
      okCount: 5,
      failedCount: 0,
      runId: "run-0412",
    } as const;

    expect(createReplyLine(replyTally)).toBe(
      "5 devices · 5 ok · report run-0412",
    );
  });

  test("adds the failed count when a device failed", () => {
    const replyTally = {
      unit: "device",
      okCount: 4,
      failedCount: 1,
      runId: "run-0412",
    } as const;

    expect(createReplyLine(replyTally)).toBe(
      "5 devices · 4 ok · 1 failed · report run-0412",
    );
  });

  test("uses the singular for one device and drops the report without a run", () => {
    const replyTally = {
      unit: "device",
      okCount: 1,
      failedCount: 0,
      runId: null,
    } as const;

    expect(createReplyLine(replyTally)).toBe("1 device · 1 ok");
  });

  test("counts flows for the flow runner", () => {
    const replyTally = {
      unit: "flow",
      okCount: 2,
      failedCount: 1,
      runId: null,
    } as const;

    expect(createReplyLine(replyTally)).toBe("3 flows · 2 ok · 1 failed");
  });

  test("says no device answered when nothing was counted", () => {
    const replyTally = {
      unit: "device",
      okCount: 0,
      failedCount: 0,
      runId: "run-0412",
    } as const;

    expect(createReplyLine(replyTally)).toBe("0 devices · no device answered");
  });
});

describe("summarizeCommand", () => {
  test("returns ok with no failures when every device passes", () => {
    const deviceAnswers = [
      createOkAnswer("iphone-se"),
      createOkAnswer("pixel-8"),
    ];

    const reply = summarizeCommand(deviceAnswers, "run-0412");

    expect(reply.status).toBe("ok");
    expect(reply.failures).toEqual([]);
    expect(reply.line).toBe("2 devices · 2 ok · report run-0412");
    expect(reply.runId).toBe("run-0412");
  });

  test("returns failed and lists the failed device", () => {
    const okAnswers = ["pixel-8", "ipad-mini"].map(createOkAnswer);
    const deviceAnswers = [...okAnswers, createFailedAnswer("iphone-se")];

    const reply = summarizeCommand(deviceAnswers, null);

    expect(reply.status).toBe("failed");
    expect(reply.line).toBe("3 devices · 2 ok · 1 failed");
    expect(reply.failures.map((failure) => failure.deviceId)).toEqual([
      "iphone-se",
    ]);
  });

  test("returns failed when no device answered", () => {
    const reply = summarizeCommand([], null);

    expect(reply.status).toBe("failed");
    expect(reply.line).toBe("0 devices · no device answered");
  });
});
