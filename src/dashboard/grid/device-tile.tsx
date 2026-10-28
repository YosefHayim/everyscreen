import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useDeviceLoad } from "@/dashboard/device-feed/use-device-load";
import { useDeviceTest } from "@/dashboard/device-feed/use-device-test";
import { useFindings } from "@/dashboard/device-feed/use-findings";
import { useScreenImage } from "@/dashboard/device-feed/use-screen-image";
import type { DeviceView } from "@/dashboard/devices/device-view-logic";
import { pickScreenUpdate } from "@/dashboard/grid/screen-update-logic";
import { TileEstimate } from "@/dashboard/grid/tile-estimate";
import { pickTileStatus } from "@/dashboard/grid/tile-status-logic";
import { TileTest } from "@/dashboard/grid/tile-test";
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
  device: DeviceView;
}

export const DeviceTile = ({ device }: DeviceTileProps): ReactElement => {
  const { t } = useTranslation();
  const { deviceId, name, browserName, frameShape } = device;
  const { viewportWidth, viewportHeight } = device;
  const screenImageUrl = useScreenImage(deviceId);
  const deviceLoad = useDeviceLoad(deviceId);
  const deviceTest = useDeviceTest(deviceId);
  const isTestFailed = deviceTest?.status === "failed";
  const findings = useFindings();
  const status = pickTileStatus(deviceId, findings, deviceLoad);
  const hasScreenImage = screenImageUrl !== null;
  const screenUpdate = pickScreenUpdate(browserName);
  const isLiveWithScreenImage = screenUpdate === "live" && hasScreenImage;
  const liveDotClassName = cn(
    "size-1.5 rounded-full bg-pink",
    isLiveWithScreenImage && "live-dot",
  );
  const screenWidth = Math.round(viewportWidth * TILE_SCREEN_SCALE);

  return (
    <article
      className={cn(
        "relative flex min-w-46 max-w-full flex-none flex-col overflow-hidden rounded-xl border bg-card",
        TILE_BORDER_CLASS_NAMES[status],
        isTestFailed && "border-failed bg-failed-soft",
      )}
    >
      <header className="flex h-12 flex-col px-3 pt-2">
        <div className="flex h-6 items-center justify-between gap-2">
          <h3 className="m-0 text-[13px] leading-5 font-semibold">
            <Link
              to="/focus/$deviceId"
              params={{ deviceId }}
              className="text-ink no-underline after:absolute after:inset-0 after:content-['']"
            >
              {name}
            </Link>
          </h3>
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
            {t(`tile.engines.${browserName}`)} &middot;{" "}
            {t(`tile.${screenUpdate}`)}
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
        <TileTest deviceId={deviceId} />
        <TileEstimate deviceLoad={deviceLoad} />
      </footer>
    </article>
  );
};
