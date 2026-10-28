import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { TileEstimate } from "@/dashboard/grid/tile-estimate";
import { pickTileStatus } from "@/dashboard/grid/tile-status-logic";
import type { WaitingDevice } from "@/dashboard/grid/waiting-devices";
import { useDeviceLoad } from "@/dashboard/live/use-device-load";
import { useFindings } from "@/dashboard/live/use-findings";
import { useScreenImage } from "@/dashboard/live/use-screen-image";
import { cn } from "@/dashboard/ui/cn";
import { DeviceFrame } from "@/dashboard/ui/device-frame";
import { type ChipStatus, StatusChip } from "@/dashboard/ui/status-chip";

// The screen image is drawn at this share of the device's real viewport.
const TILE_SCREEN_SCALE = 0.25;

const TILE_BORDER_CLASS_NAMES = {
  ok: "border-line",
  warn: "border-warn",
  failed: "border-failed",
} satisfies Record<ChipStatus, string>;

interface DeviceTileProps {
  device: WaitingDevice;
}

export const DeviceTile = ({ device }: DeviceTileProps): ReactElement => {
  const { t } = useTranslation();
  const { deviceId, name, browserName, frameShape, viewportWidth } = device;
  const { viewportHeight } = device;
  const screenImageUrl = useScreenImage(deviceId);
  const deviceLoad = useDeviceLoad(deviceId);
  const findings = useFindings();
  const status = pickTileStatus(deviceId, findings, deviceLoad);
  const hasScreenImage = screenImageUrl !== null;
  const liveDotClassName = cn(
    "size-1.5 rounded-full bg-pink",
    hasScreenImage && "live-dot",
  );
  const screenWidth = Math.round(viewportWidth * TILE_SCREEN_SCALE);

  return (
    <article
      className={cn(
        "flex min-w-46 max-w-full flex-none flex-col overflow-hidden rounded-xl border bg-card",
        TILE_BORDER_CLASS_NAMES[status],
      )}
    >
      <header className="flex h-12 flex-col px-3 pt-2">
        <div className="flex h-6 items-center justify-between gap-2">
          <h3 className="m-0 text-[13px] leading-5 font-semibold">{name}</h3>
          <StatusChip
            status={status}
            label={t(`tile.status.${status}`)}
            isLabelHidden
          />
        </div>
        <p className="m-0 flex h-4 items-center justify-between font-mono text-[10px] text-ink-2">
          <span>
            {viewportWidth}&times;{viewportHeight}
          </span>
          <span className="inline-flex items-center gap-1">
            <span aria-hidden="true" className={liveDotClassName} />
            {t(`tile.engines.${browserName}`)} &middot; {t("tile.live")}
          </span>
        </p>
      </header>
      <div className="mx-2 mt-2 flex flex-1 items-center justify-center rounded-lg bg-soft py-2">
        <DeviceFrame
          frameShape={frameShape}
          viewportWidth={viewportWidth}
          viewportHeight={viewportHeight}
          screenWidth={screenWidth}
        >
          <p
            aria-hidden={hasScreenImage}
            className="m-0 grid size-full place-items-center px-2 text-center text-[10px] text-ink-2"
          >
            {t("tile.waiting")}
          </p>
          {hasScreenImage && (
            <img
              src={screenImageUrl}
              alt={name}
              className="absolute inset-0 size-full object-cover"
            />
          )}
        </DeviceFrame>
      </div>
      <footer className="px-3 pt-2 pb-[9px] font-mono text-[10px] leading-[14px] text-ink-2">
        <TileEstimate deviceLoad={deviceLoad} />
      </footer>
    </article>
  );
};
