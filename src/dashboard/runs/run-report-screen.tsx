import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { FailureProof } from "@/dashboard/runs/failure-proof";
import { RunFindings } from "@/dashboard/runs/run-findings";
import { RunMatrix } from "@/dashboard/runs/run-matrix";
import { listFailureProofs } from "@/dashboard/runs/run-report-logic";
import { RunSummary } from "@/dashboard/runs/run-summary";
import { useRunReport } from "@/dashboard/runs/use-run-report";
import { ScreenBoundary } from "@/dashboard/ui/screen-boundary";
import { pickScreenStatus } from "@/dashboard/ui/screen-status-logic";

export const RunReportScreen = (): ReactElement => {
  const { t } = useTranslation();
  const { runQuery, deviceViews } = useRunReport();
  const runStatus = pickScreenStatus(runQuery.status, false);
  const run = runQuery.data;
  const isRunLoaded = run !== undefined;
  const failureProofs = isRunLoaded ? listFailureProofs(run) : [];
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
