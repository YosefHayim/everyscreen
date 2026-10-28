import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useDeviceLoad } from "@/dashboard/device-feed/use-device-load";

interface FocusEstimatesProps {
  deviceId: string;
}

export const FocusEstimates = ({
  deviceId,
}: FocusEstimatesProps): ReactElement => {
  const { t } = useTranslation();
  const deviceLoad = useDeviceLoad(deviceId);
  const hasNoDeviceLoad = deviceLoad === null;
  if (hasNoDeviceLoad) {
    return (
      <section className="flex flex-col gap-3">
        <h2 className="m-0 text-base font-medium">
          {t("focus.estimatesTitle")}
        </h2>
        <p className="m-0 text-sm text-ink-2">{t("focus.noEstimates")}</p>
      </section>
    );
  }

  const figures = [
    { figureKey: "fps", figureLabel: `${Math.round(deviceLoad.fps)} fps` },
    { figureKey: "cpu", figureLabel: `${Math.round(deviceLoad.cpuPercent)}%` },
    {
      figureKey: "memory",
      figureLabel: `${Math.round(deviceLoad.memoryMegabytes)} MB`,
    },
    {
      figureKey: "layoutShift",
      figureLabel: deviceLoad.layoutShift.toFixed(2),
    },
  ];

  return (
    <section className="flex flex-col gap-3">
      <h2 className="m-0 text-base font-medium">{t("focus.estimatesTitle")}</h2>
      <dl className="m-0 grid grid-cols-2 gap-3">
        {figures.map((figure) => (
          <div
            key={figure.figureKey}
            className="rounded-xl border border-line bg-card p-3"
          >
            <dt className="text-xs text-ink-2">
              {t(`focus.figures.${figure.figureKey}`)}
            </dt>
            <dd className="m-0 mt-1 text-xl">
              {figure.figureLabel}{" "}
              <span className="font-mono text-[11px] text-ink-2">
                {t("focus.est")}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
};
