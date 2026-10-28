import { useEffect, useRef, useState } from "react";
import { useZoomStream } from "@/dashboard/zoom/use-zoom-stream";

interface ZoomedDevice {
  zoomedDeviceId: string | null;
  changeZoomedDevice: (deviceId: string | null) => void;
}

export const useZoomedDevice = (): ZoomedDevice => {
  const [zoomedDeviceId, setZoomedDeviceId] = useState<string | null>(null);
  const zoomedDeviceIdRef = useRef<string | null>(null);
  const { mutate: sendZoom } = useZoomStream();

  const changeZoomedDevice = (deviceId: string | null) => {
    zoomedDeviceIdRef.current = deviceId;
    setZoomedDeviceId(deviceId);
    sendZoom(deviceId);
  };

  // Leaving the grid while a device is zoomed must put the hub stream back.
  useEffect(
    () => () => {
      const isStillZoomed = zoomedDeviceIdRef.current !== null;
      if (isStillZoomed) sendZoom(null);
    },
    [sendZoom],
  );

  return { zoomedDeviceId, changeZoomedDevice };
};
