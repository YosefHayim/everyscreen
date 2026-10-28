import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  type DeviceGroupView,
  listDeviceGroups,
} from "@/dashboard/devices/device-view-logic";
import { useDeviceViews } from "@/dashboard/devices/use-device-views";
import type { ScreenStatus } from "@/dashboard/ui/screen-boundary";
import { pickScreenStatus } from "@/dashboard/ui/screen-status-logic";

interface DevicesScreen {
  deviceCount: number;
  deviceGroups: DeviceGroupView[];
  devicesStatus: ScreenStatus;
  isFormOpen: boolean;
  toggleLabel: string;
  toggleForm: () => void;
}

export const useDevicesScreen = (): DevicesScreen => {
  const { t } = useTranslation();
  const devicesQuery = useDeviceViews();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const deviceViews = devicesQuery.data ?? [];
  const hasNoDevices = deviceViews.length === 0;
  const toggleLabel = isFormOpen
    ? t("devices.closeForm")
    : t("devices.openForm");

  return {
    deviceCount: deviceViews.length,
    deviceGroups: listDeviceGroups(deviceViews),
    devicesStatus: pickScreenStatus(devicesQuery.status, hasNoDevices),
    isFormOpen,
    toggleLabel,
    toggleForm: () => setIsFormOpen(!isFormOpen),
  };
};
