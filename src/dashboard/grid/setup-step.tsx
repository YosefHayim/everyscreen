import { cva } from "class-variance-authority";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import type {
  SetupStepKey,
  SetupStepStatus,
} from "@/dashboard/grid/setup-steps-logic";
import { cn } from "@/dashboard/ui/cn";
import { Icon } from "@/dashboard/ui/icon";

const markVariants = cva(
  "grid size-6 flex-none place-items-center rounded-full text-xs",
  {
    variants: {
      status: {
        done: "bg-ok text-card",
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

const STATE_LABEL_KEYS = {
  done: "grid.empty.stepStates.done",
  now: "grid.empty.stepStates.now",
} as const;

const STATE_CLASS_NAMES = {
  done: "text-ok",
  now: "text-cobalt",
} as const;

interface SetupStepProps {
  stepKey: SetupStepKey;
  stepNumber: number;
  status: SetupStepStatus;
}

export const SetupStep = ({
  stepKey,
  stepNumber,
  status,
}: SetupStepProps): ReactElement => {
  const { t } = useTranslation();
  const isDone = status === "done";
  const hasStateLabel = status !== "later";
  const markContent = isDone ? (
    <Icon name="tick" size={14} strokeWidth={2.6} />
  ) : (
    stepNumber
  );

  return (
    <li className="flex min-h-11 items-center gap-2 pe-3 ps-2.5">
      <span className={markVariants({ status })}>{markContent}</span>
      <span className={nameVariants({ status })}>
        {t(`grid.empty.steps.${stepKey}`)}
      </span>
      {hasStateLabel && (
        <span
          className={cn("font-mono text-[11px]", STATE_CLASS_NAMES[status])}
        >
          {t(STATE_LABEL_KEYS[status])}
        </span>
      )}
    </li>
  );
};
