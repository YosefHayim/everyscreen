import { useTranslation } from "react-i18next";
import { OpenAppCard } from "@/dashboard/grid/open-app-card";
import { SetupSteps } from "@/dashboard/grid/setup-steps";
import { WAITING_DEVICES } from "@/dashboard/grid/waiting-devices";
import { WaitingFrame } from "@/dashboard/grid/waiting-frame";

export const GridScreen = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 flex-col items-center gap-4 overflow-y-auto bg-soft p-4 md:px-7 md:pt-4 md:pb-5">
      <SetupSteps />
      <OpenAppCard />
      <section
        aria-label={t("grid.framesLabel")}
        className="mt-auto flex w-full flex-wrap items-end justify-center gap-x-6 gap-y-5"
      >
        {WAITING_DEVICES.map((waitingDevice) => (
          <WaitingFrame key={waitingDevice.deviceId} device={waitingDevice} />
        ))}
      </section>
    </div>
  );
};
