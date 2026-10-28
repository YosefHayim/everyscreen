import { HUB_FILE_PATH } from "@/environment";
import { type HubFile, hubFileSchema } from "@/hub/hub-file";
import { readOptionalFile } from "@/playwright/read-optional-file";

export const readHubFile = (): HubFile | null => {
  const serializedHubFile = readOptionalFile(HUB_FILE_PATH);
  const isHubFileMissing = serializedHubFile === null;
  if (isHubFileMissing) return null;

  const hubFileDocument: unknown = JSON.parse(serializedHubFile);
  return hubFileSchema.parse(hubFileDocument);
};
