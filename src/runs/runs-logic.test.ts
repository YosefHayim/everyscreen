import { describe, expect, test } from "vitest";
import type { DeviceAnswer } from "@/commands/commands-logic";
import {
  mergeRunEvent,
  pickNextRunId,
  pickRunStatus,
  type Run,
  type RunStep,
} from "@/runs/runs-logic";

const createStep = (deviceAnswers: DeviceAnswer[]): RunStep => ({
  stepId: "step-1",
  title: "tap Checkout",
  startedAt: 1,
  deviceAnswers,
  findings: [],
  proof: null,
});

const OK_ANSWER: DeviceAnswer = {
  status: "ok",
  deviceId: "iphone-se",
  durationMs: 100,
};
const FAILED_ANSWER: DeviceAnswer = {
  status: "failed",
  deviceId: "pixel-8",
  durationMs: 100,
  message: "no button",
  shotPath: null,
};

const EMPTY_RUN: Run = {
  runId: "run-0001",
  origin: "cli",
  status: "running",
  startedAt: 1,
  steps: [],
};

describe("pickNextRunId", () => {
  test("starts at run-0001 when there are no runs", () => {
    expect(pickNextRunId([])).toBe("run-0001");
  });

  test("adds one to the highest run id with zero padding", () => {
    expect(pickNextRunId(["run-0411", "run-0412", "run-0002"])).toBe(
      "run-0413",
    );
  });

  test("ignores ids that are not run ids", () => {
    expect(pickNextRunId(["notes", "run-0009"])).toBe("run-0010");
  });
});

describe("pickRunStatus", () => {
  test("returns running when there are no steps", () => {
    expect(pickRunStatus([])).toBe("running");
  });

  test("returns passed when every device answer is ok", () => {
    expect(pickRunStatus([createStep([OK_ANSWER])])).toBe("passed");
  });

  test("returns failed when any device answer failed", () => {
    const steps = [
      createStep([OK_ANSWER]),
      createStep([OK_ANSWER, FAILED_ANSWER]),
    ];

    expect(pickRunStatus(steps)).toBe("failed");
  });
});

describe("mergeRunEvent", () => {
  test("sets the origin on run start", () => {
    const mergedRun = mergeRunEvent(EMPTY_RUN, {
      kind: "run-start",
      origin: "flow",
    });

    expect(mergedRun.origin).toBe("flow");
    expect(mergedRun.status).toBe("running");
  });

  test("appends the step on step end without changing the old run", () => {
    const step = createStep([OK_ANSWER]);

    const mergedRun = mergeRunEvent(EMPTY_RUN, { kind: "step-end", step });

    expect(mergedRun.steps).toEqual([step]);
    expect(EMPTY_RUN.steps).toEqual([]);
  });

  test("sets the status on run end", () => {
    const mergedRun = mergeRunEvent(EMPTY_RUN, {
      kind: "run-end",
      status: "failed",
    });

    expect(mergedRun.status).toBe("failed");
    expect(EMPTY_RUN.status).toBe("running");
  });
});
