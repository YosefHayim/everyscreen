import { describe, expect, test } from "vitest";
import type { Finding } from "@/checks/checks-logic";
import type { DeviceAnswer } from "@/commands/commands-logic";
import {
  checkRunEvent,
  isRunOpen,
  mergeRunEvent,
  pickLeftOpenRuns,
  pickNextRunId,
  pickRunStatus,
  pickStepId,
  type Run,
  type RunOrigin,
  type RunStatus,
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

  test("returns failed when a device has a failed finding", () => {
    const failedFinding: Finding = {
      kind: "overflow",
      severity: "failed",
      deviceId: "iphone-se",
      selector: null,
      message: "Wider than the screen",
    };
    const steps = [{ ...createStep([OK_ANSWER]), findings: [failedFinding] }];

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

const createSavedRun = (
  runId: string,
  origin: RunOrigin,
  status: RunStatus,
): Run => ({
  runId,
  origin,
  runKind: "steps",
  status,
  startedAt: 1,
  steps: [],
});

describe("isRunOpen", () => {
  test("returns false when no run is saved", () => {
    const savedRun = null;

    expect(isRunOpen(savedRun)).toBe(false);
  });

  test("returns false when the run has ended", () => {
    const savedRun = createSavedRun("run-0001", "cli", "ok");

    expect(isRunOpen(savedRun)).toBe(false);
  });

  test("returns true when the run is still running", () => {
    const savedRun = createSavedRun("run-0001", "cli", "running");

    expect(isRunOpen(savedRun)).toBe(true);
  });
});

describe("pickLeftOpenRuns", () => {
  test("returns no run when every run has ended", () => {
    const runs = [createSavedRun("run-0001", "cli", "ok")];

    expect(pickLeftOpenRuns(runs)).toEqual([]);
  });

  test("returns the cli runs that are still running", () => {
    const runs = [
      createSavedRun("run-0001", "cli", "running"),
      createSavedRun("run-0002", "cli", "failed"),
      createSavedRun("run-0003", "cli", "running"),
    ];

    const leftOpenRuns = pickLeftOpenRuns(runs);

    expect(leftOpenRuns.map(({ runId }) => runId)).toEqual([
      "run-0001",
      "run-0003",
    ]);
  });

  test("keeps the playwright and flow runs that are still running", () => {
    const runs = [
      createSavedRun("run-0001", "playwright", "running"),
      createSavedRun("run-0002", "flow", "running"),
    ];

    expect(pickLeftOpenRuns(runs)).toEqual([]);
  });
});
