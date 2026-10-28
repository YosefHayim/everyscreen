import { describe, expect, test } from "vitest";
import type { RunTotals } from "@/live/live-test-schema";
import {
  createElapsedLabel,
  pickElapsedMs,
  pickProgressShares,
  pickRunStatus,
} from "./run-bar-logic";

const createTotals = (changes: Partial<RunTotals> = {}): RunTotals => ({
  phase: "update",
  totalTests: 12,
  startedAt: 1000,
  endedAt: null,
  okCount: 0,
  failedCount: 0,
  outcome: null,
  ...changes,
});

describe("pickRunStatus", () => {
  test("is running until the run has an outcome", () => {
    expect(pickRunStatus(createTotals())).toBe("running");
  });

  test("is the outcome once the run ended", () => {
    expect(pickRunStatus(createTotals({ outcome: "ok" }))).toBe("ok");
    expect(pickRunStatus(createTotals({ outcome: "failed" }))).toBe("failed");
  });
});

describe("pickElapsedMs", () => {
  test("counts up to now while the run is live", () => {
    expect(pickElapsedMs(createTotals(), 43_000)).toBe(42_000);
  });

  test("stops at the end time once the run ended", () => {
    const runTotals = createTotals({ endedAt: 11_000 });

    expect(pickElapsedMs(runTotals, 99_000)).toBe(10_000);
  });

  test("never goes below zero when the clocks differ", () => {
    expect(pickElapsedMs(createTotals(), 500)).toBe(0);
  });
});

describe("createElapsedLabel", () => {
  test("writes minutes and two-digit seconds", () => {
    expect(createElapsedLabel(0)).toBe("0:00");
    expect(createElapsedLabel(42_900)).toBe("0:42");
    expect(createElapsedLabel(605_000)).toBe("10:05");
  });
});

describe("pickProgressShares", () => {
  test("gives every share as a percent of all tests", () => {
    const runTotals = createTotals({ okCount: 3, failedCount: 3 });

    const progressShares = pickProgressShares(runTotals, 6);

    expect(progressShares).toEqual({
      okPercent: 25,
      failedPercent: 25,
      runningPercent: 50,
    });
  });

  test("shows an empty bar when the run has no tests", () => {
    const runTotals = createTotals({ totalTests: 0 });

    const progressShares = pickProgressShares(runTotals, 0);

    expect(progressShares).toEqual({
      okPercent: 0,
      failedPercent: 0,
      runningPercent: 0,
    });
  });

  test("keeps the running share inside what is left", () => {
    const runTotals = createTotals({ okCount: 10 });

    const progressShares = pickProgressShares(runTotals, 5);

    expect(progressShares.runningPercent).toBeCloseTo(16.67, 1);
  });

  test("never lets the running share go negative", () => {
    const runTotals = createTotals({ okCount: 13 });

    const progressShares = pickProgressShares(runTotals, 2);

    expect(progressShares.runningPercent).toBe(0);
  });
});
