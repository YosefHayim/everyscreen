import { useSyncExternalStore } from "react";
import { getScreenImage, subscribe } from "@/dashboard/live/live-socket";

export const useScreenImage = (deviceId: string) =>
  useSyncExternalStore(subscribe, () => getScreenImage(deviceId));
