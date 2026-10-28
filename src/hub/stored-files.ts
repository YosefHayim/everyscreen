import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const isMissingFileError = (error: unknown): boolean =>
  error instanceof Error && "code" in error && error.code === "ENOENT";

export const readStoredBytes = async (
  filePath: string,
): Promise<Buffer | null> => {
  try {
    return await readFile(filePath);
  } catch (error) {
    const isFileMissing = isMissingFileError(error);
    if (isFileMissing) return null;
    throw error;
  }
};

export const readStoredFile = async (
  filePath: string,
): Promise<string | null> => {
  const fileBytes = await readStoredBytes(filePath);
  const isFileMissing = fileBytes === null;
  if (isFileMissing) return null;
  return fileBytes.toString("utf8");
};

export const writeStoredFile = async (
  filePath: string,
  fileBytes: string | Uint8Array,
): Promise<void> => {
  const folderPath = dirname(filePath);
  const draftPath = `${filePath}.${randomUUID()}.draft`;
  await mkdir(folderPath, { recursive: true });
  await writeFile(draftPath, fileBytes);
  await rename(draftPath, filePath);
};
