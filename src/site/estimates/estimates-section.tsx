import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { PageSection } from "@/site/page-section";
import { SectionHeading } from "@/site/section-heading";
import { SiteIcon } from "@/site/ui/site-icon";
import { type DeviceEstimate, EstimateCard } from "./estimate-card";

const DEVICE_ESTIMATES: DeviceEstimate[] = [
  {
    deviceId: "iphone-se",
    frameRate: 54,
    cpuSlowdown: 4,
    cpuPercent: 38,
    memoryMegabytes: 61,
    layoutShift: "0.02",
  },
  {
    deviceId: "iphone-15",
    frameRate: 60,
    cpuSlowdown: 2,
    cpuPercent: 22,
    memoryMegabytes: 64,
    layoutShift: "0.00",
  },
  {
    deviceId: "pixel-8",
    frameRate: 58,
    cpuSlowdown: 3,
    cpuPercent: 29,
    memoryMegabytes: 66,
    layoutShift: "0.01",
  },
  {
    deviceId: "ipad-mini",
    frameRate: 60,
    cpuSlowdown: 2,
    cpuPercent: 17,
    memoryMegabytes: 72,
    layoutShift: "0.00",
  },
];

export const EstimatesSection = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <PageSection className="flex flex-col gap-12">
      <SectionHeading
        alignment="split"
        title={t("estimates.title")}
        subtitle={t("estimates.subtitle")}
      />
      <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2 md:grid-cols-4">
        {DEVICE_ESTIMATES.map((estimate) => (
          <EstimateCard key={estimate.deviceId} estimate={estimate} />
        ))}
      </ul>
      <p className="m-0 flex max-w-[680px] items-start gap-2 text-sm text-ink-2">
        <span className="mt-0.5 flex-none text-ink-3">
          <SiteIcon name="info" size={16} />
        </span>
        {t("estimates.note")}
      </p>
    </PageSection>
  );
};
