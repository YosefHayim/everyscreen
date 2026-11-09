import { HTTPException } from "hono/http-exception";
import type { Finding } from "@/checks/checks-logic";
import type { DeviceAnswer } from "@/commands/commands-logic";
import { countDeviceStatuses } from "@/runs/device-status-logic";

export type RunStatus = "running" | "ok" | "failed";

export type RunOrigin = "cli" | "flow" | "playwright";

export type RunKind = "steps" | "sweep";

export interface StepProof {
  shotPath: string | null;
  errorMessage: string;
  codeSnippet: string | null;
  codeLocation: string | null;
}

export interface RunStep {
  stepId: string;
  title: string;
  startedAt: number;
  deviceAnswers: DeviceAnswer[];
  findings: Finding[];
  proof: StepProof | null;
}

export interface Run {
  runId: string;
  origin: RunOrigin;
  runKind: RunKind;
  status: RunStatus;
  startedAt: number;
  steps: RunStep[];
}

export type RunEvent =
  | { kind: "run-start"; origin: RunOrigin; runKind: RunKind }
  | { kind: "step-end"; step: RunStep }
  | { kind: "run-end"; status: "ok" | "failed" };

export const RUN_ID_PATTERN = /^run-(\d+)$/;
const RUN_ID_DIGITS = 4;
const NOT_FOUND_STATUS = 404;
const CONFLICT_STATUS = 409;

const readRunNumber = (runId: string): number | null => {
  const idParts = RUN_ID_PATTERN.exec(runId);
  const isIdMalformed = idParts === null;
  if (isIdMalformed) {
    return null;
  }
  return Number(idParts[1]);
};

export const pickNextRunId = (runIds: string[]): string => {
  const runNumbers = runIds
    .map(readRunNumber)
    .filter((runNumber) => runNumber !== null);
  const latestNumber = Math.max(0, ...runNumbers);
  const nextNumber = String(latestNumber + 1).padStart(RUN_ID_DIGITS, "0");
  return `run-${nextNumber}`;
};

export const pickRunStatus = (steps: RunStep[]): RunStatus => {
  const { failedCount } = countDeviceStatuses(steps);
  const hasFailedDevice = failedCount > 0;
  return hasFailedDevice ? "failed" : "ok";
};

export const checkRunEvent = (
  savedRun: Run | null,
  runEvent: RunEvent,
): Run => {
  const isRunMissing = savedRun === null;
  if (isRunMissing) {
    throw new HTTPException(NOT_FOUND_STATUS, {
      message: "No run with that id",
    });
  }
  const hasRunEnded = savedRun.status !== "running";
  const isStepAfterEnd = hasRunEnded && runEvent.kind === "step-end";
  if (isStepAfterEnd) {
    throw new HTTPException(CONFLICT_STATUS, {
      message: "The run has already ended",
    });
  }
  return savedRun;
};

export const mergeRunEvent = (run: Run, runEvent: RunEvent): Run => {
  switch (runEvent.kind) {
    case "run-start":
      return {
        ...run,
        origin: runEvent.origin,
        runKind: runEvent.runKind,
        status: "running",
      };
    case "step-end":
      return { ...run, steps: [...run.steps, runEvent.step] };
    case "run-end": {
      const isReportedFailed = runEvent.status === "failed";
      const stepsStatus = pickRunStatus(run.steps);
      const status = isReportedFailed ? "failed" : stepsStatus;
      return { ...run, status };
    }
  }
};

export const createStepId = (stepNumber: number): string =>
  `step-${stepNumber}`;

export const pickStepId = (steps: RunStep[]): string =>
  createStepId(steps.length + 1);

export const isRunOpen = (run: Run | null): run is Run => {
  const isRunSaved = run !== null;
  return isRunSaved && run.status === "running";
};

// A hub makes only cli runs, so a cli run still running when a new hub starts was left by an earlier hub.
export const pickLeftOpenRuns = (runs: Run[]): Run[] =>
  runs.filter(({ origin, status }) => origin === "cli" && status === "running");
