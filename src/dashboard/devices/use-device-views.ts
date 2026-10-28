import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import type { DeviceView } from "@/dashboard/devices/device-view-logic";
import { deviceQueries } from "@/dashboard/devices/devices-queries";

export const useDeviceViews = (): UseQueryResult<DeviceView[]> =>
  useQuery(deviceQueries.list());
