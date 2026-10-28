import type { LiveTestStatus } from "@/live/live-test-schema";

export interface DeviceStep {
  stepIndex: number;
  stepTitle: string;
  status: LiveTestStatus;
  errorLine: string | null;
}

export type StepSegmentState = "done" | "current" | "failed" | "pending";

export interface StepSegment {
  stepIndex: number;
  state: StepSegmentState;
}

export interface StepProgress {
  stepNumber: number;
  stepTitle: string;
  totalSteps: number | null;
  segments: StepSegment[];
}

const FIRST_STEP_INDEX = 1;

export const addDeviceStep = (
  deviceSteps: DeviceStep[],
  newStep: DeviceStep,
): DeviceStep[] => {
  const otherSteps = deviceSteps.filter(
    ({ stepIndex }) => stepIndex !== newStep.stepIndex,
  );
  return [...otherSteps, newStep].sort(
    (firstStep, secondStep) => firstStep.stepIndex - secondStep.stepIndex,
  );
};

// A failed test stops early, so only a passed test tells how many steps the test has.
export const pickStepTotalToKeep = (
  testStatus: LiveTestStatus,
  deviceSteps: DeviceStep[],
): number | null => {
  const isTestPassed = testStatus === "ok";
  const lastStep = deviceSteps.at(-1);
  const hasNoStep = lastStep === undefined;
  if (!isTestPassed || hasNoStep) return null;
  return lastStep.stepIndex;
};

const pickSegmentState = (
  deviceStep: DeviceStep | undefined,
  isLastStep: boolean,
  testStatus: LiveTestStatus,
): StepSegmentState => {
  const isStepNotBegun = deviceStep === undefined;
  if (isStepNotBegun) return "pending";

  const isStepFailed = deviceStep.status === "failed";
  const isTestFailedAtThisStep = isLastStep && testStatus === "failed";
  if (isStepFailed || isTestFailedAtThisStep) return "failed";

  const isStepRunning = deviceStep.status === "running";
  return isStepRunning ? "current" : "done";
};

export const createStepProgress = (
  deviceSteps: DeviceStep[],
  knownTotalSteps: number | null,
  testStatus: LiveTestStatus,
): StepProgress | null => {
  const lastStep = deviceSteps.at(-1);
  const hasNoStep = lastStep === undefined;
  if (hasNoStep) return null;

  const isTotalKnown = knownTotalSteps !== null;
  const totalSteps = isTotalKnown
    ? Math.max(knownTotalSteps, lastStep.stepIndex)
    : null;
  const segmentCount = totalSteps ?? 0;
  const segments = Array.from({ length: segmentCount }, (_unused, position) => {
    const stepIndex = position + FIRST_STEP_INDEX;
    const deviceStep = deviceSteps.find((step) => step.stepIndex === stepIndex);
    const isLastStep = stepIndex === lastStep.stepIndex;
    const state = pickSegmentState(deviceStep, isLastStep, testStatus);
    return { stepIndex, state };
  });
  return {
    stepNumber: lastStep.stepIndex,
    stepTitle: lastStep.stepTitle,
    totalSteps,
    segments,
  };
};
