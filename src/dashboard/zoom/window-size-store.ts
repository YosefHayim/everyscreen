import type { FrameSize } from "@/dashboard/frames/frame-layout-logic";

const readWindowSize = (): FrameSize => ({
  width: window.innerWidth,
  height: window.innerHeight,
});

let currentWindowSize = readWindowSize();

export const getWindowSize = (): FrameSize => currentWindowSize;

export const subscribeToWindowSize = (listener: () => void): (() => void) => {
  const changeWindowSize = () => {
    currentWindowSize = readWindowSize();
    listener();
  };
  window.addEventListener("resize", changeWindowSize);
  return () => window.removeEventListener("resize", changeWindowSize);
};
