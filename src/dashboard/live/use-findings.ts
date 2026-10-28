import { useSyncExternalStore } from "react";
import type { Finding } from "@/checks/checks-logic";
import { getFindings, subscribe } from "@/dashboard/live/live-store";

export const useFindings = (): Finding[] =>
  useSyncExternalStore(subscribe, getFindings);
