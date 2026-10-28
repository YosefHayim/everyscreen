import type { RunTotals } from "@/live/live-test-schema";

export type LiveRunStatus = "running" | "ok" | "failed";

export interface ProgressShares {
  okPercent: number;
  failedPercent: number;
  runningPercent: number;
}

const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const SECOND_DIGITS = 2;
const FULL_PERCENT = 100;

export const pickLiveRunStatus = (runTotals: RunTotals): LiveRunStatus =>
  runTotals.outcome ?? "running";

export const pickElapsedMs = (runTotals: RunTotals, nowMs: number): number => {
  const endMs = runTotals.endedAt ?? nowMs;
  return Math.max(0, endMs - runTotals.startedAt);
};

export const createElapsedLabel = (elapsedMs: number): string => {
  const totalSeconds = Math.floor(elapsedMs / MS_PER_SECOND);
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;
  return `${minutes}:${String(seconds).padStart(SECOND_DIGITS, "0")}`;
};

const pickPercent = (testCount: number, totalTests: number): number =>
  (testCount / totalTests) * FULL_PERCENT;

export const pickProgressShares = (
  runTotals: RunTotals,
  runningCount: number,
): ProgressShares => {
  const { totalTests, okCount, failedCount } = runTotals;
  const hasNoTests = totalTests === 0;
  if (hasNoTests) return { okPercent: 0, failedPercent: 0, runningPercent: 0 };

  const okPercent = pickPercent(okCount, totalTests);
  const failedPercent = pickPercent(failedCount, totalTests);
  const wantedRunningPercent = pickPercent(runningCount, totalTests);
  const freePercent = FULL_PERCENT - okPercent - failedPercent;
  const runningPercent = Math.min(wantedRunningPercent, freePercent);
  return {
    okPercent,
    failedPercent,
    runningPercent: Math.max(0, runningPercent),
  };
};
