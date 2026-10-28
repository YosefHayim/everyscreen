import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { deviceQueries } from "@/dashboard/devices/devices-queries";
import { useDeviceViews } from "@/dashboard/devices/use-device-views";
import {
  listMakerGroups,
  type MakerGroup,
  toggleGridDeviceId,
} from "@/dashboard/picker/picker-logic";
import { useUpdateGrid } from "@/dashboard/picker/use-update-grid";

export interface DevicePicker {
  isOpen: boolean;
  openPicker: () => void;
  closePicker: () => void;
  makerGroups: MakerGroup[];
  gridDeviceIds: string[];
  toggleDevice: (deviceId: string) => void;
  isSaving: boolean;
  hasFailed: boolean;
}

export const useDevicePicker = (): DevicePicker => {
  const [isOpen, setIsOpen] = useState(false);
  const catalogQuery = useQuery({
    ...deviceQueries.catalog(),
    enabled: isOpen,
  });
  const deviceViewsQuery = useDeviceViews();
  const updateGrid = useUpdateGrid();
  const catalog = catalogQuery.data ?? [];
  const deviceViews = deviceViewsQuery.data ?? [];
  const catalogViews = deviceViews.filter((deviceView) => !deviceView.isCustom);
  const gridDeviceIds = catalogViews.map((deviceView) => deviceView.deviceId);

  const toggleDevice = (deviceId: string) => {
    const changedDeviceIds = toggleGridDeviceId(gridDeviceIds, deviceId);
    updateGrid.mutate(changedDeviceIds);
  };

  return {
    isOpen,
    openPicker: () => setIsOpen(true),
    closePicker: () => setIsOpen(false),
    makerGroups: listMakerGroups(catalog),
    gridDeviceIds,
    toggleDevice,
    isSaving: updateGrid.isPending,
    hasFailed: updateGrid.isError,
  };
};
