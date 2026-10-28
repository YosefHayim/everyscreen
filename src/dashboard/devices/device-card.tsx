import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import type { DeviceView } from "@/dashboard/devices/device-view-logic";
import { useRemoveDevice } from "@/dashboard/devices/use-remove-device";
import { DeviceFrame } from "@/dashboard/frames/device-frame";
import {
  pickFitScale,
  pickFrameLayout,
} from "@/dashboard/frames/frame-layout-logic";
import { Button } from "@/dashboard/ui/button";
import { cn } from "@/dashboard/ui/cn";

const PREVIEW_BOX = { width: 200, height: 128 };

interface DeviceCardProps {
  device: DeviceView;
}

export const DeviceCard = ({ device }: DeviceCardProps): ReactElement => {
  const { t } = useTranslation();
  const removeDeviceMutation = useRemoveDevice();
  const { deviceId, name, isCustom } = device;
  const frameLayout = pickFrameLayout(device);
  const previewScale = pickFitScale(frameLayout, PREVIEW_BOX);
  const touchLabel = device.hasTouch
    ? t("devices.touch")
    : t("devices.noTouch");

  return (
    <article
      className={cn(
        "flex flex-col gap-3 rounded-2xl border bg-card p-3",
        isCustom && "border-dashed border-cobalt",
        !isCustom && "border-line",
      )}
    >
      <div className="grid h-36 place-items-center rounded-xl bg-soft">
        <DeviceFrame layout={frameLayout} scale={previewScale}>
          <span />
        </DeviceFrame>
      </div>
      <div>
        <h3 className="m-0 text-base font-medium">{name}</h3>
        <p className="mt-1 mb-0 font-mono text-xs text-ink-2">
          {t("devices.viewport", {
            width: device.viewportWidth,
            height: device.viewportHeight,
            pixelRatio: device.pixelRatio,
          })}
        </p>
      </div>
      <p className="m-0 flex items-center justify-between font-mono text-xs text-ink-2">
        <span className="rounded-md border border-line px-2 py-0.5">
          {t(`tile.engines.${device.browserName}`)}
        </span>
        <span>{touchLabel}</span>
      </p>
      {isCustom && (
        <Button
          icon="trash"
          variant="outline"
          size="small"
          aria-label={t("devices.remove", { name })}
          disabled={removeDeviceMutation.isPending}
          onClick={() => removeDeviceMutation.mutate(deviceId)}
        >
          {t("devices.removeLabel")}
        </Button>
      )}
      {removeDeviceMutation.isError && (
        <p role="alert" className="m-0 text-xs text-failed">
          {t("devices.removeFailed")}
        </p>
      )}
    </article>
  );
};
