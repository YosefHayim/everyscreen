import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import type { DeviceView } from "@/dashboard/devices/device-view-logic";
import { SweepHeader } from "@/dashboard/sweep/sweep-header";
import { SweepShotDialog } from "@/dashboard/sweep/sweep-shot-dialog";
import { SweepTable } from "@/dashboard/sweep/sweep-table";
import { useSweepScreen } from "@/dashboard/sweep/use-sweep-screen";
import type { Run } from "@/runs/runs-logic";

interface SweepScreenProps {
  run: Run;
  deviceViews: DeviceView[];
}

export const SweepScreen = ({
  run,
  deviceViews,
}: SweepScreenProps): ReactElement => {
  const { t } = useTranslation();
  const sweepScreen = useSweepScreen(run, deviceViews);
  const { shownRoutes, openedShot } = sweepScreen;
  const isShotOpened = openedShot !== null;
  const hasNoShownRoutes = shownRoutes.length === 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SweepHeader
        sweepTotals={sweepScreen.sweepTotals}
        isFindingsOnly={sweepScreen.isFindingsOnly}
        routeFilter={sweepScreen.routeFilter}
        runSweep={sweepScreen.runSweep}
        onChangeFindingsOnly={sweepScreen.changeFindingsOnly}
        onChangeRouteFilter={sweepScreen.changeRouteFilter}
      />
      <SweepTable
        columns={sweepScreen.columns}
        routes={shownRoutes}
        onOpenShot={sweepScreen.openShot}
      />
      {hasNoShownRoutes && (
        <p role="status" className="m-0 px-5 py-6 text-sm text-ink-2">
          {t("sweep.noRoutes")}
        </p>
      )}
      <footer className="flex flex-wrap justify-between gap-2 border-t border-line bg-card px-4 py-3 font-mono text-sm text-ink-2 md:px-5">
        <span>
          {t("sweep.showing", {
            shownCount: shownRoutes.length,
            totalCount: sweepScreen.totalRouteCount,
          })}
        </span>
        <span>{t("sweep.openHint")}</span>
      </footer>
      {isShotOpened && (
        <SweepShotDialog
          openedShot={openedShot}
          onClose={sweepScreen.closeShot}
        />
      )}
    </div>
  );
};
