import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import type { DeviceTest } from "@/dashboard/device-feed/live-store";
import { cn } from "@/dashboard/ui/cn";
import type { LiveTestStatus } from "@/live/live-test-schema";

const TEST_STATUS_CLASS_NAMES = {
  running: "text-ink-2",
  ok: "text-ok",
  failed: "text-failed",
} satisfies Record<LiveTestStatus, string>;

const TEST_STATUS_LABEL_KEYS = {
  running: "tile.test.running",
  ok: "tile.test.ok",
  failed: "tile.test.failed",
} satisfies Record<LiveTestStatus, string>;

interface TileTestProps {
  deviceTest: DeviceTest | null;
}

export const TileTest = ({
  deviceTest,
}: TileTestProps): ReactElement | null => {
  const { t } = useTranslation();
  const hasNoDeviceTest = deviceTest === null;
  if (hasNoDeviceTest) return null;

  const { title, status } = deviceTest;

  return (
    <p className="m-0 mb-1 flex items-center justify-between gap-2">
      <span className="truncate" title={title}>
        {title}
      </span>
      <span className={cn("flex-none", TEST_STATUS_CLASS_NAMES[status])}>
        {t(TEST_STATUS_LABEL_KEYS[status])}
      </span>
    </p>
  );
};
