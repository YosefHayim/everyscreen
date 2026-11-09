import { describe, expect, test } from "vitest";
import type { Finding } from "@/checks/checks-logic";
import { listTileReasons } from "@/dashboard/grid/tile-status-logic";
import type { RunStep } from "@/runs/runs-logic";

const createFinding = (
  deviceId: string,
  kind: Finding["kind"] = "overflow",
): Finding => ({
  kind,
  severity: "warn",
  deviceId,
  selector: null,
  message: "Wider than the screen",
});

const createRunStep = (findings: Finding[]): RunStep => ({
  stepId: "step-1",
  title: "open https://shop.example",
  startedAt: 0,
  deviceAnswers: [],
  findings,
  proof: null,
});

describe("listTileReasons", () => {
  test("returns no reasons when the device has no finding", () => {
    const runSteps = [createRunStep([createFinding("pixel-8")])];

    const tileReasons = listTileReasons("iphone-se", runSteps);

    expect(tileReasons).toEqual([]);
  });

  test("counts the findings of each kind for the device across steps", () => {
    const runSteps = [
      createRunStep([
        createFinding("pixel-8", "overflow"),
        createFinding("pixel-8", "console-error"),
      ]),
      createRunStep([createFinding("pixel-8", "overflow")]),
    ];

    const tileReasons = listTileReasons("pixel-8", runSteps);

    expect(tileReasons).toEqual([
      { findingKind: "overflow", findingCount: 2 },
      { findingKind: "console-error", findingCount: 1 },
    ]);
  });
});
