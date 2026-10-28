import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { PageSection } from "./page-section";
import { SectionHeading } from "./section-heading";
import { SiteIcon } from "./ui/site-icon";

interface StepCard {
  id: string;
  commandLine: string;
}

const STEP_CARDS: StepCard[] = [
  { id: "start", commandLine: "npx everyscreen start" },
  { id: "open", commandLine: "everyscreen open --url http://localhost:5173" },
  { id: "run", commandLine: "pnpm playwright test" },
];

export const StepsSection = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <PageSection id="steps" className="flex flex-col gap-12">
      <SectionHeading
        alignment="centered"
        title={t("steps.title")}
        subtitle={t("steps.subtitle")}
      />
      <ol className="m-0 grid list-none gap-4 p-0 md:grid-cols-3">
        {STEP_CARDS.map((step, index) => (
          <li
            key={step.id}
            className="flex flex-col gap-3 rounded-xl border border-line bg-card p-6"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="grid size-9 place-items-center rounded-full bg-cobalt font-mono text-sm text-card">
                {index + 1}
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-soft px-3 py-1 text-xs text-ink-2">
                <SiteIcon name="clock" size={12} />
                {t(`steps.cards.${step.id}.time`)}
              </span>
            </div>
            <h3 className="m-0 mt-2 text-lg font-medium">
              {t(`steps.cards.${step.id}.title`)}
            </h3>
            <p className="m-0 text-sm leading-[21px] text-ink-2">
              {t(`steps.cards.${step.id}.detail`)}
            </p>
            <p className="m-0 mt-auto break-words rounded-lg bg-soft px-3 py-2.5 font-mono text-xs">
              {step.commandLine}
            </p>
          </li>
        ))}
      </ol>
    </PageSection>
  );
};
