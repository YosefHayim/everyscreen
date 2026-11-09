import type { FindingKind } from "@/checks/checks-logic";
import type { RunStep } from "@/runs/runs-logic";

export interface TileReason {
  findingKind: FindingKind;
  findingCount: number;
}

export const listTileReasons = (
  deviceId: string,
  runSteps: RunStep[],
): TileReason[] => {
  const deviceFindings = runSteps
    .flatMap((runStep) => runStep.findings)
    .filter((finding) => finding.deviceId === deviceId);
  const findingKinds = [
    ...new Set(deviceFindings.map((finding) => finding.kind)),
  ];
  return findingKinds.map((findingKind) => ({
    findingKind,
    findingCount: deviceFindings.filter(
      (finding) => finding.kind === findingKind,
    ).length,
  }));
};
