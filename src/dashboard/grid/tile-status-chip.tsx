import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useLatestRunSteps } from "@/dashboard/device-feed/use-latest-run-steps";
import { listTileReasons } from "@/dashboard/grid/tile-reasons-logic";
import { StatusChip } from "@/dashboard/ui/status-chip";
import { pickDeviceStatus } from "@/runs/device-status-logic";

interface TileStatusChipProps {
  deviceId: string;
  isLabelHidden?: boolean;
}

export const TileStatusChip = ({
  deviceId,
  isLabelHidden = false,
}: TileStatusChipProps): ReactElement | null => {
  const { t } = useTranslation();
  const latestRunSteps = useLatestRunSteps();
  const status = pickDeviceStatus(deviceId, latestRunSteps);

  const isDeviceMissingFromRun = status === null;
  if (isDeviceMissingFromRun) return null;

  const tileReasons = listTileReasons(deviceId, latestRunSteps);
  const reasonLabels = tileReasons.map((tileReason) => {
    const isAnswerReason = tileReason.kind === "answer";
    if (isAnswerReason) return tileReason.message;

    return t(`tile.reasons.${tileReason.findingKind}`, {
      count: tileReason.findingCount,
    });
  });
  const hasReasons = reasonLabels.length > 0;
  const reasonLabel = reasonLabels.join(", ");
  const statusLabel = t(`tile.status.${status}`);

  const chipLabel = hasReasons ? `${statusLabel}: ${reasonLabel}` : statusLabel;
  const reasonTitle = hasReasons ? reasonLabel : undefined;
  const reasonTabIndex = hasReasons ? 0 : undefined;

  return (
    <span
      title={reasonTitle}
      tabIndex={reasonTabIndex}
      className="inline-flex rounded-full focus-visible:outline-2"
    >
      <StatusChip
        status={status}
        label={chipLabel}
        isLabelHidden={isLabelHidden}
      />
    </span>
  );
};
