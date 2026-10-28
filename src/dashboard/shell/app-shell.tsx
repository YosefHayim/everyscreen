import { Link, Outlet } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { HUB_ADDRESS } from "@/dashboard/hub-address";
import { Icon } from "@/dashboard/ui/icon";
import { LogoMark } from "@/dashboard/ui/logo-mark";

const NAV_TABS = [{ to: "/", labelKey: "shell.nav.grid" }] as const;

export const AppShell = () => {
  const { t } = useTranslation();

  return (
    <div className="flex h-screen min-h-180 flex-col overflow-hidden bg-paper font-sans text-ink">
      <header className="flex h-14 flex-none items-center gap-4 border-b border-line bg-card px-3 md:px-5">
        <Link
          to="/"
          aria-label={t("shell.name")}
          className="flex min-h-11 items-center gap-2.5 text-ink no-underline"
        >
          <LogoMark />
          <span className="hidden text-base font-semibold tracking-[-0.02em] md:inline">
            {t("shell.name")}
          </span>
        </Link>
        <span className="hidden h-7 items-center gap-2 rounded-full bg-paper px-3 font-mono text-xs text-ink-2 md:inline-flex">
          <span
            aria-hidden="true"
            className="live-dot size-2 rounded-full bg-pink"
          />
          {HUB_ADDRESS}
        </span>
        <label className="hidden h-10 max-w-105 flex-1 items-center gap-2 rounded-lg border border-line bg-soft px-3 text-ink-2 md:flex">
          <Icon name="open-url" />
          <input
            type="text"
            readOnly
            aria-label={t("shell.appUrlLabel")}
            placeholder={t("shell.appUrlPlaceholder")}
            className="min-w-0 flex-1 border-0 bg-transparent font-mono text-[13px] text-ink-3 outline-offset-4"
          />
        </label>
        <span className="flex-1" />
        <nav aria-label={t("shell.navLabel")} className="flex self-stretch">
          {NAV_TABS.map((navTab) => (
            <Link
              key={navTab.to}
              to={navTab.to}
              className="inline-flex h-14 items-center px-3.5 text-sm font-medium text-ink-2 no-underline hover:text-ink"
              activeProps={{
                className:
                  "text-cobalt shadow-[inset_0_-2px_0_var(--color-cobalt)]",
                "aria-current": "page",
              }}
            >
              {t(navTab.labelKey)}
            </Link>
          ))}
        </nav>
      </header>
      <main className="flex min-h-0 flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  );
};
