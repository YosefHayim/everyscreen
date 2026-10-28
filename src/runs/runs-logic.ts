import type { Finding } from "@/checks/checks-logic";
import type { DeviceAnswer } from "@/commands/commands-logic";

export type RunStatus = "running" | "passed" | "failed";

export type RunOrigin = "cli" | "flow" | "playwright";

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
  status: RunStatus;
  startedAt: number;
  steps: RunStep[];
}

export type RunEvent =
  | { kind: "run-start"; origin: RunOrigin }
  | { kind: "step-end"; step: RunStep }
  | { kind: "run-end"; status: "passed" | "failed" };

const RUN_ID_PATTERN = /^run-(\d+)$/;
const RUN_ID_DIGITS = 4;

const readRunNumber = (runId: string): number | null => {
  const idParts = RUN_ID_PATTERN.exec(runId);
  const isIdMalformed = idParts === null;
  if (isIdMalformed) return null;
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
  const isThereNoStep = steps.length === 0;
  if (isThereNoStep) return "running";
  const hasFailedAnswer = steps.some((step) =>
    step.deviceAnswers.some((deviceAnswer) => deviceAnswer.status === "failed"),
  );
  return hasFailedAnswer ? "failed" : "passed";
};

export const mergeRunEvent = (run: Run, runEvent: RunEvent): Run => {
  if (runEvent.kind === "run-start") {
    return { ...run, origin: runEvent.origin, status: "running" };
  }
  if (runEvent.kind === "step-end") {
    return { ...run, steps: [...run.steps, runEvent.step] };
  }
  return { ...run, status: runEvent.status };
};
