import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { TileStepSegments } from "@/dashboard/grid/tile-step-segments";
import { useTileTest } from "@/dashboard/grid/use-tile-test";
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

const pickStepLineKey = (totalSteps: number | null): string => {
  const isTotalKnown = totalSteps !== null;
  return isTotalKnown ? "tile.test.stepLineOf" : "tile.test.stepLine";
};

interface TileTestProps {
  deviceId: string;
}

export const TileTest = ({ deviceId }: TileTestProps): ReactElement | null => {
  const { t } = useTranslation();
  const { deviceTest, stepProgress } = useTileTest(deviceId);
  const hasNoDeviceTest = deviceTest === null;
  if (hasNoDeviceTest) return null;

  const { title, status, errorLine } = deviceTest;
  const hasStepProgress = stepProgress !== null;
  const hasSegments = hasStepProgress && stepProgress.segments.length > 0;
  const hasErrorLine = status === "failed" && errorLine !== null;

  const totalSteps = hasStepProgress ? stepProgress.totalSteps : null;
  const stepLineKey = pickStepLineKey(totalSteps);
  const stepLine = hasStepProgress
    ? t(stepLineKey, {
        stepNumber: stepProgress.stepNumber,
        totalSteps: stepProgress.totalSteps,
        stepTitle: stepProgress.stepTitle,
      })
    : null;

  return (
    <div className="mb-1">
      <p className="m-0 flex items-baseline gap-2 font-sans text-xs">
        <span
          className={cn(
            "flex-none font-semibold",
            TEST_STATUS_CLASS_NAMES[status],
          )}
        >
          {t(TEST_STATUS_LABEL_KEYS[status])}
        </span>
        <span className="truncate text-ink" title={title}>
          {title}
        </span>
      </p>
      {hasStepProgress && <p className="m-0 mt-0.5 truncate">{stepLine}</p>}
      {hasErrorLine && (
        <p className="m-0 truncate text-failed" title={errorLine}>
          {errorLine}
        </p>
      )}
      {hasSegments && (
        <TileStepSegments testTitle={title} segments={stepProgress.segments} />
      )}
    </div>
  );
};
