import { existsSync, readFileSync } from "node:fs";

// A config file is plain sync code, so the files are read with readFileSync.
export const readOptionalFile = (filePath: string): string | null => {
  const isFileMissing = !existsSync(filePath);
  if (isFileMissing) return null;
  return readFileSync(filePath, "utf8");
};
