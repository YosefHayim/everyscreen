import { HTTPException } from "hono/http-exception";
import type { CheckDevice, Finding } from "@/checks/checks-logic";
import type { DeviceStep } from "@/commands/command-steps";
import type { HubCommand } from "@/commands/commands-schema";
import type { DevicePage } from "@/devices/device-browsers";
import type { DevicePreset } from "@/devices/devices-logic";
import { STORE_FOLDER } from "@/environment";
import type { RunStep, StepProof } from "@/runs/runs-logic";

const NO_DEVICE_STATUS = 404;
const SHOTS_SUBFOLDER = "shots";
const SHOT_FILE_EXTENSION = ".png";

interface DeviceOk {
  status: "ok";
  deviceId: string;
  durationMs: number;
  shotPath: string | null;
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

type CountedUnit = "device" | "flow" | "route" | "shot" | "finding";

export const countUnits = (count: number, unit: CountedUnit): string => {
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

export const pickCheckDevice = (devicePreset: DevicePreset): CheckDevice => ({
  id: devicePreset.id,
  hasTouch: devicePreset.use.hasTouch === true,
  safeAreaInsets: devicePreset.safeAreaInsets,
});

export const pickDeviceIds = (
  runningDeviceIds: string[],
  deviceIds: string[] | null,
): string[] => {
  const isEveryDeviceChosen = deviceIds === null;
  const chosenIds = deviceIds ?? runningDeviceIds;
  const unknownIds = chosenIds.filter(
    (deviceId) => !runningDeviceIds.includes(deviceId),
  );
  const hasUnknownId = unknownIds.length > 0;
  if (hasUnknownId) {
    throw new HTTPException(NO_DEVICE_STATUS, {
      message: `No device ${unknownIds.join(", ")}`,
    });
  }
  const isNoDeviceChosen = chosenIds.length === 0;
  if (isNoDeviceChosen) {
    throw new HTTPException(NO_DEVICE_STATUS, {
      message: isEveryDeviceChosen
        ? "No device is running"
        : "No device chosen",
    });
  }
  return chosenIds;
};

export const pickErrorMessage = (error: unknown): string => {
  const isRealError = error instanceof Error;
  const fullMessage = isRealError ? error.message : String(error);
  const [firstLine] = fullMessage.split("\n");
  return firstLine;
};

export const pickFailureMessage = (
  actionErrorMessage: string | null,
  findings: Finding[],
): string | null => {
  const hasActionFailed = actionErrorMessage !== null;
  if (hasActionFailed) return actionErrorMessage;
  const failedFinding = findings.find(({ severity }) => severity === "failed");
  const hasFailedFinding = failedFinding !== undefined;
  if (hasFailedFinding) return failedFinding.message;
  return null;
};

export const pickStepProof = (
  deviceAnswers: DeviceAnswer[],
): StepProof | null => {
  const firstFailure = deviceAnswers.find(isFailure);
  const isEveryDeviceOk = firstFailure === undefined;
  if (isEveryDeviceOk) return null;
  return {
    shotPath: firstFailure.shotPath,
    errorMessage: firstFailure.message,
    codeSnippet: null,
    codeLocation: null,
  };
};

export const createShotPath = (
  runId: string,
  stepId: string,
  deviceId: string,
): string =>
  `${STORE_FOLDER}/${SHOTS_SUBFOLDER}/${runId}-${stepId}-${deviceId}${SHOT_FILE_EXTENSION}`;

export const createStepTitle = (hubCommand: HubCommand): string => {
  switch (hubCommand.commandName) {
    case "open":
      return `open ${hubCommand.url}`;
    case "sweep":
      return `sweep ${hubCommand.url}`;
    case "tap":
      return `tap ${hubCommand.role} "${hubCommand.name}"`;
    case "fill":
      return `fill ${hubCommand.role} "${hubCommand.name}"`;
    case "scroll":
      return `scroll to ${hubCommand.to}`;
    case "check":
      return "check";
    case "shot":
      return "shot";
    case "expect":
      return `expect "${hubCommand.text}"`;
  }
};

export const pickChosenPages = (
  devicePages: DevicePage[],
  deviceIds: string[] | null,
): DevicePage[] => {
  const runningDeviceIds = devicePages.map(({ device }) => device.id);
  const chosenIds = pickDeviceIds(runningDeviceIds, deviceIds);
  return devicePages.filter(({ device }) => chosenIds.includes(device.id));
};

interface RunStepStart {
  stepId: string;
  title: string;
  startedAt: number;
  deviceSteps: DeviceStep[];
}

export const createCommandRunStep = (runStepStart: RunStepStart): RunStep => {
  const { stepId, title, startedAt, deviceSteps } = runStepStart;
  const deviceAnswers = deviceSteps.map(({ deviceAnswer }) => deviceAnswer);
  const findings = deviceSteps.flatMap((deviceStep) => deviceStep.findings);
  return {
    stepId,
    title,
    startedAt,
    deviceAnswers,
    findings,
    proof: pickStepProof(deviceAnswers),
  };
};
