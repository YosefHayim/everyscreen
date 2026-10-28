import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { RunBarCounter } from "@/dashboard/run-bar/run-bar-counter";
import { RunProgress } from "@/dashboard/run-bar/run-progress";
import { useRunBar } from "@/dashboard/run-bar/use-run-bar";
import { StatusChip } from "@/dashboard/ui/status-chip";

export const RunBar = (): ReactElement | null => {
  const { t } = useTranslation();
  const runBar = useRunBar();
  const hasNoRunBar = runBar === null;
  if (hasNoRunBar) return null;

  const { status, latestTest, counters, progressShares } = runBar;
  const isRunning = status === "running";
  const isRunFinished = !isRunning;
  const hasLatestTest = latestTest !== null;
  const statusLabel = t(`runBar.status.${status}`);

  return (
    <section aria-label={t("runBar.label")} className="flex-none bg-card">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-3 py-2 md:px-5">
        {isRunning && (
          <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-paper px-2.5 text-[12.5px] font-medium text-ink">
            <span
              aria-hidden="true"
              className="live-dot size-1.5 rounded-full bg-pink"
            />
            {statusLabel}
          </span>
        )}
        {isRunFinished && <StatusChip status={status} label={statusLabel} />}
        <div className="min-w-0 flex-1 basis-60">
          {hasLatestTest && (
            <p className="m-0 truncate text-sm font-semibold text-ink">
              {latestTest.specFile} &middot; {latestTest.title}
            </p>
          )}
        </div>
        <dl className="m-0 flex flex-wrap gap-x-6 gap-y-1">
          {counters.map((runCounter) => (
            <RunBarCounter
              key={runCounter.counterKey}
              runCounter={runCounter}
            />
          ))}
        </dl>
      </div>
      <RunProgress progressShares={progressShares} />
    </section>
  );
};
