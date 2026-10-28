import { describe, expect, test } from "vitest";
import type { DeviceAnswer } from "@/commands/commands-logic";
import {
  checkRunEvent,
  mergeRunEvent,
  pickNextRunId,
  pickRunningRun,
  pickRunStatus,
  pickStepId,
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
  shotPath: null,
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
  runKind: "steps",
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
  test("returns ok when there are no steps", () => {
    expect(pickRunStatus([])).toBe("ok");
  });

  test("returns ok when every device answer is ok", () => {
    expect(pickRunStatus([createStep([OK_ANSWER])])).toBe("ok");
  });

  test("returns failed when any device answer failed", () => {
    const steps = [
      createStep([OK_ANSWER]),
      createStep([OK_ANSWER, FAILED_ANSWER]),
    ];

    expect(pickRunStatus(steps)).toBe("failed");
  });
});

describe("checkRunEvent", () => {
  test("returns the saved run for a step on a running run", () => {
    const step = createStep([OK_ANSWER]);

    const checkedRun = checkRunEvent(EMPTY_RUN, { kind: "step-end", step });

    expect(checkedRun).toBe(EMPTY_RUN);
  });

  test("throws 404 when the run is missing", () => {
    const runEvent = { kind: "run-end", status: "ok" } as const;

    expect(() => checkRunEvent(null, runEvent)).toThrow("No run with that id");
  });

  test("throws 409 for a step after the run ended", () => {
    const endedRun: Run = { ...EMPTY_RUN, status: "ok" };
    const step = createStep([OK_ANSWER]);

    expect(() => checkRunEvent(endedRun, { kind: "step-end", step })).toThrow(
      "The run has already ended",
    );
  });

  test("accepts a second run end on an ended run", () => {
    const endedRun: Run = { ...EMPTY_RUN, status: "ok" };

    const checkedRun = checkRunEvent(endedRun, {
      kind: "run-end",
      status: "ok",
    });

    expect(checkedRun).toBe(endedRun);
  });
});

describe("mergeRunEvent", () => {
  test("sets the origin and the run kind on run start", () => {
    const mergedRun = mergeRunEvent(EMPTY_RUN, {
      kind: "run-start",
      origin: "flow",
      runKind: "sweep",
    });

    expect(mergedRun.origin).toBe("flow");
    expect(mergedRun.runKind).toBe("sweep");
    expect(mergedRun.status).toBe("running");
  });

  test("appends the step on step end without changing the old run", () => {
    const step = createStep([OK_ANSWER]);

    const mergedRun = mergeRunEvent(EMPTY_RUN, { kind: "step-end", step });

    expect(mergedRun.steps).toEqual([step]);
    expect(EMPTY_RUN.steps).toEqual([]);
  });

  test("ends failed when the event says failed", () => {
    const mergedRun = mergeRunEvent(EMPTY_RUN, {
      kind: "run-end",
      status: "failed",
    });

    expect(mergedRun.status).toBe("failed");
    expect(EMPTY_RUN.status).toBe("running");
  });

  test("ends failed when a step has a failed answer", () => {
    const failedRun: Run = {
      ...EMPTY_RUN,
      steps: [createStep([FAILED_ANSWER])],
    };

    const mergedRun = mergeRunEvent(failedRun, {
      kind: "run-end",
      status: "ok",
    });

    expect(mergedRun.status).toBe("failed");
  });

  test("ends ok when every step is ok", () => {
    const okRun: Run = { ...EMPTY_RUN, steps: [createStep([OK_ANSWER])] };

    const mergedRun = mergeRunEvent(okRun, {
      kind: "run-end",
      status: "ok",
    });

    expect(mergedRun.status).toBe("ok");
  });
});

describe("pickStepId", () => {
  test("numbers the first step 1", () => {
    expect(pickStepId([])).toBe("step-1");
  });

  test("numbers the next step after the saved ones", () => {
    const steps = [createStep([OK_ANSWER]), createStep([OK_ANSWER])];

    expect(pickStepId(steps)).toBe("step-3");
  });
});

describe("pickRunningRun", () => {
  const createRun = (runId: string, status: Run["status"]): Run => ({
    runId,
    origin: "cli",
    runKind: "steps",
    status,
    startedAt: 1,
    steps: [],
  });

  test("returns null when no run is saved", () => {
    expect(pickRunningRun([])).toBeNull();
  });

  test("returns null when every run has ended", () => {
    expect(pickRunningRun([createRun("run-0001", "ok")])).toBeNull();
  });

  test("returns the latest run that is still running", () => {
    const runs = [
      createRun("run-0001", "running"),
      createRun("run-0002", "failed"),
      createRun("run-0003", "running"),
    ];

    expect(pickRunningRun(runs)?.runId).toBe("run-0003");
  });
});
