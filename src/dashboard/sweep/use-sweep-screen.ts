import { type ChangeEvent, useState } from "react";
import type { DeviceView } from "@/dashboard/devices/device-view-logic";
import {
  createSweepMatrix,
  listShownRows,
  type OpenedShot,
  pickOpenedShot,
  pickSweepTotals,
  type ShotChoice,
  type SweepRow,
  type SweepTotals,
} from "@/dashboard/sweep/sweep-matrix-logic";
import { type RunSweep, useRunSweep } from "@/dashboard/sweep/use-run-sweep";
import type { Run } from "@/runs/runs-logic";

interface SweepScreen {
  columns: DeviceView[];
  shownRows: SweepRow[];
  totalRowCount: number;
  sweepTotals: SweepTotals;
  isFindingsOnly: boolean;
  routeFilter: string;
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
  const [routeFilter, setRouteFilter] = useState("");
  const [shotChoice, setShotChoice] = useState<ShotChoice | null>(null);
  const runSweep = useRunSweep();
  const sweepMatrix = createSweepMatrix(run, deviceViews);
  const shownRows = listShownRows(sweepMatrix.rows, {
    isFindingsOnly,
    routeFilter,
  });

  return {
    columns: sweepMatrix.columns,
    shownRows,
    totalRowCount: sweepMatrix.rows.length,
    sweepTotals: pickSweepTotals(sweepMatrix),
    isFindingsOnly,
    routeFilter,
    openedShot: pickOpenedShot(sweepMatrix, shotChoice),
    runSweep,
    changeFindingsOnly: (event) => setIsFindingsOnly(event.target.checked),
    changeRouteFilter: (event) => setRouteFilter(event.target.value),
    openShot: setShotChoice,
    closeShot: () => setShotChoice(null),
  };
};
