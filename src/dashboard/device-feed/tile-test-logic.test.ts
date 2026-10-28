import { describe, expect, test } from "vitest";
import { type DeviceTest, pickTileTest } from "./tile-test-logic";

const createTest = (changes: Partial<DeviceTest> = {}): DeviceTest => ({
  deviceId: "pixel-10",
  testId: "a1",
  title: "pays",
  specFile: "shop.spec.ts",
  status: "ok",
  errorLine: null,
  ...changes,
});

describe("pickTileTest", () => {
  test("gives nothing when the device ran no test", () => {
    expect(pickTileTest([])).toBeNull();
  });

  test("gives the only test", () => {
    const onlyTest = createTest();

    expect(pickTileTest([onlyTest])).toBe(onlyTest);
  });

  test("gives the newest running test over a newer finished one", () => {
    const firstRunning = createTest({ testId: "a1", status: "running" });
    const secondRunning = createTest({ testId: "a2", status: "running" });
    const newestFinished = createTest({ testId: "a3", status: "failed" });

    const tileTest = pickTileTest([
      firstRunning,
      secondRunning,
      newestFinished,
    ]);

    expect(tileTest).toBe(secondRunning);
  });

  test("gives the newest finished test when none is running", () => {
    const olderTest = createTest({ testId: "a1" });
    const newestTest = createTest({ testId: "a2", status: "failed" });

    expect(pickTileTest([olderTest, newestTest])).toBe(newestTest);
  });
});
