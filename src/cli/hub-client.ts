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

const problemSchema = z.object({ detail: z.string() });

const createHubClient = (hubUrl: string) => hc<HubApp>(hubUrl);

export type HubClient = ReturnType<typeof createHubClient>;

export const createHubUrl = (hubFile: HubFile): string =>
  `http://${HUB_HOST}:${hubFile.port}`;

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

const isConnectionRefused = (error: unknown): boolean =>
  error instanceof TypeError &&
  error.cause instanceof Error &&
  "code" in error.cause &&
  error.cause.code === "ECONNREFUSED";

export const readProblemReply = async (
  problemResponse: Response,
): Promise<CommandReply> => {
  const problemDocument: unknown = await problemResponse.json();
  const problem = problemSchema.parse(problemDocument);
  return createReply("failed", problem.detail);
};

export const callHub = async (
  rootFolder: string,
  askHubClient: (hubClient: HubClient) => Promise<CommandReply>,
): Promise<CommandReply> => {
  const hubFile = await readHubFile(rootFolder);
  const isHubFileMissing = hubFile === null;
  if (isHubFileMissing) return createHubDownReply();
  const hubClient = createHubClient(createHubUrl(hubFile));
  try {
    return await askHubClient(hubClient);
  } catch (error) {
    const isHubDown = isConnectionRefused(error);
    if (isHubDown) return createHubDownReply();
    throw error;
  }
};

export const sendHubCommand = (
  rootFolder: string,
  hubCommand: HubCommand,
): Promise<CommandReply> =>
  callHub(rootFolder, async (hubClient) => {
    const commandsResponse = await hubClient.api.commands.$post({
      json: hubCommand,
    });
    const isCommandRefused = !commandsResponse.ok;
    if (isCommandRefused) return readProblemReply(commandsResponse);
    return commandsResponse.json();
  });
