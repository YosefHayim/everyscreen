import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { LogoMark } from "@/dashboard/ui/logo-mark";
import { SiteIcon } from "@/site/ui/site-icon";
import { PREVIEW_DEVICES } from "./preview-devices";
import { PreviewFrame } from "./preview-frame";
import { PreviewRunsSidebar } from "./preview-runs-sidebar";
import { PreviewToast } from "./preview-toast";

export const HeroPreview = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <div
      role="img"
      aria-label={t("preview.label")}
      className="relative mx-auto flex w-full max-w-[1180px] flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-lift"
    >
      <div className="flex h-14 flex-none items-center gap-3 border-b border-line-soft px-4">
        <LogoMark />
        <span className="hidden rounded-md bg-soft px-2 py-1 font-mono text-xs text-ink-3 md:inline">
          {t("preview.address")}
        </span>
        <span className="live-dot hidden size-2 flex-none rounded-full bg-pink md:block" />
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold md:flex-none">
          {t("preview.runName")}
        </span>
        <span className="hidden flex-1 text-xs text-ink-2 md:inline">
          {t("preview.runStep")}
        </span>
        <span className="flex h-7 items-center gap-1.5 rounded-full bg-ok-soft px-2.5 text-[12.5px] font-medium text-ok">
          <SiteIcon name="tick" size={13} strokeWidth={2.4} />
          <span className="count-ok" />
          {t("preview.okLabel")}
        </span>
        <span className="flex h-7 items-center gap-1.5 rounded-full bg-warn-soft px-2.5 text-[12.5px] font-medium text-warn">
          <SiteIcon name="finding" size={13} strokeWidth={2.2} />
          <span className="count-find" />
          {t("preview.findingLabel")}
        </span>
        <span className="hidden h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-[13px] md:inline-flex">
          <SiteIcon name="add-device" size={15} />
          {t("preview.addDevice")}
        </span>
      </div>
      <div className="h-[3px] flex-none bg-line-soft">
        <div className="loop-progress h-full bg-pink" />
      </div>
      <div className="flex md:h-[660px]">
        <PreviewRunsSidebar />
        <div className="relative flex min-w-0 flex-1 flex-col bg-soft">
          <div className="flex items-start justify-start gap-5 overflow-hidden px-4 pt-8 pb-5 md:flex-1 md:px-6 md:pt-10 md:pb-0">
            {PREVIEW_DEVICES.map((device, index) => (
              <PreviewFrame key={device.id} device={device} index={index} />
            ))}
          </div>
          <PreviewToast />
        </div>
      </div>
    </div>
  );
};
