import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { DeviceFrame } from "@/dashboard/ui/device-frame";
import { SiteIcon } from "@/site/ui/site-icon";

const SIZE_IDS = ["small", "medium", "large"];
const TOAST_IDS = ["notch", "tap", "clipped"];
const FLAGGED_CLASS_NAME = "border border-dashed border-amber bg-amber/10";

export const ShopPreview = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-line bg-card p-6 md:flex-row md:items-start">
      <div
        role="img"
        aria-label={t("checks.shop.label")}
        className="flex-none self-center"
      >
        <DeviceFrame
          frameShape="dynamic-island"
          viewportWidth={393}
          viewportHeight={852}
          screenWidth={172}
        >
          <div className="flex h-full flex-col gap-2 px-2 pt-6 pb-3 text-[9px]">
            <p
              className={`m-0 self-center rounded px-2 py-0.5 text-[9px] font-semibold tracking-[0.12em] ${FLAGGED_CLASS_NAME}`}
            >
              {t("checks.shop.name")}
            </p>
            <p
              className={`m-0 flex items-center justify-between rounded bg-soft px-1.5 py-1 ${FLAGGED_CLASS_NAME}`}
            >
              {t("checks.shop.promo")}
              <SiteIcon name="close" size={8} />
            </p>
            <div className="grid h-[72px] place-items-center rounded bg-shirt-bg text-shirt-ink">
              <SiteIcon name="shirt" size={36} strokeWidth={1.4} />
            </div>
            <div className="flex items-baseline justify-between text-[11px]">
              <span className="font-semibold">{t("checks.shop.product")}</span>
              <span className="font-mono">{t("checks.shop.price")}</span>
            </div>
            <p
              className={`m-0 truncate rounded px-1 py-0.5 text-[8px] ${FLAGGED_CLASS_NAME}`}
            >
              {t("checks.shop.shipping")}
            </p>
            <div className="flex gap-1">
              {SIZE_IDS.map((sizeId) => (
                <span
                  key={sizeId}
                  className="grid size-6 place-items-center rounded border border-line text-[9px]"
                >
                  {t(`checks.shop.sizes.${sizeId}`)}
                </span>
              ))}
            </div>
            <span className="mt-auto grid h-7 place-items-center rounded-full bg-ink text-[10px] font-medium text-card">
              {t("checks.shop.add")}
            </span>
          </div>
        </DeviceFrame>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {TOAST_IDS.map((toastId) => (
            <li
              key={toastId}
              className="flex gap-3 rounded-xl border border-line bg-card p-3.5 shadow-lift"
            >
              <span className="grid size-8 flex-none place-items-center rounded-full bg-warn-soft text-warn">
                <SiteIcon name="finding" size={16} strokeWidth={2.2} />
              </span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <p className="m-0 text-sm font-semibold">
                  {t(`checks.toasts.${toastId}.title`)}
                </p>
                <p className="m-0 text-[13px] leading-[18px] text-ink-2">
                  {t(`checks.toasts.${toastId}.detail`)}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <p className="m-0 font-mono text-xs text-ink-3">
          {t("checks.shop.caption")}
        </p>
      </div>
    </div>
  );
};
