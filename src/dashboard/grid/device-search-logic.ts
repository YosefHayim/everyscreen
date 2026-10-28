import type { DeviceView } from "@/dashboard/devices/device-view-logic";

export const pickMatchingDevices = (
  deviceViews: DeviceView[],
  searchQuery: string,
): DeviceView[] => {
  const wantedName = searchQuery.trim().toLowerCase();
  const isSearchEmpty = wantedName === "";
  if (isSearchEmpty) return deviceViews;
  return deviceViews.filter((deviceView) =>
    deviceView.name.toLowerCase().includes(wantedName),
  );
};
