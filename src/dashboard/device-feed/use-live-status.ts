import { useSyncExternalStore } from "react";
import {
  type ConnectionStatus,
  getConnectionStatus,
  subscribe,
} from "@/dashboard/device-feed/live-store";

export const useLiveStatus = (): ConnectionStatus =>
  useSyncExternalStore(subscribe, getConnectionStatus);
