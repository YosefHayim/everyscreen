import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { LogoMark } from "@/dashboard/ui/logo-mark";
import { GITHUB_URL, README_URL } from "@/site/site-links";
import { LinkButton } from "@/site/ui/link-button";
import { SiteIcon } from "@/site/ui/site-icon";
import { useMobileMenu } from "./use-mobile-menu";

const NAV_LINKS = [
  { id: "how", href: "#steps" },
  { id: "checks", href: "#checks" },
  { id: "cloud", href: "#cloud" },
  { id: "faq", href: "#faq" },
  { id: "docs", href: README_URL },
];

const NAV_LINK_CLASS_NAME =
  "px-1 py-3 text-sm font-medium text-ink-2 no-underline transition-colors hover:text-ink";

export const SiteHeader = (): ReactElement => {
  const { t } = useTranslation();
  const { isMenuOpen, toggleMenu, closeMenu } = useMobileMenu();
  const menuLabelKey = isMenuOpen ? "header.closeMenu" : "header.openMenu";
  const menuIconName = isMenuOpen ? "close" : "menu";

  return (
    <header className="border-b border-line">
      <nav
        aria-label={t("header.mainNavigation")}
        className="mx-auto flex h-[72px] max-w-[1180px] items-center justify-between gap-6 px-[clamp(16px,3vw,40px)]"
      >
        <a
          href="#top"
          aria-label={t("header.home")}
          className="flex items-center gap-2.5 text-ink no-underline"
        >
          <LogoMark />
          <span className="text-lg font-semibold tracking-[-0.02em]">
            Everyscreen
          </span>
        </a>
        <div className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((navLink) => (
            <a
              key={navLink.id}
              href={navLink.href}
              className={NAV_LINK_CLASS_NAME}
            >
              {t(`header.links.${navLink.id}`)}
            </a>
          ))}
        </div>
        <div className="hidden md:block">
          <LinkButton href={GITHUB_URL} icon="star" tone="dark" size="small">
            {t("header.star")}
          </LinkButton>
        </div>
        <button
          type="button"
          aria-label={t(menuLabelKey)}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
          onClick={toggleMenu}
          className="inline-flex size-11 cursor-pointer items-center justify-center rounded-full border border-line bg-card text-ink md:hidden"
        >
          <SiteIcon name={menuIconName} size={20} />
        </button>
      </nav>
      {isMenuOpen && (
        <div
          id="mobile-menu"
          className="mx-auto flex max-w-[1180px] flex-col gap-1 px-[clamp(16px,3vw,40px)] pb-5 md:hidden"
        >
          {NAV_LINKS.map((navLink) => (
            <a
              key={navLink.id}
              href={navLink.href}
              onClick={closeMenu}
              className={NAV_LINK_CLASS_NAME}
            >
              {t(`header.links.${navLink.id}`)}
            </a>
          ))}
          <div className="pt-3">
            <LinkButton href={GITHUB_URL} icon="star" tone="dark" size="small">
              {t("header.star")}
            </LinkButton>
          </div>
        </div>
      )}
    </header>
  );
};
