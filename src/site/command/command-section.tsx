import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { PageSection } from "@/site/page-section";
import { SectionHeading } from "@/site/section-heading";
import { SiteIcon } from "@/site/ui/site-icon";
import { AgentTerminal } from "./agent-terminal";

const COMMAND_POINT_IDS = ["role", "device", "shot"];

export const CommandSection = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <PageSection className="py-[clamp(24px,3vw,40px)]">
      <div className="grid items-center gap-12 rounded-[24px] bg-cobalt p-[clamp(24px,5vw,56px)] text-card md:grid-cols-2">
        <div className="flex flex-col gap-8">
          <SectionHeading
            isOnCobalt
            title={t("command-section.title")}
            subtitle={t("command-section.subtitle")}
          />
          <ul className="m-0 flex list-none flex-col gap-4 p-0">
            {COMMAND_POINT_IDS.map((pointId) => (
              <li key={pointId} className="flex items-start gap-3 text-[15px]">
                <span className="mt-px grid size-6 flex-none place-items-center rounded-full bg-card/15">
                  <SiteIcon name="tick" size={14} strokeWidth={2.4} />
                </span>
                {t(`command-section.points.${pointId}`)}
              </li>
            ))}
          </ul>
        </div>
        <AgentTerminal />
      </div>
    </PageSection>
  );
};
