import type { DeviceTest } from "@/dashboard/device-feed/tile-test-logic";
import { useLatestTest } from "@/dashboard/device-feed/use-latest-test";
import { useRunTotals } from "@/dashboard/device-feed/use-run-totals";
import { useRunningTestCount } from "@/dashboard/device-feed/use-running-test-count";
import {
  createElapsedLabel,
  type LiveRunStatus,
  type ProgressShares,
  pickElapsedMs,
  pickLiveRunStatus,
  pickProgressShares,
} from "@/dashboard/run-bar/run-bar-logic";
import { useNowMs } from "@/dashboard/run-bar/use-now-ms";

export type CounterTone = "ink" | "ok" | "failed" | "running";

export interface RunCounter {
  counterKey: "done" | "ok" | "failed" | "running" | "elapsed";
  counterLabel: string;
  tone: CounterTone;
}

interface RunBar {
  status: LiveRunStatus;
  isRunStopped: boolean;
  latestTest: DeviceTest | null;
  counters: RunCounter[];
  progressShares: ProgressShares;
}

export const useRunBar = (): RunBar | null => {
  const runTotals = useRunTotals();
  const latestTest = useLatestTest();
  const liveRunningCount = useRunningTestCount();
  const isRunTotalsMissing = runTotals === null;
  const isRunLive = !isRunTotalsMissing && runTotals.outcome === null;
  const nowMs = useNowMs(isRunLive);
  if (isRunTotalsMissing) return null;

  const { totalTests, okCount, failedCount } = runTotals;
  const runningCount = isRunLive ? liveRunningCount : 0;
  const elapsedMs = pickElapsedMs(runTotals, nowMs);
  const elapsedLabel = createElapsedLabel(elapsedMs);
  const doneCount = okCount + failedCount;
  const counters: RunCounter[] = [
    {
      counterKey: "done",
      counterLabel: `${doneCount} / ${totalTests}`,
      tone: "ink",
    },
    { counterKey: "ok", counterLabel: String(okCount), tone: "ok" },
    { counterKey: "failed", counterLabel: String(failedCount), tone: "failed" },
    {
      counterKey: "running",
      counterLabel: String(runningCount),
      tone: "running",
    },
    { counterKey: "elapsed", counterLabel: elapsedLabel, tone: "ink" },
  ];

  return {
    status: pickLiveRunStatus(runTotals),
    isRunStopped: runTotals.endReason === "stopped",
    latestTest,
    counters,
    progressShares: pickProgressShares(runTotals, runningCount),
  };
};
