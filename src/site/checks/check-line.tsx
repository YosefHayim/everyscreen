import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { SiteIcon } from "@/site/ui/site-icon";
import type { SiteIconName } from "@/site/ui/site-icon-paths";

export interface CheckSummary {
  id: string;
  icon: SiteIconName;
}

interface CheckLineProps {
  check: CheckSummary;
}

export const CheckLine = ({ check }: CheckLineProps): ReactElement => {
  const { t } = useTranslation();

  return (
    <li className="flex items-start gap-4 border-b border-line py-4">
      <span className="grid size-10 flex-none place-items-center rounded-lg border border-line bg-card text-cobalt">
        <SiteIcon name={check.icon} size={18} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h3 className="m-0 text-base font-medium">
          {t(`checks.cards.${check.id}.title`)}
        </h3>
        <p className="m-0 text-sm leading-[21px] text-ink-2">
          {t(`checks.cards.${check.id}.detail`)}
        </p>
      </div>
      <span className="flex-none rounded-full border border-line bg-card px-2.5 py-0.5 font-mono text-xs text-ink-2">
        {t(`checks.cards.${check.id}.example`)}
      </span>
    </li>
  );
};
