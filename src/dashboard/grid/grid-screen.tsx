import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { DeviceTile } from "@/dashboard/grid/device-tile";
import { FindingToasts } from "@/dashboard/grid/finding-toasts";
import { OpenAppCard } from "@/dashboard/grid/open-app-card";
import { SetupSteps } from "@/dashboard/grid/setup-steps";
import { useGridScreen } from "@/dashboard/grid/use-grid-screen";
import { ScreenBoundary } from "@/dashboard/ui/screen-boundary";

export const GridScreen = (): ReactElement => {
  const { t } = useTranslation();
  const { deviceViews, devicesStatus } = useGridScreen();

  return (
    <div className="flex min-h-full flex-col items-center gap-4 p-4 md:px-7 md:pt-4 md:pb-5">
      <SetupSteps />
      <OpenAppCard />
      <ScreenBoundary status={devicesStatus}>
        <section
          aria-label={t("grid.tilesLabel")}
          className="mt-auto flex w-full flex-wrap items-end justify-center gap-x-6 gap-y-5"
        >
          {deviceViews.map((deviceView) => (
            <DeviceTile key={deviceView.deviceId} device={deviceView} />
          ))}
        </section>
      </ScreenBoundary>
      <FindingToasts />
    </div>
  );
};
