import { type ChangeEvent, useState } from "react";
import type { DeviceView } from "@/dashboard/devices/device-view-logic";
import {
  createSweepMatrix,
  listShownRoutes,
  type OpenedShot,
  pickOpenedShot,
  pickSweepTotals,
  type ShotChoice,
  type SweepRoute,
  type SweepTotals,
} from "@/dashboard/sweep/sweep-matrix-logic";
import { type RunSweep, useRunSweep } from "@/dashboard/sweep/use-run-sweep";
import type { Run } from "@/runs/runs-logic";

interface SweepScreen {
  columns: DeviceView[];
  shownRoutes: SweepRoute[];
  totalRouteCount: number;
  sweepTotals: SweepTotals;
  isFindingsOnly: boolean;
  routeFilter: string | null;
  openedShot: OpenedShot | null;
  runSweep: RunSweep;
  changeFindingsOnly: (event: ChangeEvent<HTMLInputElement>) => void;
  changeRouteFilter: (event: ChangeEvent<HTMLInputElement>) => void;
  openShot: (shotChoice: ShotChoice) => void;
  closeShot: () => void;
}

export const useSweepScreen = (
  run: Run,
  deviceViews: DeviceView[],
): SweepScreen => {
  const [isFindingsOnly, setIsFindingsOnly] = useState(false);
  const [routeFilter, setRouteFilter] = useState<string | null>(null);
  const [shotChoice, setShotChoice] = useState<ShotChoice | null>(null);
  const runSweep = useRunSweep();
  const sweepMatrix = createSweepMatrix(run, deviceViews);
  const shownRoutes = listShownRoutes(sweepMatrix.routes, {
    isFindingsOnly,
    routeFilter,
  });

  return {
    columns: sweepMatrix.columns,
    shownRoutes,
    totalRouteCount: sweepMatrix.routes.length,
    sweepTotals: pickSweepTotals(sweepMatrix),
    isFindingsOnly,
    routeFilter,
    openedShot: pickOpenedShot(sweepMatrix, shotChoice),
    runSweep,
    changeFindingsOnly: (event) => setIsFindingsOnly(event.target.checked),
    changeRouteFilter: (event) => {
      const isInputEmpty = event.target.value === "";
      setRouteFilter(isInputEmpty ? null : event.target.value);
    },
    openShot: setShotChoice,
    closeShot: () => setShotChoice(null),
  };
};
