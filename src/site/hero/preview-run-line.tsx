import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/dashboard/ui/cn";
import { SiteIcon } from "@/site/ui/site-icon";

type PreviewRunStatus = "running" | "passed" | "failed" | "waiting";

export interface PreviewRun {
  id: string;
  status: PreviewRunStatus;
  railIndex: number | null;
}

interface PreviewRunLineProps {
  run: PreviewRun;
}

export const PreviewRunLine = ({ run }: PreviewRunLineProps): ReactElement => {
  const { t } = useTranslation();
  const isRunning = run.status === "running";
  const isPassed = run.status === "passed";
  const isFailed = run.status === "failed";
  const isWaiting = run.status === "waiting";
  const isFinished = isPassed || isFailed;
  const finishedIconName = isPassed ? "tick" : "close";
  const finishedClassName = isPassed ? "text-ok" : "text-failed";

  return (
    <div
      className={cn("flex gap-2.5 p-2.5", isRunning && "rounded-lg bg-paper")}
    >
      {isRunning && (
        <span
          aria-hidden="true"
          className="live-dot mt-[5px] size-2 flex-none rounded-full bg-pink"
        />
      )}
      {isFinished && (
        <span
          data-index={run.railIndex}
          className="loop-rail relative mt-0.5 grid size-3.5 flex-none place-items-center"
        >
          <span
            aria-hidden="true"
            className="loop-spin absolute inset-0 rounded-full border-2 border-line border-t-cobalt"
          />
          <span
            data-index={run.railIndex}
            className={`loop-badge ${finishedClassName}`}
          >
            <SiteIcon name={finishedIconName} size={14} strokeWidth={2.4} />
          </span>
        </span>
      )}
      {isWaiting && (
        <span className="mt-0.5 text-ink-3">
          <SiteIcon name="clock" size={14} strokeWidth={2} />
        </span>
      )}
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[13px] font-medium">
          {t(`preview.runs.${run.id}.name`)}
        </span>
        <span className="text-xs text-ink-2">
          {t(`preview.runs.${run.id}.status`)}
        </span>
      </span>
    </div>
  );
};
