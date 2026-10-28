import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import type { RunOrigin } from "@/runs/runs-logic";

interface RunOriginBadgeProps {
  origin: RunOrigin;
}

export const RunOriginBadge = ({
  origin,
}: RunOriginBadgeProps): ReactElement => {
  const { t } = useTranslation();

  return (
    <span className="inline-flex h-6 items-center rounded-full border border-line bg-card px-2.5 text-xs text-ink">
      {t(`runs.origins.${origin}`)}
    </span>
  );
};
