import { useHasScreenImage } from "@/dashboard/device-feed/use-has-screen-image";
import { useLiveStatus } from "@/dashboard/device-feed/use-live-status";
import type { DeviceView } from "@/dashboard/devices/device-view-logic";
import { useDeviceViews } from "@/dashboard/devices/use-device-views";
import { isOpenAppCardShown } from "@/dashboard/grid/setup-steps-logic";
import type { ScreenStatus } from "@/dashboard/ui/screen-boundary";
import { pickScreenStatus } from "@/dashboard/ui/screen-status-logic";

interface GridScreen {
  deviceViews: DeviceView[];
  devicesStatus: ScreenStatus;
  isOpenAppCardShown: boolean;
}

export const useGridScreen = (): GridScreen => {
  const devicesQuery = useDeviceViews();
  const deviceViews = devicesQuery.data ?? [];
  const liveStatus = useLiveStatus();
  const hasScreenImage = useHasScreenImage();
  const hasNoDevices = deviceViews.length === 0;

  return {
    deviceViews,
    devicesStatus: pickScreenStatus(devicesQuery.status, hasNoDevices),
    isOpenAppCardShown: isOpenAppCardShown(liveStatus, hasScreenImage),
  };
};
