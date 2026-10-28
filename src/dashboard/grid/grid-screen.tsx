import type { CSSProperties, ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { AgentActivityPanel } from "@/dashboard/grid/agent-activity-panel";
import { DeviceTile } from "@/dashboard/grid/device-tile";
import { FindingToasts } from "@/dashboard/grid/finding-toasts";
import { pickGridColumns } from "@/dashboard/grid/grid-view-logic";
import { OpenAppCard } from "@/dashboard/grid/open-app-card";
import { RunStrip } from "@/dashboard/grid/run-strip";
import { SetupSteps } from "@/dashboard/grid/setup-steps";
import { useGridScreen } from "@/dashboard/grid/use-grid-screen";
import { ScreenBoundary } from "@/dashboard/ui/screen-boundary";
import { ZoomDialog } from "@/dashboard/zoom/zoom-dialog";

export const GridScreen = (): ReactElement => {
  const { t } = useTranslation();
  const {
    deviceGroups,
    shownDeviceViews,
    gridView,
    devicesStatus,
    isOpenAppCardShown,
    isSearchEmpty,
    zoomedDeviceId,
    changeZoomedDevice,
  } = useGridScreen();
  const gridColumns = pickGridColumns(gridView);
  const isTrueSize = gridColumns.template === null;
  const groupStyle: CSSProperties = {
    gap: gridColumns.gap,
    gridTemplateColumns: gridColumns.template ?? undefined,
  };
  const groupClassName = isTrueSize
    ? "flex flex-wrap items-start"
    : "grid items-start";

  return (
    <div className="flex min-h-full flex-col">
      <RunStrip />
      <div className="flex flex-1 flex-col gap-3 p-3 md:px-5 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <SetupSteps />
          {isOpenAppCardShown && <OpenAppCard />}
          <ScreenBoundary status={devicesStatus}>
            {isSearchEmpty && (
              <p className="m-0 text-sm text-ink-2">{t("grid.noMatch")}</p>
            )}
            <section
              aria-label={t("grid.tilesLabel")}
              className="flex flex-col gap-4"
            >
              {deviceGroups.map((deviceGroup) => (
                <section
                  key={deviceGroup.group}
                  aria-label={t(`devices.groups.${deviceGroup.group}`)}
                  className={groupClassName}
                  style={groupStyle}
                >
                  {deviceGroup.devices.map((deviceView) => (
                    <DeviceTile
                      key={deviceView.deviceId}
                      device={deviceView}
                      gridView={gridView}
                      onZoom={() => changeZoomedDevice(deviceView.deviceId)}
                    />
                  ))}
                </section>
              ))}
            </section>
          </ScreenBoundary>
        </div>
        <div className="lg:w-72 lg:flex-none">
          <AgentActivityPanel />
        </div>
      </div>
      <FindingToasts />
      <ZoomDialog
        deviceViews={shownDeviceViews}
        zoomedDeviceId={zoomedDeviceId}
        onZoomChange={changeZoomedDevice}
      />
    </div>
  );
};
