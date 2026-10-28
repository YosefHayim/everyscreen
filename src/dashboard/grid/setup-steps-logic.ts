import type { ConnectionStatus } from "@/dashboard/device-feed/live-store";

export type SetupStepStatus = "done" | "now" | "later";
export type SetupStepKey = "startHub" | "openApp" | "runTests";

export interface SetupStepProgress {
  stepKey: SetupStepKey;
  status: SetupStepStatus;
}

const pickOpenStatus = (
  isHubOpen: boolean,
  hasScreenImage: boolean,
): SetupStepStatus => {
  const isAppOpened = isHubOpen && hasScreenImage;
  if (isAppOpened) return "done";
  if (isHubOpen) return "now";
  return "later";
};

const pickTestsStatus = (
  isAppOpened: boolean,
  hasRun: boolean,
): SetupStepStatus => {
  if (hasRun) return "done";
  if (isAppOpened) return "now";
  return "later";
};

export const pickSetupStepProgress = (
  liveStatus: ConnectionStatus,
  hasScreenImage: boolean,
  hasRun: boolean,
): SetupStepProgress[] => {
  const isHubOpen = liveStatus === "open";
  const hubStatus: SetupStepStatus = isHubOpen ? "done" : "now";
  const openStatus = pickOpenStatus(isHubOpen, hasScreenImage);
  const isAppOpened = openStatus === "done";
  const testsStatus = pickTestsStatus(isAppOpened, hasRun);

  return [
    { stepKey: "startHub", status: hubStatus },
    { stepKey: "openApp", status: openStatus },
    { stepKey: "runTests", status: testsStatus },
  ];
};

export const isOpenAppCardShown = (
  liveStatus: ConnectionStatus,
  hasScreenImage: boolean,
): boolean => {
  const isHubOpen = liveStatus === "open";
  const openStatus = pickOpenStatus(isHubOpen, hasScreenImage);
  return openStatus !== "done";
};

export const isSetupGuideShown = (hasRun: boolean): boolean => !hasRun;
