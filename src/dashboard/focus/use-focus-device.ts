import { useParams } from "@tanstack/react-router";
import type { DeviceView } from "@/dashboard/devices/device-view-logic";
import { useDeviceViews } from "@/dashboard/devices/use-device-views";
import type { ScreenStatus } from "@/dashboard/ui/screen-boundary";
import { pickScreenStatus } from "@/dashboard/ui/screen-status-logic";

interface FocusDeviceView {
  focusDevice: DeviceView | null;
  otherDevices: DeviceView[];
  screenStatus: ScreenStatus;
}

export const useFocusDevice = (): FocusDeviceView => {
  const { deviceId } = useParams({ from: "/focus/$deviceId" });
  const devicesQuery = useDeviceViews();
  const deviceViews = devicesQuery.data ?? [];
  const focusDevice =
    deviceViews.find((deviceView) => deviceView.deviceId === deviceId) ?? null;
  const otherDevices = deviceViews.filter(
    (deviceView) => deviceView.deviceId !== deviceId,
  );
  const isFocusDeviceMissing = focusDevice === null;
  const screenStatus = pickScreenStatus(
    devicesQuery.status,
    isFocusDeviceMissing,
  );

  return { focusDevice, otherDevices, screenStatus };
};
