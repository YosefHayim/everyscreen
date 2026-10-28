import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useDeviceLoad } from "@/dashboard/device-feed/use-device-load";
import { useFindings } from "@/dashboard/device-feed/use-findings";
import { useScreenImage } from "@/dashboard/device-feed/use-screen-image";
import type { DeviceView } from "@/dashboard/devices/device-view-logic";
import { FocusEstimates } from "@/dashboard/focus/focus-estimates";
import { FocusFindings } from "@/dashboard/focus/focus-findings";
import { pickScreenUpdate } from "@/dashboard/grid/screen-update-logic";
import { pickTileStatus } from "@/dashboard/grid/tile-status-logic";
import { DeviceFrame } from "@/dashboard/ui/device-frame";
import { StatusChip } from "@/dashboard/ui/status-chip";

const FOCUS_SCREEN_WIDTH = 260;

interface FocusDeviceProps {
  device: DeviceView;
}

export const FocusDevice = ({ device }: FocusDeviceProps): ReactElement => {
  const { t } = useTranslation();
  const { deviceId, name, browserName, frameShape } = device;
  const screenImageUrl = useScreenImage(deviceId);
  const deviceLoad = useDeviceLoad(deviceId);
  const findings = useFindings();
  const status = pickTileStatus(deviceId, findings, deviceLoad);
  const screenUpdate = pickScreenUpdate(browserName);
  const hasScreenImage = screenImageUrl !== null;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="m-0 text-2xl font-medium tracking-[-0.02em]">{name}</h1>
        <StatusChip status={status} label={t(`tile.status.${status}`)} />
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
          <DeviceFrame
            frameShape={frameShape}
            viewportWidth={device.viewportWidth}
            viewportHeight={device.viewportHeight}
            screenWidth={FOCUS_SCREEN_WIDTH}
          >
            <p
              aria-hidden={hasScreenImage}
              className="m-0 grid size-full place-items-center px-3 text-center text-xs text-ink-2"
            >
              {t("focus.waiting")}
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
          <FocusEstimates deviceId={deviceId} />
        </div>
      </div>
    </div>
  );
};
