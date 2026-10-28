#!/usr/bin/env node
import { readCommandLine } from "@/cli/cli-flags";
import { type CliPlan, createReply, planCli } from "@/cli/cli-logic";
import { writeReply } from "@/cli/cli-reply";
import { runCliRequest } from "@/cli/cli-requests";

const EXIT_CODES = {
  ok: 0,
  failed: 1,
  badUsage: 2,
} as const;

const runPlan = async (
  cliPlan: CliPlan,
  isJsonWanted: boolean,
): Promise<number> => {
  if (cliPlan.kind === "show-help") {
    process.stdout.write(`${cliPlan.helpText}\n`);
    return EXIT_CODES.ok;
  }
  if (cliPlan.kind === "bad-usage") {
    writeReply(createReply("failed", cliPlan.message), isJsonWanted);
    return EXIT_CODES.badUsage;
  }
  const commandReply = await runCliRequest(cliPlan.cliRequest, process.cwd());
  writeReply(commandReply, isJsonWanted);
  return EXIT_CODES[commandReply.status];
};

const runCli = async (): Promise<void> => {
  const commandLineWords = process.argv.slice(2);
  const isJsonWanted = commandLineWords.includes("--json");
  const commandLine = readCommandLine(commandLineWords);
  if (commandLine.kind === "unreadable") {
    writeReply(createReply("failed", commandLine.message), isJsonWanted);
    process.exitCode = EXIT_CODES.badUsage;
    return;
  }
  const cliPlan = planCli(commandLine.commandWords, commandLine.flags);
  try {
    process.exitCode = await runPlan(cliPlan, isJsonWanted);
  } catch (error) {
    console.error({ error });
    const isErrorKnown = error instanceof Error;
    const errorLine = isErrorKnown ? error.message : "unexpected error";
    writeReply(createReply("failed", errorLine), isJsonWanted);
    process.exitCode = EXIT_CODES.failed;
  }
};

await runCli();
