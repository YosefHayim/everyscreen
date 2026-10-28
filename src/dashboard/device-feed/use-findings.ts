import { useSyncExternalStore } from "react";
import type { Finding } from "@/checks/checks-logic";
import { getFindings, subscribe } from "@/dashboard/device-feed/live-store";

export const useFindings = (): Finding[] =>
  useSyncExternalStore(subscribe, getFindings);
