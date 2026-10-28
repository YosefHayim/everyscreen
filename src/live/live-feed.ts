import type { Finding } from "@/checks/checks-logic";
import type { DeviceLoad } from "@/estimates/estimates-logic";
import type {
  LiveTestStatus,
  RunTotals,
  StepEvent,
} from "@/live/live-test-schema";

export type LiveMessage =
  | { kind: "screen"; deviceId: string; imageBase64: string }
  | { kind: "estimate"; deviceId: string; deviceLoad: DeviceLoad }
  | {
      kind: "test";
      deviceId: string;
      title: string;
      specFile: string;
      status: LiveTestStatus;
      errorLine: string | null;
    }
  | ({ kind: "step" } & StepEvent)
  | ({ kind: "run-totals" } & RunTotals)
  | { kind: "finding"; finding: Finding }
  | { kind: "run"; runId: string };

type LiveListener = (message: LiveMessage) => void;

const listeners = new Set<LiveListener>();
const lastScreens = new Map<string, LiveMessage>();
const lastTests = new Map<string, LiveMessage>();
const lastSteps = new Map<string, LiveMessage[]>();
const lastRunTotals: { message: LiveMessage | null } = { message: null };

export const subscribe = (listener: LiveListener): (() => void) => {
  listeners.add(listener);
  for (const lastScreen of lastScreens.values()) listener(lastScreen);
  const { message: runTotalsMessage } = lastRunTotals;
  const hasRunTotals = runTotalsMessage !== null;
  if (hasRunTotals) listener(runTotalsMessage);
  for (const lastTest of lastTests.values()) listener(lastTest);
  for (const deviceSteps of lastSteps.values()) {
    for (const stepMessage of deviceSteps) listener(stepMessage);
  }
  return () => listeners.delete(listener);
};

const rememberStep = (deviceId: string, stepMessage: LiveMessage): void => {
  const deviceSteps = lastSteps.get(deviceId) ?? [];
  lastSteps.set(deviceId, [...deviceSteps, stepMessage]);
};

const forgetAllTests = (): void => {
  lastTests.clear();
  lastSteps.clear();
};

export const broadcast = (message: LiveMessage): void => {
  switch (message.kind) {
    case "screen":
      lastScreens.set(message.deviceId, message);
      break;
    case "test": {
      const isTestStarting = message.status === "running";
      if (isTestStarting) lastSteps.delete(message.deviceId);
      lastTests.delete(message.deviceId);
      lastTests.set(message.deviceId, message);
      break;
    }
    case "step":
      rememberStep(message.deviceId, message);
      break;
    case "run-totals": {
      const isRunStarting = message.phase === "start";
      if (isRunStarting) forgetAllTests();
      lastRunTotals.message = message;
      break;
    }
    case "estimate":
    case "finding":
    case "run":
      break;
  }
  for (const listener of listeners) listener(message);
};

// A killed run must not leave a running test to replay for every new dashboard.
export const forgetTests = (deviceIds: string[]): void => {
  for (const deviceId of deviceIds) {
    lastTests.delete(deviceId);
    lastSteps.delete(deviceId);
  }
};
