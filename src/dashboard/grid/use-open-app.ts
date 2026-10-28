import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import type { CommandReply } from "@/commands/commands-logic";
import { saveAppUrl } from "@/dashboard/app-url-store";
import { hubApi } from "@/dashboard/hub-api";

const sendOpenCommand = async (url: string): Promise<CommandReply> => {
  const hubAnswer = await hubApi.api.commands.$post({
    json: { commandName: "open", url, deviceIds: null },
  });
  const hasHubRefused = !hubAnswer.ok;
  if (hasHubRefused) {
    throw new Error(`The hub refused the open command: ${hubAnswer.status}`);
  }
  const openReply = await hubAnswer.json();
  const hasOpenFailed = openReply.status === "failed";
  if (hasOpenFailed) {
    throw new Error(openReply.line);
  }
  saveAppUrl(url);
  return openReply;
};

export const useOpenApp = (): UseMutationResult<CommandReply, Error, string> =>
  useMutation({ mutationFn: sendOpenCommand });
