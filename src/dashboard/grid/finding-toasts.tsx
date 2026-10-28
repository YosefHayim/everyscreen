import { type ReactElement, useState } from "react";
import type { Finding } from "@/checks/checks-logic";
import { WAITING_DEVICES } from "@/dashboard/grid/waiting-devices";
import { useFindings } from "@/dashboard/live/use-findings";
import { FindingToast } from "@/dashboard/ui/finding-toast";

const MAX_VISIBLE_TOASTS = 3;

const readDeviceName = (deviceId: string): string => {
  const device = WAITING_DEVICES.find(
    (waitingDevice) => waitingDevice.deviceId === deviceId,
  );
  return device?.name ?? deviceId;
};

export const FindingToasts = (): ReactElement => {
  const findings = useFindings();
  const [dismissedFindings, setDismissedFindings] = useState<Finding[]>([]);
  const visibleFindings = findings
    .filter((finding) => !dismissedFindings.includes(finding))
    .slice(0, MAX_VISIBLE_TOASTS);

  return (
    <div className="fixed inset-x-4 bottom-4 z-10 flex flex-col gap-2 md:inset-x-auto md:end-5 md:w-95">
      {visibleFindings.map((finding) => (
        <FindingToast
          key={`${finding.deviceId}-${finding.kind}-${finding.selector}-${finding.message}`}
          finding={finding}
          deviceName={readDeviceName(finding.deviceId)}
          onDismiss={() =>
            setDismissedFindings([...dismissedFindings, finding])
          }
        />
      ))}
    </div>
  );
};
