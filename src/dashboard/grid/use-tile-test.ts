import { useMemo } from "react";
import {
  createStepProgress,
  type StepProgress,
} from "@/dashboard/device-feed/step-progress-logic";
import type { DeviceTest } from "@/dashboard/device-feed/tile-test-logic";
import { useDeviceTest } from "@/dashboard/device-feed/use-device-test";
import { useStepTotal } from "@/dashboard/device-feed/use-step-total";
import { useTestSteps } from "@/dashboard/device-feed/use-test-steps";

interface TileTest {
  deviceTest: DeviceTest | null;
  stepProgress: StepProgress | null;
}

const NO_TEST_ID = "";

export const useTileTest = (deviceId: string): TileTest => {
  const deviceTest = useDeviceTest(deviceId);
  const hasDeviceTest = deviceTest !== null;
  const testId = hasDeviceTest ? deviceTest.testId : NO_TEST_ID;
  const testTitle = hasDeviceTest ? deviceTest.title : null;
  const testStatus = hasDeviceTest ? deviceTest.status : "running";
  const testSteps = useTestSteps(testId);
  const totalSteps = useStepTotal(testTitle);
  const stepProgress = useMemo(
    () => createStepProgress(testSteps, totalSteps, testStatus),
    [testSteps, totalSteps, testStatus],
  );

  return { deviceTest, stepProgress };
};
