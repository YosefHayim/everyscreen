import { useTranslation } from "react-i18next";
import { SetupStep, type SetupStepStatus } from "@/dashboard/grid/setup-step";

interface SetupStepDefinition {
  stepKey: string;
  status: SetupStepStatus;
}

const SETUP_STEPS: SetupStepDefinition[] = [
  { stepKey: "startHub", status: "done" },
  { stepKey: "openApp", status: "now" },
  { stepKey: "runTests", status: "later" },
];

export const SetupSteps = () => {
  const { t } = useTranslation();
  const stepsLabel = t("grid.empty.stepsLabel", { count: SETUP_STEPS.length });

  return (
    <nav
      aria-label={stepsLabel}
      className="flex flex-wrap items-center justify-start gap-x-1 rounded-2xl border border-line bg-card px-2 py-1 md:justify-center md:rounded-full md:py-0 md:pr-2 md:pl-4"
    >
      <span className="w-full px-1.5 pt-2 font-mono text-[11px] tracking-[0.08em] text-ink-3 uppercase md:w-auto md:p-0 md:pr-2">
        {stepsLabel}
      </span>
      <ol className="m-0 flex flex-wrap list-none p-0">
        {SETUP_STEPS.map((setupStep, stepIndex) => (
          <SetupStep
            key={setupStep.stepKey}
            stepKey={setupStep.stepKey}
            stepNumber={stepIndex + 1}
            status={setupStep.status}
          />
        ))}
      </ol>
    </nav>
  );
};
