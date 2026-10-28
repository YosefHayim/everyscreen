import { useSyncExternalStore } from "react";
import type { FrameSize } from "@/dashboard/frames/frame-layout-logic";
import {
  getWindowSize,
  subscribeToWindowSize,
} from "@/dashboard/zoom/window-size-store";

export const useWindowSize = (): FrameSize =>
  useSyncExternalStore(subscribeToWindowSize, getWindowSize);
