import { useHasScreenImage } from "@/dashboard/device-feed/use-has-screen-image";
import { useLiveStatus } from "@/dashboard/device-feed/use-live-status";
import {
  type DeviceGroupView,
  type DeviceView,
  listDeviceGroups,
} from "@/dashboard/devices/device-view-logic";
import { useDeviceViews } from "@/dashboard/devices/use-device-views";
import { pickMatchingDevices } from "@/dashboard/grid/device-search-logic";
import type { GridView } from "@/dashboard/grid/grid-view-logic";
import { isOpenAppCardShown } from "@/dashboard/grid/setup-steps-logic";
import { useDeviceSearch } from "@/dashboard/grid/use-device-search";
import { useGridView } from "@/dashboard/grid/use-grid-view";
import type { ScreenStatus } from "@/dashboard/ui/screen-boundary";
import { pickScreenStatus } from "@/dashboard/ui/screen-status-logic";
import { useZoomedDevice } from "@/dashboard/zoom/use-zoomed-device";

interface GridScreen {
  deviceGroups: DeviceGroupView[];
  shownDeviceViews: DeviceView[];
  gridView: GridView;
  devicesStatus: ScreenStatus;
  isOpenAppCardShown: boolean;
  isSearchEmpty: boolean;
  zoomedDeviceId: string | null;
  changeZoomedDevice: (deviceId: string | null) => void;
}

export const useGridScreen = (): GridScreen => {
  const devicesQuery = useDeviceViews();
  const deviceViews = devicesQuery.data ?? [];
  const liveStatus = useLiveStatus();
  const hasScreenImage = useHasScreenImage();
  const { gridView } = useGridView();
  const { searchQuery } = useDeviceSearch();
  const { zoomedDeviceId, changeZoomedDevice } = useZoomedDevice();
  const hasNoDevices = deviceViews.length === 0;
  const matchingDeviceViews = pickMatchingDevices(deviceViews, searchQuery);
  const deviceGroups = listDeviceGroups(matchingDeviceViews);
  const shownDeviceViews = deviceGroups.flatMap(
    (deviceGroup) => deviceGroup.devices,
  );
  const isSearchEmpty = !hasNoDevices && shownDeviceViews.length === 0;

  return {
    deviceGroups,
    shownDeviceViews,
    gridView,
    devicesStatus: pickScreenStatus(devicesQuery.status, hasNoDevices),
    isOpenAppCardShown: isOpenAppCardShown(liveStatus, hasScreenImage),
    isSearchEmpty,
    zoomedDeviceId,
    changeZoomedDevice,
  };
};
