import { runOneAtATime } from "@/hub/run-one-at-a-time";
import { pickZoomChange, pickZoomOwnerId } from "@/live/zoom-logic";

type SetZoomed = (isZoomed: boolean) => Promise<void>;

const ZOOM_QUEUE_KEY = "zoom";

const zoomControls = new Map<string, SetZoomed>();
let zoomedDeviceId: string | null = null;
let zoomOwnerId: string | null = null;

export const registerZoomControl = (
  deviceId: string,
  setZoomed: SetZoomed,
): (() => void) => {
  zoomControls.set(deviceId, setZoomed);
  return () => {
    zoomControls.delete(deviceId);
    const isGoneDeviceZoomed = zoomedDeviceId === deviceId;
    if (isGoneDeviceZoomed) {
      zoomedDeviceId = null;
      zoomOwnerId = null;
    }
  };
};

const applyZoomedDevice = async (
  nextDeviceId: string | null,
  clientId: string,
): Promise<void> => {
  const knownDeviceIds = [...zoomControls.keys()];
  const zoomChange = pickZoomChange(
    zoomedDeviceId,
    nextDeviceId,
    knownDeviceIds,
  );
  const { restoreDeviceId, zoomDeviceId } = zoomChange;
  const hasDeviceToRestore = restoreDeviceId !== null;
  const hasDeviceToZoom = zoomDeviceId !== null;
  if (hasDeviceToRestore) await zoomControls.get(restoreDeviceId)?.(false);
  if (hasDeviceToZoom) await zoomControls.get(zoomDeviceId)?.(true);
  zoomedDeviceId = nextDeviceId;
  zoomOwnerId = pickZoomOwnerId(nextDeviceId, clientId);
};

export const changeZoomedDevice = (
  nextDeviceId: string | null,
  clientId: string,
): Promise<void> =>
  runOneAtATime(ZOOM_QUEUE_KEY, () =>
    applyZoomedDevice(nextDeviceId, clientId),
  );

export const releaseClientZoom = (clientId: string): Promise<void> =>
  runOneAtATime(ZOOM_QUEUE_KEY, async () => {
    const isClientZooming = zoomOwnerId === clientId;
    if (!isClientZooming) return;
    await applyZoomedDevice(null, clientId);
  });
