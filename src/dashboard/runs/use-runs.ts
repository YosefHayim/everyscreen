import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  listShownRuns,
  type OriginFilter,
  type StatusFilter,
} from "@/dashboard/runs/runs-list-logic";
import { runQueries } from "@/dashboard/runs/runs-queries";
import type { Run } from "@/runs/runs-logic";

interface RunsView {
  runsQuery: UseQueryResult<Run[]>;
  runs: Run[];
  shownRuns: Run[];
  statusFilter: StatusFilter;
  originFilter: OriginFilter;
  chooseStatusFilter: (statusFilter: StatusFilter) => void;
  chooseOriginFilter: (originFilter: OriginFilter) => void;
}

export const useRuns = (): RunsView => {
  const runsQuery = useQuery(runQueries.list());
  const [statusFilter, chooseStatusFilter] = useState<StatusFilter>("all");
  const [originFilter, chooseOriginFilter] = useState<OriginFilter>("all");
  const runs = runsQuery.data ?? [];
  const shownRuns = listShownRuns(runs, statusFilter, originFilter);

  return {
    runsQuery,
    runs,
    shownRuns,
    statusFilter,
    originFilter,
    chooseStatusFilter,
    chooseOriginFilter,
  };
};
