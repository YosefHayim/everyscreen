import { LIVE_TESTS_PATH } from "@/environment";
import type {
  TestEvent,
  TestScreen,
  TestsClear,
} from "@/live/live-test-schema";
import type { ReportHubTrouble } from "@/playwright/report-hub-trouble";

const POST_TIMEOUT_MS = 2000;
const JSON_CONTENT_TYPE = "application/json";

export interface HubTarget {
  hubUrl: string;
  reportTrouble: ReportHubTrouble;
}

export const postToHub = async (
  hubTarget: HubTarget,
  routePath: string,
  message: TestEvent | TestScreen | TestsClear,
): Promise<void> => {
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
  } catch (error) {
    reportTrouble(error);
  }
};
