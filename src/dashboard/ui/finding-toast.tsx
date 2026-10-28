import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import type { Finding } from "@/checks/checks-logic";
import { cn } from "@/dashboard/ui/cn";
import { Icon } from "@/dashboard/ui/icon";
import type { IconName } from "@/dashboard/ui/icon-paths";

const SEVERITY_ICONS = {
  warn: "finding",
  failed: "close",
} satisfies Record<Finding["severity"], IconName>;

const SEVERITY_BADGE_CLASS_NAMES = {
  warn: "bg-warn-soft text-warn",
  failed: "bg-failed-soft text-failed",
} satisfies Record<Finding["severity"], string>;

const SEVERITY_ROLES = {
  warn: "status",
  failed: "alert",
} satisfies Record<Finding["severity"], string>;

interface FindingToastProps {
  finding: Finding;
  deviceName: string;
  onDismiss: () => void;
}

export const FindingToast = ({
  finding,
  deviceName,
  onDismiss,
}: FindingToastProps): ReactElement => {
  const { t } = useTranslation();
  const { severity, kind, message } = finding;

  return (
    <div
      role={SEVERITY_ROLES[severity]}
      className="flex gap-3 rounded-xl border border-line bg-card p-3.5 shadow-lift"
    >
      <span
        className={cn(
          "grid size-8 flex-none place-items-center rounded-full",
          SEVERITY_BADGE_CLASS_NAMES[severity],
        )}
      >
        <Icon name={SEVERITY_ICONS[severity]} strokeWidth={2.2} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <span className="text-sm font-semibold">
          {t(`findings.kinds.${kind}`, { deviceName })}
        </span>
        <span className="text-[13px] leading-[18px] text-ink-2">{message}</span>
        <span className="mt-0.5 font-mono text-[11px] text-ink-3">
          {t("findings.addedToReport")}
        </span>
      </span>
      <button
        type="button"
        aria-label={t("findings.dismiss")}
        onClick={onDismiss}
        className="-me-2.5 -mt-2.5 grid size-11 flex-none cursor-pointer place-items-center rounded-full text-ink-3 hover:bg-soft"
      >
        <Icon name="close" size={14} strokeWidth={2} />
      </button>
    </div>
  );
};
