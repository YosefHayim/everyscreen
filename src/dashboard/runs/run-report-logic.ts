import { countRunFindings } from "@/dashboard/runs/runs-list-logic";
import type { Run, RunStep, StepProof } from "@/runs/runs-logic";

export type CellStatus = "ok" | "warn" | "failed" | "none";

interface MatrixCell {
  stepId: string;
  status: CellStatus;
}

export interface MatrixRow {
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
  findingCount: number;
  okDeviceCount: number;
  failedDeviceCount: number;
}

const SHOT_URL_PREFIX = "/api/shots/";

export const listRunDeviceIds = (run: Run): string[] => {
  const deviceIds = run.steps.flatMap((step) => [
    ...step.deviceAnswers.map((deviceAnswer) => deviceAnswer.deviceId),
    ...step.findings.map((finding) => finding.deviceId),
  ]);
  return [...new Set(deviceIds)];
};

export const pickCellStatus = (step: RunStep, deviceId: string): CellStatus => {
  const deviceAnswer = step.deviceAnswers.find(
    (answer) => answer.deviceId === deviceId,
  );
  const hasNoAnswer = deviceAnswer === undefined;
  if (hasNoAnswer) return "none";

  const isFailed = deviceAnswer.status === "failed";
  if (isFailed) return "failed";

  const hasFinding = step.findings.some(
    (finding) => finding.deviceId === deviceId,
  );
  return hasFinding ? "warn" : "ok";
};

export const createMatrix = (run: Run): MatrixRow[] =>
  listRunDeviceIds(run).map((deviceId) => {
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
  const failedRows = matrix.filter((matrixRow) => matrixRow.failedCount > 0);
  const findingCount = countRunFindings(run);
  return {
    stepCount: run.steps.length,
    deviceCount: matrix.length,
    findingCount,
    okDeviceCount: matrix.length - failedRows.length,
    failedDeviceCount: failedRows.length,
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
