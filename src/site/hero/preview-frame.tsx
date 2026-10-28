import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { DeviceFrame } from "@/dashboard/frames/device-frame";
import {
  createDefaultFrameSpec,
  pickFrameLayout,
} from "@/dashboard/frames/frame-layout-logic";
import { SiteIcon } from "@/site/ui/site-icon";
import type { SiteIconName } from "@/site/ui/site-icon-paths";
import { CartScreen } from "./cart-screen";
import type { PreviewBadge, PreviewDevice } from "./preview-devices";

const BADGES = {
  passed: {
    icon: "tick",
    className: "text-ok",
    strokeWidth: 2.4,
    labelKey: "preview.stepPassed",
  },
  finding: {
    icon: "finding",
    className: "text-warn",
    strokeWidth: 2.2,
    labelKey: "preview.oneFinding",
  },
} satisfies Record<
  PreviewBadge,
  {
    icon: SiteIconName;
    className: string;
    strokeWidth: number;
    labelKey: string;
  }
>;

interface PreviewFrameProps {
  device: PreviewDevice;
  index: number;
}

export const PreviewFrame = ({
  device,
  index,
}: PreviewFrameProps): ReactElement => {
  const { t } = useTranslation();
  const frameSpec = createDefaultFrameSpec(device.frameShape, {
    width: device.viewportWidth,
    height: device.viewportHeight,
  });
  const layout = pickFrameLayout(frameSpec);
  const frameScale = device.screenWidth / device.viewportWidth;
  const badge = BADGES[device.badge];
  const displayClassName = device.isHiddenOnPhone ? "hidden md:flex" : "flex";

  return (
    <div
      data-index={index}
      className={`loop-frame ${displayClassName} flex-none flex-col gap-2.5`}
      style={{ width: layout.width * frameScale }}
    >
      <DeviceFrame layout={layout} scale={frameScale}>
        <span
          aria-hidden="true"
          className="loop-scan pointer-events-none absolute inset-x-0 -top-[46px] z-[2] h-[46px] border-b-2 border-cobalt bg-linear-to-b from-cobalt/0 to-cobalt/15 shadow-[0_6px_14px_-4px_rgb(43_53_224/0.45)]"
        />
        <CartScreen
          topInset={device.cartTopInset}
          hasCouponOverflow={device.hasCouponOverflow}
        />
      </DeviceFrame>
      <div className="flex flex-col gap-[3px]">
        <div className="flex items-center justify-between">
          <span className="text-[12.5px] font-medium">
            {t(`devices.${device.id}.name`)}
          </span>
          <span
            data-index={index}
            role="img"
            aria-label={t(badge.labelKey)}
            className={`loop-badge ${badge.className}`}
          >
            <SiteIcon
              name={badge.icon}
              size={14}
              strokeWidth={badge.strokeWidth}
            />
          </span>
        </div>
        <span className="font-mono text-[11px] text-ink-3">
          {t("devices.sizeAndFrameRate", {
            width: device.viewportWidth,
            height: device.viewportHeight,
            fps: device.frameRate,
          })}
        </span>
      </div>
    </div>
  );
};
