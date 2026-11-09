import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useSyncExternalStore } from "react";
import {
  getLastRunMessage,
  subscribe,
} from "@/dashboard/device-feed/live-store";
import { runQueries } from "@/dashboard/runs/runs-queries";

// Each live run message reloads the saved runs, so the tile statuses follow the latest step.
export const useRefreshRunsOnLiveRun = (): void => {
  const queryClient = useQueryClient();
  const lastRunMessage = useSyncExternalStore(subscribe, getLastRunMessage);

  useEffect(() => {
    const isThereNoRunMessage = lastRunMessage === null;
    if (isThereNoRunMessage) return;

    void queryClient.invalidateQueries({
      queryKey: runQueries.list().queryKey,
    });
  }, [lastRunMessage, queryClient]);
};
