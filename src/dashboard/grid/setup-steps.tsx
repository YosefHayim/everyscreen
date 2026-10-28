import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useHasScreenImage } from "@/dashboard/device-feed/use-has-screen-image";
import { useLiveStatus } from "@/dashboard/device-feed/use-live-status";
import { SetupStep } from "@/dashboard/grid/setup-step";
import { pickSetupStepProgress } from "@/dashboard/grid/setup-steps-logic";

export const SetupSteps = (): ReactElement => {
  const { t } = useTranslation();
  const liveStatus = useLiveStatus();
  const hasScreenImage = useHasScreenImage();
  const setupStepProgress = pickSetupStepProgress(liveStatus, hasScreenImage);
  const stepsLabel = t("grid.empty.stepsLabel", {
    count: setupStepProgress.length,
  });

  return (
    <section
      aria-label={stepsLabel}
      className="flex flex-wrap items-center justify-start gap-x-1 rounded-2xl border border-line bg-card px-2 py-1 md:justify-center md:rounded-full md:py-0 md:ps-4 md:pe-2"
    >
      <span className="w-full px-1.5 pt-2 font-mono text-[11px] tracking-[0.08em] text-ink-3 uppercase md:w-auto md:p-0 md:pe-2">
        {stepsLabel}
      </span>
      <ol className="m-0 flex flex-wrap list-none p-0">
        {setupStepProgress.map((setupStep, stepIndex) => (
          <SetupStep
            key={setupStep.stepKey}
            stepKey={setupStep.stepKey}
            stepNumber={stepIndex + 1}
            status={setupStep.status}
          />
        ))}
      </ol>
    </section>
  );
};
