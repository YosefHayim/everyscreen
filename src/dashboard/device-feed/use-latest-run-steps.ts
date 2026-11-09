import { useQuery } from "@tanstack/react-query";
import { pickLatestRunSteps } from "@/dashboard/device-feed/latest-run-logic";
import { runQueries } from "@/dashboard/runs/runs-queries";
import type { RunStep } from "@/runs/runs-logic";

export const useLatestRunSteps = (): RunStep[] => {
  const runsQuery = useQuery(runQueries.list());
  return pickLatestRunSteps(runsQuery.data ?? []);
};
