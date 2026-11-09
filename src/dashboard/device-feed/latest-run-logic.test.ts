import { describe, expect, test } from "vitest";
import { pickLatestRunSteps } from "@/dashboard/device-feed/latest-run-logic";
import type { Run, RunStep } from "@/runs/runs-logic";

const createRunStep = (stepId: string): RunStep => ({
  stepId,
  title: "open https://shop.example",
  startedAt: 0,
  deviceAnswers: [],
  findings: [],
  proof: null,
});

const createRun = (
  runId: string,
  startedAt: number,
  steps: RunStep[],
): Run => ({
  runId,
  origin: "cli",
  runKind: "steps",
  status: "ok",
  startedAt,
  steps,
});

describe("pickLatestRunSteps", () => {
  test("returns no steps when there is no run yet", () => {
    const runs: Run[] = [];

    const latestRunSteps = pickLatestRunSteps(runs);

    expect(latestRunSteps).toEqual([]);
  });

  test("returns the steps of the run that started last, whatever the list order", () => {
    const olderRun = createRun("run-0001", 1000, [createRunStep("step-1")]);
    const newerRun = createRun("run-0002", 2000, [
      createRunStep("step-2"),
      createRunStep("step-3"),
    ]);

    const latestRunSteps = pickLatestRunSteps([olderRun, newerRun]);

    expect(latestRunSteps.map((runStep) => runStep.stepId)).toEqual([
      "step-2",
      "step-3",
    ]);
  });
});
