import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { SiteIcon } from "@/site/ui/site-icon";

export const PreviewToast = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <div className="loop-toast m-3 flex gap-3.5 rounded-xl border border-line bg-card p-4 shadow-lift md:absolute md:bottom-5 md:left-6 md:m-0 md:w-[328px]">
      <span className="grid size-9 flex-none place-items-center rounded-full bg-warn-soft text-warn">
        <SiteIcon name="finding" size={18} strokeWidth={2.2} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="m-0 text-[15px] font-semibold">
          {t("preview.toastTitle")}
        </p>
        <p className="m-0 text-[13px] leading-[18px] text-ink-2">
          {t("preview.toastMessage")}
        </p>
        <p className="m-0 font-mono text-[11px] text-ink-3">
          {t("preview.toastFoot")}
        </p>
      </div>
      <span className="text-ink-3">
        <SiteIcon name="close" size={16} />
      </span>
    </div>
  );
};
