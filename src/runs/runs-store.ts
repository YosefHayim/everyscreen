import { glob } from "node:fs/promises";
import { basename, join } from "node:path";
import { STORE_FOLDER } from "@/environment";
import { runOneAtATime } from "@/hub/run-one-at-a-time";
import { readStoredFile, writeStoredFile } from "@/hub/stored-files";
import { runSchema } from "@/runs/run-schema";
import {
  checkRunEvent,
  mergeRunEvent,
  pickNextRunId,
  type Run,
  type RunEvent,
  type RunKind,
  type RunOrigin,
} from "@/runs/runs-logic";

const RUNS_SUBFOLDER = "runs";
const RUN_FILE_EXTENSION = ".json";
const RUN_FILE_PATTERN = `*${RUN_FILE_EXTENSION}`;

const pickRunsFolder = (rootFolder: string): string =>
  join(rootFolder, STORE_FOLDER, RUNS_SUBFOLDER);

const pickRunFilePath = (rootFolder: string, runId: string): string =>
  join(pickRunsFolder(rootFolder), `${runId}${RUN_FILE_EXTENSION}`);

const listRunIds = async (rootFolder: string): Promise<string[]> => {
  const runIds: string[] = [];
  const runFileNames = glob(RUN_FILE_PATTERN, {
    cwd: pickRunsFolder(rootFolder),
  });
  for await (const runFileName of runFileNames) {
    runIds.push(basename(runFileName, RUN_FILE_EXTENSION));
  }
  return runIds.sort();
};

const writeRun = async (rootFolder: string, run: Run): Promise<void> => {
  const serializedRun = JSON.stringify(run, null, 2);
  await writeStoredFile(pickRunFilePath(rootFolder, run.runId), serializedRun);
};

export const readRun = async (
  rootFolder: string,
  runId: string,
): Promise<Run | null> => {
  const serializedRun = await readStoredFile(
    pickRunFilePath(rootFolder, runId),
  );
  const isRunMissing = serializedRun === null;
  if (isRunMissing) {
    return null;
  }
  return runSchema.parse(JSON.parse(serializedRun));
};

export const listRuns = async (rootFolder: string): Promise<Run[]> => {
  const runIds = await listRunIds(rootFolder);
  const runs: Run[] = [];
  for (const runId of runIds) {
    try {
      const run = await readRun(rootFolder, runId);
      const isRunFound = run !== null;
      if (isRunFound) {
        runs.push(run);
      }
    } catch (error) {
      console.error({ runId, error });
    }
  }
  return runs;
};

export const createRun = async (
  rootFolder: string,
  origin: RunOrigin,
  runKind: RunKind,
): Promise<Run> => {
  return runOneAtATime(pickRunsFolder(rootFolder), async () => {
    const runIds = await listRunIds(rootFolder);
    const run: Run = {
      runId: pickNextRunId(runIds),
      origin,
      runKind,
      status: "running",
      startedAt: Date.now(),
      steps: [],
    };
    await writeRun(rootFolder, run);
    return run;
  });
};

export const saveRunEvent = async (
  rootFolder: string,
  runId: string,
  runEvent: RunEvent,
): Promise<Run> => {
  const runFilePath = pickRunFilePath(rootFolder, runId);
  return runOneAtATime(runFilePath, async () => {
    const savedRun = await readRun(rootFolder, runId);
    const checkedRun = checkRunEvent(savedRun, runEvent);
    const mergedRun = mergeRunEvent(checkedRun, runEvent);
    await writeRun(rootFolder, mergedRun);
    return mergedRun;
  });
};
