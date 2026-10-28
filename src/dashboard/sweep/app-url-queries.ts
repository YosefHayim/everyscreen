import { queryOptions } from "@tanstack/react-query";
import { hubApi } from "@/dashboard/hub-api";

export const appUrlQueries = {
  open: () =>
    queryOptions({
      queryKey: ["app-url"],
      queryFn: async () => {
        const openAppReply = await hubApi.api.commands.app.$get();
        const isReplyBad = !openAppReply.ok;
        if (isReplyBad) {
          throw new Error(`App url failed: ${openAppReply.status}`);
        }
        const { appUrl } = await openAppReply.json();
        return appUrl;
      },
    }),
};
