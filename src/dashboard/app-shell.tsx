import { Link, Outlet } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useLiveStatus } from "@/dashboard/live/use-live-status";
import { cn } from "@/dashboard/ui/cn";
import { LogoMark } from "@/dashboard/ui/logo-mark";
import { HUB_URL } from "@/environment";

export const AppShell = (): ReactElement => {
  const { t } = useTranslation();
  const liveStatus = useLiveStatus();
  const isLive = liveStatus === "open";
  const liveDotClassName = cn(
    "size-2 rounded-full bg-pink",
    isLive && "live-dot",
  );

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-paper font-sans text-ink">
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
          <span aria-hidden="true" className={liveDotClassName} />
          {HUB_URL}
        </span>
      </header>
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-soft">
        <Outlet />
      </main>
    </div>
  );
};
