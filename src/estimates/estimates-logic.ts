export interface Sample {
  takenAt: number;
  taskSeconds: number;
  layoutSeconds: number;
  heapBytes: number;
  frames: number;
  layoutShift: number;
}

export interface DeviceLoad {
  label: "est.";
  fps: number;
  cpuPercent: number;
  memoryMegabytes: number;
  layoutShift: number;
  status: "ok" | "warn";
}

const MIN_FPS = 30;
const MAX_CPU_PERCENT = 80;
const MAX_LAYOUT_SHIFT = 0.1;
const FULL_CPU_PERCENT = 100;
const PERCENT_SCALE = 100;
const BYTES_PER_MEGABYTE = 1_000_000;
const MILLISECONDS_PER_SECOND = 1000;

const createIdleDeviceLoad = (): DeviceLoad => ({
  label: "est.",
  fps: 0,
  cpuPercent: 0,
  memoryMegabytes: 0,
  layoutShift: 0,
  status: "ok",
});

export const estimateDeviceLoad = (samples: Sample[]): DeviceLoad => {
  const firstSample = samples.at(0);
  const lastSample = samples.at(-1);
  const hasNoWindow =
    firstSample === undefined ||
    lastSample === undefined ||
    firstSample === lastSample;
  if (hasNoWindow) return createIdleDeviceLoad();

  const wallSeconds =
    (lastSample.takenAt - firstSample.takenAt) / MILLISECONDS_PER_SECOND;
  const isWallTimeEmpty = wallSeconds <= 0;
  if (isWallTimeEmpty) return createIdleDeviceLoad();

  const fps = (lastSample.frames - firstSample.frames) / wallSeconds;
  const busyPercent =
    ((lastSample.taskSeconds - firstSample.taskSeconds) / wallSeconds) *
    PERCENT_SCALE;
  const cpuPercent = Math.min(FULL_CPU_PERCENT, busyPercent);
  const memoryMegabytes = lastSample.heapBytes / BYTES_PER_MEGABYTE;
  const isSmooth =
    fps >= MIN_FPS &&
    cpuPercent <= MAX_CPU_PERCENT &&
    lastSample.layoutShift <= MAX_LAYOUT_SHIFT;

  return {
    label: "est.",
    fps,
    cpuPercent,
    memoryMegabytes,
    layoutShift: lastSample.layoutShift,
    status: isSmooth ? "ok" : "warn",
  };
};

export const pickSampleWindow = (
  recentSamples: Sample[],
  newSample: Sample,
  windowSize: number,
): Sample[] => {
  const lastSample = recentSamples.at(-1);
  const hasFrameCounterReset =
    lastSample !== undefined && newSample.frames < lastSample.frames;
  if (hasFrameCounterReset) return [newSample];

  return [...recentSamples.slice(-(windowSize - 1)), newSample];
};
