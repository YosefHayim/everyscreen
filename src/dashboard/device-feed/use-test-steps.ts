import { useSyncExternalStore } from "react";
import { getTestSteps, subscribe } from "@/dashboard/device-feed/live-store";
import type { DeviceStep } from "@/dashboard/device-feed/step-progress-logic";

export const useTestSteps = (testId: string): DeviceStep[] =>
  useSyncExternalStore(subscribe, () => getTestSteps(testId));
