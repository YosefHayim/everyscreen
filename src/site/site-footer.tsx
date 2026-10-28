import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { LogoMark } from "@/dashboard/ui/logo-mark";
import {
  GITHUB_URL,
  ISSUES_URL,
  LICENSE_URL,
  NPM_URL,
  README_URL,
} from "./site-links";

const FOOTER_LINKS = [
  { id: "github", href: GITHUB_URL },
  { id: "npm", href: NPM_URL },
  { id: "docs", href: README_URL },
  { id: "issues", href: ISSUES_URL },
  { id: "license", href: LICENSE_URL },
];

export const SiteFooter = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[1180px] flex-col items-center justify-between gap-6 px-[clamp(16px,3vw,40px)] py-10 md:flex-row">
        <div className="flex items-center gap-2.5">
          <LogoMark />
          <span className="text-sm font-semibold">Everyscreen</span>
        </div>
        <nav
          aria-label={t("footer.navigation")}
          className="flex flex-wrap justify-center gap-x-8 gap-y-1"
        >
          {FOOTER_LINKS.map((footerLink) => (
            <a
              key={footerLink.id}
              href={footerLink.href}
              className="py-2 text-sm text-ink-2 no-underline transition-colors hover:text-ink"
            >
              {t(`footer.links.${footerLink.id}`)}
            </a>
          ))}
        </nav>
        <p className="m-0 text-center font-mono text-xs text-ink-3">
          {t("footer.legal")}
        </p>
      </div>
    </footer>
  );
};
