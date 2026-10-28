import { createReplyText } from "@/cli/cli-logic";
import type { CommandReply } from "@/commands/commands-logic";

export const writeReply = (
  commandReply: CommandReply,
  isJsonWanted: boolean,
): void => {
  const isTerminal = process.stdout.isTTY === true;
  const replyText = createReplyText(commandReply, isJsonWanted, isTerminal);
  process.stdout.write(`${replyText}\n`);
};
