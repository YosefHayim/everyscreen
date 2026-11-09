import type { FindingKind } from "@/checks/checks-logic";
import { listDeviceFindings } from "@/runs/device-status-logic";
import type { RunStep } from "@/runs/runs-logic";

type TileReason =
  | { kind: "answer"; message: string }
  | { kind: "finding"; findingKind: FindingKind; findingCount: number };

const listAnswerReasons = (
  deviceId: string,
  runSteps: RunStep[],
): TileReason[] =>
  runSteps
    .flatMap((runStep) => runStep.deviceAnswers)
    .filter(
      (deviceAnswer) =>
        deviceAnswer.deviceId === deviceId && deviceAnswer.status === "failed",
    )
    .map(
      (deviceAnswer): TileReason => ({
        kind: "answer",
        message: deviceAnswer.message,
      }),
    );

const listFindingReasons = (
  deviceId: string,
  runSteps: RunStep[],
): TileReason[] => {
  const deviceFindings = listDeviceFindings(deviceId, runSteps);
  const findingKinds = [
    ...new Set(deviceFindings.map((finding) => finding.kind)),
  ];
  return findingKinds.map(
    (findingKind): TileReason => ({
      kind: "finding",
      findingKind,
      findingCount: deviceFindings.filter(
        (finding) => finding.kind === findingKind,
      ).length,
    }),
  );
};

export const listTileReasons = (
  deviceId: string,
  runSteps: RunStep[],
): TileReason[] => {
  const answerReasons = listAnswerReasons(deviceId, runSteps);
  const findingReasons = listFindingReasons(deviceId, runSteps);
  return [...answerReasons, ...findingReasons];
};
