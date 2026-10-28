import { useSyncExternalStore } from "react";
import { getDeviceTest, subscribe } from "@/dashboard/device-feed/live-store";
import type { DeviceTest } from "@/dashboard/device-feed/tile-test-logic";

export const useDeviceTest = (deviceId: string): DeviceTest | null =>
  useSyncExternalStore(subscribe, () => getDeviceTest(deviceId));
