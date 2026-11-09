import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useScreenImage } from "@/dashboard/device-feed/use-screen-image";
import type { DeviceView } from "@/dashboard/devices/device-view-logic";
import { FocusEstimates } from "@/dashboard/focus/focus-estimates";
import { FocusFindings } from "@/dashboard/focus/focus-findings";
import { DeviceFrame } from "@/dashboard/frames/device-frame";
import {
  pickFitScale,
  pickFrameLayout,
} from "@/dashboard/frames/frame-layout-logic";
import { pickScreenUpdate } from "@/dashboard/grid/screen-update-logic";
import { TileStatusChip } from "@/dashboard/grid/tile-status-chip";

const FOCUS_BOX = { width: 420, height: 720 };
// The waiting text stays this many screen px tall whatever the frame scale.
const WAITING_FONT_PX = 13;

interface FocusDeviceProps {
  device: DeviceView;
}

export const FocusDevice = ({ device }: FocusDeviceProps): ReactElement => {
  const { t } = useTranslation();
  const { deviceId, name, browserName } = device;
  const screenImageUrl = useScreenImage(deviceId);
  const screenUpdate = pickScreenUpdate(browserName);
  const hasScreenImage = screenImageUrl !== null;
  const frameLayout = pickFrameLayout(device);
  const frameScale = pickFitScale(frameLayout, FOCUS_BOX);
  const waitingFontSize = Math.round(WAITING_FONT_PX / frameScale);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="m-0 text-2xl font-medium tracking-[-0.02em]">{name}</h1>
        <TileStatusChip deviceId={deviceId} />
        <p className="m-0 font-mono text-xs text-ink-2">
          {t(`tile.engines.${browserName}`)} &middot;{" "}
          {t(`tile.${screenUpdate}`)} &middot;{" "}
          {t("focus.viewport", {
            width: device.viewportWidth,
            height: device.viewportHeight,
            pixelRatio: device.pixelRatio,
          })}
        </p>
      </header>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="flex justify-center overflow-hidden rounded-2xl border border-line bg-card py-6">
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
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <FocusFindings deviceId={deviceId} />
          <FocusEstimates deviceId={deviceId} browserName={browserName} />
        </div>
      </div>
    </div>
  );
};
