import { useState } from "react";
import { useZoomStream } from "@/dashboard/zoom/use-zoom-stream";

interface ZoomedDevice {
  zoomedDeviceId: string | null;
  changeZoomedDevice: (deviceId: string | null) => void;
}

export const useZoomedDevice = (): ZoomedDevice => {
  const [zoomedDeviceId, setZoomedDeviceId] = useState<string | null>(null);
  const zoomStream = useZoomStream();

  const changeZoomedDevice = (deviceId: string | null) => {
    setZoomedDeviceId(deviceId);
    zoomStream.mutate(deviceId);
  };

  return { zoomedDeviceId, changeZoomedDevice };
};
