import { stripVTControlCharacters } from "node:util";
import type {
  PlaywrightTestOptions,
  PlaywrightWorkerOptions,
  Project,
} from "@playwright/test";
import type { TestStatus } from "@playwright/test/reporter";
import type { DeviceAnswer } from "@/commands/commands-logic";
import { createReplyLine } from "@/commands/commands-logic";
import type { BrowserName, DevicePreset } from "@/devices/devices-logic";
import type { RunStep } from "@/runs/runs-logic";

export interface HubDevice {
  wsEndpoint: string;
}

export interface FinishedTest {
  deviceId: string;
  titlePath: string[];
  status: TestStatus;
  startedAt: number;
  durationMs: number;
  errorMessage: string | null;
  codeSnippet: string | null;
  codeLocation: string | null;
  shotPath: string | null;
}

export interface AttemptSummary {
  status: TestStatus;
  retry: number;
  retries: number;
}

const STEP_TITLE_SEPARATOR = " › ";
const KEY_SEPARATOR = "\u0000";

export const pickScreenshotMode = (
  browserName: BrowserName,
): "on" | "only-on-failure" => {
  const isChromium = browserName === "chromium";
  return isChromium ? "only-on-failure" : "on";
};

export const createDeviceProject = (
  devicePreset: DevicePreset,
  hubDevice: HubDevice | null,
): Project<PlaywrightTestOptions, PlaywrightWorkerOptions> => {
  const { viewport, deviceScaleFactor, isMobile, hasTouch, userAgent } =
    devicePreset.use;
  const hasHubDevice = hubDevice !== null;
  const connectOptions = hasHubDevice
    ? { wsEndpoint: hubDevice.wsEndpoint }
    : undefined;
  return {
    name: devicePreset.id,
    use: {
      browserName: devicePreset.browserName,
      viewport,
      deviceScaleFactor,
      isMobile,
      hasTouch,
      userAgent,
      screenshot: pickScreenshotMode(devicePreset.browserName),
      connectOptions,
    },
  };
};

export const pickProjectDevices = (
  gridDevices: DevicePreset[],
  deviceIds: string[] | null,
): DevicePreset[] => {
  const isEveryDeviceWanted = deviceIds === null;
  if (isEveryDeviceWanted) return gridDevices;

  return deviceIds.map((deviceId) => {
    const gridDevice = gridDevices.find(({ id }) => id === deviceId);
    const isDeviceMissing = gridDevice === undefined;
    if (isDeviceMissing) {
      const knownIds = gridDevices.map(({ id }) => id).join(", ");
      throw new Error(`Unknown device ${deviceId}. Known devices: ${knownIds}`);
    }
    return gridDevice;
  });
};

export const isLastAttempt = (attemptSummary: AttemptSummary): boolean => {
  const { status, retry, retries } = attemptSummary;
  const hasNoMoreRetries = retry >= retries;
  const isAttemptGood = status === "passed" || status === "skipped";
  return isAttemptGood || hasNoMoreRetries;
};

export const pickTestKey = (titlePath: string[]): string =>
  titlePath.join(KEY_SEPARATOR);

export const isStepComplete = (
  finishedTests: FinishedTest[],
  expectedCount: number,
): boolean => finishedTests.length >= expectedCount;

const isAnswered = (finishedTest: FinishedTest): boolean =>
  finishedTest.status !== "skipped";

const isFailed = (finishedTest: FinishedTest): boolean =>
  finishedTest.status !== "passed";

const pickFirstLine = (message: string): string => {
  const [firstLine] = stripVTControlCharacters(message).split("\n");
  return firstLine;
};

const createDeviceAnswer = (finishedTest: FinishedTest): DeviceAnswer => {
  const { deviceId, durationMs, errorMessage, status, shotPath } = finishedTest;
  const isTestPassed = status === "passed";
  if (isTestPassed) return { status: "ok", deviceId, durationMs };

  const hasErrorMessage = errorMessage !== null;
  const message = hasErrorMessage
    ? pickFirstLine(errorMessage)
    : `Test ${status}`;
  return { status: "failed", deviceId, durationMs, message, shotPath };
};

const createStepProof = (failedTest: FinishedTest): RunStep["proof"] => {
  const { errorMessage, status, shotPath, codeSnippet, codeLocation } =
    failedTest;
  const hasErrorMessage = errorMessage !== null;
  const proofMessage = hasErrorMessage
    ? stripVTControlCharacters(errorMessage)
    : `Test ${status}`;
  const hasCodeSnippet = codeSnippet !== null;
  return {
    shotPath,
    errorMessage: proofMessage,
    codeSnippet: hasCodeSnippet ? stripVTControlCharacters(codeSnippet) : null,
    codeLocation,
  };
};

export const createRunStep = (
  stepNumber: number,
  finishedTests: FinishedTest[],
): RunStep | null => {
  const answeredTests = finishedTests.filter(isAnswered);
  const isNothingAnswered = answeredTests.length === 0;
  if (isNothingAnswered) return null;

  const failedTest = answeredTests.find(isFailed);
  const isAnyTestFailed = failedTest !== undefined;
  const startTimes = answeredTests.map(({ startedAt }) => startedAt);
  return {
    stepId: `step-${stepNumber}`,
    title: answeredTests[0].titlePath.join(STEP_TITLE_SEPARATOR),
    startedAt: Math.min(...startTimes),
    deviceAnswers: answeredTests.map(createDeviceAnswer),
    findings: [],
    proof: isAnyTestFailed ? createStepProof(failedTest) : null,
  };
};

export const pickRunEndStatus = (
  suiteStatus: "passed" | "failed" | "timedout" | "interrupted",
): "passed" | "failed" => {
  const isSuitePassed = suiteStatus === "passed";
  return isSuitePassed ? "passed" : "failed";
};

export const createSuiteReplyLine = (
  runSteps: RunStep[],
  runId: string,
): string => {
  const deviceAnswers = runSteps.flatMap((runStep) => runStep.deviceAnswers);
  const deviceIds = [...new Set(deviceAnswers.map(({ deviceId }) => deviceId))];
  const failedDeviceIds = new Set(
    deviceAnswers
      .filter(({ status }) => status === "failed")
      .map(({ deviceId }) => deviceId),
  );
  const failedCount = failedDeviceIds.size;
  const okCount = deviceIds.length - failedCount;
  return createReplyLine({ unit: "device", okCount, failedCount, runId });
};
