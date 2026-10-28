import { useSyncExternalStore } from "react";
import { hasAnyScreenImage, subscribe } from "@/dashboard/live/live-store";

export const useHasScreenImage = (): boolean =>
  useSyncExternalStore(subscribe, hasAnyScreenImage);
