import { useSyncExternalStore } from "react";
import {
  type DeviceTest,
  getDeviceTest,
  subscribe,
} from "@/dashboard/device-feed/live-store";

export const useDeviceTest = (deviceId: string): DeviceTest | null =>
  useSyncExternalStore(subscribe, () => getDeviceTest(deviceId));
