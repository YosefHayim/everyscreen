import { useSyncExternalStore } from "react";
import { getLatestTest, subscribe } from "@/dashboard/device-feed/live-store";
import type { DeviceTest } from "@/dashboard/device-feed/tile-test-logic";

export const useLatestTest = (): DeviceTest | null =>
  useSyncExternalStore(subscribe, getLatestTest);
