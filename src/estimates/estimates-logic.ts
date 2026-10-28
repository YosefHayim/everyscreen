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
const MAX_CPU_PERCENT_CAP = 100;
const BYTES_PER_MEGABYTE = 1_000_000;
const MILLISECONDS_PER_SECOND = 1000;

const IDLE_DEVICE_LOAD: DeviceLoad = {
  label: "est.",
  fps: 0,
  cpuPercent: 0,
  memoryMegabytes: 0,
  layoutShift: 0,
  status: "ok",
};

export const estimateDeviceLoad = (samples: Sample[]): DeviceLoad => {
  const firstSample = samples.at(0);
  const lastSample = samples.at(-1);
  const hasNoWindow =
    firstSample === undefined ||
    lastSample === undefined ||
    firstSample === lastSample;
  if (hasNoWindow) return IDLE_DEVICE_LOAD;

  const wallSeconds =
    (lastSample.takenAt - firstSample.takenAt) / MILLISECONDS_PER_SECOND;
  const isWallTimeEmpty = wallSeconds <= 0;
  if (isWallTimeEmpty) return IDLE_DEVICE_LOAD;

  const fps = (lastSample.frames - firstSample.frames) / wallSeconds;
  const busyPercent =
    ((lastSample.taskSeconds - firstSample.taskSeconds) / wallSeconds) * 100;
  const cpuPercent = Math.min(MAX_CPU_PERCENT_CAP, busyPercent);
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
