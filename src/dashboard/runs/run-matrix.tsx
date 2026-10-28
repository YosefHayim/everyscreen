import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  type DeviceView,
  pickDeviceName,
} from "@/dashboard/devices/device-view-logic";
import {
  type CellStatus,
  createMatrix,
} from "@/dashboard/runs/run-report-logic";
import { cn } from "@/dashboard/ui/cn";
import { Icon } from "@/dashboard/ui/icon";
import type { IconName } from "@/dashboard/ui/icon-paths";
import type { Run } from "@/runs/runs-logic";

const CELL_ICONS = {
  ok: "tick",
  warn: "finding",
  failed: "close",
  none: null,
} satisfies Record<CellStatus, IconName | null>;

const CELL_CLASS_NAMES = {
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  failed: "bg-failed-soft text-failed",
  none: "bg-soft text-muted",
} satisfies Record<CellStatus, string>;

interface RunMatrixProps {
  run: Run;
  deviceViews: DeviceView[];
}

export const RunMatrix = ({
  run,
  deviceViews,
}: RunMatrixProps): ReactElement => {
  const { t } = useTranslation();
  const matrix = createMatrix(run);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="m-0 text-xl font-medium">
        {t("runs.report.matrixTitle")}
      </h2>
      <div className="overflow-x-auto rounded-2xl border border-line bg-card">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-start text-xs text-ink-2">
              <th scope="col" className="px-4 py-3 text-start font-normal">
                {t("runs.report.matrixDevice")}
              </th>
              {run.steps.map((step, stepIndex) => (
                <th
                  key={step.stepId}
                  scope="col"
                  title={step.title}
                  className="px-2 py-3 text-center font-mono font-normal"
                >
                  {stepIndex + 1}
                </th>
              ))}
              <th scope="col" className="px-4 py-3 text-end font-normal">
                {t("runs.report.matrixVerdict")}
              </th>
            </tr>
          </thead>
          <tbody>
            {matrix.map((matrixRow) => (
              <tr key={matrixRow.deviceId} className="border-t border-line">
                <th scope="row" className="px-4 py-3 text-start font-medium">
                  {pickDeviceName(deviceViews, matrixRow.deviceId)}
                </th>
                {matrixRow.cells.map((cell) => {
                  const cellIcon = CELL_ICONS[cell.status];
                  const hasCellIcon = cellIcon !== null;
                  return (
                    <td key={cell.stepId} className="px-2 py-2 text-center">
                      <span
                        role="img"
                        aria-label={t(`status.${cell.status}`)}
                        className={cn(
                          "inline-grid size-7 place-items-center rounded-md",
                          CELL_CLASS_NAMES[cell.status],
                        )}
                      >
                        {hasCellIcon && <Icon name={cellIcon} size={14} />}
                      </span>
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-end font-mono text-xs whitespace-nowrap text-ink-2">
                  {t("runs.report.rowTally", {
                    okCount: matrixRow.okCount,
                    warnCount: matrixRow.warnCount,
                    failedCount: matrixRow.failedCount,
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
