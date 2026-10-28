import type { CommandName } from "@/commands/commands-schema";

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

const isFailure = (deviceAnswer: DeviceAnswer): deviceAnswer is DeviceFailure =>
  deviceAnswer.status === "failed";

const describeFailure = (failure: DeviceFailure): string =>
  `${failure.deviceId}: ${failure.message}`;

export const summarizeCommand = (
  commandName: CommandName,
  deviceAnswers: DeviceAnswer[],
  runId: string | null,
): CommandReply => {
  const failures = deviceAnswers.filter(isFailure);
  const okCount = deviceAnswers.length - failures.length;
  const isEveryDeviceOk = failures.length === 0;
  const status = isEveryDeviceOk ? "ok" : "failed";
  const failureList = failures.map(describeFailure).join(", ");
  const failureText = isEveryDeviceOk
    ? ""
    : `, ${failures.length} failed (${failureList})`;
  const isThereNoRun = runId === null;
  const reportText = isThereNoRun ? "" : ` · report ${runId}`;
  const line = `${commandName}: ${okCount} ok${failureText}${reportText}`;
  return { status, line, runId, failures };
};
