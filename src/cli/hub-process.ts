import { spawn } from "node:child_process";
import { mkdir, open, rm } from "node:fs/promises";
import { join } from "node:path";
import { setTimeout as wait } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import {
  createHubDownReply,
  createReadyLine,
  createReply,
  createRunningLine,
} from "@/cli/cli-logic";
import { createHubUrl, readHubFile } from "@/cli/hub-client";
import type { CommandReply } from "@/commands/commands-logic";
import { HUB_FILE_PATH, STORE_FOLDER } from "@/environment";
import type { HubFile } from "@/hub/hub-file";
import { startHub } from "@/hub/hub-server";

const HUB_LOG_FILE = "hub.log";
const START_TIMEOUT_MS = 180_000;
const STOP_TIMEOUT_MS = 30_000;
const POLL_INTERVAL_MS = 200;

// Built code runs from dist/cli.mjs, so the dashboard sits next to it.
const isBuiltCli = import.meta.url.endsWith(".mjs");
const DASHBOARD_FOLDER = fileURLToPath(
  new URL(isBuiltCli ? "./dashboard" : "../../dist/dashboard", import.meta.url),
);

const isProcessAlive = (processId: number): boolean => {
  try {
    process.kill(processId, 0);
    return true;
  } catch (error) {
    const isProcessMissing =
      error instanceof Error && "code" in error && error.code === "ESRCH";
    if (isProcessMissing) return false;
    throw error;
  }
};

const waitForHubFile = async (
  rootFolder: string,
  hubProcessId: number,
): Promise<HubFile | null> => {
  const giveUpAt = Date.now() + START_TIMEOUT_MS;
  while (Date.now() < giveUpAt) {
    const hubFile = await readHubFile(rootFolder);
    const isHubReady = hubFile !== null && hubFile.pid === hubProcessId;
    if (isHubReady) return hubFile;
    const hasHubExited = !isProcessAlive(hubProcessId);
    if (hasHubExited) return null;
    await wait(POLL_INTERVAL_MS);
  }
  return null;
};

const spawnHubProcess = async (
  rootFolder: string,
  port: number,
): Promise<number> => {
  await mkdir(join(rootFolder, STORE_FOLDER), { recursive: true });
  const hubLog = await open(join(rootFolder, STORE_FOLDER, HUB_LOG_FILE), "a");
  const [, cliPath] = process.argv;
  const hubProcess = spawn(
    process.execPath,
    [
      ...process.execArgv,
      cliPath,
      "start",
      "--foreground",
      "--port",
      String(port),
    ],
    {
      cwd: rootFolder,
      detached: true,
      stdio: ["ignore", hubLog.fd, hubLog.fd],
    },
  );
  hubProcess.unref();
  await hubLog.close();
  const hubProcessId = hubProcess.pid;
  const hasSpawnFailed = hubProcessId === undefined;
  if (hasSpawnFailed) throw new Error("The hub process did not start");
  return hubProcessId;
};

export const startHubInBackground = async (
  rootFolder: string,
  port: number,
): Promise<CommandReply> => {
  const oldHubFile = await readHubFile(rootFolder);
  const hasOldHubFile = oldHubFile !== null;
  const isOldHubRunning = hasOldHubFile && isProcessAlive(oldHubFile.pid);
  if (isOldHubRunning) {
    const deviceCount = Object.keys(oldHubFile.devices).length;
    return createReply(
      "ok",
      createRunningLine(createHubUrl(oldHubFile), deviceCount),
    );
  }
  await rm(join(rootFolder, HUB_FILE_PATH), { force: true });

  const hubProcessId = await spawnHubProcess(rootFolder, port);
  const hubFile = await waitForHubFile(rootFolder, hubProcessId);
  const hasHubStarted = hubFile !== null;
  if (!hasHubStarted) {
    return createReply(
      "failed",
      `hub did not start · see ${STORE_FOLDER}/${HUB_LOG_FILE}`,
    );
  }
  const deviceCount = Object.keys(hubFile.devices).length;
  return createReply("ok", createReadyLine(createHubUrl(hubFile), deviceCount));
};

export const startHubInForeground = async (
  rootFolder: string,
  port: number,
): Promise<CommandReply> => {
  const runningHub = await startHub({
    rootFolder,
    port,
    dashboardFolder: DASHBOARD_FOLDER,
  });
  const stopHubOnSignal = async (): Promise<void> => {
    await runningHub.stop();
  };
  process.once("SIGTERM", stopHubOnSignal);
  process.once("SIGINT", stopHubOnSignal);
  const hubFile = await readHubFile(rootFolder);
  const isHubFileMissing = hubFile === null;
  if (isHubFileMissing) throw new Error("The hub did not write its hub file");
  const deviceCount = Object.keys(hubFile.devices).length;
  return createReply("ok", createReadyLine(runningHub.url, deviceCount));
};

export const stopHub = async (rootFolder: string): Promise<CommandReply> => {
  const hubFile = await readHubFile(rootFolder);
  const isHubFileMissing = hubFile === null;
  if (isHubFileMissing) return createHubDownReply();
  const isHubRunning = isProcessAlive(hubFile.pid);
  if (!isHubRunning) {
    await rm(join(rootFolder, HUB_FILE_PATH), { force: true });
    return createHubDownReply();
  }

  process.kill(hubFile.pid, "SIGTERM");
  const giveUpAt = Date.now() + STOP_TIMEOUT_MS;
  while (isProcessAlive(hubFile.pid) && Date.now() < giveUpAt) {
    await wait(POLL_INTERVAL_MS);
  }
  const isHubStillRunning = isProcessAlive(hubFile.pid);
  if (isHubStillRunning) {
    return createReply("failed", `hub did not stop · pid ${hubFile.pid}`);
  }
  return createReply("ok", "hub stopped");
};
