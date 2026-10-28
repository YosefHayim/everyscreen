import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { DeviceFrame } from "@/dashboard/ui/device-frame";
import { SiteIcon } from "@/site/ui/site-icon";

export const FailureShot = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-3">
      <div role="img" aria-label={t("proof.shotLabel")}>
        <DeviceFrame
          frameShape="home-button"
          viewportWidth={375}
          viewportHeight={667}
          screenWidth={168}
        >
          <div className="relative flex h-full flex-col gap-2 px-2 pt-3 pb-2 text-[9px]">
            <p className="m-0 text-center text-[8px] font-semibold tracking-[0.12em]">
              {t("checks.shop.name")}
            </p>
            <div className="grid h-[88px] place-items-center rounded bg-shirt-bg text-shirt-ink">
              <SiteIcon name="shirt" size={36} strokeWidth={1.4} />
            </div>
            <div className="flex items-baseline justify-between text-[11px]">
              <span className="font-semibold">{t("checks.shop.product")}</span>
              <span className="font-mono">{t("checks.shop.price")}</span>
            </div>
            <span className="relative mt-5 grid h-8 place-items-center rounded-full border-2 border-dashed border-failed bg-ink text-[10px] font-medium text-card">
              {t("checks.shop.add")}
              <span className="absolute -top-3 right-1 rounded-full bg-failed px-1.5 py-px text-[8px] text-card">
                {t("proof.covered")}
              </span>
            </span>
            <div className="mt-auto flex flex-col gap-1 bg-card p-1.5 text-[8px] leading-3">
              <p className="m-0">{t("proof.cookies")}</p>
              <div className="flex gap-1">
                <span className="rounded bg-ink px-3 py-1 text-card">
                  {t("proof.accept")}
                </span>
                <span className="rounded border border-line px-3 py-1">
                  {t("proof.settings")}
                </span>
              </div>
            </div>
          </div>
        </DeviceFrame>
      </div>
      <p className="m-0 font-mono text-xs text-ink-3">{t("proof.caption")}</p>
    </div>
  );
};
