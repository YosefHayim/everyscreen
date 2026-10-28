import type { Finding } from "@/checks/checks-logic";
import type { ChipStatus } from "@/dashboard/ui/status-chip";
import type { DeviceLoad } from "@/estimates/estimates-logic";

export const pickTileStatus = (
  deviceId: string,
  findings: Finding[],
  deviceLoad: DeviceLoad | null,
): ChipStatus => {
  const deviceFindings = findings.filter(
    (finding) => finding.deviceId === deviceId,
  );
  const hasFailedFinding = deviceFindings.some(
    (finding) => finding.severity === "failed",
  );
  if (hasFailedFinding) return "failed";

  const hasWarnFinding = deviceFindings.length > 0;
  const isLoadWarn = deviceLoad?.status === "warn";
  const isTileWarn = hasWarnFinding || isLoadWarn;
  if (isTileWarn) return "warn";

  return "ok";
};
