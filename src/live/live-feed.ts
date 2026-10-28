import type { Finding } from "@/checks/checks-logic";
import type { DeviceLoad } from "@/estimates/estimates-logic";
import type { RunTotals, StepEvent, TestEvent } from "@/live/live-test-schema";

export type LiveMessage =
  | { kind: "screen"; deviceId: string; imageBase64: string }
  | { kind: "estimate"; deviceId: string; deviceLoad: DeviceLoad }
  | ({ kind: "test" } & TestEvent)
  | ({ kind: "step" } & StepEvent)
  | ({ kind: "run-totals" } & RunTotals)
  | { kind: "finding"; finding: Finding }
  | { kind: "run"; runId: string };

type LiveListener = (message: LiveMessage) => void;

const listeners = new Set<LiveListener>();
const lastScreens = new Map<string, LiveMessage>();
const lastTests = new Map<string, TestEvent>();
const lastSteps = new Map<string, StepEvent[]>();
const lastRunTotals: { runTotals: RunTotals | null } = { runTotals: null };

export const subscribe = (listener: LiveListener): (() => void) => {
  listeners.add(listener);
  for (const lastScreen of lastScreens.values()) listener(lastScreen);
  const { runTotals } = lastRunTotals;
  const hasRunTotals = runTotals !== null;
  if (hasRunTotals) listener({ kind: "run-totals", ...runTotals });
  for (const [testId, testEvent] of lastTests) {
    listener({ kind: "test", ...testEvent });
    const testSteps = lastSteps.get(testId) ?? [];
    for (const stepEvent of testSteps) listener({ kind: "step", ...stepEvent });
  }
  return () => listeners.delete(listener);
};

const rememberTest = (testEvent: TestEvent): void => {
  const isTestStarting = testEvent.status === "running";
  if (isTestStarting) lastSteps.delete(testEvent.testId);
  lastTests.delete(testEvent.testId);
  lastTests.set(testEvent.testId, testEvent);
};

const rememberStep = (stepEvent: StepEvent): void => {
  const testSteps = lastSteps.get(stepEvent.testId) ?? [];
  const otherSteps = testSteps.filter(
    ({ stepIndex }) => stepIndex !== stepEvent.stepIndex,
  );
  lastSteps.set(stepEvent.testId, [...otherSteps, stepEvent]);
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
    case "test":
      rememberTest(message);
      break;
    case "step":
      rememberStep(message);
      break;
    case "run-totals": {
      const isRunStarting = message.phase === "start";
      if (isRunStarting) forgetAllTests();
      lastRunTotals.runTotals = message;
      break;
    }
    case "estimate":
    case "finding":
    case "run":
      break;
  }
  for (const listener of listeners) listener(message);
};

export const readRunTotals = (): RunTotals | null => lastRunTotals.runTotals;

// A killed run must not leave a running test or run totals to replay for every new dashboard.
export const forgetTests = (deviceIds: string[]): void => {
  const forgottenTestIds = [...lastTests.values()]
    .filter(({ deviceId }) => deviceIds.includes(deviceId))
    .map(({ testId }) => testId);
  for (const testId of forgottenTestIds) {
    lastTests.delete(testId);
    lastSteps.delete(testId);
  }
  lastRunTotals.runTotals = null;
};
