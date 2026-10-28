import { type ReactElement, useState } from "react";
import type { Finding } from "@/checks/checks-logic";
import { useFindings } from "@/dashboard/device-feed/use-findings";
import { pickDeviceName } from "@/dashboard/devices/device-view-logic";
import { useDeviceViews } from "@/dashboard/devices/use-device-views";
import { FindingToast } from "@/dashboard/ui/finding-toast";

const MAX_VISIBLE_TOASTS = 3;

export const FindingToasts = (): ReactElement => {
  const findings = useFindings();
  const deviceViews = useDeviceViews().data ?? [];
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
          deviceName={pickDeviceName(deviceViews, finding.deviceId)}
          onDismiss={() =>
            setDismissedFindings([...dismissedFindings, finding])
          }
        />
      ))}
    </div>
  );
};
