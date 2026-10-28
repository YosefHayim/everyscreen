import { cva } from "class-variance-authority";
import { useTranslation } from "react-i18next";
import { Icon } from "@/dashboard/ui/icon";

export type SetupStepStatus = "done" | "now" | "later";

const markVariants = cva(
  "grid size-6 flex-none place-items-center rounded-full text-xs",
  {
    variants: {
      status: {
        done: "bg-pass text-card",
        now: "bg-cobalt font-semibold text-card",
        later: "border-[1.5px] border-muted font-medium text-ink-2",
      },
    },
  },
);

const nameVariants = cva("text-[13.5px] whitespace-nowrap", {
  variants: {
    status: {
      done: "font-medium text-ink",
      now: "font-semibold text-cobalt",
      later: "font-medium text-ink-2",
    },
  },
});

const stateVariants = cva("font-mono text-[11px]", {
  variants: { status: { done: "text-pass", now: "text-cobalt", later: "" } },
});

interface SetupStepProps {
  stepKey: string;
  stepNumber: number;
  status: SetupStepStatus;
}

export const SetupStep = ({ stepKey, stepNumber, status }: SetupStepProps) => {
  const { t } = useTranslation();
  const isDone = status === "done";
  const isNotDone = status !== "done";
  const hasStateLabel = status !== "later";

  return (
    <li className="flex min-h-11 items-center gap-2 pr-3 pl-2.5">
      <span className={markVariants({ status })}>
        {isDone && <Icon name="tick" size={14} strokeWidth={2.6} />}
        {isNotDone && stepNumber}
      </span>
      <span className={nameVariants({ status })}>
        {t(`grid.empty.steps.${stepKey}`)}
      </span>
      {hasStateLabel && (
        <span className={stateVariants({ status })}>
          {t(`grid.empty.stepStates.${status}`)}
        </span>
      )}
    </li>
  );
};
