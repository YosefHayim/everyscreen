import { describe, expect, test } from "vitest";
import type { RunTotals } from "@/live/live-test-schema";
import {
  isRunLive,
  listStoppedTests,
  pickSilentRunEnd,
} from "./run-silence-logic";

const createTotals = (changes: Partial<RunTotals> = {}): RunTotals => ({
  phase: "update",
  totalTests: 4,
  startedAt: 1000,
  endedAt: null,
  okCount: 1,
  failedCount: 0,
  outcome: null,
  endReason: null,
  ...changes,
});

describe("isRunLive", () => {
  test("is true while the run has no outcome", () => {
    expect(isRunLive(createTotals())).toBe(true);
  });

  test("is false once the run has an outcome", () => {
    expect(isRunLive(createTotals({ outcome: "ok" }))).toBe(false);
  });
});

describe("listStoppedTests", () => {
  test("marks each running test failed with the stopped line", () => {
    const runningTest = {
      deviceId: "pixel-10",
      testId: "a1",
      title: "pays",
      specFile: "shop.spec.ts",
      status: "running" as const,
      errorLine: null,
    };

    const stoppedTests = listStoppedTests([runningTest]);

    expect(stoppedTests).toEqual([
      {
        ...runningTest,
        status: "failed",
        errorLine: "Run stopped without a report",
      },
    ]);
  });

  test("gives nothing when no test was running", () => {
    expect(listStoppedTests([])).toEqual([]);
  });
});

describe("pickSilentRunEnd", () => {
  test("gives nothing when no run is known", () => {
    expect(pickSilentRunEnd(null, 0, 5000)).toBeNull();
  });

  test("gives nothing when the run already ended", () => {
    const endedTotals = createTotals({ outcome: "ok", endedAt: 3000 });

    expect(pickSilentRunEnd(endedTotals, 2, 5000)).toBeNull();
  });

  test("ends a live run as failed and stopped, keeping its counts when no test was running", () => {
    const silentEnd = pickSilentRunEnd(createTotals(), 0, 5000);

    expect(silentEnd).toEqual(
      createTotals({
        endedAt: 5000,
        outcome: "failed",
        endReason: "stopped",
      }),
    );
  });

  test("counts the one running test as failed", () => {
    const liveTotals = createTotals({ failedCount: 1 });

    const silentEnd = pickSilentRunEnd(liveTotals, 1, 5000);

    expect(silentEnd?.failedCount).toBe(2);
  });

  test("counts every running test as failed on top of the earlier failures", () => {
    const liveTotals = createTotals({ okCount: 1, failedCount: 1 });

    const silentEnd = pickSilentRunEnd(liveTotals, 3, 5000);

    expect(silentEnd?.failedCount).toBe(4);
    expect(silentEnd?.okCount).toBe(1);
  });
});
