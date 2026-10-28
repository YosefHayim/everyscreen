import { type ReactElement, useState } from "react";
import { useTranslation } from "react-i18next";
import { AddDeviceForm } from "@/dashboard/devices/add-device-form";
import { DeviceCard } from "@/dashboard/devices/device-card";
import { listDeviceGroups } from "@/dashboard/devices/device-view-logic";
import { useDeviceViews } from "@/dashboard/devices/use-device-views";
import { Button } from "@/dashboard/ui/button";
import { ScreenBoundary } from "@/dashboard/ui/screen-boundary";
import { pickScreenStatus } from "@/dashboard/ui/screen-status-logic";

export const DevicesScreen = (): ReactElement => {
  const { t } = useTranslation();
  const devicesQuery = useDeviceViews();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const deviceViews = devicesQuery.data ?? [];
  const deviceGroups = listDeviceGroups(deviceViews);
  const hasNoDevices = deviceViews.length === 0;
  const devicesStatus = pickScreenStatus(devicesQuery.status, hasNoDevices);
  const toggleLabel = isFormOpen
    ? t("devices.closeForm")
    : t("devices.openForm");

  return (
    <div className="mx-auto flex w-full max-w-290 flex-col gap-6 p-4 md:p-7">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="m-0 text-3xl font-medium tracking-[-0.02em]">
            {t("devices.title")}
          </h1>
          <p className="mt-1 mb-0 text-sm text-ink-2">
            {t("devices.subtitle", { count: deviceViews.length })}
          </p>
        </div>
        <Button
          icon="device-add"
          variant="outline"
          size="small"
          aria-expanded={isFormOpen}
          onClick={() => setIsFormOpen(!isFormOpen)}
        >
          {toggleLabel}
        </Button>
      </header>
      {isFormOpen && (
        <section className="rounded-2xl border border-line bg-card p-4 md:p-5">
          <AddDeviceForm />
        </section>
      )}
      <ScreenBoundary status={devicesStatus}>
        {deviceGroups.map((deviceGroup) => (
          <section
            key={deviceGroup.group}
            aria-label={t(`devices.groups.${deviceGroup.group}`)}
            className="flex flex-col gap-3"
          >
            <h2 className="m-0 text-xl font-medium">
              {t(`devices.groups.${deviceGroup.group}`)}{" "}
              <span className="font-mono text-xs text-ink-2">
                {deviceGroup.devices.length}
              </span>
            </h2>
            <div className="grid grid-cols-1 gap-4 min-[500px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {deviceGroup.devices.map((deviceView) => (
                <DeviceCard key={deviceView.deviceId} device={deviceView} />
              ))}
            </div>
          </section>
        ))}
      </ScreenBoundary>
    </div>
  );
};
