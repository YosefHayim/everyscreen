import type { LiveTestStatus } from "@/live/live-test-schema";

export interface DeviceTest {
  deviceId: string;
  testId: string;
  title: string;
  specFile: string;
  status: LiveTestStatus;
  errorLine: string | null;
}

// Parallel tests can run on one device, so the tile follows the newest running one.
export const pickTileTest = (deviceTests: DeviceTest[]): DeviceTest | null => {
  const runningTests = deviceTests.filter(({ status }) => status === "running");
  const newestRunningTest = runningTests.at(-1);
  const hasRunningTest = newestRunningTest !== undefined;
  if (hasRunningTest) return newestRunningTest;
  return deviceTests.at(-1) ?? null;
};
