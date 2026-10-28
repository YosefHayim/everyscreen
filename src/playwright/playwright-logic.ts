import { basename, sep } from "node:path";
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
import { HUB_HOST } from "@/environment";
import type { HubFile } from "@/hub/hub-file";
import type {
  LiveTestStatus,
  StepEvent,
  TestEvent,
} from "@/live/live-test-schema";
import type { RunStep } from "@/runs/runs-logic";

export interface HubDevice {
  wsEndpoint: string;
}

export interface DeviceProjectOptions {
  everyscreenDeviceId: string | null;
}

export type DeviceProject = Project<
  PlaywrightTestOptions & DeviceProjectOptions,
  PlaywrightWorkerOptions
>;

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

export const STEP_TITLE_SEPARATOR = " › ";
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
): DeviceProject => {
  const { viewport, screen, deviceScaleFactor, isMobile, hasTouch, userAgent } =
    devicePreset.use;
  const hasHubDevice = hubDevice !== null;
  const connectOptions = hasHubDevice
    ? { wsEndpoint: hubDevice.wsEndpoint }
    : undefined;
  return {
    name: devicePreset.id,
    use: {
      everyscreenDeviceId: devicePreset.id,
      browserName: devicePreset.browserName,
      viewport,
      screen,
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
  if (isTestPassed)
    return { status: "ok", deviceId, durationMs, shotPath: null };

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
): "ok" | "failed" => {
  const isSuitePassed = suiteStatus === "passed";
  return isSuitePassed ? "ok" : "failed";
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

export const pickLiveTestStatus = (testStatus: TestStatus): "ok" | "failed" => {
  const isTestGood = testStatus === "passed" || testStatus === "skipped";
  return isTestGood ? "ok" : "failed";
};

export const pickFirstErrorLine = (
  errorMessage: string | null | undefined,
): string | null => {
  const isMessageMissing = errorMessage === null || errorMessage === undefined;
  if (isMessageMissing) return null;

  const plainMessage = stripVTControlCharacters(errorMessage);
  const firstLine = plainMessage
    .split("\n")
    .map((messageLine) => messageLine.trim())
    .find((messageLine) => messageLine !== "");
  return firstLine ?? null;
};

export interface TestAttempt {
  deviceId: string;
  testId: string;
  titlePath: string[];
  status: LiveTestStatus;
  errorMessage: string | null | undefined;
}

// The title path starts with the spec file, which the run bar shows apart from the title.
export const createTestEvent = (testAttempt: TestAttempt): TestEvent => {
  const { deviceId, testId, titlePath, status, errorMessage } = testAttempt;
  const [specPath, ...titleParts] = titlePath;
  const isTestFailed = status === "failed";
  return {
    deviceId,
    testId,
    title: titleParts.join(STEP_TITLE_SEPARATOR),
    specFile: basename(specPath ?? ""),
    status,
    errorLine: isTestFailed ? pickFirstErrorLine(errorMessage) : null,
  };
};

const USER_STEP_CATEGORIES = ["pw:api", "test.step"];
const HIDDEN_PARENT_CATEGORIES = ["hook", "fixture"];

// Only the top step a user wrote counts, so a click inside test.step is not a second step.
export const isCountedStep = (
  category: string,
  ancestorCategories: string[],
): boolean => {
  const isUserStep = USER_STEP_CATEGORIES.includes(category);
  const hasHiddenAncestor = ancestorCategories.some(
    (ancestorCategory) =>
      HIDDEN_PARENT_CATEGORIES.includes(ancestorCategory) ||
      USER_STEP_CATEGORIES.includes(ancestorCategory),
  );
  return isUserStep && !hasHiddenAncestor;
};

// The fixture streams screen images with its own page calls, which are not steps the user wrote.
export const isStepFromFolder = (
  stepFile: string | undefined,
  folderPath: string,
): boolean => {
  const hasNoStepFile = stepFile === undefined;
  if (hasNoStepFile) return false;
  return stepFile.startsWith(`${folderPath}${sep}`);
};

export interface StepReport {
  deviceId: string;
  testId: string;
  stepIndex: number;
  stepTitle: string;
  errorMessage: string | null | undefined;
  isEnded: boolean;
}

export const createStepEvent = (stepReport: StepReport): StepEvent => {
  const { deviceId, testId, stepIndex, stepTitle, errorMessage, isEnded } =
    stepReport;
  const errorLine = pickFirstErrorLine(errorMessage);
  const isStepFailed = errorLine !== null;
  const endStatus = isStepFailed ? "failed" : "ok";
  return {
    deviceId,
    testId,
    stepIndex,
    stepTitle,
    status: isEnded ? endStatus : "running",
    errorLine,
  };
};

export const pickRunOutcome = (
  suiteStatus: "passed" | "failed" | "timedout" | "interrupted",
): "ok" | "failed" => {
  const isSuitePassed = suiteStatus === "passed";
  return isSuitePassed ? "ok" : "failed";
};

export const createHubUrl = (hubFile: HubFile): string =>
  `http://${HUB_HOST}:${hubFile.port}`;

// Only a device browser without a CDP address is hidden from the hub, so only its tests send screen images.
export const pickScreenHubUrl = (
  hubFile: HubFile | null,
  deviceId: string | null,
): string | null => {
  const isDeviceUnknown = deviceId === null;
  const isHubFileMissing = hubFile === null;
  if (isDeviceUnknown || isHubFileMissing) return null;

  const hubDevice = hubFile.devices[deviceId];
  const isHubDeviceMissing = hubDevice === undefined;
  if (isHubDeviceMissing) return null;

  const isDeviceWatchedByHub = hubDevice.cdpUrl !== null;
  if (isDeviceWatchedByHub) return null;

  return createHubUrl(hubFile);
};
