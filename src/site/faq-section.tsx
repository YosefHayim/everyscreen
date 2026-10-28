import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { PageSection } from "./page-section";
import { SectionHeading } from "./section-heading";
import { SiteIcon } from "./ui/site-icon";

const QUESTION_IDS = [
  "frameworks",
  "safari",
  "numbers",
  "privacy",
  "agents",
  "cloud",
];

export const FaqSection = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <PageSection
      id="faq"
      className="grid items-start gap-10 md:grid-cols-[1fr_1.6fr]"
    >
      <SectionHeading title={t("faq.title")} subtitle={t("faq.subtitle")} />
      <div className="overflow-hidden rounded-2xl border border-line bg-card">
        {QUESTION_IDS.map((questionId, index) => (
          <details
            key={questionId}
            open={index === 0}
            className="border-b border-line px-6 py-5 last:border-b-0"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-medium [&::-webkit-details-marker]:hidden">
              {t(`faq.questions.${questionId}.question`)}
              <span className="faq-plus flex-none text-cobalt">
                <SiteIcon name="plus" size={18} />
              </span>
            </summary>
            <p className="m-0 mt-3 text-[15px] leading-6 text-ink-2">
              {t(`faq.questions.${questionId}.answer`)}
            </p>
          </details>
        ))}
      </div>
    </PageSection>
  );
};
