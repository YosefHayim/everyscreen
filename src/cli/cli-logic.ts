import { z } from "zod";
import type { CliFlags } from "@/cli/cli-flags";
import {
  CLI_COMMAND_NAMES,
  type CliCommandName,
  COMMAND_HELPS,
} from "@/cli/cli-help-texts";
import type { CommandReply } from "@/commands/commands-logic";
import { type HubCommand, hubCommandSchema } from "@/commands/commands-schema";
import { type CustomDevice, customDeviceSchema } from "@/devices/device-schema";
import { HUB_PORT } from "@/environment";
import { SKILL_AGENTS, type SkillAgent } from "@/skill/skill-install";

const DEFAULT_FLOWS_GLOB = "flows/*.yaml";
const DEFAULT_PARALLEL = 1;
const MAX_PORT = 65_535;
const COMMAND_COLUMN_WIDTH = 16;
const PRODUCT_LINE = "Run your web app on many device sizes at once.";
const HUB_DOWN_LINE = "hub is not running · run npx everyscreen start";

export type CliRequest =
  | { kind: "send-command"; hubCommand: HubCommand }
  | { kind: "start"; port: number; isForeground: boolean }
  | { kind: "stop" }
  | { kind: "status" }
  | { kind: "list-devices" }
  | { kind: "add-device"; customDevice: CustomDevice }
  | { kind: "remove-device"; deviceId: string }
  | { kind: "run-flows"; flowsGlob: string; parallel: number }
  | { kind: "install-skill"; agent: SkillAgent };

export type CliPlan =
  | { kind: "show-help"; helpText: string }
  | { kind: "bad-usage"; message: string }
  | { kind: "run"; cliRequest: CliRequest };

type CliRequestOutcome =
  | { kind: "ready"; cliRequest: CliRequest }
  | { kind: "bad-usage"; message: string };

const startFlagsSchema = z.object({
  port: z.number().int().min(0).max(MAX_PORT).default(HUB_PORT),
  foreground: z.boolean().default(false),
});

const runFlagsSchema = z.object({
  flows: z.string().min(1).default(DEFAULT_FLOWS_GLOB),
  parallel: z.number().int().min(1).default(DEFAULT_PARALLEL),
});

const skillFlagsSchema = z.object({
  agent: z.enum(SKILL_AGENTS).default("claude"),
});

const removeDeviceFlagsSchema = z.object({ device: z.string() });

export const createReply = (
  status: CommandReply["status"],
  line: string,
): CommandReply => ({ status, line, runId: null, failures: [] });

export const createHubDownReply = (): CommandReply =>
  createReply("failed", HUB_DOWN_LINE);

export const createReadyLine = (hubUrl: string, deviceCount: number): string =>
  `hub ready at ${hubUrl} · ${deviceCount} devices`;

export const createRunningLine = (
  hubUrl: string,
  deviceCount: number,
): string => `hub running at ${hubUrl} · ${deviceCount} devices`;

export const createDeviceListLine = (deviceIds: string[]): string =>
  `${deviceIds.length} devices · ${deviceIds.join(", ")}`;

export const createReplyText = (
  commandReply: CommandReply,
  isJsonWanted: boolean,
  isTerminal: boolean,
): string => {
  const mustWriteJson = isJsonWanted || !isTerminal;
  if (mustWriteJson) return JSON.stringify(commandReply);
  const failureLines = commandReply.failures.map(
    ({ deviceId, message, durationMs }) =>
      `${deviceId}  fail  ${message}  ${durationMs} ms`,
  );
  return [commandReply.line, ...failureLines].join("\n");
};

export const createHelpText = (
  cliCommandName: CliCommandName | null,
): string => {
  const isRootHelp = cliCommandName === null;
  if (isRootHelp) {
    const commandLines = CLI_COMMAND_NAMES.map(
      (commandName) =>
        `  ${commandName.padEnd(COMMAND_COLUMN_WIDTH)}${COMMAND_HELPS[commandName].summary}`,
    );
    return [
      `everyscreen · ${PRODUCT_LINE}`,
      "",
      "Usage: everyscreen <command> [flags]",
      "",
      "Commands:",
      ...commandLines,
      "",
      "Every command takes --json (print one JSON object) and --help.",
      "Run everyscreen <command> --help for the flags of one command.",
    ].join("\n");
  }
  const commandHelp = COMMAND_HELPS[cliCommandName];
  const flagLines = commandHelp.flagLines.map((flagLine) => `  ${flagLine}`);
  return [
    `everyscreen ${cliCommandName} · ${commandHelp.summary}`,
    "",
    `Usage: ${commandHelp.usage}`,
    "",
    "Flags:",
    ...flagLines,
    "  --json           Print one JSON object",
    "  --help           Show this help",
  ].join("\n");
};

export const pickCommandName = (
  commandWords: string[],
): CliCommandName | null => {
  const joinedWords = commandWords.join(" ");
  const foundName = CLI_COMMAND_NAMES.find(
    (commandName) => commandName === joinedWords,
  );
  return foundName ?? null;
};

const readNumberFlag = (flagText: string | undefined): number | undefined => {
  const isFlagMissing = flagText === undefined;
  if (isFlagMissing) return undefined;
  return Number(flagText);
};

const createBadUsage = (
  commandName: CliCommandName,
  issue: z.core.$ZodIssue,
): CliRequestOutcome => {
  const flagName = issue.path.join(".");
  return {
    kind: "bad-usage",
    message: `bad usage · ${commandName} --${flagName}: ${issue.message} · run everyscreen ${commandName} --help`,
  };
};

const createReadyRequest = (cliRequest: CliRequest): CliRequestOutcome => ({
  kind: "ready",
  cliRequest,
});

const createHubCommandOutcome = (
  commandName: CliCommandName,
  flags: CliFlags,
): CliRequestOutcome => {
  const isDeviceMissing = flags.device === undefined;
  const hubCommandCandidate = {
    commandName,
    url: flags.url,
    role: flags.role,
    name: flags.name,
    with: flags.with,
    to: flags.to,
    text: flags.text,
    deviceIds: isDeviceMissing ? null : [flags.device],
  };
  const hubCommandCheck = hubCommandSchema.safeParse(hubCommandCandidate);
  if (hubCommandCheck.success) {
    return createReadyRequest({
      kind: "send-command",
      hubCommand: hubCommandCheck.data,
    });
  }
  return createBadUsage(commandName, hubCommandCheck.error.issues[0]);
};

const createStartOutcome = (flags: CliFlags): CliRequestOutcome => {
  const startCheck = startFlagsSchema.safeParse({
    port: readNumberFlag(flags.port),
    foreground: flags.foreground,
  });
  if (startCheck.success) {
    return createReadyRequest({
      kind: "start",
      port: startCheck.data.port,
      isForeground: startCheck.data.foreground,
    });
  }
  return createBadUsage("start", startCheck.error.issues[0]);
};

const createAddDeviceOutcome = (flags: CliFlags): CliRequestOutcome => {
  const customDeviceCheck = customDeviceSchema.safeParse({
    name: flags.name,
    width: readNumberFlag(flags.width),
    height: readNumberFlag(flags.height),
    pixelRatio: readNumberFlag(flags["pixel-ratio"]),
    hasTouch: flags.touch,
  });
  if (customDeviceCheck.success) {
    return createReadyRequest({
      kind: "add-device",
      customDevice: customDeviceCheck.data,
    });
  }
  return createBadUsage("devices add", customDeviceCheck.error.issues[0]);
};

const createRemoveDeviceOutcome = (flags: CliFlags): CliRequestOutcome => {
  const removeCheck = removeDeviceFlagsSchema.safeParse(flags);
  if (removeCheck.success) {
    return createReadyRequest({
      kind: "remove-device",
      deviceId: removeCheck.data.device,
    });
  }
  return createBadUsage("devices remove", removeCheck.error.issues[0]);
};

const createRunFlowsOutcome = (flags: CliFlags): CliRequestOutcome => {
  const runCheck = runFlagsSchema.safeParse({
    flows: flags.flows,
    parallel: readNumberFlag(flags.parallel),
  });
  if (runCheck.success) {
    return createReadyRequest({
      kind: "run-flows",
      flowsGlob: runCheck.data.flows,
      parallel: runCheck.data.parallel,
    });
  }
  return createBadUsage("run", runCheck.error.issues[0]);
};

const createInstallSkillOutcome = (flags: CliFlags): CliRequestOutcome => {
  const skillCheck = skillFlagsSchema.safeParse(flags);
  if (skillCheck.success) {
    return createReadyRequest({
      kind: "install-skill",
      agent: skillCheck.data.agent,
    });
  }
  return createBadUsage("skill install", skillCheck.error.issues[0]);
};

const createRequestOutcome = (
  commandName: CliCommandName,
  flags: CliFlags,
): CliRequestOutcome => {
  switch (commandName) {
    case "start":
      return createStartOutcome(flags);
    case "stop":
      return createReadyRequest({ kind: "stop" });
    case "status":
      return createReadyRequest({ kind: "status" });
    case "devices list":
      return createReadyRequest({ kind: "list-devices" });
    case "devices add":
      return createAddDeviceOutcome(flags);
    case "devices remove":
      return createRemoveDeviceOutcome(flags);
    case "run":
      return createRunFlowsOutcome(flags);
    case "skill install":
      return createInstallSkillOutcome(flags);
    case "open":
    case "tap":
    case "fill":
    case "scroll":
    case "check":
    case "shot":
    case "expect":
      return createHubCommandOutcome(commandName, flags);
  }
};

export const planCli = (commandWords: string[], flags: CliFlags): CliPlan => {
  const commandName = pickCommandName(commandWords);
  const isHelpWanted = flags.help === true;
  const isNothingTyped = commandWords.length === 0;
  const isCommandUnknown = commandName === null;
  const isRootHelpWanted = isNothingTyped || (isCommandUnknown && isHelpWanted);
  if (isRootHelpWanted) {
    return { kind: "show-help", helpText: createHelpText(null) };
  }
  if (isCommandUnknown) {
    const typedCommand = commandWords.join(" ");
    return {
      kind: "bad-usage",
      message: `bad usage · unknown command "${typedCommand}" · run everyscreen --help`,
    };
  }
  if (isHelpWanted) {
    return { kind: "show-help", helpText: createHelpText(commandName) };
  }
  const requestOutcome = createRequestOutcome(commandName, flags);
  const isUsageBad = requestOutcome.kind === "bad-usage";
  if (isUsageBad) return requestOutcome;
  return { kind: "run", cliRequest: requestOutcome.cliRequest };
};
