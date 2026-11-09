import type { Run, RunStep } from "@/runs/runs-logic";

export const pickLatestRunSteps = (runs: Run[]): RunStep[] => {
  const newestFirstRuns = [...runs].sort(
    (firstRun, secondRun) => secondRun.startedAt - firstRun.startedAt,
  );
  const latestRun = newestFirstRuns.at(0);
  const hasNoRun = latestRun === undefined;
  if (hasNoRun) return [];

  return latestRun.steps;
};
