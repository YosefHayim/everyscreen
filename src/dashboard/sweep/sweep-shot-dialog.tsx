import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import type { OpenedShot } from "@/dashboard/sweep/sweep-matrix-logic";
import { Button } from "@/dashboard/ui/button";
import { ModalDialog } from "@/dashboard/ui/modal-dialog";
import { StatusChip } from "@/dashboard/ui/status-chip";

interface SweepShotDialogProps {
  openedShot: OpenedShot;
  onClose: () => void;
}

export const SweepShotDialog = ({
  openedShot,
  onClose,
}: SweepShotDialogProps): ReactElement => {
  const { t } = useTranslation();
  const { routePath, deviceView, cell } = openedShot;
  const { status, shotUrl, failureMessage } = cell;
  const hasShot = shotUrl !== null;
  const hasStatusChip = status !== "none";
  const hasFailureMessage = failureMessage !== null;
  const hasFindings = cell.findings.length > 0;
  const isCellClean = !hasFindings && !hasFailureMessage;
  const shotAlt = t("sweep.shotAlt", {
    route: routePath,
    deviceName: deviceView.name,
  });

  return (
    <ModalDialog
      isOpen
      label={t("sweep.dialogLabel", {
        route: routePath,
        deviceName: deviceView.name,
      })}
      onClose={onClose}
      onKeyDown={null}
      className="w-[min(92vw,64rem)] overflow-auto p-5"
    >
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="m-0 font-mono text-xl font-medium">{routePath}</h2>
        <p className="m-0 text-base text-ink-2">{deviceView.name}</p>
        {hasStatusChip && (
          <StatusChip status={status} label={t(`sweep.cellStatus.${status}`)} />
        )}
        <div className="ms-auto">
          <Button icon="close" variant="outline" size="small" onClick={onClose}>
            {t("sweep.dialogClose")}
          </Button>
        </div>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <figure className="m-0 flex items-start justify-center rounded-xl bg-soft p-3">
          {hasShot && (
            <img
              src={shotUrl}
              alt={shotAlt}
              className="max-h-[70vh] max-w-full rounded-lg border border-line"
            />
          )}
          {!hasShot && (
            <figcaption className="py-10 text-sm text-ink-2">
              {t("runs.report.noShot")}
            </figcaption>
          )}
        </figure>
        <div className="flex min-w-0 flex-col gap-3">
          {hasFailureMessage && (
            <p className="m-0 rounded-xl bg-failed-soft px-4 py-3 font-mono text-xs leading-5 text-failed">
              {failureMessage}
            </p>
          )}
          {isCellClean && (
            <p className="m-0 text-sm text-ink-2">{t("sweep.noFindings")}</p>
          )}
          {hasFindings && (
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {cell.findings.map((finding) => {
                const hasSelector = finding.selector !== null;
                return (
                  <li
                    key={`${finding.kind}-${finding.selector}-${finding.message}`}
                    className="rounded-xl bg-warn-soft px-4 py-3"
                  >
                    <h3 className="m-0 text-sm font-medium text-warn">
                      {t(`checks.${finding.kind}`)}
                    </h3>
                    <p className="mt-1 mb-0 text-sm">{finding.message}</p>
                    {hasSelector && (
                      <p className="mt-1 mb-0 font-mono text-xs text-ink-2">
                        {finding.selector}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </ModalDialog>
  );
};
