import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const fileLocks = new Map<string, Promise<unknown>>();

const isMissingFileError = (error: unknown): boolean =>
  error instanceof Error && "code" in error && error.code === "ENOENT";

const runAfter = async <TaskReturn>(
  previousTask: Promise<unknown> | null,
  task: () => Promise<TaskReturn>,
): Promise<TaskReturn> => {
  await Promise.allSettled([previousTask]);
  return task();
};

export const runWithFileLock = async <TaskReturn>(
  filePath: string,
  task: () => Promise<TaskReturn>,
): Promise<TaskReturn> => {
  const previousTask = fileLocks.get(filePath) ?? null;
  const currentTask = runAfter(previousTask, task);
  fileLocks.set(filePath, currentTask);
  try {
    return await currentTask;
  } finally {
    const isLastTask = fileLocks.get(filePath) === currentTask;
    if (isLastTask) fileLocks.delete(filePath);
  }
};

export const readStoredFile = async (
  filePath: string,
): Promise<string | null> => {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    const isFileMissing = isMissingFileError(error);
    if (isFileMissing) return null;
    throw error;
  }
};

export const writeStoredFile = async (
  filePath: string,
  serializedFile: string,
): Promise<void> => {
  const folderPath = dirname(filePath);
  const draftPath = `${filePath}.${randomUUID()}.draft`;
  await mkdir(folderPath, { recursive: true });
  await writeFile(draftPath, serializedFile);
  await rename(draftPath, filePath);
};
