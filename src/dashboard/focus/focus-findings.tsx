import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useLatestRunSteps } from "@/dashboard/device-feed/use-latest-run-steps";
import { StatusChip } from "@/dashboard/ui/status-chip";
import { listDeviceFindings } from "@/runs/device-status-logic";

interface FocusFindingsProps {
  deviceId: string;
}

export const FocusFindings = ({
  deviceId,
}: FocusFindingsProps): ReactElement => {
  const { t } = useTranslation();
  const latestRunSteps = useLatestRunSteps();
  const deviceFindings = listDeviceFindings(deviceId, latestRunSteps);
  const hasNoFindings = deviceFindings.length === 0;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="m-0 text-base font-medium">{t("focus.findingsTitle")}</h2>
      {hasNoFindings && (
        <p className="m-0 text-sm text-ink-2">{t("focus.noFindings")}</p>
      )}
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {deviceFindings.map((finding) => (
          <li
            key={`${finding.kind}-${finding.selector}-${finding.message}`}
            className="rounded-2xl border border-line bg-card p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="m-0 text-sm font-medium">
                {t(`checks.${finding.kind}`)}
              </h3>
              <StatusChip
                status={finding.severity}
                label={t(`status.${finding.severity}`)}
                isLabelHidden
              />
            </div>
            <p className="mt-2 mb-1 text-sm">{finding.message}</p>
            <p className="m-0 font-mono text-xs break-words text-ink-2">
              {finding.selector}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
};
