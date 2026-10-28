import { describe, expect, test } from "vitest";
import { runSchema } from "@/runs/run-schema";

const OLD_RUN_FILE = {
  runId: "run-0001",
  origin: "cli",
  status: "ok",
  startedAt: 1,
  steps: [],
};

describe("runSchema", () => {
  test("reads a run file without a run kind as a steps run", () => {
    const run = runSchema.parse(OLD_RUN_FILE);

    expect(run.runKind).toBe("steps");
  });

  test("keeps the run kind a run file names", () => {
    const run = runSchema.parse({ ...OLD_RUN_FILE, runKind: "sweep" });

    expect(run.runKind).toBe("sweep");
  });
});
