import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import type { RunSweep } from "@/dashboard/sweep/use-run-sweep";
import { Button } from "@/dashboard/ui/button";

interface SweepRunButtonProps {
  runSweep: RunSweep;
}

export const SweepRunButton = ({
  runSweep,
}: SweepRunButtonProps): ReactElement => {
  const { t } = useTranslation();
  const hasNoAppUrl = runSweep.appUrl === null;
  const { isRunning, hasFailedToStart } = runSweep;
  const isButtonDisabled = hasNoAppUrl || isRunning;
  const buttonLabel = isRunning ? t("sweep.running") : t("sweep.run");
  const hasNote = hasNoAppUrl || hasFailedToStart;

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        icon="refresh"
        variant="outline"
        size="small"
        disabled={isButtonDisabled}
        aria-describedby="sweep-run-note"
        onClick={runSweep.startSweep}
        className="border-cobalt text-cobalt"
      >
        {buttonLabel}
      </Button>
      {hasNote && (
        <p id="sweep-run-note" className="m-0 text-xs text-ink-2">
          {hasNoAppUrl && t("sweep.needsAppUrl")}
          {hasFailedToStart && (
            <span role="alert" className="text-failed">
              {t("sweep.runFailed")}
            </span>
          )}
        </p>
      )}
    </div>
  );
};
