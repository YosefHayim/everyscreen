import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import type { DeviceView } from "@/dashboard/devices/device-view-logic";
import type {
  ShotChoice,
  SweepRow as SweepRowView,
} from "@/dashboard/sweep/sweep-matrix-logic";
import { SweepRow } from "@/dashboard/sweep/sweep-row";

interface SweepTableProps {
  columns: DeviceView[];
  rows: SweepRowView[];
  onOpenShot: (shotChoice: ShotChoice) => void;
}

export const SweepTable = ({
  columns,
  rows,
  onOpenShot,
}: SweepTableProps): ReactElement => {
  const { t } = useTranslation();

  return (
    <div className="min-h-0 flex-1 overflow-x-auto">
      <table className="w-max border-separate border-spacing-0">
        <thead>
          <tr>
            <th
              scope="col"
              className="sticky start-0 z-10 bg-soft px-4 py-3 text-start text-xs font-normal tracking-wider text-ink-2 uppercase"
            >
              {t("sweep.routeColumn")}
            </th>
            {columns.map((deviceView) => (
              <th
                key={deviceView.deviceId}
                scope="col"
                className="px-2.5 py-3 text-start font-normal"
              >
                <span className="block text-base font-medium">
                  {deviceView.name}
                </span>
                <span className="block font-mono text-sm text-ink-2">
                  {t("sweep.viewport", {
                    width: deviceView.viewportWidth,
                    height: deviceView.viewportHeight,
                  })}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <SweepRow
              key={row.stepId}
              row={row}
              columns={columns}
              onOpenShot={onOpenShot}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
