import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { RunLine } from "@/dashboard/runs/run-line";
import {
  countRuns,
  ORIGIN_FILTERS,
  STATUS_FILTERS,
} from "@/dashboard/runs/runs-list-logic";
import { useRuns } from "@/dashboard/runs/use-runs";
import { FilterChip } from "@/dashboard/ui/filter-chip";
import { ScreenBoundary } from "@/dashboard/ui/screen-boundary";

export const RunsScreen = (): ReactElement => {
  const { t } = useTranslation();
  const runsView = useRuns();
  const { runsStatus, runs, shownRuns } = runsView;
  const hasShownRuns = shownRuns.length > 0;
  const hasNoShownRuns = !hasShownRuns;

  return (
    <div className="mx-auto flex w-full max-w-290 flex-col gap-5 p-4 md:p-7">
      <header>
        <h1 className="m-0 text-3xl font-medium tracking-[-0.02em]">
          {t("runs.title")}
        </h1>
        <p className="mt-1 mb-0 text-sm text-ink-2">{t("runs.subtitle")}</p>
      </header>
      <ScreenBoundary status={runsStatus}>
        <section
          aria-label={t("runs.statusLabel")}
          className="flex flex-wrap items-center gap-2"
        >
          {STATUS_FILTERS.map((statusFilter) => (
            <FilterChip
              key={statusFilter}
              label={t(`runs.statusFilters.${statusFilter}`)}
              count={countRuns(runs, statusFilter)}
              isSelected={runsView.statusFilter === statusFilter}
              onSelect={() => runsView.chooseStatusFilter(statusFilter)}
            />
          ))}
        </section>
        <section
          aria-label={t("runs.sourceLabel")}
          className="flex flex-wrap items-center gap-2"
        >
          {ORIGIN_FILTERS.map((originFilter) => (
            <FilterChip
              key={originFilter}
              label={t(`runs.originFilters.${originFilter}`)}
              count={null}
              isSelected={runsView.originFilter === originFilter}
              onSelect={() => runsView.chooseOriginFilter(originFilter)}
            />
          ))}
        </section>
        {hasNoShownRuns && (
          <p role="status" className="m-0 text-sm text-ink-2">
            {t("runs.noRuns")}
          </p>
        )}
        {hasShownRuns && (
          <ul className="m-0 list-none overflow-hidden rounded-2xl border border-line bg-card p-0">
            {shownRuns.map((run) => (
              <RunLine key={run.runId} run={run} />
            ))}
          </ul>
        )}
      </ScreenBoundary>
    </div>
  );
};
