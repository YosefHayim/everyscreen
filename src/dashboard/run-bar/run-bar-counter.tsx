import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import type { CounterTone, RunCounter } from "@/dashboard/run-bar/use-run-bar";
import { cn } from "@/dashboard/ui/cn";

const COUNTER_TONE_CLASS_NAMES = {
  ink: "text-ink",
  ok: "text-ok",
  failed: "text-failed",
  running: "text-pink",
} satisfies Record<CounterTone, string>;

interface RunBarCounterProps {
  runCounter: RunCounter;
}

export const RunBarCounter = ({
  runCounter,
}: RunBarCounterProps): ReactElement => {
  const { t } = useTranslation();
  const { counterKey, counterLabel, tone } = runCounter;

  return (
    <div className="flex flex-col gap-0.5">
      <dt className="font-mono text-[10px] tracking-[0.08em] text-ink-3 uppercase">
        {t(`runBar.counters.${counterKey}`)}
      </dt>
      <dd
        className={cn(
          "m-0 font-mono text-lg leading-6 font-semibold",
          COUNTER_TONE_CLASS_NAMES[tone],
        )}
      >
        {counterLabel}
      </dd>
    </div>
  );
};
