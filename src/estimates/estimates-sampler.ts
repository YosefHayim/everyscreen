import type { CDPSession, Page } from "playwright";
import { z } from "zod";
import { estimateDeviceLoad, type Sample } from "@/estimates/estimates-logic";
import { broadcast } from "@/live/live-feed";

const SAMPLE_INTERVAL_MS = 1000;
const SAMPLE_WINDOW = 5;
const COUNTERS_KEY = "everyscreenCounters";

const pageCountersSchema = z.object({
  frames: z.number(),
  layoutShift: z.number(),
});

const metricsSchema = z.array(
  z.object({ name: z.string(), value: z.number() }),
);

interface LayoutShiftEntry extends PerformanceEntry {
  hadRecentInput: boolean;
  value: number;
}

const isLayoutShift = (entry: PerformanceEntry): entry is LayoutShiftEntry =>
  entry.entryType === "layout-shift";

const watchFrames = (countersKey: string) => {
  const isAlreadyWatching = countersKey in window;
  if (isAlreadyWatching) return;

  const counters = { frames: 0, layoutShift: 0 };
  const countFrame = () => {
    counters.frames += 1;
    requestAnimationFrame(countFrame);
  };
  requestAnimationFrame(countFrame);
  new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries().filter(isLayoutShift)) {
      const isShiftWithoutInput = !entry.hadRecentInput;
      if (isShiftWithoutInput) counters.layoutShift += entry.value;
    }
  }).observe({ type: "layout-shift", buffered: true });
  Object.assign(window, { [countersKey]: counters });
};

const findMetric = (
  metrics: z.infer<typeof metricsSchema>,
  metricName: string,
): number => {
  const metric = metrics.find((candidate) => candidate.name === metricName);
  const isMetricMissing = metric === undefined;
  if (isMetricMissing)
    throw new Error(`Chromium did not report the ${metricName} metric`);
  return metric.value;
};

const readSample = async (session: CDPSession, page: Page): Promise<Sample> => {
  const metricsReply = await session.send("Performance.getMetrics");
  const metrics = metricsSchema.parse(metricsReply.metrics);
  const rawCounters = await page.evaluate(
    (countersKey) => Reflect.get(window, countersKey),
    COUNTERS_KEY,
  );
  const counters = pageCountersSchema.parse(rawCounters);
  return {
    takenAt: Date.now(),
    taskSeconds: findMetric(metrics, "TaskDuration"),
    layoutSeconds: findMetric(metrics, "LayoutDuration"),
    heapBytes: findMetric(metrics, "JSHeapUsedSize"),
    frames: counters.frames,
    layoutShift: counters.layoutShift,
  };
};

export const startSampling = async (
  page: Page,
  deviceId: string,
): Promise<() => void> => {
  const session = await page.context().newCDPSession(page);
  await session.send("Performance.enable");
  await page.addInitScript(watchFrames, COUNTERS_KEY);
  await page.evaluate(watchFrames, COUNTERS_KEY);

  const recentSamples: Sample[] = [];
  let isStopped = false;
  let timer: NodeJS.Timeout | null = null;

  const stop = () => {
    isStopped = true;
    if (timer !== null) clearInterval(timer);
  };

  const takeSample = async () => {
    try {
      const sample = await readSample(session, page);
      recentSamples.push(sample);
      const windowSamples = recentSamples.slice(-SAMPLE_WINDOW);
      const deviceLoad = estimateDeviceLoad(windowSamples);
      const isStillWatching = !isStopped;
      if (isStillWatching)
        broadcast({ kind: "estimate", deviceId, deviceLoad });
    } catch (error) {
      const isPageGone = page.isClosed() || isStopped;
      if (isPageGone) return stop();
      console.error({ deviceId, error });
      stop();
    }
  };

  timer = setInterval(takeSample, SAMPLE_INTERVAL_MS);
  page.on("close", stop);
  return stop;
};
