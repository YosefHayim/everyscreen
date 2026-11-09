import { describe, expect, test } from "vitest";
import type { Finding } from "@/checks/checks-logic";
import type { DeviceAnswer } from "@/commands/commands-logic";
import {
  countDeviceStatuses,
  pickDeviceStatus,
} from "@/runs/device-status-logic";
import type { RunStep } from "@/runs/runs-logic";

const createOkAnswer = (deviceId: string): DeviceAnswer => ({
  status: "ok",
  deviceId,
  durationMs: 10,
  shotPath: null,
});

const createFailedAnswer = (deviceId: string): DeviceAnswer => ({
  status: "failed",
  deviceId,
  durationMs: 10,
  message: "Tap failed",
  shotPath: null,
});

const createFinding = (
  deviceId: string,
  severity: Finding["severity"],
): Finding => ({
  kind: "clipped-text",
  severity,
  deviceId,
  selector: ".price",
  message: ".price cuts its text off",
});

const createRunStep = (
  deviceAnswers: DeviceAnswer[],
  findings: Finding[],
): RunStep => ({
  stepId: "step-1",
  title: "open https://shop.example",
  startedAt: 0,
  deviceAnswers,
  findings,
  proof: null,
});

describe("pickDeviceStatus", () => {
  test("returns ok when the device has no finding and no failed answer", () => {
    const runSteps = [createRunStep([createOkAnswer("pixel-8")], [])];

    const deviceStatus = pickDeviceStatus("pixel-8", runSteps);

    expect(deviceStatus).toBe("ok");
  });

  test("returns warn when the device has a warn finding and no failed answer", () => {
    const runSteps = [
      createRunStep(
        [createOkAnswer("pixel-8")],
        [createFinding("pixel-8", "warn")],
      ),
    ];

    const deviceStatus = pickDeviceStatus("pixel-8", runSteps);

    expect(deviceStatus).toBe("warn");
  });

  test("returns failed when the device has a failed answer", () => {
    const runSteps = [createRunStep([createFailedAnswer("pixel-8")], [])];

    const deviceStatus = pickDeviceStatus("pixel-8", runSteps);

    expect(deviceStatus).toBe("failed");
  });

  test("returns failed when the device has a failed finding even with an ok answer", () => {
    const runSteps = [
      createRunStep(
        [createOkAnswer("pixel-8")],
        [createFinding("pixel-8", "failed")],
      ),
    ];

    const deviceStatus = pickDeviceStatus("pixel-8", runSteps);

    expect(deviceStatus).toBe("failed");
  });

  test("ignores findings and answers of other devices", () => {
    const runSteps = [
      createRunStep(
        [createOkAnswer("pixel-8"), createFailedAnswer("iphone-se")],
        [createFinding("iphone-se", "warn")],
      ),
    ];

    const deviceStatus = pickDeviceStatus("pixel-8", runSteps);

    expect(deviceStatus).toBe("ok");
  });
});

describe("countDeviceStatuses", () => {
  test("counts each device once by its status across all steps", () => {
    const runSteps = [
      createRunStep(
        [
          createOkAnswer("pixel-8"),
          createOkAnswer("iphone-se"),
          createFailedAnswer("ipad-mini"),
        ],
        [createFinding("iphone-se", "warn")],
      ),
      createRunStep([createOkAnswer("pixel-8")], []),
    ];

    const statusCounts = countDeviceStatuses(runSteps);

    expect(statusCounts).toEqual({ okCount: 1, warnCount: 1, failedCount: 1 });
  });

  test("returns zero counts when no step has a device", () => {
    const runSteps: RunStep[] = [];

    const statusCounts = countDeviceStatuses(runSteps);

    expect(statusCounts).toEqual({ okCount: 0, warnCount: 0, failedCount: 0 });
  });
});
