import { queryOptions } from "@tanstack/react-query";
import { hubApi } from "@/dashboard/hub-api";
import { pickRefetchInterval } from "@/dashboard/runs/runs-list-logic";

export const runQueries = {
  list: () =>
    queryOptions({
      queryKey: ["runs"],
      queryFn: async () => {
        const runsReply = await hubApi.api.runs.$get();
        const isReplyBad = !runsReply.ok;
        if (isReplyBad) throw new Error(`Runs failed: ${runsReply.status}`);
        return runsReply.json();
      },
      // Playwright runs are written straight to the store, so poll while one runs.
      refetchInterval: (runsQuery) => pickRefetchInterval(runsQuery.state.data),
    }),
  detail: (runId: string) =>
    queryOptions({
      queryKey: ["runs", runId],
      queryFn: async () => {
        const runReply = await hubApi.api.runs[":runId"].$get({
          param: { runId },
        });
        const isReplyBad = !runReply.ok;
        if (isReplyBad) throw new Error(`Run ${runId}: ${runReply.status}`);
        return runReply.json();
      },
    }),
};
