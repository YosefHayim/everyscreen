import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
  TestStep,
} from "@playwright/test/reporter";
import { STORE_FOLDER } from "@/environment";
import { runOneAtATime } from "@/hub/run-one-at-a-time";
import type {
  LiveTestStatus,
  RunTotals,
  StepEvent,
  TestEvent,
  TestsClear,
} from "@/live/live-test-schema";
import {
  createHubUrl,
  createRunStep,
  createStepEvent,
  createSuiteReplyLine,
  createTestEvent,
  type FinishedTest,
  isCountedStep,
  isLastAttempt,
  isStepComplete,
  isStepFromFolder,
  pickLiveTestStatus,
  pickRunEndStatus,
  pickRunOutcome,
  pickTestKey,
} from "@/playwright/playwright-logic";
import {
  type HubTarget,
  postToHub,
  waitForHubPosts,
} from "@/playwright/post-to-hub";
import { readHubFileSafely } from "@/playwright/read-hub-file";
import { createHubTroubleReporter } from "@/playwright/report-hub-trouble";
import type { Run, RunStep } from "@/runs/runs-logic";
import { createRun, saveRunEvent } from "@/runs/runs-store";

const OWN_FOLDER = dirname(fileURLToPath(import.meta.url));
const SHOTS_SUBFOLDER = "shots";
const SCREENSHOT_ATTACHMENT_NAME = "screenshot";
const TEST_EVENTS_QUEUE_KEY = "test-events";
const HEARTBEAT_INTERVAL_MS = 5000;
// A title path starts with "", the project name and the file.
const TITLE_PATH_PROJECT_PARTS = 2;

const pickTitlePath = (testCase: TestCase): string[] =>
  testCase.titlePath().slice(TITLE_PATH_PROJECT_PARTS);

const listAncestorCategories = (testStep: TestStep): string[] => {
  const { parent } = testStep;
  const hasNoParent = parent === undefined;
  if (hasNoParent) return [];
  return [parent.category, ...listAncestorCategories(parent)];
};

interface RunEnd {
  endedAt: number;
  outcome: "ok" | "failed";
}

const pickDeviceId = (testCase: TestCase): string => {
  const project = testCase.parent.project();
  const isProjectMissing = project === undefined;
  if (isProjectMissing) {
    throw new Error(`Test ${testCase.title} belongs to no project`);
  }
  return project.name;
};

export default class EveryscreenReporter implements Reporter {
  rootFolder = process.cwd();
  runCreation: Promise<Run> | null = null;
  expectedCounts = new Map<string, number>();
  finishedTests: FinishedTest[] = [];
  savedKeys = new Set<string>();
  savedSteps: RunStep[] = [];
  pendingTasks: Promise<void>[] = [];
  pendingHubPosts: Promise<boolean>[] = [];
  isHubGivenUp = false;
  heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  hubTarget: HubTarget | null = null;
  deviceIds: string[] = [];
  totalTests = 0;
  startedAt = 0;
  okCount = 0;
  failedCount = 0;
  stepIndexes = new Map<TestStep, number>();
  stepCounts = new Map<TestResult, number>();

  runTask = (task: () => Promise<void>) => {
    const trackedTask = task().catch((error: unknown) => {
      console.error({ message: "Everyscreen could not save the run", error });
    });
    this.pendingTasks.push(trackedTask);
  };

  readRun = async (): Promise<Run> => {
    const { runCreation } = this;
    const isRunNotCreated = runCreation === null;
    if (isRunNotCreated) throw new Error("The run was never created");
    return runCreation;
  };

  postToLiveTests = (
    routePath: string,
    message: TestEvent | StepEvent | RunTotals | TestsClear,
  ) => {
    const { hubTarget, isHubGivenUp } = this;
    const isHubMissing = hubTarget === null;
    if (isHubMissing || isHubGivenUp) return;

    const hubPost = runOneAtATime(TEST_EVENTS_QUEUE_KEY, async () => {
      const isPostSkipped = this.isHubGivenUp;
      if (isPostSkipped) return false;
      const isPosted = await postToHub(hubTarget, routePath, message);
      this.isHubGivenUp = !isPosted;
      return isPosted;
    });
    this.pendingHubPosts.push(hubPost);
  };

  sendTestEvent = (
    testCase: TestCase,
    status: LiveTestStatus,
    testResult: TestResult,
  ) => {
    const deviceId = pickDeviceId(testCase);
    const titlePath = pickTitlePath(testCase);
    const errorMessage = testResult.error?.message;
    const testEvent = createTestEvent({
      deviceId,
      testId: testCase.id,
      titlePath,
      status,
      errorMessage,
    });
    this.postToLiveTests("/events", testEvent);
  };

  sendRunTotals = (phase: RunTotals["phase"], runEnd: RunEnd | null) => {
    const isRunEnded = runEnd !== null;
    this.postToLiveTests("/run", {
      phase,
      totalTests: this.totalTests,
      startedAt: this.startedAt,
      endedAt: isRunEnded ? runEnd.endedAt : null,
      okCount: this.okCount,
      failedCount: this.failedCount,
      outcome: isRunEnded ? runEnd.outcome : null,
      endReason: isRunEnded ? "reported" : null,
    });
  };

  sendStepEvent = (
    testCase: TestCase,
    testStep: TestStep,
    stepIndex: number,
    isEnded: boolean,
  ) => {
    const stepEvent = createStepEvent({
      deviceId: pickDeviceId(testCase),
      testId: testCase.id,
      stepIndex,
      stepTitle: testStep.title,
      errorMessage: testStep.error?.message,
      isEnded,
    });
    this.postToLiveTests("/steps", stepEvent);
  };

  createHubTarget = (): HubTarget | null => {
    const reportTrouble = createHubTroubleReporter();
    const hubFile = readHubFileSafely(reportTrouble);
    const isHubFileMissing = hubFile === null;
    if (isHubFileMissing) {
      reportTrouble(new Error("There is no hub file, is the hub running?"));
      return null;
    }
    return { hubUrl: createHubUrl(hubFile), reportTrouble };
  };

  copyShot = async (
    runId: string,
    testCase: TestCase,
    testResult: TestResult,
  ): Promise<string | null> => {
    const attachment = testResult.attachments.find(
      ({ name }) => name === SCREENSHOT_ATTACHMENT_NAME,
    );
    const attachmentPath = attachment?.path;
    const isShotMissing = attachmentPath === undefined;
    if (isShotMissing) return null;

    const shotPath = join(
      STORE_FOLDER,
      SHOTS_SUBFOLDER,
      `${runId}-${testCase.id}.png`,
    );
    await mkdir(join(this.rootFolder, STORE_FOLDER, SHOTS_SUBFOLDER), {
      recursive: true,
    });
    await copyFile(attachmentPath, join(this.rootFolder, shotPath));
    return shotPath;
  };

  saveStep = async (testKey: string) => {
    const keyTests = this.finishedTests.filter(
      ({ titlePath }) => pickTestKey(titlePath) === testKey,
    );
    const runStep = createRunStep(this.savedSteps.length + 1, keyTests);
    const isStepEmpty = runStep === null;
    if (isStepEmpty) return;

    this.savedSteps.push(runStep);
    const { runId } = await this.readRun();
    await saveRunEvent(this.rootFolder, runId, {
      kind: "step-end",
      step: runStep,
    });
  };

  onBegin = (config: FullConfig, suite: Suite) => {
    this.hubTarget = this.createHubTarget();
    this.deviceIds = config.projects.map(({ name }) => name);
    const allTests = suite.allTests();
    this.totalTests = allTests.length;
    this.startedAt = Date.now();
    this.sendRunTotals("start", null);
    this.heartbeatTimer = setInterval(
      () => this.sendRunTotals("update", null),
      HEARTBEAT_INTERVAL_MS,
    );
    for (const testCase of allTests) {
      const testTitlePath = pickTitlePath(testCase);
      const testKey = pickTestKey(testTitlePath);
      this.expectedCounts.set(
        testKey,
        (this.expectedCounts.get(testKey) ?? 0) + 1,
      );
    }
    this.runCreation = createRun(this.rootFolder, "playwright", "steps");
    this.runCreation.catch((error: unknown) => {
      console.error({ message: "Everyscreen could not create the run", error });
    });
  };

  onTestBegin = (testCase: TestCase, testResult: TestResult) => {
    this.sendTestEvent(testCase, "running", testResult);
  };

  onStepBegin = (
    testCase: TestCase,
    testResult: TestResult,
    testStep: TestStep,
  ) => {
    const ancestorCategories = listAncestorCategories(testStep);
    const isUserStep = isCountedStep(testStep.category, ancestorCategories);
    const isFixtureStep = isStepFromFolder(testStep.location?.file, OWN_FOLDER);
    const isStepHidden = !isUserStep || isFixtureStep;
    if (isStepHidden) return;

    const stepIndex = (this.stepCounts.get(testResult) ?? 0) + 1;
    this.stepCounts.set(testResult, stepIndex);
    this.stepIndexes.set(testStep, stepIndex);
    this.sendStepEvent(testCase, testStep, stepIndex, false);
  };

  onStepEnd = (
    testCase: TestCase,
    _testResult: TestResult,
    testStep: TestStep,
  ) => {
    const stepIndex = this.stepIndexes.get(testStep);
    const isStepUncounted = stepIndex === undefined;
    if (isStepUncounted) return;

    this.stepIndexes.delete(testStep);
    this.sendStepEvent(testCase, testStep, stepIndex, true);
  };

  onTestEnd = (testCase: TestCase, testResult: TestResult) => {
    const liveStatus = pickLiveTestStatus(testResult.status);
    this.sendTestEvent(testCase, liveStatus, testResult);
    const isAttemptLast = isLastAttempt({
      status: testResult.status,
      retry: testResult.retry,
      retries: testCase.retries,
    });
    const isRetryComing = !isAttemptLast;
    if (isRetryComing) return;

    const isTestFailed = liveStatus === "failed";
    const isTestGood = liveStatus === "ok";
    if (isTestFailed) this.failedCount += 1;
    if (isTestGood) this.okCount += 1;
    this.sendRunTotals("update", null);

    this.runTask(async () => {
      const { runId } = await this.readRun();
      const shotPath = await this.copyShot(runId, testCase, testResult);
      const { error, startTime, duration, status } = testResult;
      const titlePath = pickTitlePath(testCase);
      const errorLocation = error?.location;
      const hasErrorLocation = errorLocation !== undefined;
      const codeLocation = hasErrorLocation
        ? `${relative(this.rootFolder, errorLocation.file)}:${errorLocation.line}:${errorLocation.column}`
        : null;
      this.finishedTests.push({
        deviceId: pickDeviceId(testCase),
        titlePath,
        status,
        startedAt: startTime.getTime(),
        durationMs: duration,
        errorMessage: error?.message ?? null,
        codeSnippet: error?.snippet ?? null,
        codeLocation,
        shotPath,
      });

      const testKey = pickTestKey(titlePath);
      const keyTests = this.finishedTests.filter(
        (finishedTest) => pickTestKey(finishedTest.titlePath) === testKey,
      );
      const expectedCount = this.expectedCounts.get(testKey);
      const isExpectedCountMissing = expectedCount === undefined;
      if (isExpectedCountMissing) {
        throw new Error(`Test ${testCase.title} was not counted at the start`);
      }

      const isStepSaved = this.savedKeys.has(testKey);
      const isReadyToSave = isStepComplete(keyTests, expectedCount);
      const isSaveSkipped = !isReadyToSave || isStepSaved;
      if (isSaveSkipped) return;

      this.savedKeys.add(testKey);
      await this.saveStep(testKey);
    });
  };

  onEnd = async (fullResult: FullResult) => {
    const { heartbeatTimer } = this;
    const isHeartbeatRunning = heartbeatTimer !== null;
    if (isHeartbeatRunning) clearInterval(heartbeatTimer);
    this.heartbeatTimer = null;

    this.sendRunTotals("update", {
      endedAt: Date.now(),
      outcome: pickRunOutcome(fullResult.status),
    });
    this.postToLiveTests("/clear", { deviceIds: this.deviceIds });
    await waitForHubPosts(this.pendingHubPosts);
    await Promise.all(this.pendingTasks);
    const unsavedKeys = [...this.expectedCounts.keys()].filter(
      (testKey) => !this.savedKeys.has(testKey),
    );
    for (const testKey of unsavedKeys) {
      this.savedKeys.add(testKey);
      await this.saveStep(testKey);
    }

    const { runId } = await this.readRun();
    const runEndStatus = pickRunEndStatus(fullResult.status);
    await saveRunEvent(this.rootFolder, runId, {
      kind: "run-end",
      status: runEndStatus,
    });
    const replyLine = createSuiteReplyLine(this.savedSteps, runId);
    console.log(replyLine);
  };
}
