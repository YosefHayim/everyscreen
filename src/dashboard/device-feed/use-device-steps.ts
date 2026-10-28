import { useSyncExternalStore } from "react";
import { getDeviceSteps, subscribe } from "@/dashboard/device-feed/live-store";
import type { DeviceStep } from "@/dashboard/device-feed/step-progress-logic";

export const useDeviceSteps = (deviceId: string): DeviceStep[] =>
  useSyncExternalStore(subscribe, () => getDeviceSteps(deviceId));
