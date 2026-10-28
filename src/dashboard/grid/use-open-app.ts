import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import type { CommandReply } from "@/commands/commands-logic";
import type { HubCommand } from "@/commands/commands-schema";

const COMMANDS_PATH = "/api/commands";

// Wave 2 moves this call to hc<HubApp>.
const sendOpenCommand = async (url: string): Promise<CommandReply> => {
  const openCommand: HubCommand = {
    commandName: "open",
    url,
    deviceIds: null,
  };
  const hubAnswer = await fetch(COMMANDS_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(openCommand),
  });
  const hasHubRefused = !hubAnswer.ok;
  if (hasHubRefused) {
    throw new Error(`The hub refused the open command: ${hubAnswer.status}`);
  }
  const openReply: CommandReply = await hubAnswer.json();
  const hasOpenFailed = openReply.status === "failed";
  if (hasOpenFailed) {
    const replyLine = openReply.line;
    throw new Error(replyLine);
  }
  return openReply;
};

export const useOpenApp = (): UseMutationResult<CommandReply, Error, string> =>
  useMutation({ mutationFn: sendOpenCommand });
