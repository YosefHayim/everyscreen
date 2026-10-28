import { join } from "node:path";
import { hc } from "hono/client";
import { z } from "zod";
import { createHubDownReply, createReply } from "@/cli/cli-logic";
import type { CommandReply } from "@/commands/commands-logic";
import type { HubCommand } from "@/commands/commands-schema";
import { HUB_FILE_PATH, HUB_HOST } from "@/environment";
import type { HubApp } from "@/hub/hub-app";
import { type HubFile, hubFileSchema } from "@/hub/hub-file";
import { readStoredFile } from "@/hub/stored-files";

const ANSWER_TIMEOUT_MS = 3000;
const LOST_CONNECTION_CODES = ["ECONNREFUSED", "ECONNRESET"];

const problemSchema = z.object({ detail: z.string() });

const createHubClient = (hubUrl: string) => hc<HubApp>(hubUrl);

export type HubClient = ReturnType<typeof createHubClient>;

export const createHubUrl = (hubFile: HubFile): string =>
  `http://${HUB_HOST}:${hubFile.port}`;

export const countDevices = (hubFile: HubFile): number =>
  Object.keys(hubFile.devices).length;

export const readHubFile = async (
  rootFolder: string,
): Promise<HubFile | null> => {
  const serializedHubFile = await readStoredFile(
    join(rootFolder, HUB_FILE_PATH),
  );
  const isHubFileMissing = serializedHubFile === null;
  if (isHubFileMissing) return null;
  const hubFileDocument: unknown = JSON.parse(serializedHubFile);
  return hubFileSchema.parse(hubFileDocument);
};

const isConnectionLost = (error: unknown): boolean => {
  const isFetchError = error instanceof TypeError;
  if (!isFetchError) return false;
  const lostCause = error.cause;
  const hasCode = lostCause instanceof Error && "code" in lostCause;
  if (!hasCode) return false;
  return LOST_CONNECTION_CODES.includes(String(lostCause.code));
};

const isAnswerTimeout = (error: unknown): boolean =>
  error instanceof DOMException && error.name === "TimeoutError";

export const readProblemReply = async (
  problemReply: Response,
): Promise<CommandReply> => {
  const problemDocument: unknown = await problemReply.json();
  const problem = problemSchema.parse(problemDocument);
  return createReply("failed", problem.detail);
};

// A hub file can outlive a crashed hub, so only a hub that answers counts as running.
export const isHubAnswering = async (hubFile: HubFile): Promise<boolean> => {
  const hubClient = createHubClient(createHubUrl(hubFile));
  try {
    await hubClient.api.devices.$get(
      {},
      { init: { signal: AbortSignal.timeout(ANSWER_TIMEOUT_MS) } },
    );
    return true;
  } catch (error) {
    const isHubSilent = isConnectionLost(error) || isAnswerTimeout(error);
    if (isHubSilent) return false;
    throw error;
  }
};

export const callHub = async (
  rootFolder: string,
  askHubClient: (hubClient: HubClient, hubUrl: string) => Promise<CommandReply>,
): Promise<CommandReply> => {
  const hubFile = await readHubFile(rootFolder);
  const isHubFileMissing = hubFile === null;
  if (isHubFileMissing) return createHubDownReply();
  const hubUrl = createHubUrl(hubFile);
  const hubClient = createHubClient(hubUrl);
  try {
    return await askHubClient(hubClient, hubUrl);
  } catch (error) {
    const isHubDown = isConnectionLost(error);
    if (isHubDown) return createHubDownReply();
    throw error;
  }
};

export const sendHubCommand = (
  rootFolder: string,
  hubCommand: HubCommand,
): Promise<CommandReply> =>
  callHub(rootFolder, async (hubClient) => {
    const commandsReply = await hubClient.api.commands.$post({
      json: hubCommand,
    });
    const isCommandRefused = !commandsReply.ok;
    if (isCommandRefused) return readProblemReply(commandsReply);
    return commandsReply.json();
  });
