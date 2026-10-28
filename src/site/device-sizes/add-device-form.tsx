import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { SiteIcon } from "@/site/ui/site-icon";

const FIELD_CLASS_NAME =
  "rounded-lg border border-line bg-card px-3 py-2.5 font-mono text-[13px] text-ink";

export const AddDeviceForm = (): ReactElement => {
  const { t } = useTranslation();
  const sizeFieldIds = ["width", "height", "pixelRatio"];

  return (
    <div
      inert
      className="flex flex-col gap-4 rounded-2xl border border-line bg-card p-6"
    >
      <p className="m-0 text-lg font-medium">{t("device-sizes.form.title")}</p>
      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] text-ink-2">
          {t("device-sizes.form.name")}
        </span>
        <span className={FIELD_CLASS_NAME}>
          {t("device-sizes.form.nameExample")}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {sizeFieldIds.map((fieldId) => (
          <div key={fieldId} className="flex min-w-0 flex-col gap-1.5">
            <span className="text-[13px] text-ink-2">
              {t(`device-sizes.form.${fieldId}`)}
            </span>
            <span className={FIELD_CLASS_NAME}>
              {t(`device-sizes.form.${fieldId}Example`)}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-line-soft pt-4">
        <div className="flex flex-col">
          <span className="text-[13px] font-medium">
            {t("device-sizes.form.touch")}
          </span>
          <span className="text-xs text-ink-3">
            {t("device-sizes.form.touchHint")}
          </span>
        </div>
        <span className="flex h-6 w-10 flex-none items-center justify-end rounded-full bg-cobalt px-0.5">
          <span className="size-5 rounded-full bg-card" />
        </span>
      </div>
      <span className="inline-flex h-12 items-center justify-center gap-2 self-start rounded-full bg-ink px-6 text-sm font-medium text-card">
        <SiteIcon name="plus" size={16} />
        {t("device-sizes.form.submit")}
      </span>
    </div>
  );
};
