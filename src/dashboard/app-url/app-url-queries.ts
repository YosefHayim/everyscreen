import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { hubApi } from "@/dashboard/hub-api";

export const appUrlQueries = {
  // A new command notice changes the key, so an open or a goto from the CLI refetches the url.
  open: (latestCommandSentAt: number | null) =>
    queryOptions({
      queryKey: ["app-url", latestCommandSentAt],
      placeholderData: keepPreviousData,
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
