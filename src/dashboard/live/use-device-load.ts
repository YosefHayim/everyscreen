import { useSyncExternalStore } from "react";
import { getDeviceLoad, subscribe } from "@/dashboard/live/live-store";
import type { DeviceLoad } from "@/estimates/estimates-logic";

export const useDeviceLoad = (deviceId: string): DeviceLoad | null =>
  useSyncExternalStore(subscribe, () => getDeviceLoad(deviceId));
