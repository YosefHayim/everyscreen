import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import type { SweepCell } from "@/dashboard/sweep/sweep-matrix-logic";
import { pickCellCaption } from "@/dashboard/sweep/sweep-matrix-logic";

interface SweepCellCaptionProps {
  cell: SweepCell;
}

export const SweepCellCaption = ({
  cell,
}: SweepCellCaptionProps): ReactElement => {
  const { t } = useTranslation();
  const caption = pickCellCaption(cell);
  const isFailure = caption.kind === "failure";
  const isFinding = caption.kind === "finding";
  if (isFailure) return <>{caption.message}</>;
  if (isFinding) {
    const hasMoreFindings = caption.moreCount > 0;
    return (
      <>
        {t(`checks.${caption.findingKind}`)}
        {hasMoreFindings && (
          <span className="ms-1 font-mono">
            {t("sweep.moreFindings", { count: caption.moreCount })}
          </span>
        )}
      </>
    );
  }
  return <>{t(`sweep.cellStatus.${caption.status}`)}</>;
};
