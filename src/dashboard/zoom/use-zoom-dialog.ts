import { type KeyboardEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import type { DeviceView } from "@/dashboard/devices/device-view-logic";
import { useWindowSize } from "@/dashboard/zoom/use-window-size";
import {
  createZoomView,
  pickArrowStep,
  pickNeighborDeviceId,
  type ReadingDirection,
  type ZoomMode,
  type ZoomView,
} from "@/dashboard/zoom/zoom-logic";

export interface ZoomRequest {
  deviceViews: DeviceView[];
  zoomedDeviceId: string | null;
  onZoomChange: (deviceId: string | null) => void;
}

interface ZoomDialogControls {
  zoomView: ZoomView | null;
  zoomMode: ZoomMode;
  changeZoomMode: (zoomMode: ZoomMode) => void;
  closeZoom: () => void;
  moveWithArrowKey: (keyboardEvent: KeyboardEvent<HTMLDialogElement>) => void;
}

export const useZoomDialog = (zoomRequest: ZoomRequest): ZoomDialogControls => {
  const { deviceViews, zoomedDeviceId, onZoomChange } = zoomRequest;
  const { i18n } = useTranslation();
  const windowSize = useWindowSize();
  const [zoomMode, changeZoomMode] = useState<ZoomMode>("fit");
  const zoomView = createZoomView(
    deviceViews,
    zoomedDeviceId,
    windowSize,
    zoomMode,
  );

  const closeZoom = () => onZoomChange(null);

  const moveWithArrowKey = (
    keyboardEvent: KeyboardEvent<HTMLDialogElement>,
  ) => {
    const readingDirection: ReadingDirection = i18n.dir();
    const { key, altKey, metaKey, ctrlKey, shiftKey } = keyboardEvent;
    const isModified = altKey || metaKey || ctrlKey || shiftKey;
    const arrowStep = pickArrowStep({
      key,
      direction: readingDirection,
      isModified,
    });
    const isNotArrow = arrowStep === null;
    if (isNotArrow || zoomedDeviceId === null) return;
    const deviceIds = deviceViews.map((deviceView) => deviceView.deviceId);
    const neighborDeviceId = pickNeighborDeviceId(
      deviceIds,
      zoomedDeviceId,
      arrowStep,
    );
    const isNeighborMissing = neighborDeviceId === null;
    if (isNeighborMissing) return;
    keyboardEvent.preventDefault();
    onZoomChange(neighborDeviceId);
  };

  return { zoomView, zoomMode, changeZoomMode, closeZoom, moveWithArrowKey };
};
