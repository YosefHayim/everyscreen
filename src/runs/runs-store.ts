import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { STORE_FOLDER } from "@/environment";
import type { Run } from "@/runs/runs-logic";

const RUNS_SUBFOLDER = "runs";
const SHOTS_SUBFOLDER = "shots";
const RUN_FILE_EXTENSION = ".json";
const MISSING_FILE_CODE = "ENOENT";

const pickRunsFolder = (rootFolder: string): string =>
  join(rootFolder, STORE_FOLDER, RUNS_SUBFOLDER);

const pickRunPath = (rootFolder: string, runId: string): string =>
  join(pickRunsFolder(rootFolder), `${runId}${RUN_FILE_EXTENSION}`);

export const pickShotsFolder = (rootFolder: string): string =>
  join(rootFolder, STORE_FOLDER, SHOTS_SUBFOLDER);

export const listRunIds = async (rootFolder: string): Promise<string[]> => {
  const runsFolder = pickRunsFolder(rootFolder);
  await mkdir(runsFolder, { recursive: true });
  const fileNames = await readdir(runsFolder);
  const runFileNames = fileNames.filter((fileName) =>
    fileName.endsWith(RUN_FILE_EXTENSION),
  );
  return runFileNames
    .map((fileName) => basename(fileName, RUN_FILE_EXTENSION))
    .sort();
};

export const writeRun = async (rootFolder: string, run: Run): Promise<void> => {
  await mkdir(pickRunsFolder(rootFolder), { recursive: true });
  const serializedRun = JSON.stringify(run, null, 2);
  await writeFile(pickRunPath(rootFolder, run.runId), serializedRun);
};

export const readRun = async (
  rootFolder: string,
  runId: string,
): Promise<Run | null> => {
  try {
    const serializedRun = await readFile(
      pickRunPath(rootFolder, runId),
      "utf8",
    );
    return JSON.parse(serializedRun) as Run;
  } catch (error) {
    const isFileMissing =
      error instanceof Error &&
      "code" in error &&
      error.code === MISSING_FILE_CODE;
    if (isFileMissing) return null;
    throw error;
  }
};

export const listRuns = async (rootFolder: string): Promise<Run[]> => {
  const runIds = await listRunIds(rootFolder);
  const runs = await Promise.all(
    runIds.map((runId) => readRun(rootFolder, runId)),
  );
  return runs.filter((run) => run !== null);
};
