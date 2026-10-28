import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useLiveStatus } from "@/dashboard/device-feed/use-live-status";
import { RunBar } from "@/dashboard/run-bar/run-bar";
import { AppUrlBar } from "@/dashboard/grid/app-url-bar";
import { DeviceSearchInput } from "@/dashboard/grid/device-search-input";
import { AddDeviceButton } from "@/dashboard/picker/add-device-button";
import { cn } from "@/dashboard/ui/cn";
import { LogoMark } from "@/dashboard/ui/logo-mark";
import { HUB_URL } from "@/environment";

const NAV_LINKS = [
  { to: "/", labelKey: "shell.nav.grid" },
  { to: "/runs", labelKey: "shell.nav.runs" },
  { to: "/devices", labelKey: "shell.nav.devices" },
] as const;

export const AppShell = (): ReactElement => {
  const { t } = useTranslation();
  const liveStatus = useLiveStatus();
  const isLive = liveStatus === "open";
  const pathname = useRouterState({
    select: (routerState) => routerState.location.pathname,
  });
  const isGridRoute = pathname === "/";
  const hubLabelKey = isLive ? "shell.hubConnected" : "shell.hubOffline";
  const liveDotClassName = cn(
    "size-2 rounded-full bg-pink",
    isLive && "live-dot",
  );

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-paper font-sans text-ink">
      <header className="flex flex-none flex-wrap items-center gap-x-3 gap-y-1 border-b border-line bg-card px-3 py-1 md:px-5">
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
        <span
          title={HUB_URL}
          className="inline-flex h-7 items-center gap-2 rounded-full bg-paper px-3 text-xs text-ink-2"
        >
          <span aria-hidden="true" className={liveDotClassName} />
          {t(hubLabelKey)}
        </span>
        {isGridRoute && <AppUrlBar />}
        {isGridRoute && <DeviceSearchInput />}
        {isGridRoute && <AddDeviceButton />}
        <nav
          aria-label={t("shell.nav.label")}
          className="ms-auto flex items-center gap-1"
        >
          {NAV_LINKS.map((navLink) => (
            <Link
              key={navLink.to}
              to={navLink.to}
              activeOptions={{ exact: navLink.to === "/" }}
              className="flex min-h-11 items-center rounded-full px-3 text-sm text-ink-2 no-underline hover:text-ink"
              activeProps={{ className: "bg-paper font-medium text-ink" }}
            >
              {t(navLink.labelKey)}
            </Link>
          ))}
        </nav>
      </header>
      <RunBar />
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-soft">
        <Outlet />
      </main>
    </div>
  );
};
