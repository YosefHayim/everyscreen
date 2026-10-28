import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import type { DeviceLoad } from "@/estimates/estimates-logic";

interface TileEstimateProps {
  deviceLoad: DeviceLoad | null;
}

export const TileEstimate = ({
  deviceLoad,
}: TileEstimateProps): ReactElement => {
  const { t } = useTranslation();
  const hasNoDeviceLoad = deviceLoad === null;
  if (hasNoDeviceLoad) return <>{t("tile.noEstimate")}</>;

  const fps = Math.round(deviceLoad.fps);
  const cpuPercent = Math.round(deviceLoad.cpuPercent);

  return <>{t("tile.estimate", { fps, cpuPercent })}</>;
};
