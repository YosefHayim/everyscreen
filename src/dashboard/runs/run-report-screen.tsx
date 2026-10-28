import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { FailureProof } from "@/dashboard/runs/failure-proof";
import { RunFindings } from "@/dashboard/runs/run-findings";
import { RunMatrix } from "@/dashboard/runs/run-matrix";
import { RunSummary } from "@/dashboard/runs/run-summary";
import { useRunReport } from "@/dashboard/runs/use-run-report";
import { ScreenBoundary } from "@/dashboard/ui/screen-boundary";

export const RunReportScreen = (): ReactElement => {
  const { t } = useTranslation();
  const { run, runStatus, failureProofs, deviceViews } = useRunReport();
  const isRunLoaded = run !== null;
  const hasFailureProofs = failureProofs.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-290 flex-col gap-7 p-4 md:p-7">
      <ScreenBoundary status={runStatus}>
        {isRunLoaded && (
          <>
            <RunSummary run={run} />
            {hasFailureProofs && (
              <section className="flex flex-col gap-3">
                <h2 className="m-0 text-xl font-medium">
                  {t("runs.report.proofTitle")}
                </h2>
                {failureProofs.map((failureProof) => (
                  <FailureProof
                    key={failureProof.stepId}
                    failureProof={failureProof}
                    deviceViews={deviceViews}
                  />
                ))}
              </section>
            )}
            <RunMatrix run={run} deviceViews={deviceViews} />
            <RunFindings run={run} deviceViews={deviceViews} />
          </>
        )}
      </ScreenBoundary>
    </div>
  );
};
