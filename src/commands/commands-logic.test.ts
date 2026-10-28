import { HTTPException } from "hono/http-exception";
import { describe, expect, test } from "vitest";
import type { Finding } from "@/checks/checks-logic";
import {
  countUnits,
  createCommandRunStep,
  createReplyLine,
  createShotPath,
  createStepTitle,
  type DeviceAnswer,
  pickCheckDevice,
  pickChosenPages,
  pickDeviceIds,
  pickErrorMessage,
  pickFailureMessage,
  pickStepProof,
  summarizeCommand,
} from "@/commands/commands-logic";
import type { DevicePage } from "@/devices/device-browsers";
import { type DevicePreset, findCatalogPreset } from "@/devices/devices-logic";

const findPreset = (deviceId: string): DevicePreset => {
  return findCatalogPreset(deviceId, "full-screen");
};

const createFinding = (severity: Finding["severity"]): Finding => ({
  kind: "overflow",
  severity,
  deviceId: "iphone-se",
  selector: ".cart-total",
  message: ".cart-total is 40px past the edge",
});

const createOkAnswer = (deviceId: string): DeviceAnswer => ({
  status: "ok",
  deviceId,
  durationMs: 180,
  shotPath: null,
});

const createFailedAnswer = (deviceId: string): DeviceAnswer => ({
  status: "failed",
  deviceId,
  durationMs: 412,
  message: 'cookie bar covers "Checkout"',
  shotPath: null,
});

describe("createReplyLine", () => {
  test("counts devices and ok answers with the report", () => {
    const replyTally = {
      unit: "device",
      okCount: 5,
      failedCount: 0,
      runId: "run-0412",
    } as const;

    expect(createReplyLine(replyTally)).toBe(
      "5 devices · 5 ok · report run-0412",
    );
  });

  test("adds the failed count when a device failed", () => {
    const replyTally = {
      unit: "device",
      okCount: 4,
      failedCount: 1,
      runId: "run-0412",
    } as const;

    expect(createReplyLine(replyTally)).toBe(
      "5 devices · 4 ok · 1 failed · report run-0412",
    );
  });

  test("uses the singular for one device and drops the report without a run", () => {
    const replyTally = {
      unit: "device",
      okCount: 1,
      failedCount: 0,
      runId: null,
    } as const;

    expect(createReplyLine(replyTally)).toBe("1 device · 1 ok");
  });

  test("counts flows for the flow runner", () => {
    const replyTally = {
      unit: "flow",
      okCount: 2,
      failedCount: 1,
      runId: null,
    } as const;

    expect(createReplyLine(replyTally)).toBe("3 flows · 2 ok · 1 failed");
  });

  test("says no device answered when nothing was counted", () => {
    const replyTally = {
      unit: "device",
      okCount: 0,
      failedCount: 0,
      runId: "run-0412",
    } as const;

    expect(createReplyLine(replyTally)).toBe("0 devices · no device answered");
  });
});

describe("summarizeCommand", () => {
  test("returns ok with no failures when every device passes", () => {
    const deviceAnswers = [
      createOkAnswer("iphone-se"),
      createOkAnswer("pixel-8"),
    ];

    const reply = summarizeCommand(deviceAnswers, "run-0412");

    expect(reply.status).toBe("ok");
    expect(reply.failures).toEqual([]);
    expect(reply.line).toBe("2 devices · 2 ok · report run-0412");
    expect(reply.runId).toBe("run-0412");
  });

  test("returns failed and lists the failed device", () => {
    const okAnswers = ["pixel-8", "ipad-mini"].map(createOkAnswer);
    const deviceAnswers = [...okAnswers, createFailedAnswer("iphone-se")];

    const reply = summarizeCommand(deviceAnswers, null);

    expect(reply.status).toBe("failed");
    expect(reply.line).toBe("3 devices · 2 ok · 1 failed");
    expect(reply.failures.map((failure) => failure.deviceId)).toEqual([
      "iphone-se",
    ]);
  });

  test("returns failed when no device answered", () => {
    const reply = summarizeCommand([], null);

    expect(reply.status).toBe("failed");
    expect(reply.line).toBe("0 devices · no device answered");
  });
});

describe("pickCheckDevice", () => {
  test("reads touch and the safe area from the device", () => {
    const checkDevice = pickCheckDevice(findPreset("iphone-15"));

    expect(checkDevice.id).toBe("iphone-15");
    expect(checkDevice.hasTouch).toBe(true);
    expect(checkDevice.safeAreaInsets.top).toBeGreaterThan(0);
  });

  test("has no touch and no insets on a laptop", () => {
    const checkDevice = pickCheckDevice(findPreset("laptop-1440"));

    expect(checkDevice.hasTouch).toBe(false);
    expect(checkDevice.safeAreaInsets.top).toBe(0);
  });
});

describe("pickDeviceIds", () => {
  const runningDeviceIds = ["iphone-se", "pixel-8"];

  test("returns every running device when no ids are given", () => {
    expect(pickDeviceIds(runningDeviceIds, null)).toEqual(runningDeviceIds);
  });

  test("returns only the chosen device", () => {
    expect(pickDeviceIds(runningDeviceIds, ["pixel-8"])).toEqual(["pixel-8"]);
  });

  test("rejects an id that is not running", () => {
    const pick = () => pickDeviceIds(runningDeviceIds, ["pixel-8", "nokia"]);

    expect(pick).toThrow(HTTPException);
    expect(pick).toThrow("No device nokia");
  });

  test("rejects a hub with no running device", () => {
    const pick = () => pickDeviceIds([], null);

    expect(pick).toThrow("No device is running");
  });

  test("rejects an empty list of chosen ids", () => {
    const pick = () => pickDeviceIds(runningDeviceIds, []);

    expect(pick).toThrow("No device chosen");
  });
});

describe("pickErrorMessage", () => {
  test("keeps the first line of an error", () => {
    const error = new Error(
      "locator.click: Timeout 5000ms exceeded.\nCall log:",
    );

    expect(pickErrorMessage(error)).toBe(
      "locator.click: Timeout 5000ms exceeded.",
    );
  });

  test("turns a thrown string into its text", () => {
    expect(pickErrorMessage("boom")).toBe("boom");
  });
});

describe("pickFailureMessage", () => {
  test("prefers the action error", () => {
    const failureMessage = pickFailureMessage("no button", [
      createFinding("failed"),
    ]);

    expect(failureMessage).toBe("no button");
  });

  test("uses the first finding that failed", () => {
    const failureMessage = pickFailureMessage(null, [
      { ...createFinding("warn"), message: "small" },
      createFinding("failed"),
    ]);

    expect(failureMessage).toBe(".cart-total is 40px past the edge");
  });

  test("returns null when the action worked and findings only warn", () => {
    expect(pickFailureMessage(null, [createFinding("warn")])).toBeNull();
  });
});

describe("pickStepProof", () => {
  test("keeps the shot and message of the first failure", () => {
    const deviceAnswers: DeviceAnswer[] = [
      createOkAnswer("pixel-8"),
      {
        status: "failed",
        deviceId: "iphone-se",
        durationMs: 412,
        message: 'cookie bar covers "Checkout"',
        shotPath: "shots/a.png",
      },
    ];

    expect(pickStepProof(deviceAnswers)).toEqual({
      shotPath: "shots/a.png",
      errorMessage: 'cookie bar covers "Checkout"',
      codeSnippet: null,
      codeLocation: null,
    });
  });

  test("returns null when every device is ok", () => {
    expect(pickStepProof([createOkAnswer("pixel-8")])).toBeNull();
  });
});

describe("createShotPath", () => {
  test("names the shot by run, step and device", () => {
    expect(createShotPath("run-0001", "step-2", "pixel-8")).toBe(
      ".everyscreen/shots/run-0001-step-2-pixel-8.png",
    );
  });
});

describe("createStepTitle", () => {
  const everyDevice = { deviceIds: null };

  test.each([
    [
      { commandName: "open", url: "http://a.test/", ...everyDevice },
      "open http://a.test/",
    ],
    [
      { commandName: "tap", role: "button", name: "Buy", ...everyDevice },
      'tap button "Buy"',
    ],
    [
      {
        commandName: "fill",
        role: "textbox",
        name: "Email",
        with: "a",
        ...everyDevice,
      },
      'fill textbox "Email"',
    ],
    [
      { commandName: "scroll", to: "bottom", ...everyDevice },
      "scroll to bottom",
    ],
    [
      {
        commandName: "sweep",
        url: "http://a.test/",
        maxRoutes: 50,
        ...everyDevice,
      },
      "sweep http://a.test/",
    ],
    [{ commandName: "check", ...everyDevice }, "check"],
    [{ commandName: "shot", ...everyDevice }, "shot"],
    [
      { commandName: "expect", text: "Thanks", ...everyDevice },
      'expect "Thanks"',
    ],
  ] as const)("titles %j", (hubCommand, expectedTitle) => {
    expect(createStepTitle(hubCommand)).toBe(expectedTitle);
  });
});

describe("countUnits", () => {
  test("keeps the unit singular for one and adds s otherwise", () => {
    expect(countUnits(1, "route")).toBe("1 route");
    expect(countUnits(0, "route")).toBe("0 routes");
    expect(countUnits(24, "route")).toBe("24 routes");
  });
});

describe("pickChosenPages", () => {
  const devicePages = ["pixel-8", "iphone-se"].map(
    (deviceId): DevicePage => ({
      device: findPreset(deviceId),
      page: null as never,
      hasLiveScreen: false,
    }),
  );

  test("keeps every page when no device ids are given", () => {
    const chosenPages = pickChosenPages(devicePages, null);

    expect(chosenPages).toEqual(devicePages);
  });

  test("keeps only the pages of the given device ids", () => {
    const chosenPages = pickChosenPages(devicePages, ["iphone-se"]);

    expect(chosenPages.map(({ device }) => device.id)).toEqual(["iphone-se"]);
  });
});

describe("createCommandRunStep", () => {
  test("joins the answers and findings of every device and picks the first failure as proof", () => {
    const failedAnswer = createFailedAnswer("pixel-8");
    const finding = createFinding("warn");

    const runStep = createCommandRunStep({
      stepId: "step-2",
      title: "sweep /about",
      startedAt: 5,
      deviceSteps: [
        { deviceAnswer: createOkAnswer("iphone-se"), findings: [finding] },
        { deviceAnswer: failedAnswer, findings: [] },
      ],
    });

    expect(runStep.deviceAnswers).toHaveLength(2);
    expect(runStep.findings).toEqual([finding]);
    expect(runStep.proof?.errorMessage).toBe('cookie bar covers "Checkout"');
    expect(runStep.title).toBe("sweep /about");
  });
});
