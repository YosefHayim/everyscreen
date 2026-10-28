import type { Finding, FindingKind } from "@/checks/checks-logic";
import type { DeviceAnswer } from "@/commands/commands-logic";
import type { DeviceView } from "@/dashboard/devices/device-view-logic";
import {
  type CellStatus,
  listRunDeviceIds,
  pickCellStatus,
  pickShotUrl,
} from "@/dashboard/runs/run-report-logic";
import { pickFrameLayout } from "@/dashboard/ui/device-frame-logic";
import type { Run, RunStep } from "@/runs/runs-logic";

export interface SweepCell {
  deviceId: string;
  status: CellStatus;
  shotUrl: string | null;
  failureMessage: string | null;
  findings: Finding[];
}

type RowVerdict = "findings" | "failed" | "clean";

export interface SweepRow {
  stepId: string;
  route: string;
  shotCount: number;
  findingCount: number;
  failedCount: number;
  verdict: RowVerdict;
  cells: SweepCell[];
}

export interface SweepMatrix {
  columns: DeviceView[];
  rows: SweepRow[];
}

export interface SweepTotals {
  routeCount: number;
  deviceCount: number;
  shotCount: number;
  findingCount: number;
  okCount: number;
  warnCount: number;
  failedCount: number;
}

export interface SweepRowFilter {
  isFindingsOnly: boolean;
  routeFilter: string;
}

export interface ShotChoice {
  stepId: string;
  deviceId: string;
}

export interface OpenedShot {
  route: string;
  deviceView: DeviceView;
  cell: SweepCell;
}

export type CellCaption =
  | { kind: "failure"; message: string }
  | { kind: "finding"; findingKind: FindingKind; moreCount: number }
  | { kind: "status"; status: CellStatus };

const SWEEP_TITLE_PREFIX = "sweep ";
const THUMB_BOX_WIDTH = 150;
const THUMB_BOX_HEIGHT = 108;
const PROBE_SCREEN_WIDTH = 100;

const pickFailureMessage = (
  deviceAnswer: DeviceAnswer | undefined,
): string | null => {
  const isAnswerFailed = deviceAnswer?.status === "failed";
  if (isAnswerFailed) return deviceAnswer.message;
  return null;
};

const createSweepCell = (step: RunStep, deviceId: string): SweepCell => {
  const deviceAnswer = step.deviceAnswers.find(
    (answer) => answer.deviceId === deviceId,
  );
  const failureMessage = pickFailureMessage(deviceAnswer);
  const shotPath = deviceAnswer?.shotPath ?? null;
  return {
    deviceId,
    status: pickCellStatus(step, deviceId),
    shotUrl: pickShotUrl(shotPath),
    failureMessage,
    findings: step.findings.filter((finding) => finding.deviceId === deviceId),
  };
};

const pickRowVerdict = (
  findingCount: number,
  failedCount: number,
): RowVerdict => {
  const hasFindings = findingCount > 0;
  if (hasFindings) return "findings";
  const hasFailures = failedCount > 0;
  if (hasFailures) return "failed";
  return "clean";
};

const createSweepRow = (step: RunStep, columns: DeviceView[]): SweepRow => {
  const cells = columns.map(({ deviceId }) => createSweepCell(step, deviceId));
  const findingCount = cells.reduce(
    (total, cell) => total + cell.findings.length,
    0,
  );
  const failedCount = cells.filter((cell) => cell.status === "failed").length;
  return {
    stepId: step.stepId,
    route: step.title.replace(SWEEP_TITLE_PREFIX, ""),
    shotCount: cells.filter((cell) => cell.shotUrl !== null).length,
    findingCount,
    failedCount,
    verdict: pickRowVerdict(findingCount, failedCount),
    cells,
  };
};

export const createSweepMatrix = (
  run: Run,
  deviceViews: DeviceView[],
): SweepMatrix => {
  const runDeviceIds = listRunDeviceIds(run);
  const columns = deviceViews.filter(({ deviceId }) =>
    runDeviceIds.includes(deviceId),
  );
  return {
    columns,
    rows: run.steps.map((step) => createSweepRow(step, columns)),
  };
};

export const pickSweepTotals = (sweepMatrix: SweepMatrix): SweepTotals => {
  const { rows, columns } = sweepMatrix;
  const cells = rows.flatMap((row) => row.cells);
  const countCells = (status: CellStatus): number =>
    cells.filter((cell) => cell.status === status).length;
  return {
    routeCount: rows.length,
    deviceCount: columns.length,
    shotCount: rows.reduce((total, row) => total + row.shotCount, 0),
    findingCount: rows.reduce((total, row) => total + row.findingCount, 0),
    okCount: countCells("ok"),
    warnCount: countCells("warn"),
    failedCount: countCells("failed"),
  };
};

export const listShownRows = (
  rows: SweepRow[],
  rowFilter: SweepRowFilter,
): SweepRow[] => {
  const routeQuery = rowFilter.routeFilter.trim().toLowerCase();
  return rows.filter((row) => {
    const isRowFlagged = row.verdict !== "clean";
    const isHiddenByFindings = rowFilter.isFindingsOnly && !isRowFlagged;
    const isRouteMatching = row.route.toLowerCase().includes(routeQuery);
    return !isHiddenByFindings && isRouteMatching;
  });
};

export const pickCellCaption = (cell: SweepCell): CellCaption => {
  const [firstFinding] = cell.findings;
  const { failureMessage } = cell;
  const isFailureWorded = failureMessage !== null;
  if (isFailureWorded) return { kind: "failure", message: failureMessage };
  const hasFinding = firstFinding !== undefined;
  if (hasFinding) {
    return {
      kind: "finding",
      findingKind: firstFinding.kind,
      moreCount: cell.findings.length - 1,
    };
  }
  return { kind: "status", status: cell.status };
};

export const pickThumbScreenWidth = (deviceView: DeviceView): number => {
  const probeLayout = pickFrameLayout({
    frameShape: deviceView.frameShape,
    viewportWidth: deviceView.viewportWidth,
    viewportHeight: deviceView.viewportHeight,
    screenWidth: PROBE_SCREEN_WIDTH,
  });
  const fitScale = Math.min(
    THUMB_BOX_WIDTH / probeLayout.width,
    THUMB_BOX_HEIGHT / probeLayout.height,
  );
  return Math.round(PROBE_SCREEN_WIDTH * fitScale);
};

export const pickOpenedShot = (
  sweepMatrix: SweepMatrix,
  shotChoice: ShotChoice | null,
): OpenedShot | null => {
  const hasNoChoice = shotChoice === null;
  if (hasNoChoice) return null;
  const row = sweepMatrix.rows.find(
    ({ stepId }) => stepId === shotChoice.stepId,
  );
  const cell = row?.cells.find(
    ({ deviceId }) => deviceId === shotChoice.deviceId,
  );
  const deviceView = sweepMatrix.columns.find(
    ({ deviceId }) => deviceId === shotChoice.deviceId,
  );
  const isShotMissing =
    row === undefined || cell === undefined || deviceView === undefined;
  if (isShotMissing) return null;
  return { route: row.route, deviceView, cell };
};
