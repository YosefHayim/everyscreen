import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

export type ScreenStatus = "loading" | "empty" | "failed" | "ready";

interface ScreenBoundaryProps {
  status: ScreenStatus;
  children: ReactNode;
}

export const ScreenBoundary = ({ status, children }: ScreenBoundaryProps) => {
  const { t } = useTranslation();
  const isScreenReady = status === "ready";
  if (isScreenReady) return children;

  return (
    <p
      role="status"
      className="grid min-h-40 place-items-center text-sm text-ink-2"
    >
      {t(`boundary.${status}`)}
    </p>
  );
};
