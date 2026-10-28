import { describe, expect, test } from "vitest";
import { DEVICE_PRESETS } from "@/devices/device-presets";
import {
  createDeviceProject,
  createRunStep,
  createSuiteReplyLine,
  createTestEvent,
  type FinishedTest,
  isLastAttempt,
  isScreenSentByTest,
  isStepComplete,
  pickLiveTestStatus,
  pickProjectDevices,
  pickRunEndStatus,
  pickScreenshotMode,
  pickTestKey,
} from "@/playwright/playwright-logic";

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
});

describe("pickProjectDevices", () => {
  test("returns every grid device when no ids are asked for", () => {
    const projectDevices = pickProjectDevices(DEVICE_PRESETS, null);

    expect(projectDevices).toEqual(DEVICE_PRESETS);
  });

  test("returns the asked devices in the asked order", () => {
    const projectDevices = pickProjectDevices(DEVICE_PRESETS, [
      "pixel-8",
      "iphone-se",
    ]);

    expect(projectDevices.map(({ id }) => id)).toEqual([
      "pixel-8",
      "iphone-se",
    ]);
  });

  test("throws and names the id of an unknown device", () => {
    const pickUnknown = () => pickProjectDevices(DEVICE_PRESETS, ["nokia"]);

    expect(pickUnknown).toThrow(/Unknown device nokia.*pixel-8/);
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
  test("passes when the suite passed", () => {
    const status = pickRunEndStatus("passed");

    expect(status).toBe("passed");
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

describe("createDeviceProject (live options)", () => {
  test("names the device and runs its tests in parallel", () => {
    const project = createDeviceProject(iphoneSe, null);

    expect(project.fullyParallel).toBe(true);
    expect(project.use?.everyscreenDeviceId).toBe(iphoneSe.id);
  });
});

describe("pickLiveTestStatus", () => {
  test("calls a passed test ok", () => {
    expect(pickLiveTestStatus("passed")).toBe("ok");
  });

  test("calls a skipped test ok", () => {
    expect(pickLiveTestStatus("skipped")).toBe("ok");
  });

  test("calls a timed out test failed", () => {
    expect(pickLiveTestStatus("timedOut")).toBe("failed");
  });
});

describe("createTestEvent", () => {
  test("joins the title path into one title", () => {
    const testEvent = createTestEvent(
      "pixel-8",
      ["shop.spec.ts", "cart", "adds a tote"],
      "running",
    );

    expect(testEvent).toEqual({
      deviceId: "pixel-8",
      title: "shop.spec.ts › cart › adds a tote",
      status: "running",
    });
  });
});

describe("isScreenSentByTest", () => {
  const hubFile = {
    port: 4100,
    devices: {
      "pixel-8": { wsEndpoint: "ws://a", cdpUrl: "http://127.0.0.1:9" },
      "iphone-se": { wsEndpoint: "ws://b", cdpUrl: null },
    },
  };

  test("sends nothing when the project has no device id", () => {
    expect(isScreenSentByTest(hubFile, null)).toBe(false);
  });

  test("sends nothing when there is no hub file", () => {
    expect(isScreenSentByTest(null, "iphone-se")).toBe(false);
  });

  test("sends nothing when the hub does not run the device", () => {
    expect(isScreenSentByTest(hubFile, "ipad-mini")).toBe(false);
  });

  test("sends nothing for a Chromium device the hub watches", () => {
    expect(isScreenSentByTest(hubFile, "pixel-8")).toBe(false);
  });

  test("sends screen images for a device without a CDP address", () => {
    expect(isScreenSentByTest(hubFile, "iphone-se")).toBe(true);
  });
});
