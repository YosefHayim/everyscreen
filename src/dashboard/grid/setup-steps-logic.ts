import type { ConnectionStatus } from "@/dashboard/live/live-store";

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

export const pickSetupStepProgress = (
  liveStatus: ConnectionStatus,
  hasScreenImage: boolean,
): SetupStepProgress[] => {
  const isHubOpen = liveStatus === "open";
  const hubStatus: SetupStepStatus = isHubOpen ? "done" : "now";
  const openStatus = pickOpenStatus(isHubOpen, hasScreenImage);
  const isAppOpened = openStatus === "done";
  const testsStatus: SetupStepStatus = isAppOpened ? "now" : "later";

  return [
    { stepKey: "startHub", status: hubStatus },
    { stepKey: "openApp", status: openStatus },
    { stepKey: "runTests", status: testsStatus },
  ];
};
