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

export interface ReplyTally {
  unit: "device" | "flow";
  okCount: number;
  failedCount: number;
  runId: string | null;
}

const isFailure = (deviceAnswer: DeviceAnswer): deviceAnswer is DeviceFailure =>
  deviceAnswer.status === "failed";

const countUnits = (count: number, unit: ReplyTally["unit"]): string => {
  const isSingular = count === 1;
  const plural = isSingular ? unit : `${unit}s`;
  return `${count} ${plural}`;
};

export const createReplyLine = (replyTally: ReplyTally): string => {
  const { unit, okCount, failedCount, runId } = replyTally;
  const totalCount = okCount + failedCount;
  const isNothingCounted = totalCount === 0;
  if (isNothingCounted) {
    return `${countUnits(0, unit)} · no ${unit} answered`;
  }
  const hasFailure = failedCount > 0;
  const hasRun = runId !== null;
  const lineParts = [countUnits(totalCount, unit), `${okCount} ok`];
  if (hasFailure) {
    lineParts.push(`${failedCount} failed`);
  }
  if (hasRun) {
    lineParts.push(`report ${runId}`);
  }
  return lineParts.join(" · ");
};

export const summarizeCommand = (
  deviceAnswers: DeviceAnswer[],
  runId: string | null,
): CommandReply => {
  const failures = deviceAnswers.filter(isFailure);
  const failedCount = failures.length;
  const okCount = deviceAnswers.length - failedCount;
  const isEveryDeviceOk = failedCount === 0 && okCount > 0;
  const status = isEveryDeviceOk ? "ok" : "failed";
  const line = createReplyLine({ unit: "device", okCount, failedCount, runId });
  return { status, line, runId, failures };
};
