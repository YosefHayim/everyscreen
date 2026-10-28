import type { DeviceTest } from "@/dashboard/device-feed/live-store";
import { useLatestTest } from "@/dashboard/device-feed/use-latest-test";
import { useRunTotals } from "@/dashboard/device-feed/use-run-totals";
import { useRunningTestCount } from "@/dashboard/device-feed/use-running-test-count";
import {
  createElapsedLabel,
  type ProgressShares,
  pickElapsedMs,
  pickProgressShares,
  pickRunStatus,
  type RunStatus,
} from "@/dashboard/run-bar/run-bar-logic";
import { useNowMs } from "@/dashboard/run-bar/use-now-ms";

export type CounterTone = "ink" | "ok" | "failed" | "running";

export interface RunCounter {
  counterKey: "done" | "ok" | "failed" | "running" | "elapsed";
  valueText: string;
  tone: CounterTone;
}

export interface RunBar {
  status: RunStatus;
  latestTest: DeviceTest | null;
  counters: RunCounter[];
  progressShares: ProgressShares;
}

export const useRunBar = (): RunBar | null => {
  const runTotals = useRunTotals();
  const latestTest = useLatestTest();
  const runningCount = useRunningTestCount();
  const isRunTotalsMissing = runTotals === null;
  const isRunLive = !isRunTotalsMissing && runTotals.outcome === null;
  const nowMs = useNowMs(isRunLive);
  if (isRunTotalsMissing) return null;

  const { totalTests, okCount, failedCount } = runTotals;
  const elapsedMs = pickElapsedMs(runTotals, nowMs);
  const elapsedLabel = createElapsedLabel(elapsedMs);
  const doneCount = okCount + failedCount;
  const counters: RunCounter[] = [
    {
      counterKey: "done",
      valueText: `${doneCount} / ${totalTests}`,
      tone: "ink",
    },
    { counterKey: "ok", valueText: String(okCount), tone: "ok" },
    { counterKey: "failed", valueText: String(failedCount), tone: "failed" },
    { counterKey: "running", valueText: String(runningCount), tone: "running" },
    { counterKey: "elapsed", valueText: elapsedLabel, tone: "ink" },
  ];

  return {
    status: pickRunStatus(runTotals),
    latestTest,
    counters,
    progressShares: pickProgressShares(runTotals, runningCount),
  };
};
