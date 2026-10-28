import { describe, expect, test } from "vitest";
import type { RunTotals } from "@/live/live-test-schema";
import { isRunLive, pickSilentRunEnd } from "./run-silence-logic";

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

describe("pickSilentRunEnd", () => {
  test("gives nothing when no run is known", () => {
    expect(pickSilentRunEnd(null, 5000)).toBeNull();
  });

  test("gives nothing when the run already ended", () => {
    const endedTotals = createTotals({ outcome: "ok", endedAt: 3000 });

    expect(pickSilentRunEnd(endedTotals, 5000)).toBeNull();
  });

  test("ends a live run as failed and stopped, keeping its counts", () => {
    const silentEnd = pickSilentRunEnd(createTotals(), 5000);

    expect(silentEnd).toEqual(
      createTotals({
        endedAt: 5000,
        outcome: "failed",
        endReason: "stopped",
      }),
    );
  });
});
