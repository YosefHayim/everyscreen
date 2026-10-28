import { HUB_FILE_PATH } from "@/environment";
import { type HubFile, hubFileSchema } from "@/hub/hub-file";
import { readOptionalFile } from "@/playwright/read-optional-file";
import type { ReportHubTrouble } from "@/playwright/report-hub-trouble";

export const readHubFile = (): HubFile | null => {
  const serializedHubFile = readOptionalFile(HUB_FILE_PATH);
  const isHubFileMissing = serializedHubFile === null;
  if (isHubFileMissing) return null;

  const hubFileDocument: unknown = JSON.parse(serializedHubFile);
  return hubFileSchema.parse(hubFileDocument);
};

// A half-written hub file must not fail the user's tests.
export const readHubFileSafely = (
  reportTrouble: ReportHubTrouble,
): HubFile | null => {
  try {
    return readHubFile();
  } catch (error) {
    reportTrouble(error);
    return null;
  }
};
