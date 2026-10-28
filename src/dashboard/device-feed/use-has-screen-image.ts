import { useSyncExternalStore } from "react";
import {
  hasAnyScreenImage,
  subscribe,
} from "@/dashboard/device-feed/live-store";

export const useHasScreenImage = (): boolean =>
  useSyncExternalStore(subscribe, hasAnyScreenImage);
