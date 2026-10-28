import type { DeviceView } from "@/dashboard/devices/device-view-logic";
import { useDeviceViews } from "@/dashboard/devices/use-device-views";
import type { ScreenStatus } from "@/dashboard/ui/screen-boundary";
import { pickScreenStatus } from "@/dashboard/ui/screen-status-logic";

interface GridScreen {
  deviceViews: DeviceView[];
  devicesStatus: ScreenStatus;
}

export const useGridScreen = (): GridScreen => {
  const devicesQuery = useDeviceViews();
  const deviceViews = devicesQuery.data ?? [];
  const hasNoDevices = deviceViews.length === 0;

  return {
    deviceViews,
    devicesStatus: pickScreenStatus(devicesQuery.status, hasNoDevices),
  };
};
