import { describe, expect, test } from "vitest";
import type { Finding } from "@/checks/checks-logic";
import {
  createMatrix,
  listFailureProofs,
  listRunDeviceIds,
  pickRunTotals,
  pickShotUrl,
} from "@/dashboard/runs/run-report-logic";
import type { Run, RunStep } from "@/runs/runs-logic";

const overflowFinding: Finding = {
  kind: "overflow",
  severity: "warn",
  deviceId: "iphone-se",
  selector: ".coupon-row",
  message: "24px past the edge",
};

const passedStep: RunStep = {
  stepId: "step-1",
  title: "open /cart",
  startedAt: 1,
  deviceAnswers: [
    { status: "ok", deviceId: "pixel-8", durationMs: 100, shotPath: null },
    { status: "ok", deviceId: "iphone-se", durationMs: 100, shotPath: null },
  ],
  findings: [overflowFinding],
  proof: null,
};

const failedStep: RunStep = {
  stepId: "step-2",
  title: "tap Apply",
  startedAt: 2,
  deviceAnswers: [
    { status: "ok", deviceId: "pixel-8", durationMs: 100, shotPath: null },
    {
      status: "failed",
      deviceId: "iphone-se",
      durationMs: 5000,
      message: "covered",
      shotPath: ".everyscreen/shots/run-0001-iphone-se.png",
    },
  ],
  findings: [],
  proof: {
    shotPath: ".everyscreen/shots/run-0001-iphone-se.png",
    errorMessage: "covered",
    codeSnippet: "await page.click()",
    codeLocation: "cart.spec.ts:4",
  },
};

const lonelyStep: RunStep = {
  stepId: "step-3",
  title: "tap Pay",
  startedAt: 3,
  deviceAnswers: [
    { status: "ok", deviceId: "pixel-8", durationMs: 100, shotPath: null },
  ],
  findings: [],
  proof: null,
};

const run: Run = {
  runId: "run-0001",
  origin: "flow",
  runKind: "steps",
  status: "failed",
  startedAt: 1,
  steps: [passedStep, failedStep, lonelyStep],
};

describe("listRunDeviceIds", () => {
  test("lists each device once in the order it first appears", () => {
    expect(listRunDeviceIds(run)).toEqual(["pixel-8", "iphone-se"]);
  });

  test("includes a device that only has a finding", () => {
    const findingOnlyRun: Run = {
      ...run,
      steps: [{ ...lonelyStep, findings: [overflowFinding] }],
    };

    expect(listRunDeviceIds(findingOnlyRun)).toEqual(["pixel-8", "iphone-se"]);
  });

  test("returns nothing for a run with no steps", () => {
    expect(listRunDeviceIds({ ...run, steps: [] })).toEqual([]);
  });
});

describe("createMatrix", () => {
  test("marks ok, warn, failed and none cells per device and step", () => {
    const matrix = createMatrix(run);

    expect(matrix[0]?.cells.map((cell) => cell.status)).toEqual([
      "ok",
      "ok",
      "ok",
    ]);
    expect(matrix[1]?.cells.map((cell) => cell.status)).toEqual([
      "warn",
      "failed",
      "none",
    ]);
  });

  test("counts ok, warn and failed cells per device", () => {
    const matrix = createMatrix(run);

    expect(matrix[1]).toMatchObject({
      okCount: 0,
      warnCount: 1,
      failedCount: 1,
    });
  });
});

describe("pickRunTotals", () => {
  test("counts steps, devices, findings and device outcomes", () => {
    const runTotals = pickRunTotals(run);

    expect(runTotals).toEqual({
      stepCount: 3,
      deviceCount: 2,
      findingCount: 1,
      okDeviceCount: 1,
      failedDeviceCount: 1,
    });
  });
});

describe("listFailureProofs", () => {
  test("returns the proof of each step that kept one", () => {
    const failureProofs = listFailureProofs(run);

    expect(failureProofs).toHaveLength(1);
    expect(failureProofs[0]).toMatchObject({
      stepId: "step-2",
      stepNumber: 2,
      title: "tap Apply",
      failedDeviceIds: ["iphone-se"],
    });
  });

  test("returns nothing when no step kept a proof", () => {
    expect(listFailureProofs({ ...run, steps: [passedStep] })).toEqual([]);
  });
});

describe("pickShotUrl", () => {
  test("points at the shot file name under the shots route", () => {
    const shotUrl = pickShotUrl(".everyscreen/shots/run-0001-iphone-se.png");

    expect(shotUrl).toBe("/api/shots/run-0001-iphone-se.png");
  });

  test("returns null when the step has no shot", () => {
    expect(pickShotUrl(null)).toBeNull();
  });
});
