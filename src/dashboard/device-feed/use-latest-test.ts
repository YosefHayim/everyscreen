import { useSyncExternalStore } from "react";
import {
  type DeviceTest,
  getLatestTest,
  subscribe,
} from "@/dashboard/device-feed/live-store";

export const useLatestTest = (): DeviceTest | null =>
  useSyncExternalStore(subscribe, getLatestTest);
