import type { ChangeEvent, ReactElement } from "react";
import { useTranslation } from "react-i18next";
import type { SweepTotals } from "@/dashboard/sweep/sweep-matrix-logic";
import { SweepRunButton } from "@/dashboard/sweep/sweep-run-button";
import type { RunSweep } from "@/dashboard/sweep/use-run-sweep";
import { Icon } from "@/dashboard/ui/icon";
import { StatusChip } from "@/dashboard/ui/status-chip";
import { Toggle } from "@/dashboard/ui/toggle";

const FINDINGS_ONLY_ID = "sweep-findings-only";

interface SweepHeaderProps {
  sweepTotals: SweepTotals;
  isFindingsOnly: boolean;
  pathText: string;
  runSweep: RunSweep;
  onChangeFindingsOnly: (event: ChangeEvent<HTMLInputElement>) => void;
  onChangePathText: (event: ChangeEvent<HTMLInputElement>) => void;
}

export const SweepHeader = ({
  sweepTotals,
  isFindingsOnly,
  pathText,
  runSweep,
  onChangeFindingsOnly,
  onChangePathText,
}: SweepHeaderProps): ReactElement => {
  const { t } = useTranslation();
  const statusChips = [
    { status: "ok", count: sweepTotals.okCount },
    { status: "warn", count: sweepTotals.warnCount },
    { status: "failed", count: sweepTotals.failedCount },
  ] as const;

  return (
    <header className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-line bg-card px-4 py-3 md:px-5">
      <h1 className="m-0 text-xl font-semibold tracking-[-0.01em]">
        {t("sweep.title")}
      </h1>
      <p className="m-0 font-mono text-[15px] text-ink-2">
        {t("sweep.stats", { ...sweepTotals })}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {statusChips.map((statusChip) => (
          <StatusChip
            key={statusChip.status}
            status={statusChip.status}
            label={t(`sweep.chips.${statusChip.status}`, {
              count: statusChip.count,
            })}
          />
        ))}
      </div>
      <div className="ms-auto flex flex-wrap items-center gap-4">
        <label
          htmlFor={FINDINGS_ONLY_ID}
          className="flex cursor-pointer items-center gap-2 text-[15px] font-medium"
        >
          <Toggle
            id={FINDINGS_ONLY_ID}
            checked={isFindingsOnly}
            onChange={onChangeFindingsOnly}
          />
          {t("sweep.findingsOnly")}
          <span className="rounded-full bg-paper px-2 font-mono text-[13px] text-ink-2">
            {sweepTotals.findingCount}
          </span>
        </label>
        <label className="flex h-10 w-56 items-center gap-2 rounded-xl border border-line bg-soft px-3 text-ink-2">
          <Icon name="search" size={16} />
          <input
            type="search"
            value={pathText}
            onChange={onChangePathText}
            placeholder={t("sweep.filterRoutes")}
            aria-label={t("sweep.filterRoutes")}
            className="min-w-0 flex-1 border-0 bg-transparent font-mono text-sm text-ink outline-offset-4"
          />
        </label>
        <SweepRunButton runSweep={runSweep} />
      </div>
    </header>
  );
};
