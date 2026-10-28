import { useMutation } from "@tanstack/react-query";
import type { HubCommand } from "@/commands/commands-schema";

const COMMANDS_PATH = "/api/commands";

export const useOpenApp = () =>
  useMutation({
    mutationFn: async (url: string) => {
      const openCommand: HubCommand = {
        commandName: "open",
        url,
        deviceIds: null,
      };
      const commandReply = await fetch(COMMANDS_PATH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(openCommand),
      });
      const hasCommandFailed = !commandReply.ok;
      if (hasCommandFailed) {
        throw new Error(
          `The hub refused the open command: ${commandReply.status}`,
        );
      }
    },
  });
