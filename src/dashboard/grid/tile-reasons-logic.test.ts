import { describe, expect, test } from "vitest";
import type { Finding } from "@/checks/checks-logic";
import type { DeviceAnswer } from "@/commands/commands-logic";
import { listTileReasons } from "@/dashboard/grid/tile-reasons-logic";
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

const createFailedAnswer = (
  deviceId: string,
  message: string,
): DeviceAnswer => ({
  status: "failed",
  deviceId,
  durationMs: 10,
  message,
  shotPath: null,
});

const createRunStep = (
  findings: Finding[],
  deviceAnswers: DeviceAnswer[] = [],
): RunStep => ({
  stepId: "step-1",
  title: "open https://shop.example",
  startedAt: 0,
  deviceAnswers,
  findings,
  proof: null,
});

describe("listTileReasons", () => {
  test("returns no reasons when the device has no finding and no failed answer", () => {
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
      { kind: "finding", findingKind: "overflow", findingCount: 2 },
      { kind: "finding", findingKind: "console-error", findingCount: 1 },
    ]);
  });

  test("lists the message of a failed answer as the reason", () => {
    const runSteps = [
      createRunStep([], [createFailedAnswer("pixel-8", "Tap on Buy failed")]),
    ];

    const tileReasons = listTileReasons("pixel-8", runSteps);

    expect(tileReasons).toEqual([
      { kind: "answer", message: "Tap on Buy failed" },
    ]);
  });

  test("lists the failed answer before the finding counts", () => {
    const runSteps = [
      createRunStep(
        [createFinding("pixel-8", "overflow")],
        [createFailedAnswer("pixel-8", "Tap on Buy failed")],
      ),
    ];

    const tileReasons = listTileReasons("pixel-8", runSteps);

    expect(tileReasons).toEqual([
      { kind: "answer", message: "Tap on Buy failed" },
      { kind: "finding", findingKind: "overflow", findingCount: 1 },
    ]);
  });

  test("ignores failed answers of other devices", () => {
    const runSteps = [
      createRunStep([], [createFailedAnswer("iphone-se", "Tap on Buy failed")]),
    ];

    const tileReasons = listTileReasons("pixel-8", runSteps);

    expect(tileReasons).toEqual([]);
  });
});
