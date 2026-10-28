import { describe, expect, test } from "vitest";
import {
  countRunFindings,
  countRuns,
  createDurationLabel,
  createStartedLabel,
  listShownRuns,
  pickFirstFailedDeviceId,
  pickRefetchInterval,
  pickRunDurationMs,
  pickRunHeadline,
} from "@/dashboard/runs/runs-list-logic";
import type { Run, RunStep } from "@/runs/runs-logic";

const createStep = (overrides: Partial<RunStep> = {}): RunStep => ({
  stepId: "step-1",
  title: "tap Checkout",
  startedAt: 1,
  deviceAnswers: [
    { status: "ok", deviceId: "pixel-8", durationMs: 400, shotPath: null },
    { status: "ok", deviceId: "iphone-se", durationMs: 900, shotPath: null },
  ],
  findings: [],
  proof: null,
  ...overrides,
});

const createRun = (overrides: Partial<Run> = {}): Run => ({
  runId: "run-0001",
  origin: "cli",
  status: "passed",
  startedAt: 1,
  steps: [createStep()],
  ...overrides,
});

describe("listShownRuns", () => {
  test("returns every run newest first for the all filters", () => {
    const olderRun = createRun({ runId: "run-0001" });
    const newerRun = createRun({ runId: "run-0002" });

    const shownRuns = listShownRuns([olderRun, newerRun], "all", "all");

    expect(shownRuns).toEqual([newerRun, olderRun]);
  });

  test("keeps only runs with the chosen status", () => {
    const failedRun = createRun({ runId: "run-0002", status: "failed" });

    const shownRuns = listShownRuns([createRun(), failedRun], "failed", "all");

    expect(shownRuns).toEqual([failedRun]);
  });

  test("keeps only runs from the chosen origin", () => {
    const flowRun = createRun({ runId: "run-0002", origin: "flow" });

    const shownRuns = listShownRuns([createRun(), flowRun], "all", "flow");

    expect(shownRuns).toEqual([flowRun]);
  });

  test("returns nothing for no runs", () => {
    expect(listShownRuns([], "all", "all")).toEqual([]);
  });
});

describe("countRuns", () => {
  test("counts all runs and the runs of one status", () => {
    const runs = [createRun(), createRun({ status: "failed" })];

    expect(countRuns(runs, "all")).toBe(2);
    expect(countRuns(runs, "failed")).toBe(1);
  });
});

describe("pickRefetchInterval", () => {
  test("refetches every 2 seconds while a run is running", () => {
    const interval = pickRefetchInterval([createRun({ status: "running" })]);

    expect(interval).toBe(2000);
  });

  test("stops refetching when no run is running", () => {
    expect(pickRefetchInterval([createRun()])).toBe(false);
  });

  test("stops refetching before the runs load", () => {
    expect(pickRefetchInterval(undefined)).toBe(false);
  });
});

describe("pickRunDurationMs", () => {
  test("adds the slowest device answer of every step", () => {
    const run = createRun({ steps: [createStep(), createStep()] });

    expect(pickRunDurationMs(run)).toBe(1800);
  });

  test("is zero for a run with no steps", () => {
    expect(pickRunDurationMs(createRun({ steps: [] }))).toBe(0);
  });
});

describe("createDurationLabel", () => {
  test("writes minutes and two-digit seconds", () => {
    expect(createDurationLabel(51_000)).toBe("0:51");
    expect(createDurationLabel(72_000)).toBe("1:12");
  });
});

describe("createStartedLabel", () => {
  test("writes the local hour and minute", () => {
    const startedAt = new Date(2026, 9, 28, 14, 5).getTime();

    expect(createStartedLabel(startedAt)).toBe("14:05");
  });
});

describe("pickRunHeadline", () => {
  test("returns the title of the first step", () => {
    expect(pickRunHeadline(createRun())).toBe("tap Checkout");
  });

  test("returns null for a run with no steps", () => {
    expect(pickRunHeadline(createRun({ steps: [] }))).toBeNull();
  });
});

describe("pickFirstFailedDeviceId", () => {
  test("returns the device of the first failed answer", () => {
    const failedStep = createStep({
      deviceAnswers: [
        { status: "ok", deviceId: "pixel-8", durationMs: 1, shotPath: null },
        {
          status: "failed",
          deviceId: "iphone-se",
          durationMs: 1,
          message: "covered",
          shotPath: null,
        },
      ],
    });

    const deviceId = pickFirstFailedDeviceId(
      createRun({ steps: [createStep(), failedStep] }),
    );

    expect(deviceId).toBe("iphone-se");
  });

  test("returns null when no answer failed", () => {
    expect(pickFirstFailedDeviceId(createRun())).toBeNull();
  });
});

describe("countRunFindings", () => {
  test("adds the findings of every step", () => {
    const finding = {
      kind: "overflow",
      severity: "warn",
      deviceId: "iphone-se",
      selector: null,
      message: "wide",
    } as const;
    const run = createRun({
      steps: [createStep({ findings: [finding, finding] }), createStep()],
    });

    expect(countRunFindings(run)).toBe(2);
  });
});
