export interface DeviceOk {
  status: "ok";
  deviceId: string;
  durationMs: number;
}

export interface DeviceFailure {
  status: "failed";
  deviceId: string;
  durationMs: number;
  message: string;
  shotPath: string | null;
}

export type DeviceAnswer = DeviceOk | DeviceFailure;

export interface CommandReply {
  status: "ok" | "failed";
  line: string;
  runId: string | null;
  failures: DeviceFailure[];
}
