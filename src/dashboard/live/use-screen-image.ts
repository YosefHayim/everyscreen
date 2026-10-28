import { useSyncExternalStore } from "react";
import { getScreenImageUrl, subscribe } from "@/dashboard/live/live-store";

export const useScreenImage = (deviceId: string): string | null =>
  useSyncExternalStore(subscribe, () => getScreenImageUrl(deviceId));
