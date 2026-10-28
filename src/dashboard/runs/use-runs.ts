import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  listShownRuns,
  type OriginFilter,
  type StatusFilter,
} from "@/dashboard/runs/runs-list-logic";
import { runQueries } from "@/dashboard/runs/runs-queries";
import type { ScreenStatus } from "@/dashboard/ui/screen-boundary";
import { pickScreenStatus } from "@/dashboard/ui/screen-status-logic";
import type { Run } from "@/runs/runs-logic";

interface RunsView {
  runsStatus: ScreenStatus;
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
  const hasNoRuns = runs.length === 0;

  return {
    runsStatus: pickScreenStatus(runsQuery.status, hasNoRuns),
    runs,
    shownRuns,
    statusFilter,
    originFilter,
    chooseStatusFilter,
    chooseOriginFilter,
  };
};
