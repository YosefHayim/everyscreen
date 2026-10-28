import { useTranslation } from "react-i18next";
import { useScreenImage } from "@/dashboard/live/use-screen-image";
import { cn } from "@/dashboard/ui/cn";
import { DeviceFrame } from "@/dashboard/ui/device-frame";
import { type ChipStatus, StatusChip } from "@/dashboard/ui/status-chip";
import type { BrowserName, FrameShape } from "@/devices/devices-logic";
import type { DeviceLoad } from "@/estimates/estimates-logic";

// The screen image is drawn at this share of the device's real viewport.
const TILE_SCREEN_SCALE = 0.25;

const TILE_BORDER_CLASS_NAMES = {
  pass: "border-line",
  warn: "border-warn-line",
  fail: "border-fail",
} satisfies Record<ChipStatus, string>;

interface DeviceTileProps {
  deviceId: string;
  name: string;
  browserName: BrowserName;
  frameShape: FrameShape;
  viewportWidth: number;
  viewportHeight: number;
  status: ChipStatus;
  deviceLoad: DeviceLoad | null;
}

export const DeviceTile = (tile: DeviceTileProps) => {
  const { t } = useTranslation();
  const {
    deviceId,
    name,
    browserName,
    frameShape,
    viewportWidth,
    viewportHeight,
    status,
    deviceLoad,
  } = tile;
  const screenImage = useScreenImage(deviceId);
  const hasScreenImage = screenImage !== null;
  const hasNoScreenImage = screenImage === null;
  const hasDeviceLoad = deviceLoad !== null;
  const screenWidth = Math.round(viewportWidth * TILE_SCREEN_SCALE);

  return (
    <article
      className={cn(
        "flex min-w-46 flex-none flex-col overflow-hidden rounded-xl border bg-card",
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
            <span
              aria-hidden="true"
              className="live-dot size-1.5 rounded-full bg-pink"
            />
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
          {hasScreenImage && (
            <img
              src={screenImage.imageUrl}
              alt={name}
              className="size-full object-cover"
            />
          )}
          {hasNoScreenImage && (
            <p className="m-0 grid size-full place-items-center px-2 text-center text-[10px] text-ink-2">
              {t("tile.waiting")}
            </p>
          )}
        </DeviceFrame>
      </div>
      <footer className="px-3 pt-2 pb-[9px] font-mono text-[10px] leading-[14px] text-ink-2">
        {hasDeviceLoad && (
          <>
            {t("tile.estimate", {
              fps: deviceLoad.fps,
              cpuPercent: deviceLoad.cpuPercent,
            })}{" "}
            <span className="text-ink-3">{deviceLoad.label}</span>
          </>
        )}
        {!hasDeviceLoad && t("tile.noEstimate")}
      </footer>
    </article>
  );
};
