import type { ReactElement, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/dashboard/ui/cn";
import { SiteIcon } from "./ui/site-icon";

export interface CloudPlan {
  id: "local" | "hosted";
  pointIds: string[];
  hasBadge: boolean;
}

interface CloudPlanCardProps {
  plan: CloudPlan;
  children: ReactNode;
}

export const CloudPlanCard = ({
  plan,
  children,
}: CloudPlanCardProps): ReactElement => {
  const { t } = useTranslation();
  const isHosted = plan.id === "hosted";
  const cardToneClassName = isHosted
    ? "border-cobalt bg-cobalt text-card"
    : "border-line bg-card";
  const noteToneClassName = isHosted
    ? "border-card/25 text-card/85"
    : "border-line text-ink-2";

  return (
    <div
      className={cn(
        "flex flex-col gap-5 rounded-2xl border p-8",
        cardToneClassName,
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="m-0 text-xl font-medium">
          {t(`cloud.${plan.id}.name`)}
        </h3>
        {plan.hasBadge && (
          <span className="rounded-full bg-card/20 px-2.5 py-1 text-xs font-medium">
            {t(`cloud.${plan.id}.badge`)}
          </span>
        )}
      </div>
      <p className="m-0 text-[44px] leading-none font-medium tracking-[-0.03em]">
        {t(`cloud.${plan.id}.price`)}
      </p>
      <p className={cn("m-0 border-b pb-5 text-[15px]", noteToneClassName)}>
        {t(`cloud.${plan.id}.note`)}
      </p>
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {plan.pointIds.map((pointId) => (
          <li key={pointId} className="flex items-start gap-2.5 text-[15px]">
            <span
              className={cn("mt-0.5 flex-none", !isHosted && "text-cobalt")}
            >
              <SiteIcon name="tick" size={16} strokeWidth={2.4} />
            </span>
            {t(`cloud.${plan.id}.points.${pointId}`)}
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-2">{children}</div>
    </div>
  );
};
