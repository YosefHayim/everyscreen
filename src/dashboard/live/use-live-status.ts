import { useSyncExternalStore } from "react";
import {
  type ConnectionStatus,
  getConnectionStatus,
  subscribe,
} from "@/dashboard/live/live-store";

export const useLiveStatus = (): ConnectionStatus =>
  useSyncExternalStore(subscribe, getConnectionStatus);
