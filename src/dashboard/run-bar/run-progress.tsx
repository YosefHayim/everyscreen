import type { ReactElement } from "react";
import type { ProgressShares } from "@/dashboard/run-bar/run-bar-logic";
import { cn } from "@/dashboard/ui/cn";

const PROGRESS_PART_CLASS_NAMES = {
  ok: "bg-ok",
  failed: "bg-failed",
  running:
    "bg-[repeating-linear-gradient(90deg,var(--color-pink)_0_6px,transparent_6px_10px)]",
};

interface RunProgressProps {
  progressShares: ProgressShares;
}

export const RunProgress = ({
  progressShares,
}: RunProgressProps): ReactElement => {
  const { okPercent, failedPercent, runningPercent } = progressShares;
  const progressParts = [
    { partKey: "ok", percent: okPercent },
    { partKey: "failed", percent: failedPercent },
    { partKey: "running", percent: runningPercent },
  ] as const;

  return (
    <div aria-hidden="true" className="flex h-1 w-full bg-line">
      {progressParts.map(({ partKey, percent }) => (
        <div
          key={partKey}
          className={cn("h-full", PROGRESS_PART_CLASS_NAMES[partKey])}
          style={{ width: `${percent}%` }}
        />
      ))}
    </div>
  );
};
