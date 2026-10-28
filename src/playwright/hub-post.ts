import { HUB_HOST, LIVE_TESTS_PATH } from "@/environment";
import { readHubFile } from "@/playwright/hub-link";

const POST_TIMEOUT_MS = 2000;
const JSON_CONTENT_TYPE = "application/json";

const hubTrouble = { isReported: false };

// A hub that is down must never fail the user's tests, so the trouble is logged one time.
export const reportHubTroubleOnce = (error: unknown): void => {
  if (hubTrouble.isReported) return;
  hubTrouble.isReported = true;
  console.error({
    message:
      "Everyscreen could not reach the hub, so the tests run on without live updates",
    error,
  });
};

export const postToHub = async (
  routePath: string,
  message: object,
): Promise<void> => {
  try {
    const hubFile = readHubFile();
    const isHubFileMissing = hubFile === null;
    if (isHubFileMissing) throw new Error("No hub file, is the hub running?");

    const hubReply = await fetch(
      `http://${HUB_HOST}:${hubFile.port}${LIVE_TESTS_PATH}${routePath}`,
      {
        method: "POST",
        headers: { "Content-Type": JSON_CONTENT_TYPE },
        body: JSON.stringify(message),
        signal: AbortSignal.timeout(POST_TIMEOUT_MS),
      },
    );
    if (!hubReply.ok) throw new Error(`The hub answered ${hubReply.status}`);
  } catch (error) {
    reportHubTroubleOnce(error);
  }
};
