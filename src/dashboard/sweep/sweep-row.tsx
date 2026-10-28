import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import type { DeviceView } from "@/dashboard/devices/device-view-logic";
import { SweepCell } from "@/dashboard/sweep/sweep-cell";
import type {
  ShotChoice,
  SweepRow as SweepRowView,
} from "@/dashboard/sweep/sweep-matrix-logic";
import { StatusChip } from "@/dashboard/ui/status-chip";

interface SweepRowProps {
  row: SweepRowView;
  columns: DeviceView[];
  onOpenShot: (shotChoice: ShotChoice) => void;
}

export const SweepRow = ({
  row,
  columns,
  onOpenShot,
}: SweepRowProps): ReactElement => {
  const { t } = useTranslation();
  const hasFindings = row.verdict === "findings";
  const hasOnlyFailures = row.verdict === "failed";
  const isClean = row.verdict === "clean";

  return (
    <tr>
      <th
        scope="row"
        className="sticky start-0 z-10 min-w-48 bg-soft px-4 py-2 text-start align-middle font-normal"
      >
        <span className="block font-mono text-lg font-medium break-all text-ink">
          {row.route}
        </span>
        <span className="mt-1 mb-2 block text-sm text-ink-2">
          {t("sweep.shotCount", { count: row.shotCount })}
        </span>
        {hasFindings && (
          <StatusChip
            status="warn"
            label={t("runs.findingsCount", { count: row.findingCount })}
          />
        )}
        {hasOnlyFailures && (
          <StatusChip
            status="failed"
            label={t("sweep.failedCount", { count: row.failedCount })}
          />
        )}
        {isClean && <StatusChip status="ok" label={t("sweep.clean")} />}
      </th>
      {row.cells.map((cell, cellIndex) => (
        <SweepCell
          key={cell.deviceId}
          cell={cell}
          deviceView={columns[cellIndex]}
          route={row.route}
          onOpen={() =>
            onOpenShot({ stepId: row.stepId, deviceId: cell.deviceId })
          }
        />
      ))}
    </tr>
  );
};
