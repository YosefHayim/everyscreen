import { useMemo } from "react";
import type { DeviceTest } from "@/dashboard/device-feed/live-store";
import {
  createStepProgress,
  type StepProgress,
} from "@/dashboard/device-feed/step-progress-logic";
import { useDeviceSteps } from "@/dashboard/device-feed/use-device-steps";
import { useDeviceTest } from "@/dashboard/device-feed/use-device-test";
import { useStepTotal } from "@/dashboard/device-feed/use-step-total";

interface TileTest {
  deviceTest: DeviceTest | null;
  stepProgress: StepProgress | null;
}

export const useTileTest = (deviceId: string): TileTest => {
  const deviceTest = useDeviceTest(deviceId);
  const deviceSteps = useDeviceSteps(deviceId);
  const hasDeviceTest = deviceTest !== null;
  const testTitle = hasDeviceTest ? deviceTest.title : null;
  const testStatus = hasDeviceTest ? deviceTest.status : "running";
  const totalSteps = useStepTotal(testTitle);
  const stepProgress = useMemo(
    () => createStepProgress(deviceSteps, totalSteps, testStatus),
    [deviceSteps, totalSteps, testStatus],
  );

  return { deviceTest, stepProgress };
};
