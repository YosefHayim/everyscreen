import type { Finding } from "@/checks/checks-logic";
import type { RunStep } from "@/runs/runs-logic";

type DeviceStatus = "ok" | "warn" | "failed";

interface DeviceStatusCounts {
  okCount: number;
  warnCount: number;
  failedCount: number;
}

export const listDeviceIds = (runSteps: RunStep[]): string[] => {
  const deviceIds = runSteps.flatMap((runStep) => [
    ...runStep.deviceAnswers.map((deviceAnswer) => deviceAnswer.deviceId),
    ...runStep.findings.map((finding) => finding.deviceId),
  ]);
  return [...new Set(deviceIds)];
};

export const listDeviceFindings = (
  deviceId: string,
  runSteps: RunStep[],
): Finding[] =>
  runSteps
    .flatMap((runStep) => runStep.findings)
    .filter((finding) => finding.deviceId === deviceId);

// One rule for every screen: a failed action or failed finding fails the device, any other finding warns it.
// A device that is not in these steps has no status, so it returns null.
export const pickDeviceStatus = (
  deviceId: string,
  runSteps: RunStep[],
): DeviceStatus | null => {
  const isDeviceInRun = listDeviceIds(runSteps).includes(deviceId);
  if (!isDeviceInRun) return null;

  const hasFailedAnswer = runSteps.some((runStep) =>
    runStep.deviceAnswers.some(
      (deviceAnswer) =>
        deviceAnswer.deviceId === deviceId && deviceAnswer.status === "failed",
    ),
  );
  const deviceFindings = listDeviceFindings(deviceId, runSteps);
  const hasFailedFinding = deviceFindings.some(
    (finding) => finding.severity === "failed",
  );

  const isDeviceFailed = hasFailedAnswer || hasFailedFinding;
  if (isDeviceFailed) return "failed";

  const hasFindings = deviceFindings.length > 0;
  if (hasFindings) return "warn";

  return "ok";
};

export const countDeviceStatuses = (
  runSteps: RunStep[],
): DeviceStatusCounts => {
  const deviceStatuses = listDeviceIds(runSteps).map((deviceId) =>
    pickDeviceStatus(deviceId, runSteps),
  );
  const countStatus = (wantedStatus: DeviceStatus): number =>
    deviceStatuses.filter((deviceStatus) => deviceStatus === wantedStatus)
      .length;

  return {
    okCount: countStatus("ok"),
    warnCount: countStatus("warn"),
    failedCount: countStatus("failed"),
  };
};
