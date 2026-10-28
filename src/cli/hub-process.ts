import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, open, rm } from "node:fs/promises";
import { join } from "node:path";
import { setTimeout as wait } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import {
  createHubDownReply,
  createPortConflictReply,
  createReadyLine,
  createReply,
  createRunningLine,
  isPortConflict,
} from "@/cli/cli-logic";
import {
  countDevices,
  createHubUrl,
  isHubAnswering,
  readHubFile,
} from "@/cli/hub-client";
import type { CommandReply } from "@/commands/commands-logic";
import { HUB_FILE_PATH, HUB_PORT, STORE_FOLDER } from "@/environment";
import type { HubFile } from "@/hub/hub-file";
import { startHub } from "@/hub/hub-server";

const HUB_LOG_PATH = `${STORE_FOLDER}/hub.log`;
const START_TIMEOUT_MS = 180_000;
const STOP_TIMEOUT_MS = 30_000;
const POLL_INTERVAL_MS = 200;

// Built code runs from dist/cli.mjs, so the dashboard sits next to it.
const isBuiltCli = import.meta.url.endsWith(".mjs");
const DASHBOARD_FOLDER = fileURLToPath(
  new URL(isBuiltCli ? "./dashboard" : "../../dist/dashboard", import.meta.url),
);

export const isProcessAlive = (processId: number): boolean => {
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
  const isBeforeDeadline = () => Date.now() < giveUpAt;
  while (isBeforeDeadline()) {
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
  const hubLog = await open(join(rootFolder, HUB_LOG_PATH), "a");
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
  try {
    // once() rejects when the process emits "error" (ENOENT, EAGAIN) before it spawns.
    await once(hubProcess, "spawn");
  } finally {
    await hubLog.close();
  }
  hubProcess.unref();
  const hubProcessId = hubProcess.pid;
  const hasSpawnFailed = hubProcessId === undefined;
  if (hasSpawnFailed) throw new Error("The hub process did not start");
  return hubProcessId;
};

export const startHubInBackground = async (
  rootFolder: string,
  requestedPort: number | null,
): Promise<CommandReply> => {
  const oldHubFile = await readHubFile(rootFolder);
  const hasOldHubFile = oldHubFile !== null;
  const isOldHubRunning = hasOldHubFile && (await isHubAnswering(oldHubFile));
  if (isOldHubRunning) {
    const oldHubUrl = createHubUrl(oldHubFile);
    const hasPortConflict = isPortConflict(requestedPort, oldHubFile.port);
    if (hasPortConflict) return createPortConflictReply(oldHubUrl);
    const oldDeviceCount = countDevices(oldHubFile);
    const runningLine = createRunningLine(oldHubUrl, oldDeviceCount);
    return createReply("ok", runningLine);
  }
  await rm(join(rootFolder, HUB_FILE_PATH), { force: true });

  const hubPort = requestedPort ?? HUB_PORT;
  const hubProcessId = await spawnHubProcess(rootFolder, hubPort);
  const hubFile = await waitForHubFile(rootFolder, hubProcessId);
  const hasHubStarted = hubFile !== null;
  if (!hasHubStarted) {
    return createReply("failed", `hub did not start · see ${HUB_LOG_PATH}`);
  }
  const hubUrl = createHubUrl(hubFile);
  const deviceCount = countDevices(hubFile);
  return createReply("ok", createReadyLine(hubUrl, deviceCount));
};

export const startHubInForeground = async (
  rootFolder: string,
  requestedPort: number | null,
): Promise<CommandReply> => {
  const runningHub = await startHub({
    rootFolder,
    port: requestedPort ?? HUB_PORT,
    dashboardFolder: DASHBOARD_FOLDER,
  });
  const stopHubOnSignal = async (): Promise<void> => {
    try {
      await runningHub.stop();
    } catch (error) {
      console.error({ error });
    }
  };
  process.once("SIGTERM", stopHubOnSignal);
  process.once("SIGINT", stopHubOnSignal);
  const hubFile = await readHubFile(rootFolder);
  const isHubFileMissing = hubFile === null;
  if (isHubFileMissing) throw new Error("The hub did not write its hub file");
  const deviceCount = countDevices(hubFile);
  return createReply("ok", createReadyLine(runningHub.url, deviceCount));
};

export const stopHub = async (rootFolder: string): Promise<CommandReply> => {
  const hubFile = await readHubFile(rootFolder);
  const isHubFileMissing = hubFile === null;
  if (isHubFileMissing) return createHubDownReply();
  // After a crash the process id can belong to another program, so ask the hub first.
  const isHubRunning = await isHubAnswering(hubFile);
  if (!isHubRunning) {
    await rm(join(rootFolder, HUB_FILE_PATH), { force: true });
    return createHubDownReply();
  }

  process.kill(hubFile.pid, "SIGTERM");
  const giveUpAt = Date.now() + STOP_TIMEOUT_MS;
  const isWaitingForExit = () =>
    isProcessAlive(hubFile.pid) && Date.now() < giveUpAt;
  while (isWaitingForExit()) {
    await wait(POLL_INTERVAL_MS);
  }
  const isHubStillRunning = isProcessAlive(hubFile.pid);
  if (isHubStillRunning) {
    return createReply("failed", `hub did not stop · pid ${hubFile.pid}`);
  }
  return createReply("ok", "hub stopped");
};
