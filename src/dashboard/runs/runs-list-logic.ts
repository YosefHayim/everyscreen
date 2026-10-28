import type { Run, RunOrigin, RunStatus } from "@/runs/runs-logic";

export type StatusFilter = "all" | RunStatus;
export type OriginFilter = "all" | RunOrigin;

export const STATUS_FILTERS: StatusFilter[] = [
  "all",
  "running",
  "failed",
  "ok",
];
export const ORIGIN_FILTERS: OriginFilter[] = [
  "all",
  "cli",
  "flow",
  "playwright",
];

const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const SECOND_DIGITS = 2;
const REFETCH_WHILE_RUNNING_MS = 2000;

const isRunShown = (
  run: Run,
  statusFilter: StatusFilter,
  originFilter: OriginFilter,
): boolean => {
  const isStatusShown = statusFilter === "all" || run.status === statusFilter;
  const isOriginShown = originFilter === "all" || run.origin === originFilter;
  return isStatusShown && isOriginShown;
};

export const listShownRuns = (
  runs: Run[],
  statusFilter: StatusFilter,
  originFilter: OriginFilter,
): Run[] =>
  runs.filter((run) => isRunShown(run, statusFilter, originFilter)).reverse();

export const countRuns = (runs: Run[], statusFilter: StatusFilter): number =>
  runs.filter((run) => isRunShown(run, statusFilter, "all")).length;

export const pickRefetchInterval = (
  runs: Run[] | undefined,
): number | false => {
  const hasRunningRun = runs?.some((run) => run.status === "running") === true;
  return hasRunningRun ? REFETCH_WHILE_RUNNING_MS : false;
};

export const pickRunDurationMs = (run: Run): number =>
  run.steps.reduce((totalMs, step) => {
    const answerDurations = step.deviceAnswers.map(
      (deviceAnswer) => deviceAnswer.durationMs,
    );
    return totalMs + Math.max(0, ...answerDurations);
  }, 0);

export const createDurationLabel = (durationMs: number): string => {
  const totalSeconds = Math.round(durationMs / MILLISECONDS_PER_SECOND);
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = String(totalSeconds % SECONDS_PER_MINUTE).padStart(
    SECOND_DIGITS,
    "0",
  );
  return `${minutes}:${seconds}`;
};

export const createStartedLabel = (startedAt: number): string => {
  const startedDate = new Date(startedAt);
  const hours = String(startedDate.getHours()).padStart(2, "0");
  const minutes = String(startedDate.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

export const pickRunHeadline = (run: Run): string | null =>
  run.steps[0]?.title ?? null;

export const pickFirstFailedDeviceId = (run: Run): string | null => {
  for (const step of run.steps) {
    const failedAnswer = step.deviceAnswers.find(
      (deviceAnswer) => deviceAnswer.status === "failed",
    );
    const hasFailedAnswer = failedAnswer !== undefined;
    if (hasFailedAnswer) return failedAnswer.deviceId;
  }
  return null;
};

export const countRunFindings = (run: Run): number =>
  run.steps.reduce((total, step) => total + step.findings.length, 0);
