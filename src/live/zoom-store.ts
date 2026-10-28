import { pickZoomChange } from "@/live/zoom-logic";

type SetZoomed = (isZoomed: boolean) => Promise<void>;

const zoomControls = new Map<string, SetZoomed>();
let zoomedDeviceId: string | null = null;

export const registerZoomControl = (
  deviceId: string,
  setZoomed: SetZoomed,
): (() => void) => {
  zoomControls.set(deviceId, setZoomed);
  return () => {
    zoomControls.delete(deviceId);
    const isGoneDeviceZoomed = zoomedDeviceId === deviceId;
    if (isGoneDeviceZoomed) zoomedDeviceId = null;
  };
};

export const changeZoomedDevice = async (
  nextDeviceId: string | null,
): Promise<void> => {
  const knownDeviceIds = [...zoomControls.keys()];
  const zoomChange = pickZoomChange(
    zoomedDeviceId,
    nextDeviceId,
    knownDeviceIds,
  );
  zoomedDeviceId = nextDeviceId;
  const { restoreDeviceId, zoomDeviceId } = zoomChange;
  const hasDeviceToRestore = restoreDeviceId !== null;
  const hasDeviceToZoom = zoomDeviceId !== null;
  if (hasDeviceToRestore) await zoomControls.get(restoreDeviceId)?.(false);
  if (hasDeviceToZoom) await zoomControls.get(zoomDeviceId)?.(true);
};
