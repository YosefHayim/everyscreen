import { useQuery } from "@tanstack/react-query";
import { appUrlQueries } from "@/dashboard/app-url/app-url-queries";
import { useCommandNotices } from "@/dashboard/device-feed/use-command-notices";

export const useOpenAppUrl = (): string | null => {
  const commandNotices = useCommandNotices();
  const latestCommandSentAt = commandNotices[0]?.sentAt ?? null;
  const appUrlQuery = useQuery(appUrlQueries.open(latestCommandSentAt));

  return appUrlQuery.data ?? null;
};
