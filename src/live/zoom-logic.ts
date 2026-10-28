import { HTTPException } from "hono/http-exception";

const UNKNOWN_ZOOM_DEVICE_STATUS = 422;

export interface ZoomChange {
  restoreDeviceId: string | null;
  zoomDeviceId: string | null;
}

export const pickZoomChange = (
  previousDeviceId: string | null,
  nextDeviceId: string | null,
  knownDeviceIds: string[],
): ZoomChange => {
  const isNextDeviceChosen = nextDeviceId !== null;
  const isNextDeviceUnknown =
    isNextDeviceChosen && !knownDeviceIds.includes(nextDeviceId);
  if (isNextDeviceUnknown) {
    throw new HTTPException(UNKNOWN_ZOOM_DEVICE_STATUS, {
      message: `zoom: no live device with id ${nextDeviceId}`,
    });
  }

  const isNothingChanging = previousDeviceId === nextDeviceId;
  if (isNothingChanging) return { restoreDeviceId: null, zoomDeviceId: null };
  return { restoreDeviceId: previousDeviceId, zoomDeviceId: nextDeviceId };
};

export const pickZoomOwnerId = (
  nextDeviceId: string | null,
  clientId: string,
): string | null => {
  const isZoomEnding = nextDeviceId === null;
  if (isZoomEnding) return null;
  return clientId;
};
