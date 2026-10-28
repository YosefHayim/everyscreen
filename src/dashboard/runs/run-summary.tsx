import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { RunOriginBadge } from "@/dashboard/runs/run-origin-badge";
import { pickRunTotals } from "@/dashboard/runs/run-report-logic";
import {
  createDurationLabel,
  createStartedLabel,
  pickRunDurationMs,
  pickRunHeadline,
} from "@/dashboard/runs/runs-list-logic";
import { Icon } from "@/dashboard/ui/icon";
import { StatusChip } from "@/dashboard/ui/status-chip";
import type { Run } from "@/runs/runs-logic";

interface RunSummaryProps {
  run: Run;
}

export const RunSummary = ({ run }: RunSummaryProps): ReactElement => {
  const { t } = useTranslation();
  const runTotals = pickRunTotals(run);
  const headline = pickRunHeadline(run) ?? t("runs.noSteps");
  const hasFailedDevice = runTotals.failedDeviceCount > 0;
  const hasFindings = runTotals.findingCount > 0;
  const durationLabel = createDurationLabel(pickRunDurationMs(run));
  const startedLabel = createStartedLabel(run.startedAt);
  const stats = [
    { statKey: "steps", statLabel: String(runTotals.stepCount) },
    { statKey: "devices", statLabel: String(runTotals.deviceCount) },
    { statKey: "duration", statLabel: durationLabel },
    { statKey: "started", statLabel: startedLabel },
  ];

  return (
    <section className="flex flex-col gap-4">
      <Link
        to="/runs"
        className="inline-flex min-h-11 items-center gap-1 text-sm text-ink-2 no-underline hover:text-ink"
      >
        <Icon name="chevron-left" size={14} />
        {t("runs.report.back")}
      </Link>
      <div className="rounded-2xl border border-line bg-card p-5 md:p-7">
        <h1 className="m-0 font-mono text-3xl font-medium tracking-[-0.02em]">
          {t("runs.report.title", { runId: run.runId })}
        </h1>
        <p className="mt-2 mb-3 text-base">{headline}</p>
        <RunOriginBadge origin={run.origin} />
        <dl className="m-0 mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4 md:grid-cols-5">
          {stats.map((stat) => (
            <div key={stat.statKey}>
              <dt className="text-xs text-ink-2">
                {t(`runs.report.stats.${stat.statKey}`)}
              </dt>
              <dd className="m-0 mt-1 font-mono text-lg">{stat.statLabel}</dd>
            </div>
          ))}
          <div className="col-span-2 md:col-span-1">
            <dt className="text-xs text-ink-2">
              {t("runs.report.stats.result")}
            </dt>
            <dd className="m-0 mt-1 flex flex-wrap gap-2">
              <StatusChip
                status="ok"
                label={t("runs.report.okDevices", {
                  count: runTotals.okDeviceCount,
                })}
              />
              {hasFailedDevice && (
                <StatusChip
                  status="failed"
                  label={t("runs.report.failedDevices", {
                    count: runTotals.failedDeviceCount,
                  })}
                />
              )}
              {hasFindings && (
                <StatusChip
                  status="warn"
                  label={t("runs.findingsCount", {
                    count: runTotals.findingCount,
                  })}
                />
              )}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
};
