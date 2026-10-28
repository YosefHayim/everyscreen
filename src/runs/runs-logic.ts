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
