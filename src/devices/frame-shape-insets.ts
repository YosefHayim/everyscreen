import type { FrameShape, SafeAreaInsets } from "@/devices/devices-logic";

const NO_INSETS: SafeAreaInsets = {
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
};

// Used by custom devices and by catalog devices whose maker publishes no insets.
export const FRAME_SHAPE_INSETS = {
  "home-button": NO_INSETS,
  "dynamic-island": { top: 59, bottom: 34, left: 0, right: 0 },
  "punch-hole": { top: 24, bottom: 0, left: 0, right: 0 },
  tablet: NO_INSETS,
  laptop: NO_INSETS,
  kiosk: NO_INSETS,
} as const satisfies Record<FrameShape, SafeAreaInsets>;
