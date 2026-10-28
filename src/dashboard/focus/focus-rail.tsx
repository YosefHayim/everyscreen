import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import type { DeviceView } from "@/dashboard/devices/device-view-logic";

interface FocusRailProps {
  otherDevices: DeviceView[];
}

export const FocusRail = ({ otherDevices }: FocusRailProps): ReactElement => {
  const { t } = useTranslation();

  return (
    <nav
      aria-label={t("focus.railLabel")}
      className="hidden w-48 flex-none flex-col gap-2 overflow-y-auto border-e border-line bg-card p-3 md:flex"
    >
      <h2 className="m-0 px-1 font-mono text-[11px] tracking-[0.08em] text-ink-3 uppercase">
        {t("focus.railTitle")}
      </h2>
      {otherDevices.map((otherDevice) => (
        <Link
          key={otherDevice.deviceId}
          to="/focus/$deviceId"
          params={{ deviceId: otherDevice.deviceId }}
          className="flex min-h-11 flex-col justify-center rounded-lg border border-line px-3 py-1.5 text-ink no-underline hover:bg-soft"
        >
          <span className="text-[13px] font-semibold">{otherDevice.name}</span>
          <span className="font-mono text-[10px] text-ink-2">
            {otherDevice.viewportWidth}&times;{otherDevice.viewportHeight}
          </span>
        </Link>
      ))}
    </nav>
  );
};
