import { useSyncExternalStore } from "react";
import {
  getCommandNotices,
  subscribe,
} from "@/dashboard/device-feed/live-store";
import type { CommandNotice } from "@/live/live-command-schema";

export const useCommandNotices = (): CommandNotice[] =>
  useSyncExternalStore(subscribe, getCommandNotices);
