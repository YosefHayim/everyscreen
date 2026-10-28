import type { LiveTestStatus } from "@/live/live-test-schema";

export type ScreenSource = "test-run" | "hub";
export type ScreenPhase = "following-hub" | "keeping-test-screen";

// While a test runs on a device, the hub's screencast shows the test page. After the last test ends, the hub's frames show a blank page, so the last test screen stays.
export const pickScreenPhase = (
  testStatuses: LiveTestStatus[],
): ScreenPhase => {
  const isAnyTestRunning = testStatuses.includes("running");
  return isAnyTestRunning ? "following-hub" : "keeping-test-screen";
};

export const isScreenAccepted = (
  screenSource: ScreenSource,
  screenPhase: ScreenPhase,
): boolean => {
  const isFromTestRun = screenSource === "test-run";
  const isHubFollowed = screenPhase === "following-hub";
  return isFromTestRun || isHubFollowed;
};
