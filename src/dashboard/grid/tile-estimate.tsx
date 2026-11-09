import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import type { BrowserName } from "@/devices/devices-logic";
import type { DeviceLoad } from "@/estimates/estimates-logic";

interface TileEstimateProps {
  deviceLoad: DeviceLoad | null;
  browserName: BrowserName;
}

export const TileEstimate = ({
  deviceLoad,
  browserName,
}: TileEstimateProps): ReactElement => {
  const { t } = useTranslation();
  const hasEstimateEngine = browserName === "chromium";
  const hasNoDeviceLoad = deviceLoad === null;
  const isEstimateNeverComing = hasNoDeviceLoad && !hasEstimateEngine;
  if (isEstimateNeverComing) {
    const engineLabel = t(`tile.engines.${browserName}`);
    return <>{t("tile.noEstimateOnEngine", { engine: engineLabel })}</>;
  }
  if (hasNoDeviceLoad) return <>{t("tile.noEstimate")}</>;

  const fps = Math.round(deviceLoad.fps);
  const cpuPercent = Math.round(deviceLoad.cpuPercent);

  return <>{t("tile.estimate", { fps, cpuPercent })}</>;
};
