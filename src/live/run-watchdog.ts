import { broadcast, readRunTotals } from "@/live/live-feed";
import type { RunTotals } from "@/live/live-test-schema";
import {
  isRunLive,
  pickSilentRunEnd,
  RUN_SILENCE_LIMIT_MS,
} from "@/live/run-silence-logic";

const watchdog: { silenceTimer: ReturnType<typeof setTimeout> | null } = {
  silenceTimer: null,
};

const endSilentRun = (): void => {
  watchdog.silenceTimer = null;
  const silentRunEnd = pickSilentRunEnd(readRunTotals(), Date.now());
  const isRunStillLive = silentRunEnd !== null;
  if (isRunStillLive) broadcast({ kind: "run-totals", ...silentRunEnd });
};

export const watchRun = (runTotals: RunTotals): void => {
  const { silenceTimer } = watchdog;
  const isTimerWaiting = silenceTimer !== null;
  if (isTimerWaiting) clearTimeout(silenceTimer);
  watchdog.silenceTimer = null;

  const isRunOver = !isRunLive(runTotals);
  if (isRunOver) return;

  const nextTimer = setTimeout(endSilentRun, RUN_SILENCE_LIMIT_MS);
  nextTimer.unref();
  watchdog.silenceTimer = nextTimer;
};
