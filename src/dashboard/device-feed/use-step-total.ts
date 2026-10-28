import { useSyncExternalStore } from "react";
import { getStepTotal, subscribe } from "@/dashboard/device-feed/live-store";

const readStepTotal = (testTitle: string | null): number | null => {
  const hasNoTestTitle = testTitle === null;
  if (hasNoTestTitle) return null;
  return getStepTotal(testTitle);
};

export const useStepTotal = (testTitle: string | null): number | null =>
  useSyncExternalStore(subscribe, () => readStepTotal(testTitle));
