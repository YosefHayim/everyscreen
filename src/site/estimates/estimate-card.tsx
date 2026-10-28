import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";

export interface DeviceEstimate {
  deviceId: string;
  frameRate: number;
  cpuSlowdown: number;
  cpuPercent: number;
  memoryMegabytes: number;
  layoutShift: string;
}

// Memory bars are drawn against this many megabytes.
const MEMORY_BAR_MEGABYTES = 127;
const PERCENT = 100;

interface EstimateCardProps {
  estimate: DeviceEstimate;
}

export const EstimateCard = ({ estimate }: EstimateCardProps): ReactElement => {
  const { t } = useTranslation();
  const memoryPercent = Math.round(
    (estimate.memoryMegabytes / MEMORY_BAR_MEGABYTES) * PERCENT,
  );

  return (
    <li className="reveal flex flex-col gap-5 rounded-xl border border-line bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-medium">
          {t(`devices.${estimate.deviceId}.name`)}
        </span>
        <span className="rounded-full bg-soft px-2 py-0.5 font-mono text-[11px] text-ink-3">
          {t("estimates.est")}
        </span>
      </div>
      <p className="m-0 flex items-baseline gap-1.5">
        <span className="text-[56px] leading-none font-medium tracking-[-0.03em]">
          {estimate.frameRate}
        </span>
        <span className="text-sm text-ink-3">{t("estimates.fps")}</span>
      </p>
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-col gap-[5px]">
          <p className="m-0 flex justify-between text-[12.5px] text-ink-2">
            <span>
              {t("estimates.cpuSlower", { slowdown: estimate.cpuSlowdown })}
            </span>
            <span className="font-mono text-warn">{estimate.cpuPercent}%</span>
          </p>
          <span className="h-1.5 rounded-full bg-line-soft">
            <span
              className="block h-1.5 rounded-full bg-amber"
              style={{ width: `${estimate.cpuPercent}%` }}
            />
          </span>
        </div>
        <div className="flex flex-col gap-[5px]">
          <p className="m-0 flex justify-between text-[12.5px] text-ink-2">
            <span>{t("estimates.memory")}</span>
            <span className="font-mono text-ink">
              {t("estimates.megabytes", { amount: estimate.memoryMegabytes })}
            </span>
          </p>
          <span className="h-1.5 rounded-full bg-line-soft">
            <span
              className="block h-1.5 rounded-full bg-cobalt"
              style={{ width: `${memoryPercent}%` }}
            />
          </span>
        </div>
        <p className="m-0 flex justify-between text-[12.5px] text-ink-2">
          <span>{t("estimates.layoutShift")}</span>
          <span className="font-mono text-ink">{estimate.layoutShift}</span>
        </p>
      </div>
    </li>
  );
};
