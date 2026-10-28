#!/usr/bin/env node
import { readCommandLine } from "@/cli/cli-flags";
import {
  type CliPlan,
  canWriteFinalReply,
  createReply,
  planCli,
} from "@/cli/cli-logic";
import { writeReply } from "@/cli/cli-reply";
import { runCliRequest } from "@/cli/cli-requests";
import type { CommandReply } from "@/commands/commands-logic";

const EXIT_CODES = {
  ok: 0,
  failed: 1,
  badUsage: 2,
} as const;

const runPlan = async (
  cliPlan: CliPlan,
  isJsonWanted: boolean,
): Promise<number> => {
  switch (cliPlan.kind) {
    case "show-help": {
      const helpReply = createReply("ok", cliPlan.helpPage);
      writeReply(helpReply, isJsonWanted);
      return EXIT_CODES.ok;
    }
    case "bad-usage": {
      const badUsageReply = createReply("failed", cliPlan.message);
      writeReply(badUsageReply, isJsonWanted);
      return EXIT_CODES.badUsage;
    }
    case "run": {
      const writeStartedReply = (startedReply: CommandReply): void =>
        writeReply(startedReply, isJsonWanted);
      const commandReply = await runCliRequest(
        cliPlan.cliRequest,
        process.cwd(),
        writeStartedReply,
      );
      const isTerminal = process.stdout.isTTY === true;
      const isFinalReplyWritten = canWriteFinalReply(
        cliPlan.cliRequest,
        isJsonWanted,
        isTerminal,
      );
      if (isFinalReplyWritten) writeReply(commandReply, isJsonWanted);
      return EXIT_CODES[commandReply.status];
    }
  }
};

const runCli = async (): Promise<void> => {
  const commandLineWords = process.argv.slice(2);
  const isJsonWanted = commandLineWords.includes("--json");
  const commandLine = readCommandLine(commandLineWords);
  const isCommandLineUnreadable = commandLine.kind === "unreadable";
  if (isCommandLineUnreadable) {
    const unreadableReply = createReply("failed", commandLine.message);
    writeReply(unreadableReply, isJsonWanted);
    process.exitCode = EXIT_CODES.badUsage;
    return;
  }
  const isTerminal = process.stdout.isTTY === true;
  const cliPlan = planCli(
    commandLine.commandWords,
    commandLine.flags,
    isTerminal,
  );
  try {
    process.exitCode = await runPlan(cliPlan, isJsonWanted);
  } catch (error) {
    console.error({ error });
    const isErrorKnown = error instanceof Error;
    const errorLine = isErrorKnown ? error.message : "unexpected error";
    const errorReply = createReply("failed", errorLine);
    writeReply(errorReply, isJsonWanted);
    process.exitCode = EXIT_CODES.failed;
  }
};

await runCli();
