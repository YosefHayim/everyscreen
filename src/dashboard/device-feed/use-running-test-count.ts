import { useSyncExternalStore } from "react";
import {
  getRunningTestCount,
  subscribe,
} from "@/dashboard/device-feed/live-store";

export const useRunningTestCount = (): number =>
  useSyncExternalStore(subscribe, getRunningTestCount);
