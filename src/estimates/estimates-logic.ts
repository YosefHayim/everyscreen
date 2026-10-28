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
