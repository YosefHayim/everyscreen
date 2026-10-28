import { useSyncExternalStore } from "react";
import { getRunTotals, subscribe } from "@/dashboard/device-feed/live-store";
import type { RunTotals } from "@/live/live-test-schema";

export const useRunTotals = (): RunTotals | null =>
  useSyncExternalStore(subscribe, getRunTotals);
