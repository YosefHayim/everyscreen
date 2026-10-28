import { describe, expect, test } from "vitest";
import type { Finding } from "@/checks/checks-logic";
import { pickTileStatus } from "@/dashboard/grid/tile-status-logic";
import type { DeviceLoad } from "@/estimates/estimates-logic";

const createFinding = (
  deviceId: string,
  severity: Finding["severity"],
): Finding => ({
  kind: "overflow",
  severity,
  deviceId,
  selector: null,
  message: "Wider than the screen",
});

const createDeviceLoad = (status: DeviceLoad["status"]): DeviceLoad => ({
  label: "est.",
  fps: 60,
  cpuPercent: 20,
  memoryMegabytes: 100,
  layoutShift: 0,
  status,
});

describe("pickTileStatus", () => {
  test("is ok with no findings and no device load", () => {
    const tileStatus = pickTileStatus("iphone-se", [], null);

    expect(tileStatus).toBe("ok");
  });

  test("is ok when only other devices have findings", () => {
    const findings = [createFinding("pixel-8", "failed")];

    const tileStatus = pickTileStatus("iphone-se", findings, null);

    expect(tileStatus).toBe("ok");
  });

  test("is warn when the device has a warn finding", () => {
    const findings = [createFinding("iphone-se", "warn")];

    const tileStatus = pickTileStatus("iphone-se", findings, null);

    expect(tileStatus).toBe("warn");
  });

  test("is failed when the device has a failed finding next to a warn one", () => {
    const findings = [
      createFinding("iphone-se", "warn"),
      createFinding("iphone-se", "failed"),
    ];

    const tileStatus = pickTileStatus("iphone-se", findings, null);

    expect(tileStatus).toBe("failed");
  });

  test("is warn when the device load is warn", () => {
    const tileStatus = pickTileStatus(
      "iphone-se",
      [],
      createDeviceLoad("warn"),
    );

    expect(tileStatus).toBe("warn");
  });

  test("is ok when the device load is ok", () => {
    const tileStatus = pickTileStatus("iphone-se", [], createDeviceLoad("ok"));

    expect(tileStatus).toBe("ok");
  });
});
