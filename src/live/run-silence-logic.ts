import type { RunTotals } from "@/live/live-test-schema";

export const RUN_SILENCE_LIMIT_MS = 15000;

export const isRunLive = (runTotals: RunTotals): boolean =>
  runTotals.outcome === null;

// A run killed with Ctrl-C never sends its end, so silence ends it as failed.
export const pickSilentRunEnd = (
  lastRunTotals: RunTotals | null,
  nowMs: number,
): RunTotals | null => {
  const isRunUnknown = lastRunTotals === null;
  if (isRunUnknown) return null;

  const isRunOver = !isRunLive(lastRunTotals);
  if (isRunOver) return null;

  return {
    ...lastRunTotals,
    phase: "update",
    endedAt: nowMs,
    outcome: "failed",
    endReason: "stopped",
  };
};
