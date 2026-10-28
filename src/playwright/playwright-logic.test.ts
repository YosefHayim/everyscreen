import { describe, expect, test } from "vitest";
import { DEFAULT_GRID_IDS } from "@/devices/default-grid-ids";
import { pickGridDevices } from "@/devices/devices-logic";
import {
  createDeviceProject,
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
  pickFirstErrorLine,
  pickLiveTestStatus,
  pickProjectDevices,
  pickRunEndStatus,
  pickRunOutcome,
  pickScreenHubUrl,
  pickScreenshotMode,
  pickTestKey,
  STEP_TITLE_SEPARATOR,
} from "@/playwright/playwright-logic";

const DEVICE_PRESETS = pickGridDevices({
  devices: [],
  routes: [],
  grid: DEFAULT_GRID_IDS,
  viewportModes: {},
});
const [iphoneSe] = DEVICE_PRESETS;
const ANSI_RED = "\u001b[31m";
const ANSI_RESET = "\u001b[39m";

const createFinishedTest = (
  changes: Partial<FinishedTest> = {},
): FinishedTest => ({
  deviceId: "pixel-8",
  titlePath: ["shop.spec.ts", "cart", "adds a tote"],
  status: "passed",
  startedAt: 100,
  durationMs: 50,
  errorMessage: null,
  codeSnippet: null,
  codeLocation: null,
  shotPath: null,
  ...changes,
});

describe("pickScreenshotMode", () => {
  test("keeps failure shots only for Chromium", () => {
    const mode = pickScreenshotMode("chromium");

    expect(mode).toBe("only-on-failure");
  });

  test("shoots every test on WebKit and Firefox", () => {
    const webkitMode = pickScreenshotMode("webkit");
    const firefoxMode = pickScreenshotMode("firefox");

    expect(webkitMode).toBe("on");
    expect(firefoxMode).toBe("on");
  });
});

describe("createDeviceProject", () => {
  test("names the project by device id and copies the emulation", () => {
    const project = createDeviceProject(iphoneSe, null);

    expect(project.name).toBe("iphone-se");
    expect(project.use?.browserName).toBe("webkit");
    expect(project.use?.viewport).toEqual({ width: 375, height: 667 });
    expect(project.use?.screenshot).toBe("on");
    expect(project.use?.connectOptions).toBeUndefined();
  });

  test("connects to the hub browser when the hub lists the device", () => {
    const project = createDeviceProject(iphoneSe, { wsEndpoint: "ws://hub" });

    expect(project.use?.connectOptions).toEqual({ wsEndpoint: "ws://hub" });
  });

  test("names the device for the live fixture and leaves test files parallel off", () => {
    const project = createDeviceProject(iphoneSe, null);

    expect(project.use?.everyscreenDeviceId).toBe(iphoneSe.id);
    expect(project.fullyParallel).toBeUndefined();
  });
});

describe("pickProjectDevices", () => {
  test("returns every grid device when no ids are asked for", () => {
    const projectDevices = pickProjectDevices(DEVICE_PRESETS, null);

    expect(projectDevices).toEqual(DEVICE_PRESETS);
  });

  test("returns the asked devices in the asked order", () => {
    const projectDevices = pickProjectDevices(DEVICE_PRESETS, [
      "pixel-10",
      "iphone-se",
    ]);

    expect(projectDevices.map(({ id }) => id)).toEqual([
      "pixel-10",
      "iphone-se",
    ]);
  });

  test("throws and names the id of an unknown device", () => {
    const pickUnknown = () => pickProjectDevices(DEVICE_PRESETS, ["nokia"]);

    expect(pickUnknown).toThrow(/Unknown device nokia.*pixel-10/);
  });
});

describe("isLastAttempt", () => {
  test("is last when the attempt passed", () => {
    const isFinal = isLastAttempt({ status: "passed", retry: 0, retries: 2 });

    expect(isFinal).toBe(true);
  });

  test("is last when the test was skipped", () => {
    const isFinal = isLastAttempt({ status: "skipped", retry: 0, retries: 2 });

    expect(isFinal).toBe(true);
  });

  test("is not last when a failed attempt still has retries", () => {
    const isFinal = isLastAttempt({ status: "failed", retry: 0, retries: 2 });

    expect(isFinal).toBe(false);
  });

  test("is last when a failed attempt used the last retry", () => {
    const isFinal = isLastAttempt({ status: "failed", retry: 2, retries: 2 });

    expect(isFinal).toBe(true);
  });
});

describe("pickTestKey", () => {
  test("gives the same key to the same title path only", () => {
    const firstKey = pickTestKey(["a.spec.ts", "adds"]);
    const secondKey = pickTestKey(["a.spec.ts", "adds"]);
    const otherKey = pickTestKey(["a.spec.ts", "removes"]);

    expect(firstKey).toBe(secondKey);
    expect(firstKey).not.toBe(otherKey);
  });
});

describe("isStepComplete", () => {
  test("is incomplete until every device finished", () => {
    const isComplete = isStepComplete([createFinishedTest()], 2);

    expect(isComplete).toBe(false);
  });

  test("is complete once every device finished", () => {
    const isComplete = isStepComplete(
      [createFinishedTest(), createFinishedTest()],
      2,
    );

    expect(isComplete).toBe(true);
  });
});

describe("createRunStep", () => {
  test("returns null when every test was skipped", () => {
    const runStep = createRunStep(1, [
      createFinishedTest({ status: "skipped" }),
    ]);

    expect(runStep).toBeNull();
  });

  test("creates an ok answer per device and no proof when all passed", () => {
    const runStep = createRunStep(3, [
      createFinishedTest({ deviceId: "pixel-8", startedAt: 200 }),
      createFinishedTest({ deviceId: "iphone-se", startedAt: 100 }),
      createFinishedTest({ deviceId: "ipad-mini", status: "skipped" }),
    ]);

    expect(runStep).toEqual({
      stepId: "step-3",
      title: "shop.spec.ts › cart › adds a tote",
      startedAt: 100,
      deviceAnswers: [
        { status: "ok", deviceId: "pixel-8", durationMs: 50, shotPath: null },
        { status: "ok", deviceId: "iphone-se", durationMs: 50, shotPath: null },
      ],
      findings: [],
      proof: null,
    });
  });

  test("keeps the first error line and the proof of the first failure", () => {
    const runStep = createRunStep(1, [
      createFinishedTest(),
      createFinishedTest({
        deviceId: "iphone-se",
        status: "failed",
        errorMessage: `${ANSI_RED}Expected visible${ANSI_RESET}\nCall log:\n  waiting`,
        codeSnippet: `${ANSI_RED}> 4 | await tap()${ANSI_RESET}`,
        codeLocation: "shop.spec.ts:4:7",
        shotPath: ".everyscreen/shots/run-0001-abc.png",
      }),
    ]);

    expect(runStep?.deviceAnswers[1]).toEqual({
      status: "failed",
      deviceId: "iphone-se",
      durationMs: 50,
      message: "Expected visible",
      shotPath: ".everyscreen/shots/run-0001-abc.png",
    });
    expect(runStep?.proof).toEqual({
      shotPath: ".everyscreen/shots/run-0001-abc.png",
      errorMessage: "Expected visible\nCall log:\n  waiting",
      codeSnippet: "> 4 | await tap()",
      codeLocation: "shop.spec.ts:4:7",
    });
  });

  test("names the status when a failed test has no error", () => {
    const runStep = createRunStep(1, [
      createFinishedTest({ status: "timedOut" }),
    ]);

    expect(runStep?.deviceAnswers[0]).toMatchObject({
      message: "Test timedOut",
    });
    expect(runStep?.proof).toEqual({
      shotPath: null,
      errorMessage: "Test timedOut",
      codeSnippet: null,
      codeLocation: null,
    });
  });
});

describe("pickRunEndStatus", () => {
  test("returns ok when the suite passed", () => {
    const status = pickRunEndStatus("passed");

    expect(status).toBe("ok");
  });

  test("fails for every other suite status", () => {
    const failedStatus = pickRunEndStatus("failed");
    const timedOutStatus = pickRunEndStatus("timedout");

    expect(failedStatus).toBe("failed");
    expect(timedOutStatus).toBe("failed");
  });
});

describe("createSuiteReplyLine", () => {
  test("says no device answered for an empty run", () => {
    const line = createSuiteReplyLine([], "run-0001");

    expect(line).toBe(
      "0 devices · no device answered · report run-0001".replace(
        " · report run-0001",
        "",
      ),
    );
  });

  test("counts a device failed when any of its answers failed", () => {
    const passedStep = createRunStep(1, [
      createFinishedTest({ deviceId: "pixel-8" }),
      createFinishedTest({ deviceId: "iphone-se" }),
    ]);
    const failedStep = createRunStep(2, [
      createFinishedTest({ deviceId: "pixel-8" }),
      createFinishedTest({ deviceId: "iphone-se", status: "failed" }),
    ]);

    const line = createSuiteReplyLine(
      [passedStep, failedStep].filter((runStep) => runStep !== null),
      "run-0007",
    );

    expect(line).toBe("2 devices · 1 ok · 1 failed · report run-0007");
  });
});

describe("pickLiveTestStatus", () => {
  test.each([
    ["passed", "ok"],
    ["skipped", "ok"],
    ["failed", "failed"],
    ["timedOut", "failed"],
    ["interrupted", "failed"],
  ] as const)("calls a %s test %s", (testStatus, liveTestStatus) => {
    const pickedStatus = pickLiveTestStatus(testStatus);

    expect(pickedStatus).toBe(liveTestStatus);
  });
});

describe("createTestEvent", () => {
  test("splits the spec file from the joined title", () => {
    const titlePath = ["tests/shop.spec.ts", "cart", "adds a tote"];

    const testEvent = createTestEvent({
      deviceId: "pixel-8",
      titlePath,
      status: "running",
      errorMessage: undefined,
    });

    expect(testEvent).toEqual({
      deviceId: "pixel-8",
      title: `cart${STEP_TITLE_SEPARATOR}adds a tote`,
      specFile: "shop.spec.ts",
      status: "running",
      errorLine: null,
    });
  });

  test("carries the first error line of a failed test", () => {
    const errorMessage = `${ANSI_RED}Error: expect(Pay).toBeVisible() timed out${ANSI_RESET}\n\nLocator: Pay`;

    const testEvent = createTestEvent({
      deviceId: "pixel-8",
      titlePath: ["shop.spec.ts", "pays"],
      status: "failed",
      errorMessage,
    });

    expect(testEvent.errorLine).toBe(
      "Error: expect(Pay).toBeVisible() timed out",
    );
  });

  test("leaves the error line empty on a passed test", () => {
    const testEvent = createTestEvent({
      deviceId: "pixel-8",
      titlePath: ["shop.spec.ts", "pays"],
      status: "ok",
      errorMessage: "left over",
    });

    expect(testEvent.errorLine).toBeNull();
  });

  test("gives an empty spec file when the title path is empty", () => {
    const testEvent = createTestEvent({
      deviceId: "pixel-8",
      titlePath: [],
      status: "running",
      errorMessage: undefined,
    });

    expect(testEvent.specFile).toBe("");
  });
});

describe("pickFirstErrorLine", () => {
  test("returns null when there is no message", () => {
    expect(pickFirstErrorLine(undefined)).toBeNull();
    expect(pickFirstErrorLine(null)).toBeNull();
  });

  test("skips blank lines and colors", () => {
    const errorLine = pickFirstErrorLine(
      `\n  ${ANSI_RED}boom${ANSI_RESET}\nmore`,
    );

    expect(errorLine).toBe("boom");
  });

  test("returns null when the message is only blank lines", () => {
    expect(pickFirstErrorLine(" \n ")).toBeNull();
  });
});

describe("isCountedStep", () => {
  test("counts a top page call and a test.step", () => {
    expect(isCountedStep("pw:api", [])).toBe(true);
    expect(isCountedStep("test.step", [])).toBe(true);
  });

  test("skips categories the user did not write", () => {
    expect(isCountedStep("hook", [])).toBe(false);
    expect(isCountedStep("fixture", [])).toBe(false);
    expect(isCountedStep("expect", [])).toBe(false);
  });

  test("skips a call inside a user step", () => {
    expect(isCountedStep("pw:api", ["test.step"])).toBe(false);
  });

  test("skips a call inside a hook or fixture", () => {
    expect(isCountedStep("pw:api", ["hook"])).toBe(false);
    expect(isCountedStep("pw:api", ["fixture"])).toBe(false);
  });

  test("counts a call under a step that is not a user step", () => {
    expect(isCountedStep("pw:api", ["expect"])).toBe(true);
  });
});

describe("isStepFromFolder", () => {
  test("is true for a file inside the folder", () => {
    expect(isStepFromFolder("/pkg/dist/test.mjs", "/pkg/dist")).toBe(true);
  });

  test("is false for a file in a folder that only shares the name start", () => {
    expect(isStepFromFolder("/pkg/dist-other/a.ts", "/pkg/dist")).toBe(false);
  });

  test("is false for a step without a file", () => {
    expect(isStepFromFolder(undefined, "/pkg/dist")).toBe(false);
  });
});

describe("createStepEvent", () => {
  const stepReport = {
    deviceId: "pixel-8",
    stepIndex: 2,
    stepTitle: 'Click "Apply"',
    errorMessage: undefined,
    isEnded: false,
  };

  test("reports a begun step as running", () => {
    const stepEvent = createStepEvent(stepReport);

    expect(stepEvent).toEqual({
      deviceId: "pixel-8",
      stepIndex: 2,
      stepTitle: 'Click "Apply"',
      status: "running",
      errorLine: null,
    });
  });

  test("reports an ended step without an error as ok", () => {
    const stepEvent = createStepEvent({ ...stepReport, isEnded: true });

    expect(stepEvent.status).toBe("ok");
  });

  test("reports an ended step with an error as failed with its line", () => {
    const stepEvent = createStepEvent({
      ...stepReport,
      isEnded: true,
      errorMessage: "Timeout 1000ms exceeded\ncall log",
    });

    expect(stepEvent.status).toBe("failed");
    expect(stepEvent.errorLine).toBe("Timeout 1000ms exceeded");
  });
});

describe("pickRunOutcome", () => {
  test("is ok only when the suite passed", () => {
    expect(pickRunOutcome("passed")).toBe("ok");
    expect(pickRunOutcome("failed")).toBe("failed");
    expect(pickRunOutcome("timedout")).toBe("failed");
    expect(pickRunOutcome("interrupted")).toBe("failed");
  });
});

describe("createHubUrl", () => {
  test("points at the hub port on the local host", () => {
    const hubUrl = createHubUrl({ pid: 1, port: 4100, devices: {} });

    expect(hubUrl).toBe("http://127.0.0.1:4100");
  });
});

describe("pickScreenHubUrl", () => {
  const hubFile = {
    pid: 1234,
    port: 4100,
    devices: {
      "pixel-8": { wsEndpoint: "ws://a", cdpUrl: "http://127.0.0.1:9" },
      "iphone-se": { wsEndpoint: "ws://b", cdpUrl: null },
    },
  };

  test("returns null when the project has no device id", () => {
    const hubUrl = pickScreenHubUrl(hubFile, null);

    expect(hubUrl).toBeNull();
  });

  test("returns null when there is no hub file", () => {
    const hubUrl = pickScreenHubUrl(null, "iphone-se");

    expect(hubUrl).toBeNull();
  });

  test("returns null when the hub does not run the device", () => {
    const hubUrl = pickScreenHubUrl(hubFile, "ipad-mini");

    expect(hubUrl).toBeNull();
  });

  test("returns null for a Chromium device the hub watches", () => {
    const hubUrl = pickScreenHubUrl(hubFile, "pixel-8");

    expect(hubUrl).toBeNull();
  });

  test("returns the hub url for a device without a CDP address", () => {
    const hubUrl = pickScreenHubUrl(hubFile, "iphone-se");

    expect(hubUrl).toBe("http://127.0.0.1:4100");
  });
});
