import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { SweepCell } from "@/dashboard/sweep/sweep-cell";
import {
  listRouteChips,
  type ShotChoice,
  type SweepRoute as SweepRouteView,
} from "@/dashboard/sweep/sweep-matrix-logic";
import { StatusChip } from "@/dashboard/ui/status-chip";

interface SweepRouteProps {
  route: SweepRouteView;
  onOpenShot: (shotChoice: ShotChoice) => void;
}

export const SweepRoute = ({
  route,
  onOpenShot,
}: SweepRouteProps): ReactElement => {
  const { t } = useTranslation();
  const routeChips = listRouteChips(route).map((routeChip) => {
    const { isRouteClean, status, cellCount } = routeChip;
    const label = isRouteClean
      ? t("sweep.clean")
      : t(`sweep.chips.${status}`, { count: cellCount });
    return { status, label };
  });

  return (
    <tr>
      <th
        scope="row"
        className="sticky start-0 z-10 min-w-48 bg-soft px-4 py-2 text-start align-middle font-normal"
      >
        <span className="block font-mono text-lg font-medium break-all text-ink">
          {route.path}
        </span>
        <span className="mt-1 mb-2 block text-sm text-ink-2">
          {t("sweep.shotCount", { count: route.shotCount })}
        </span>
        <span className="flex flex-wrap gap-1">
          {routeChips.map((routeChip) => (
            <StatusChip
              key={routeChip.status}
              status={routeChip.status}
              label={routeChip.label}
            />
          ))}
        </span>
      </th>
      {route.cells.map((cell) => (
        <SweepCell
          key={cell.deviceView.deviceId}
          cell={cell}
          routePath={route.path}
          onOpen={() =>
            onOpenShot({
              stepId: route.stepId,
              deviceId: cell.deviceView.deviceId,
            })
          }
        />
      ))}
    </tr>
  );
};
