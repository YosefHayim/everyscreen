import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { DeviceFrame } from "@/dashboard/frames/device-frame";
import { pickFrameLayout } from "@/dashboard/frames/frame-layout-logic";
import type { CellStatus } from "@/dashboard/runs/run-report-logic";
import { SweepCellCaption } from "@/dashboard/sweep/sweep-cell-caption";
import {
  pickThumbScale,
  type SweepCell as SweepCellView,
} from "@/dashboard/sweep/sweep-matrix-logic";
import { cn } from "@/dashboard/ui/cn";
import { StatusChip } from "@/dashboard/ui/status-chip";

const CELL_CLASS_NAMES = {
  ok: "border-line bg-card text-ink-2",
  warn: "border-warn bg-warn-soft text-warn",
  failed: "border-failed bg-failed-soft text-failed",
  none: "border-line bg-soft text-muted",
} satisfies Record<CellStatus, string>;

interface SweepCellProps {
  cell: SweepCellView;
  routePath: string;
  onOpen: () => void;
}

export const SweepCell = ({
  cell,
  routePath,
  onOpen,
}: SweepCellProps): ReactElement => {
  const { t } = useTranslation();
  const { status, shotUrl, deviceView } = cell;
  const hasShot = shotUrl !== null;
  const hasStatusChip = status !== "none";
  const openLabel = t("sweep.openShot", {
    route: routePath,
    deviceName: deviceView.name,
  });
  const shotAlt = t("sweep.shotAlt", {
    route: routePath,
    deviceName: deviceView.name,
  });

  return (
    <td className="w-44 min-w-44 max-w-44 p-1.5 align-top">
      <button
        type="button"
        aria-label={openLabel}
        onClick={onOpen}
        className={cn(
          "relative flex h-40 w-full cursor-pointer flex-col items-center gap-1 rounded-xl border p-2",
          CELL_CLASS_NAMES[status],
        )}
      >
        <span className="flex min-h-0 flex-1 items-center justify-center">
          <DeviceFrame
            layout={pickFrameLayout(deviceView)}
            scale={pickThumbScale(deviceView)}
          >
            {hasShot && (
              <img
                src={shotUrl}
                alt={shotAlt}
                loading="lazy"
                className="size-full object-cover object-top"
              />
            )}
          </DeviceFrame>
        </span>
        <span className="line-clamp-2 min-h-4 text-center text-[13px] leading-4">
          <SweepCellCaption cell={cell} />
        </span>
        {hasStatusChip && (
          <span className="absolute end-1.5 top-1.5">
            <StatusChip
              status={status}
              label={t(`sweep.cellStatus.${status}`)}
              isLabelHidden
            />
          </span>
        )}
      </button>
    </td>
  );
};
