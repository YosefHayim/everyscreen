import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useDeviceLoad } from "@/dashboard/device-feed/use-device-load";
import { useScreenImage } from "@/dashboard/device-feed/use-screen-image";
import { DeviceFrame } from "@/dashboard/frames/device-frame";
import { TileEstimate } from "@/dashboard/grid/tile-estimate";
import { TileTest } from "@/dashboard/grid/tile-test";
import { Icon } from "@/dashboard/ui/icon";
import {
  type Segment,
  SegmentedControl,
} from "@/dashboard/ui/segmented-control";
import type { ZoomMode, ZoomView } from "@/dashboard/zoom/zoom-logic";

// The waiting text stays this many screen px tall whatever the frame scale.
const WAITING_FONT_PX = 14;

const ZOOM_MODE_SEGMENTS = [
  { id: "fit", labelKey: "zoom.fit" },
  { id: "true-size", labelKey: "zoom.trueSize" },
] satisfies { id: ZoomMode; labelKey: string }[];

interface ZoomBodyProps {
  zoomView: ZoomView;
  zoomMode: ZoomMode;
  onZoomModeChange: (zoomMode: ZoomMode) => void;
  onClose: () => void;
}

export const ZoomBody = ({
  zoomView,
  zoomMode,
  onZoomModeChange,
  onClose,
}: ZoomBodyProps): ReactElement => {
  const { t } = useTranslation();
  const { device, frameLayout, frameScale } = zoomView;
  const { deviceId, name, browserName } = device;
  const screenImageUrl = useScreenImage(deviceId);
  const deviceLoad = useDeviceLoad(deviceId);
  const hasScreenImage = screenImageUrl !== null;
  const waitingFontSize = Math.round(WAITING_FONT_PX / frameScale);
  const zoomModeSegments: Segment<ZoomMode>[] = ZOOM_MODE_SEGMENTS.map(
    (segment) => ({ id: segment.id, label: t(segment.labelKey) }),
  );

  return (
    <div className="flex flex-col">
      <header className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-2">
        <h2 className="m-0 text-sm font-semibold">{name}</h2>
        <span className="font-mono text-xs text-ink-2">
          {device.viewportWidth}&times;{device.viewportHeight} &middot;{" "}
          {t(`tile.engines.${browserName}`)}
        </span>
        <span className="ms-auto flex items-center gap-2">
          <SegmentedControl
            label={t("zoom.sizeMode")}
            segments={zoomModeSegments}
            selectedId={zoomMode}
            onSelect={onZoomModeChange}
          />
          <button
            type="button"
            aria-label={t("zoom.close")}
            onClick={onClose}
            className="grid size-9 cursor-pointer place-items-center rounded-md border border-line bg-card text-ink"
          >
            <Icon name="close" size={16} />
          </button>
        </span>
      </header>
      <div className="flex max-h-[calc(96dvh-9.5rem)] justify-center overflow-auto bg-soft p-4">
        <div className="m-auto">
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
      </div>
      <footer className="border-t border-line px-4 py-2 font-mono text-[11px] leading-4 text-ink-2">
        <TileTest deviceId={deviceId} />
        <TileEstimate deviceLoad={deviceLoad} />
      </footer>
    </div>
  );
};
