import type { Finding } from "@/checks/checks-logic";
import type { DeviceLoad } from "@/estimates/estimates-logic";
import type { LiveTestStatus } from "@/live/live-test-schema";

export type LiveMessage =
  | { kind: "screen"; deviceId: string; imageBase64: string }
  | { kind: "estimate"; deviceId: string; deviceLoad: DeviceLoad }
  | { kind: "test"; deviceId: string; title: string; status: LiveTestStatus }
  | { kind: "finding"; finding: Finding }
  | { kind: "run"; runId: string };

type LiveListener = (message: LiveMessage) => void;

const listeners = new Set<LiveListener>();
const lastScreens = new Map<string, LiveMessage>();
const lastTests = new Map<string, LiveMessage>();

export const subscribe = (listener: LiveListener): (() => void) => {
  listeners.add(listener);
  for (const lastScreen of lastScreens.values()) listener(lastScreen);
  for (const lastTest of lastTests.values()) listener(lastTest);
  return () => listeners.delete(listener);
};

export const broadcast = (message: LiveMessage): void => {
  const isScreen = message.kind === "screen";
  if (isScreen) lastScreens.set(message.deviceId, message);
  const isTest = message.kind === "test";
  if (isTest) lastTests.set(message.deviceId, message);
  for (const listener of listeners) listener(message);
};

// A killed run must not leave a running test to replay for every new dashboard.
export const forgetTests = (deviceIds: string[]): void => {
  for (const deviceId of deviceIds) lastTests.delete(deviceId);
};
