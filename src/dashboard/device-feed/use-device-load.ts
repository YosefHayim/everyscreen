import { useSyncExternalStore } from "react";
import { getDeviceLoad, subscribe } from "@/dashboard/device-feed/live-store";
import type { DeviceLoad } from "@/estimates/estimates-logic";

export const useDeviceLoad = (deviceId: string): DeviceLoad | null =>
  useSyncExternalStore(subscribe, () => getDeviceLoad(deviceId));
