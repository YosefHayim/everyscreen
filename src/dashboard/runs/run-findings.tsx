import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  type DeviceView,
  pickDeviceName,
} from "@/dashboard/devices/device-view-logic";
import { StatusChip } from "@/dashboard/ui/status-chip";
import type { Run } from "@/runs/runs-logic";

interface RunFindingsProps {
  run: Run;
  deviceViews: DeviceView[];
}

export const RunFindings = ({
  run,
  deviceViews,
}: RunFindingsProps): ReactElement => {
  const { t } = useTranslation();
  const stepFindings = run.steps.flatMap((step, stepIndex) =>
    step.findings.map((finding) => ({
      stepNumber: stepIndex + 1,
      stepTitle: step.title,
      finding,
    })),
  );
  const hasNoFindings = stepFindings.length === 0;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="m-0 text-xl font-medium">
        {t("runs.report.findingsTitle")}
      </h2>
      {hasNoFindings && (
        <p className="m-0 text-sm text-ink-2">{t("runs.report.noFindings")}</p>
      )}
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {stepFindings.map((stepFinding) => {
          const { finding } = stepFinding;
          return (
            <li
              key={`${stepFinding.stepNumber}-${finding.deviceId}-${finding.kind}-${finding.selector}`}
              className="rounded-2xl border border-line bg-card p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="m-0 text-base font-medium">
                  {t(`checks.${finding.kind}`)}
                </h3>
                <StatusChip
                  status={finding.severity}
                  label={t(`status.${finding.severity}`)}
                />
              </div>
              <p className="mt-2 mb-1 text-sm">{finding.message}</p>
              <p className="m-0 font-mono text-xs break-words text-ink-2">
                {finding.selector} ·{" "}
                {t("runs.report.findingStep", {
                  number: stepFinding.stepNumber,
                  title: stepFinding.stepTitle,
                })}{" "}
                · {pickDeviceName(deviceViews, finding.deviceId)}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
