import { copyFile, mkdir } from "node:fs/promises";
import { join, relative } from "node:path";
import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from "@playwright/test/reporter";
import { STORE_FOLDER } from "@/environment";
import { runOneAtATime } from "@/hub/run-one-at-a-time";
import type { LiveTestStatus } from "@/live/live-test-schema";
import { postToHub } from "@/playwright/hub-post";
import {
  createRunStep,
  createSuiteReplyLine,
  createTestEvent,
  type FinishedTest,
  isLastAttempt,
  isStepComplete,
  pickLiveTestStatus,
  pickRunEndStatus,
  pickTestKey,
} from "@/playwright/playwright-logic";
import type { Run, RunStep } from "@/runs/runs-logic";
import { createRun, saveRunEvent } from "@/runs/runs-store";

const SHOTS_SUBFOLDER = "shots";
const SCREENSHOT_ATTACHMENT_NAME = "screenshot";
const TEST_EVENTS_QUEUE_KEY = "test-events";
// A title path starts with "", the project name and the file.
const TITLE_PATH_PROJECT_PARTS = 2;

const pickTitlePath = (testCase: TestCase): string[] =>
  testCase.titlePath().slice(TITLE_PATH_PROJECT_PARTS);

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

  sendTestEvent = (testCase: TestCase, status: LiveTestStatus) => {
    const testEvent = createTestEvent(
      pickDeviceId(testCase),
      pickTitlePath(testCase),
      status,
    );
    const eventSend = runOneAtATime(TEST_EVENTS_QUEUE_KEY, () =>
      postToHub("/events", testEvent),
    );
    this.pendingTasks.push(eventSend);
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

  onBegin = (_config: FullConfig, suite: Suite) => {
    for (const testCase of suite.allTests()) {
      const testTitlePath = pickTitlePath(testCase);
      const testKey = pickTestKey(testTitlePath);
      this.expectedCounts.set(
        testKey,
        (this.expectedCounts.get(testKey) ?? 0) + 1,
      );
    }
    this.runCreation = createRun(this.rootFolder, "playwright");
    this.runCreation.catch((error: unknown) => {
      console.error({ message: "Everyscreen could not create the run", error });
    });
  };

  onTestBegin = (testCase: TestCase) => {
    this.sendTestEvent(testCase, "running");
  };

  onTestEnd = (testCase: TestCase, testResult: TestResult) => {
    this.sendTestEvent(testCase, pickLiveTestStatus(testResult.status));
    const isAttemptLast = isLastAttempt({
      status: testResult.status,
      retry: testResult.retry,
      retries: testCase.retries,
    });
    const isRetryComing = !isAttemptLast;
    if (isRetryComing) return;

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
