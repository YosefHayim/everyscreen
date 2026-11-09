import {
  countDeviceStatuses,
  listDeviceIds,
  pickDeviceStatus,
} from "@/runs/device-status-logic";
import type { Run, RunStep, StepProof } from "@/runs/runs-logic";

export type CellStatus = "ok" | "warn" | "failed" | "none";

interface MatrixCell {
  stepId: string;
  status: CellStatus;
}

export interface MatrixRoute {
  deviceId: string;
  cells: MatrixCell[];
  okCount: number;
  warnCount: number;
  failedCount: number;
}

export interface FailureProof {
  stepId: string;
  stepNumber: number;
  title: string;
  failedDeviceIds: string[];
  proof: StepProof;
}

export interface RunTotals {
  stepCount: number;
  deviceCount: number;
  okDeviceCount: number;
  warnDeviceCount: number;
  failedDeviceCount: number;
}

const SHOT_URL_PREFIX = "/api/shots/";

export const pickCellStatus = (step: RunStep, deviceId: string): CellStatus =>
  pickDeviceStatus(deviceId, [step]) ?? "none";

export const createMatrix = (run: Run): MatrixRoute[] =>
  listDeviceIds(run.steps).map((deviceId) => {
    const cells = run.steps.map((step) => ({
      stepId: step.stepId,
      status: pickCellStatus(step, deviceId),
    }));
    const countCells = (status: CellStatus): number =>
      cells.filter((cell) => cell.status === status).length;
    return {
      deviceId,
      cells,
      okCount: countCells("ok"),
      warnCount: countCells("warn"),
      failedCount: countCells("failed"),
    };
  });

export const pickRunTotals = (run: Run): RunTotals => {
  const matrix = createMatrix(run);
  const { okCount, warnCount, failedCount } = countDeviceStatuses(run.steps);
  return {
    stepCount: run.steps.length,
    deviceCount: matrix.length,
    okDeviceCount: okCount,
    warnDeviceCount: warnCount,
    failedDeviceCount: failedCount,
  };
};

export const listFailureProofs = (run: Run): FailureProof[] =>
  run.steps.flatMap((step, stepIndex) => {
    const { proof } = step;
    const hasNoProof = proof === null;
    if (hasNoProof) return [];
    const failedDeviceIds = step.deviceAnswers
      .filter((deviceAnswer) => deviceAnswer.status === "failed")
      .map((deviceAnswer) => deviceAnswer.deviceId);
    return [
      {
        stepId: step.stepId,
        stepNumber: stepIndex + 1,
        title: step.title,
        failedDeviceIds,
        proof,
      },
    ];
  });

export const pickShotUrl = (shotPath: string | null): string | null => {
  const hasNoShot = shotPath === null;
  if (hasNoShot) return null;
  const shotName = shotPath.slice(shotPath.lastIndexOf("/") + 1);
  return `${SHOT_URL_PREFIX}${encodeURIComponent(shotName)}`;
};
