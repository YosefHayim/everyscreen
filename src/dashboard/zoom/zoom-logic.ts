import type { DeviceView } from "@/dashboard/devices/device-view-logic";
import {
  type FrameLayout,
  type FrameSize,
  pickFitScale,
  pickFrameLayout,
} from "@/dashboard/frames/frame-layout-logic";

export type ZoomMode = "fit" | "true-size";
export type ArrowStep = 1 | -1;
export type ReadingDirection = "ltr" | "rtl";

export interface ArrowPress {
  key: string;
  direction: ReadingDirection;
  isModified: boolean;
}

export interface ZoomView {
  device: DeviceView;
  frameLayout: FrameLayout;
  frameScale: number;
}

// Space the dialog keeps for its padding, header and test footer.
const DIALOG_SPACE = { width: 64, height: 230 };
const MIN_ZOOM_BOX = 200;
const NEXT_STEP = 1;
const PREVIOUS_STEP = -1;

export const pickZoomBox = (windowSize: FrameSize): FrameSize => ({
  width: Math.max(MIN_ZOOM_BOX, windowSize.width - DIALOG_SPACE.width),
  height: Math.max(MIN_ZOOM_BOX, windowSize.height - DIALOG_SPACE.height),
});

export const pickZoomScale = (
  frameSize: FrameSize,
  windowSize: FrameSize,
  zoomMode: ZoomMode,
): number => {
  const isTrueSize = zoomMode === "true-size";
  if (isTrueSize) return 1;
  const zoomBox = pickZoomBox(windowSize);
  return pickFitScale(frameSize, zoomBox);
};

export const pickNeighborDeviceId = (
  deviceIds: string[],
  currentDeviceId: string,
  step: ArrowStep,
): string | null => {
  const currentIndex = deviceIds.indexOf(currentDeviceId);
  const isCurrentMissing = currentIndex === -1;
  if (isCurrentMissing) return null;
  const neighborIndex =
    (currentIndex + step + deviceIds.length) % deviceIds.length;
  // The index is always inside the list; the null only satisfies noUncheckedIndexedAccess.
  /* v8 ignore next */
  return deviceIds[neighborIndex] ?? null;
};

// The right arrow always points to the right on screen, which is the previous device in right-to-left.
export const pickArrowStep = (arrowPress: ArrowPress): ArrowStep | null => {
  const { key, direction, isModified } = arrowPress;
  const isRightArrow = key === "ArrowRight";
  const isLeftArrow = key === "ArrowLeft";
  const isArrowKey = isRightArrow || isLeftArrow;
  const isPlainArrowKey = isArrowKey && !isModified;
  if (!isPlainArrowKey) return null;
  const isLeftToRight = direction === "ltr";
  const isNextForRightArrow = isLeftToRight === isRightArrow;
  if (isNextForRightArrow) return NEXT_STEP;
  return PREVIOUS_STEP;
};

export const createZoomView = (
  deviceViews: DeviceView[],
  zoomedDeviceId: string | null,
  windowSize: FrameSize,
  zoomMode: ZoomMode,
): ZoomView | null => {
  const zoomedDevice = deviceViews.find(
    (deviceView) => deviceView.deviceId === zoomedDeviceId,
  );
  const isNothingZoomed = zoomedDevice === undefined;
  if (isNothingZoomed) return null;
  const frameLayout = pickFrameLayout(zoomedDevice);
  const frameScale = pickZoomScale(frameLayout, windowSize, zoomMode);
  return { device: zoomedDevice, frameLayout, frameScale };
};
