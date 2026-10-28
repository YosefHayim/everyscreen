import { describe, expect, test } from "vitest";
import {
  addDeviceStep,
  createStepProgress,
  type DeviceStep,
  pickStepTotalToKeep,
} from "./step-progress-logic";

const createStep = (changes: Partial<DeviceStep> = {}): DeviceStep => ({
  stepIndex: 1,
  stepTitle: "Go to the cart",
  status: "ok",
  errorLine: null,
  ...changes,
});

describe("addDeviceStep", () => {
  test("appends a step with a new index", () => {
    const deviceSteps = [createStep({ stepIndex: 1 })];

    const nextSteps = addDeviceStep(deviceSteps, createStep({ stepIndex: 2 }));

    expect(nextSteps.map(({ stepIndex }) => stepIndex)).toEqual([1, 2]);
  });

  test("replaces the step that has the same index", () => {
    const deviceSteps = [createStep({ stepIndex: 1, status: "running" })];

    const nextSteps = addDeviceStep(deviceSteps, createStep({ stepIndex: 1 }));

    expect(nextSteps).toHaveLength(1);
    expect(nextSteps[0].status).toBe("ok");
  });

  test("keeps the steps in index order when one arrives late", () => {
    const deviceSteps = [createStep({ stepIndex: 3 })];

    const nextSteps = addDeviceStep(deviceSteps, createStep({ stepIndex: 2 }));

    expect(nextSteps.map(({ stepIndex }) => stepIndex)).toEqual([2, 3]);
  });

  test("does not change the list it was given", () => {
    const deviceSteps = [createStep({ stepIndex: 1 })];

    addDeviceStep(deviceSteps, createStep({ stepIndex: 2 }));

    expect(deviceSteps).toHaveLength(1);
  });
});

describe("pickStepTotalToKeep", () => {
  test("returns the last step index of a passed test", () => {
    const deviceSteps = [
      createStep({ stepIndex: 1 }),
      createStep({ stepIndex: 2 }),
    ];

    expect(pickStepTotalToKeep("ok", deviceSteps)).toBe(2);
  });

  test("returns null for a failed test, which stopped early", () => {
    expect(pickStepTotalToKeep("failed", [createStep()])).toBeNull();
  });

  test("returns null for a test that is still running", () => {
    expect(pickStepTotalToKeep("running", [createStep()])).toBeNull();
  });

  test("returns null for a passed test without steps", () => {
    expect(pickStepTotalToKeep("ok", [])).toBeNull();
  });
});

describe("createStepProgress", () => {
  test("returns null before the first step", () => {
    expect(createStepProgress([], 7, "running")).toBeNull();
  });

  test("shows the step number and title without segments while the total is unknown", () => {
    const deviceSteps = [
      createStep({ stepIndex: 1 }),
      createStep({ stepIndex: 2, stepTitle: "Fill coupon", status: "running" }),
    ];

    const stepProgress = createStepProgress(deviceSteps, null, "running");

    expect(stepProgress).toEqual({
      stepNumber: 2,
      stepTitle: "Fill coupon",
      totalSteps: null,
      segments: [],
    });
  });

  test("draws done, current and pending segments once the total is known", () => {
    const deviceSteps = [
      createStep({ stepIndex: 1 }),
      createStep({ stepIndex: 2, status: "running" }),
    ];

    const stepProgress = createStepProgress(deviceSteps, 4, "running");

    expect(stepProgress?.totalSteps).toBe(4);
    expect(stepProgress?.segments.map(({ state }) => state)).toEqual([
      "done",
      "current",
      "pending",
      "pending",
    ]);
  });

  test("marks the step that failed", () => {
    const deviceSteps = [
      createStep({ stepIndex: 1 }),
      createStep({ stepIndex: 2, status: "failed" }),
    ];

    const stepProgress = createStepProgress(deviceSteps, 3, "failed");

    expect(stepProgress?.segments.map(({ state }) => state)).toEqual([
      "done",
      "failed",
      "pending",
    ]);
  });

  test("marks the last step when the test failed after it", () => {
    const deviceSteps = [
      createStep({ stepIndex: 1 }),
      createStep({ stepIndex: 2 }),
    ];

    const stepProgress = createStepProgress(deviceSteps, 3, "failed");

    expect(stepProgress?.segments.map(({ state }) => state)).toEqual([
      "done",
      "failed",
      "pending",
    ]);
  });

  test("grows the total when a device passes the known total", () => {
    const deviceSteps = [
      createStep({ stepIndex: 1 }),
      createStep({ stepIndex: 2 }),
    ];

    const stepProgress = createStepProgress(deviceSteps, 1, "running");

    expect(stepProgress?.totalSteps).toBe(2);
  });

  test("shows a gap in the steps as pending", () => {
    const deviceSteps = [createStep({ stepIndex: 2 })];

    const stepProgress = createStepProgress(deviceSteps, 2, "ok");

    expect(stepProgress?.segments.map(({ state }) => state)).toEqual([
      "pending",
      "done",
    ]);
  });
});
