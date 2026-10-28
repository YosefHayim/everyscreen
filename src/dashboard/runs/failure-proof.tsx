import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  type DeviceView,
  pickDeviceName,
} from "@/dashboard/devices/device-view-logic";
import {
  type FailureProof as FailureProofView,
  pickShotUrl,
} from "@/dashboard/runs/run-report-logic";

interface FailureProofProps {
  failureProof: FailureProofView;
  deviceViews: DeviceView[];
}

export const FailureProof = ({
  failureProof,
  deviceViews,
}: FailureProofProps): ReactElement => {
  const { t } = useTranslation();
  const { proof, stepNumber } = failureProof;
  const deviceNames = failureProof.failedDeviceIds
    .map((deviceId) => pickDeviceName(deviceViews, deviceId))
    .join(", ");
  const shotUrl = pickShotUrl(proof.shotPath);
  const hasShot = shotUrl !== null;
  const hasCode = proof.codeSnippet !== null;
  const shotAlt = t("runs.report.shotAlt", {
    deviceName: deviceNames,
    number: stepNumber,
  });

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-4 md:p-5">
      <header>
        <h3 className="m-0 text-base font-medium">
          {t("runs.report.proofStep", {
            number: stepNumber,
            title: failureProof.title,
          })}
        </h3>
        <p className="mt-1 mb-0 text-sm text-failed">
          {t("runs.report.proofDevices", { deviceNames })}
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <figure className="m-0 flex items-start justify-center rounded-xl bg-soft p-3">
          {hasShot && (
            <img
              src={shotUrl}
              alt={shotAlt}
              className="max-h-130 max-w-full rounded-lg border border-line"
            />
          )}
          {!hasShot && (
            <figcaption className="py-10 text-sm text-ink-2">
              {t("runs.report.noShot")}
            </figcaption>
          )}
        </figure>
        <div className="flex min-w-0 flex-col gap-3">
          <div className="overflow-hidden rounded-xl bg-ink text-card">
            <p className="m-0 flex justify-between gap-2 border-b border-white/10 px-4 py-2 font-mono text-xs text-muted">
              <span>{t("runs.report.codeTitle")}</span>
              <span>{proof.codeLocation}</span>
            </p>
            {hasCode && (
              <pre className="m-0 overflow-x-auto px-4 py-3 font-mono text-xs leading-5">
                {proof.codeSnippet}
              </pre>
            )}
            {!hasCode && (
              <p className="m-0 px-4 py-3 text-sm text-muted">
                {t("runs.report.noCode")}
              </p>
            )}
          </div>
          <div className="rounded-xl bg-failed-soft px-4 py-3 text-failed">
            <p className="m-0 mb-1 text-xs font-medium">
              {t("runs.report.errorTitle")}
            </p>
            <p className="m-0 font-mono text-xs leading-5 break-words whitespace-pre-wrap">
              {proof.errorMessage}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
};
