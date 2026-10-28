import { setTimeout as waitFor } from "node:timers/promises";
import type { CDPSession, Page } from "playwright";
import { z } from "zod";
import type { PageWatcher } from "@/devices/device-browsers";
import {
  estimateDeviceLoad,
  pickSampleWindow,
  type Sample,
} from "@/estimates/estimates-logic";
import { broadcast } from "@/live/live-feed";

const SAMPLE_INTERVAL_MS = 1000;
const SAMPLE_WINDOW = 5;
const COUNTERS_KEY = "everyscreenCounters";

const pageCountersSchema = z.object({
  frames: z.number(),
  layoutShift: z.number(),
});

const counterReadingSchema = z.array(
  z.object({ name: z.string(), value: z.number() }),
);

interface LayoutShiftEntry extends PerformanceEntry {
  hadRecentInput: boolean;
  value: number;
}

// Runs inside the page (addInitScript, evaluate): it can use nothing outside itself.
const watchFrames = (countersKey: string) => {
  const isLayoutShift = (
    performanceEntry: PerformanceEntry,
  ): performanceEntry is LayoutShiftEntry =>
    performanceEntry.entryType === "layout-shift";
  const isAlreadyWatching = countersKey in window;
  if (isAlreadyWatching) return;

  const counters = { frames: 0, layoutShift: 0 };
  const countFrame = () => {
    counters.frames += 1;
    requestAnimationFrame(countFrame);
  };
  requestAnimationFrame(countFrame);
  new PerformanceObserver((entryList) => {
    for (const layoutShiftEntry of entryList
      .getEntries()
      .filter(isLayoutShift)) {
      const isShiftWithoutInput = !layoutShiftEntry.hadRecentInput;
      if (isShiftWithoutInput) counters.layoutShift += layoutShiftEntry.value;
    }
  }).observe({ type: "layout-shift", buffered: true });
  Object.assign(window, { [countersKey]: counters });
};

const findCounterReading = (
  counterReadings: z.infer<typeof counterReadingSchema>,
  counterName: string,
): number => {
  const counterReading = counterReadings.find(
    (candidate) => candidate.name === counterName,
  );
  const isCounterReadingMissing = counterReading === undefined;
  if (isCounterReadingMissing) {
    throw new Error(`Chromium did not report the ${counterName} counter`);
  }
  return counterReading.value;
};

const readSample = async (
  cdpSession: CDPSession,
  page: Page,
): Promise<Sample> => {
  const performanceReply = await cdpSession.send("Performance.getMetrics");
  const counterReadings = counterReadingSchema.parse(performanceReply.metrics);
  const pageCountersReply = await page.evaluate(
    (countersKey) => Reflect.get(window, countersKey),
    COUNTERS_KEY,
  );
  const pageCounters = pageCountersSchema.parse(pageCountersReply);
  return {
    takenAt: Date.now(),
    taskSeconds: findCounterReading(counterReadings, "TaskDuration"),
    layoutSeconds: findCounterReading(counterReadings, "LayoutDuration"),
    heapBytes: findCounterReading(counterReadings, "JSHeapUsedSize"),
    frames: pageCounters.frames,
    layoutShift: pageCounters.layoutShift,
  };
};

const waitForNextSample = async (signal: AbortSignal): Promise<void> => {
  try {
    await waitFor(SAMPLE_INTERVAL_MS, null, { signal });
  } catch (error) {
    const isStopRequested = signal.aborted;
    if (isStopRequested) return;
    throw error;
  }
};

const sampleUntilStopped = async (
  cdpSession: CDPSession,
  page: Page,
  deviceId: string,
  signal: AbortSignal,
): Promise<void> => {
  const sampleWindow: { samples: Sample[] } = { samples: [] };
  while (!signal.aborted) {
    await waitForNextSample(signal);
    const isStopRequested = signal.aborted;
    if (isStopRequested) break;

    try {
      const sample = await readSample(cdpSession, page);
      sampleWindow.samples = pickSampleWindow(
        sampleWindow.samples,
        sample,
        SAMPLE_WINDOW,
      );
      const deviceLoad = estimateDeviceLoad(sampleWindow.samples);
      broadcast({ kind: "estimate", deviceId, deviceLoad });
    } catch (error) {
      const isPageGone = page.isClosed() || signal.aborted;
      if (!isPageGone) console.error({ deviceId, error });
    }
  }
};

export const startSampling: PageWatcher = async (page, deviceId) => {
  const cdpSession = await page.context().newCDPSession(page);
  await cdpSession.send("Performance.enable");
  await page.addInitScript(watchFrames, COUNTERS_KEY);
  await page.evaluate(watchFrames, COUNTERS_KEY);

  const abortController = new AbortController();
  const samplingLoop = sampleUntilStopped(
    cdpSession,
    page,
    deviceId,
    abortController.signal,
  );
  const stopOnPageClose = () => abortController.abort();
  page.on("close", stopOnPageClose);

  return async () => {
    abortController.abort();
    page.off("close", stopOnPageClose);
    await samplingLoop;
    const isPageOpen = !page.isClosed();
    if (isPageOpen) {
      await cdpSession.send("Performance.disable");
      await cdpSession.detach();
    }
  };
};
