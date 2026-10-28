import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { type CloudPlan, CloudPlanCard } from "./cloud-plan-card";
import { PageSection } from "./page-section";
import { SectionHeading } from "./section-heading";
import { GITHUB_URL, NPM_URL } from "./site-links";
import { LinkButton } from "./ui/link-button";

const LOCAL_PLAN: CloudPlan = {
  id: "local",
  pointIds: ["grid", "tools", "checks", "limits"],
  hasBadge: false,
};
const HOSTED_PLAN: CloudPlan = {
  id: "hosted",
  pointIds: ["environment", "preview", "proof", "history"],
  hasBadge: true,
};

export const CloudSection = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <PageSection id="cloud" className="flex flex-col gap-12">
      <SectionHeading
        alignment="centered"
        title={t("cloud.title")}
        subtitle={t("cloud.subtitle")}
      />
      <div className="mx-auto grid w-full max-w-[1100px] gap-4 md:grid-cols-2">
        <CloudPlanCard plan={LOCAL_PLAN}>
          <LinkButton href={NPM_URL} icon="open-url" tone="dark" size="small">
            {t("cloud.local.npm")}
          </LinkButton>
        </CloudPlanCard>
        <CloudPlanCard plan={HOSTED_PLAN}>
          <LinkButton href={GITHUB_URL} icon="star" tone="white" size="small">
            {t("cloud.hosted.follow")}
          </LinkButton>
        </CloudPlanCard>
      </div>
    </PageSection>
  );
};
