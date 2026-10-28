import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useDeviceLoad } from "@/dashboard/device-feed/use-device-load";
import { useDeviceTest } from "@/dashboard/device-feed/use-device-test";
import { useFindings } from "@/dashboard/device-feed/use-findings";
import { useScreenImage } from "@/dashboard/device-feed/use-screen-image";
import type { DeviceView } from "@/dashboard/devices/device-view-logic";
import { DeviceFrame } from "@/dashboard/frames/device-frame";
import { pickFrameLayout } from "@/dashboard/frames/frame-layout-logic";
import {
  type GridView,
  pickFrameScale,
  pickTilePadding,
} from "@/dashboard/grid/grid-view-logic";
import { pickScreenUpdate } from "@/dashboard/grid/screen-update-logic";
import { TileEstimate } from "@/dashboard/grid/tile-estimate";
import { pickTileStatus } from "@/dashboard/grid/tile-status-logic";
import { TileTest } from "@/dashboard/grid/tile-test";
import { cn } from "@/dashboard/ui/cn";
import { Icon } from "@/dashboard/ui/icon";
import { type ChipStatus, StatusChip } from "@/dashboard/ui/status-chip";

// The waiting text stays this many screen px tall whatever the frame scale.
const WAITING_FONT_PX = 11;

const TILE_BORDER_CLASS_NAMES = {
  ok: "border-line",
  warn: "border-warn",
  failed: "border-failed",
} satisfies Record<ChipStatus, string>;

interface DeviceTileProps {
  device: DeviceView;
  gridView: GridView;
  onZoom: () => void;
}

export const DeviceTile = ({
  device,
  gridView,
  onZoom,
}: DeviceTileProps): ReactElement => {
  const { t } = useTranslation();
  const { deviceId, name, browserName } = device;
  const { screenWidth, screenHeight } = device;
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
  const frameLayout = pickFrameLayout(device);
  const frameScale = pickFrameScale(frameLayout, gridView);
  const tilePadding = pickTilePadding(gridView);
  const isTrueSize = gridView.sizeMode === "true-size";
  const waitingFontSize = Math.round(WAITING_FONT_PX / frameScale);

  return (
    <article
      className={cn(
        "group relative flex min-w-0 flex-col overflow-hidden rounded-lg border bg-card transition-[translate,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lift",
        TILE_BORDER_CLASS_NAMES[status],
        isTestFailed && "border-failed bg-failed-soft",
        isTrueSize && "w-fit flex-none",
      )}
    >
      <header className="flex flex-col gap-0.5 px-2 py-1">
        <div className="flex items-center gap-x-2">
          <h3 className="m-0 min-w-0 flex-1 truncate text-xs font-semibold">
            <Link
              to="/focus/$deviceId"
              params={{ deviceId }}
              title={name}
              className="text-ink no-underline"
            >
              {name}
            </Link>
          </h3>
          <StatusChip
            status={status}
            label={t(`tile.status.${status}`)}
            isLabelHidden
          />
          <button
            type="button"
            onClick={onZoom}
            aria-label={t("tile.expand", { name })}
            className="grid size-6 flex-none cursor-pointer place-items-center rounded border-0 bg-transparent p-0 text-ink-2 opacity-0 hover:text-ink focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:hidden"
          >
            <Icon name="expand" size={14} />
          </button>
        </div>
        <p className="m-0 flex items-center gap-1.5 font-mono text-[10px] text-ink-2">
          <span aria-hidden="true" className={liveDotClassName} />
          <span>
            {screenWidth}&times;{screenHeight} &middot;{" "}
            {t(`tile.engines.${browserName}`)}
          </span>
        </p>
      </header>
      <div
        className="flex flex-1 items-start justify-center bg-soft"
        style={{ padding: tilePadding }}
      >
        <button
          type="button"
          onClick={onZoom}
          aria-label={t("tile.zoom", { name })}
          className="cursor-zoom-in border-0 bg-transparent p-0"
        >
          <DeviceFrame layout={frameLayout} scale={frameScale}>
            <p
              aria-hidden={hasScreenImage}
              className="m-0 grid size-full place-items-center px-4 text-center text-ink-2"
              style={{ fontSize: waitingFontSize }}
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
        </button>
      </div>
      <footer className="px-3 pt-2 pb-[9px] font-mono text-[10px] leading-[14px] text-ink-2">
        <TileTest deviceId={deviceId} />
        <TileEstimate deviceLoad={deviceLoad} />
      </footer>
    </article>
  );
};
