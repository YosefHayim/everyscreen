import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  type DeviceView,
  pickPreviewScreenWidth,
} from "@/dashboard/devices/device-view-logic";
import { useRemoveDevice } from "@/dashboard/devices/use-remove-device";
import { Button } from "@/dashboard/ui/button";
import { cn } from "@/dashboard/ui/cn";
import { DeviceFrame } from "@/dashboard/ui/device-frame";

interface DeviceCardProps {
  device: DeviceView;
}

export const DeviceCard = ({ device }: DeviceCardProps): ReactElement => {
  const { t } = useTranslation();
  const removeDeviceMutation = useRemoveDevice();
  const { deviceId, name, isCustom } = device;
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
        <DeviceFrame
          frameShape={device.frameShape}
          viewportWidth={device.viewportWidth}
          viewportHeight={device.viewportHeight}
          screenWidth={pickPreviewScreenWidth(device)}
        >
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
