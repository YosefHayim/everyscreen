import { queryOptions } from "@tanstack/react-query";
import { createDeviceView } from "@/dashboard/devices/device-view-logic";
import { hubApi } from "@/dashboard/hub-api";

export const deviceQueries = {
  list: () =>
    queryOptions({
      queryKey: ["devices"],
      queryFn: async () => {
        const devicesReply = await hubApi.api.devices.$get();
        const isReplyBad = !devicesReply.ok;
        if (isReplyBad) {
          throw new Error(`Devices failed: ${devicesReply.status}`);
        }
        return devicesReply.json();
      },
      select: (gridDevices) => gridDevices.map(createDeviceView),
    }),
};
