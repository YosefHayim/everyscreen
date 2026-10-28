import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { RunOriginBadge } from "@/dashboard/runs/run-origin-badge";
import {
  countRunFindings,
  createDurationLabel,
  createStartedLabel,
  pickFirstFailedDeviceId,
  pickRunDurationMs,
  pickRunHeadline,
} from "@/dashboard/runs/runs-list-logic";
import { cn } from "@/dashboard/ui/cn";
import { Icon } from "@/dashboard/ui/icon";
import type { IconName } from "@/dashboard/ui/icon-paths";
import type { Run, RunStatus } from "@/runs/runs-logic";

const STATUS_ICONS = {
  running: "open-url",
  ok: "tick",
  failed: "close",
} satisfies Record<RunStatus, IconName>;

const STATUS_CLASS_NAMES = {
  running: "text-pink",
  ok: "text-ok",
  failed: "text-failed",
} satisfies Record<RunStatus, string>;

interface RunRowProps {
  run: Run;
}

export const RunRow = ({ run }: RunRowProps): ReactElement => {
  const { t } = useTranslation();
  const headline = pickRunHeadline(run) ?? t("runs.noSteps");
  const failedDeviceId = pickFirstFailedDeviceId(run);
  const hasFailedDevice = failedDeviceId !== null;
  const findingCount = countRunFindings(run);
  const hasFindings = findingCount > 0;
  const durationLabel = createDurationLabel(pickRunDurationMs(run));
  const startedLabel = createStartedLabel(run.startedAt);

  return (
    <li className="border-t border-line first:border-t-0">
      <Link
        to="/runs/$runId"
        params={{ runId: run.runId }}
        aria-label={t("runs.openRun", { runId: run.runId })}
        className="flex min-h-14 flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-ink no-underline hover:bg-soft md:px-5"
      >
        <span className={cn("flex-none", STATUS_CLASS_NAMES[run.status])}>
          <Icon name={STATUS_ICONS[run.status]} size={16} strokeWidth={2.2} />
        </span>
        <span className="w-20 flex-none font-mono text-xs text-ink-2">
          {run.runId}
        </span>
        <span className="min-w-40 flex-1">
          <span className="block text-sm font-medium">{headline}</span>
          {hasFailedDevice && (
            <span className="block text-xs text-failed">
              {t("runs.failedOn", { deviceId: failedDeviceId })}
            </span>
          )}
        </span>
        <RunOriginBadge origin={run.origin} />
        {hasFindings && (
          <span className="inline-flex h-6 items-center rounded-full bg-warn-soft px-2.5 text-xs text-warn">
            {t("runs.findingsCount", { count: findingCount })}
          </span>
        )}
        <span className="font-mono text-xs text-ink-2">{durationLabel}</span>
        <span className="font-mono text-xs text-ink-2">{startedLabel}</span>
      </Link>
    </li>
  );
};
