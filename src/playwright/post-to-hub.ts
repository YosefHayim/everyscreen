import { LIVE_TESTS_PATH } from "@/environment";
import type {
  RunTotals,
  StepEvent,
  TestEvent,
  TestScreen,
  TestsClear,
} from "@/live/live-test-schema";
import type { ReportHubTrouble } from "@/playwright/report-hub-trouble";

const POST_TIMEOUT_MS = 2000;
const END_WAIT_TIMEOUT_MS = 5000;
const JSON_CONTENT_TYPE = "application/json";

export interface HubTarget {
  hubUrl: string;
  reportTrouble: ReportHubTrouble;
}

export const postToHub = async (
  hubTarget: HubTarget,
  routePath: string,
  message: TestEvent | StepEvent | RunTotals | TestScreen | TestsClear,
): Promise<boolean> => {
  const { hubUrl, reportTrouble } = hubTarget;
  try {
    const hubReply = await fetch(`${hubUrl}${LIVE_TESTS_PATH}${routePath}`, {
      method: "POST",
      headers: { "Content-Type": JSON_CONTENT_TYPE },
      body: JSON.stringify(message),
      signal: AbortSignal.timeout(POST_TIMEOUT_MS),
    });
    const isHubReplyFailed = !hubReply.ok;
    if (isHubReplyFailed)
      throw new Error(`The hub answered ${hubReply.status}`);
    return true;
  } catch (error) {
    reportTrouble(error);
    return false;
  }
};

// A hung hub must not hold the end of the user's test run for longer than this.
export const waitForHubPosts = async (
  hubPosts: Promise<unknown>[],
): Promise<void> => {
  const endSignal = AbortSignal.timeout(END_WAIT_TIMEOUT_MS);
  const endTimeout = new Promise<void>((finish) => {
    endSignal.addEventListener("abort", () => finish(), { once: true });
  });
  await Promise.race([Promise.all(hubPosts), endTimeout]);
};
