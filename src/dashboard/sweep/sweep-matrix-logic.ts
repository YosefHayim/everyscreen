import type { Finding, FindingKind } from "@/checks/checks-logic";
import type { DeviceAnswer } from "@/commands/commands-logic";
import type { DeviceView } from "@/dashboard/devices/device-view-logic";
import {
  pickFitScale,
  pickFrameLayout,
} from "@/dashboard/frames/frame-layout-logic";
import {
  type CellStatus,
  listRunDeviceIds,
  pickCellStatus,
  pickShotUrl,
} from "@/dashboard/runs/run-report-logic";
import type { Run, RunStep } from "@/runs/runs-logic";

export interface SweepCell {
  deviceView: DeviceView;
  status: CellStatus;
  shotUrl: string | null;
  failureMessage: string | null;
  findings: Finding[];
}

type RouteVerdict = "findings" | "failed" | "clean";

type RouteChipStatus = "ok" | "warn" | "failed";

export interface RouteChip {
  status: RouteChipStatus;
  cellCount: number;
  isRouteClean: boolean;
}

export interface SweepRoute {
  stepId: string;
  path: string;
  shotCount: number;
  findingCount: number;
  verdict: RouteVerdict;
  cells: SweepCell[];
}

export interface SweepMatrix {
  columns: DeviceView[];
  routes: SweepRoute[];
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

export interface SweepRouteFilter {
  isFindingsOnly: boolean;
  routeFilter: string | null;
}

export interface ShotChoice {
  stepId: string;
  deviceId: string;
}

export interface OpenedShot {
  routePath: string;
  deviceView: DeviceView;
  cell: SweepCell;
}

export type CellCaption =
  | { kind: "failure"; message: string }
  | { kind: "finding"; findingKind: FindingKind; moreCount: number }
  | { kind: "status"; status: CellStatus };

const SWEEP_TITLE_PREFIX = "sweep ";
const CHIP_STATUSES = ["ok", "warn", "failed"] as const;
const THUMB_BOX_WIDTH = 150;
const THUMB_BOX_HEIGHT = 108;

const pickFailureMessage = (
  deviceAnswer: DeviceAnswer | undefined,
): string | null => {
  const isAnswerFailed = deviceAnswer?.status === "failed";
  if (isAnswerFailed) return deviceAnswer.message;
  return null;
};

const createSweepCell = (step: RunStep, deviceView: DeviceView): SweepCell => {
  const { deviceId } = deviceView;
  const deviceAnswer = step.deviceAnswers.find(
    (answer) => answer.deviceId === deviceId,
  );
  const failureMessage = pickFailureMessage(deviceAnswer);
  const shotPath = deviceAnswer?.shotPath ?? null;
  return {
    deviceView,
    status: pickCellStatus(step, deviceId),
    shotUrl: pickShotUrl(shotPath),
    failureMessage,
    findings: step.findings.filter((finding) => finding.deviceId === deviceId),
  };
};

const pickRouteVerdict = (
  findingCount: number,
  failedCount: number,
): RouteVerdict => {
  const hasFindings = findingCount > 0;
  if (hasFindings) return "findings";
  const hasFailures = failedCount > 0;
  if (hasFailures) return "failed";
  return "clean";
};

const createSweepRoute = (step: RunStep, columns: DeviceView[]): SweepRoute => {
  const cells = columns.map((deviceView) => createSweepCell(step, deviceView));
  const findingCount = cells.reduce(
    (total, cell) => total + cell.findings.length,
    0,
  );
  const failedCount = cells.filter((cell) => cell.status === "failed").length;
  return {
    stepId: step.stepId,
    path: step.title.replace(SWEEP_TITLE_PREFIX, ""),
    shotCount: cells.filter((cell) => cell.shotUrl !== null).length,
    findingCount,
    verdict: pickRouteVerdict(findingCount, failedCount),
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
    routes: run.steps.map((step) => createSweepRoute(step, columns)),
  };
};

export const pickSweepTotals = (sweepMatrix: SweepMatrix): SweepTotals => {
  const { routes, columns } = sweepMatrix;
  const cells = routes.flatMap((route) => route.cells);
  const countCells = (status: CellStatus): number =>
    cells.filter((cell) => cell.status === status).length;
  return {
    routeCount: routes.length,
    deviceCount: columns.length,
    shotCount: routes.reduce((total, route) => total + route.shotCount, 0),
    findingCount: routes.reduce(
      (total, route) => total + route.findingCount,
      0,
    ),
    okCount: countCells("ok"),
    warnCount: countCells("warn"),
    failedCount: countCells("failed"),
  };
};

export const listShownRoutes = (
  routes: SweepRoute[],
  sweepFilter: SweepRouteFilter,
): SweepRoute[] => {
  const pathQuery = (sweepFilter.routeFilter ?? "").trim().toLowerCase();
  return routes.filter((route) => {
    const isRouteFlagged = route.verdict !== "clean";
    const isHiddenByFindings = sweepFilter.isFindingsOnly && !isRouteFlagged;
    const isPathMatching = route.path.toLowerCase().includes(pathQuery);
    return !isHiddenByFindings && isPathMatching;
  });
};

export const listRouteChips = (route: SweepRoute): RouteChip[] => {
  const { cells } = route;
  const hasNoIssue = route.verdict === "clean";
  return CHIP_STATUSES.map((status) => ({
    status,
    cellCount: cells.filter((cell) => cell.status === status).length,
    isRouteClean: hasNoIssue,
  })).filter((routeChip) => routeChip.cellCount > 0);
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

export const pickThumbScale = (deviceView: DeviceView): number => {
  const frameLayout = pickFrameLayout(deviceView);
  return pickFitScale(frameLayout, {
    width: THUMB_BOX_WIDTH,
    height: THUMB_BOX_HEIGHT,
  });
};

export const pickOpenedShot = (
  sweepMatrix: SweepMatrix,
  shotChoice: ShotChoice | null,
): OpenedShot | null => {
  const hasNoChoice = shotChoice === null;
  if (hasNoChoice) return null;
  const route = sweepMatrix.routes.find(
    ({ stepId }) => stepId === shotChoice.stepId,
  );
  const cell = route?.cells.find(
    ({ deviceView }) => deviceView.deviceId === shotChoice.deviceId,
  );
  const isShotMissing = route === undefined || cell === undefined;
  if (isShotMissing) return null;
  return { routePath: route.path, deviceView: cell.deviceView, cell };
};
