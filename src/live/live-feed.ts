import type { Finding } from "@/checks/checks-logic";
import type { DeviceLoad } from "@/estimates/estimates-logic";

export type LiveMessage =
  | { kind: "screen"; deviceId: string; imageBase64: string }
  | { kind: "estimate"; deviceId: string; deviceLoad: DeviceLoad }
  | { kind: "finding"; finding: Finding }
  | { kind: "run"; runId: string };

type LiveListener = (message: LiveMessage) => void;

const listeners = new Set<LiveListener>();
const lastScreens = new Map<string, LiveMessage>();

export const subscribe = (listener: LiveListener): (() => void) => {
  listeners.add(listener);
  for (const lastScreen of lastScreens.values()) listener(lastScreen);
  return () => listeners.delete(listener);
};

export const broadcast = (message: LiveMessage): void => {
  const isScreen = message.kind === "screen";
  if (isScreen) lastScreens.set(message.deviceId, message);
  for (const listener of listeners) listener(message);
};
