import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { PageSection } from "./page-section";
import { SectionHeading } from "./section-heading";
import { GITHUB_URL, NPM_URL } from "./site-links";
import { CommandPill } from "./ui/command-pill";
import { LinkButton } from "./ui/link-button";

const OUTLINE_SIZES = [
  { id: "phone-small", width: 56, height: 60 },
  { id: "phone-medium", width: 60, height: 90 },
  { id: "tablet", width: 112, height: 130 },
  { id: "laptop", width: 230, height: 104 },
  { id: "tablet-large", width: 112, height: 130 },
];

export const ClosingSection = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <PageSection className="py-[clamp(24px,3vw,40px)]">
      <div className="relative flex flex-col items-center gap-8 overflow-hidden rounded-[24px] bg-cobalt px-6 pt-[clamp(48px,7vw,96px)] pb-[clamp(120px,16vw,200px)] text-card">
        <SectionHeading
          alignment="centered"
          isOnCobalt
          title={t("closing.title")}
          subtitle={t("closing.subtitle")}
        />
        <div className="flex flex-wrap items-center justify-center gap-3">
          <CommandPill tone="light" />
          <LinkButton href={GITHUB_URL} icon="star" tone="outline">
            {t("header.star")}
          </LinkButton>
          <LinkButton href={NPM_URL} icon="open-url" tone="outline">
            {t("cloud.local.npm")}
          </LinkButton>
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 hidden items-end justify-center gap-5 md:flex"
        >
          {OUTLINE_SIZES.map((outline) => (
            <span
              key={outline.id}
              className="rounded-t-xl border border-b-0 border-card/30"
              style={{ width: outline.width, height: outline.height }}
            />
          ))}
        </div>
      </div>
    </PageSection>
  );
};
