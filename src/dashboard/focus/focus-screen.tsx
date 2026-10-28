import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { FocusDevice } from "@/dashboard/focus/focus-device";
import { FocusRail } from "@/dashboard/focus/focus-rail";
import { useFocusDevice } from "@/dashboard/focus/use-focus-device";
import { Icon } from "@/dashboard/ui/icon";
import { ScreenBoundary } from "@/dashboard/ui/screen-boundary";

export const FocusScreen = (): ReactElement => {
  const { t } = useTranslation();
  const { focusDevice, otherDevices, screenStatus } = useFocusDevice();
  const hasFocusDevice = focusDevice !== null;

  return (
    <div className="flex min-h-full flex-1">
      <FocusRail otherDevices={otherDevices} />
      <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">
        <Link
          to="/"
          className="inline-flex min-h-11 w-fit items-center gap-1 text-sm text-ink-2 no-underline hover:text-ink"
        >
          <Icon name="chevron-left" size={14} />
          {t("focus.back")}
        </Link>
        <ScreenBoundary status={screenStatus}>
          {hasFocusDevice && <FocusDevice device={focusDevice} />}
        </ScreenBoundary>
      </div>
    </div>
  );
};
