import { z } from "zod";
import type { CliFlags } from "@/cli/cli-flags";
import {
  CLI_COMMAND_NAMES,
  type CliCommandName,
  COMMAND_HELPS,
  type FlagHelp,
} from "@/cli/cli-help-pages";
import type { CommandReply } from "@/commands/commands-logic";
import { type HubCommand, hubCommandSchema } from "@/commands/commands-schema";
import { type CustomDevice, customDeviceSchema } from "@/devices/device-schema";
import { SKILL_AGENTS, type SkillAgent } from "@/skill/skill-install";

const DEFAULT_FLOWS_GLOB = "flows/*.yaml";
const DEFAULT_PARALLEL = 1;
const MAX_PORT = 65_535;
const COLUMN_GAP = "  ";
const PRODUCT_LINE = "Run your web app on many device sizes at once.";
export const HUB_DOWN_LINE = "hub is not running · run npx everyscreen start";

export type CliRequest =
  | { kind: "send-command"; hubCommand: HubCommand }
  | { kind: "start"; port: number | null; isForeground: boolean }
  | { kind: "stop" }
  | { kind: "status" }
  | { kind: "list-devices" }
  | { kind: "add-device"; customDevice: CustomDevice }
  | { kind: "remove-device"; deviceId: string; isConfirmed: boolean }
  | { kind: "run-flows"; flowsGlob: string; parallel: number }
  | { kind: "install-skill"; agent: SkillAgent; isConfirmed: boolean };

export type CliPlan =
  | { kind: "show-help"; helpPage: string }
  | { kind: "bad-usage"; message: string }
  | { kind: "run"; cliRequest: CliRequest };

type CliRequestCheck =
  | { kind: "ready"; cliRequest: CliRequest }
  | { kind: "bad-usage"; message: string };

const startFlagsSchema = z.object({
  port: z.number().int().min(0).max(MAX_PORT).optional(),
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

const COMMON_FLAG_HELPS: readonly FlagHelp[] = [
  { flag: "--json", description: "Print one JSON object" },
  { flag: "--help", description: "Show this help" },
];

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

export const createNeedsYesReply = (
  commandName: CliCommandName,
): CommandReply =>
  createReply(
    "failed",
    `${commandName} changes files and needs --yes when it does not run in a terminal`,
  );

export const isPortConflict = (
  requestedPort: number | null,
  runningPort: number,
): boolean => requestedPort !== null && requestedPort !== runningPort;

export const createPortConflictReply = (hubUrl: string): CommandReply =>
  createReply("failed", `hub already running at ${hubUrl} · stop it first`);

export const createPrintedReply = (
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

const createHelpLines = (helpLines: FlagHelp[]): string[] => {
  const widestName = Math.max(...helpLines.map(({ flag }) => flag.length));
  return helpLines.map(
    ({ flag, description }) =>
      `  ${flag.padEnd(widestName)}${COLUMN_GAP}${description}`,
  );
};

export const createHelpPage = (
  cliCommandName: CliCommandName | null,
): string => {
  const isRootHelp = cliCommandName === null;
  if (isRootHelp) {
    const commandHelps = CLI_COMMAND_NAMES.map((commandName) => ({
      flag: commandName,
      description: COMMAND_HELPS[commandName].summary,
    }));
    const commandLines = createHelpLines(commandHelps);
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
  const flagLines = createHelpLines([
    ...commandHelp.flagHelps,
    ...COMMON_FLAG_HELPS,
  ]);
  return [
    `everyscreen ${cliCommandName} · ${commandHelp.summary}`,
    "",
    `Usage: ${commandHelp.usage}`,
    "",
    "Flags:",
    ...flagLines,
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

const readNumberFlag = (flagWord: string | undefined): number | undefined => {
  const isFlagMissing = flagWord === undefined;
  if (isFlagMissing) return undefined;
  return Number(flagWord);
};

const createBadUsage = (
  commandName: CliCommandName,
  issue: z.core.$ZodIssue,
): CliRequestCheck => {
  const flagName = issue.path.join(".");
  return {
    kind: "bad-usage",
    message: `bad usage · ${commandName} --${flagName}: ${issue.message} · run everyscreen ${commandName} --help`,
  };
};

const createReadyCheck = (cliRequest: CliRequest): CliRequestCheck => ({
  kind: "ready",
  cliRequest,
});

const checkHubCommandFlags = (
  commandName: CliCommandName,
  flags: CliFlags,
): CliRequestCheck => {
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
  const isValidHubCommandCheck = hubCommandCheck.success;
  if (isValidHubCommandCheck) {
    return createReadyCheck({
      kind: "send-command",
      hubCommand: hubCommandCheck.data,
    });
  }
  return createBadUsage(commandName, hubCommandCheck.error.issues[0]);
};

const checkStartFlags = (flags: CliFlags): CliRequestCheck => {
  const startCheck = startFlagsSchema.safeParse({
    port: readNumberFlag(flags.port),
    foreground: flags.foreground,
  });
  const isValidStartCheck = startCheck.success;
  if (isValidStartCheck) {
    return createReadyCheck({
      kind: "start",
      port: startCheck.data.port ?? null,
      isForeground: startCheck.data.foreground,
    });
  }
  return createBadUsage("start", startCheck.error.issues[0]);
};

const checkAddDeviceFlags = (flags: CliFlags): CliRequestCheck => {
  const customDeviceCheck = customDeviceSchema.safeParse({
    name: flags.name,
    width: readNumberFlag(flags.width),
    height: readNumberFlag(flags.height),
    pixelRatio: readNumberFlag(flags["pixel-ratio"]),
    hasTouch: flags.touch,
  });
  const isValidCustomDeviceCheck = customDeviceCheck.success;
  if (isValidCustomDeviceCheck) {
    return createReadyCheck({
      kind: "add-device",
      customDevice: customDeviceCheck.data,
    });
  }
  return createBadUsage("devices add", customDeviceCheck.error.issues[0]);
};

const checkRemoveDeviceFlags = (
  flags: CliFlags,
  isConfirmed: boolean,
): CliRequestCheck => {
  const removeCheck = removeDeviceFlagsSchema.safeParse(flags);
  const isValidRemoveCheck = removeCheck.success;
  if (isValidRemoveCheck) {
    return createReadyCheck({
      kind: "remove-device",
      deviceId: removeCheck.data.device,
      isConfirmed,
    });
  }
  return createBadUsage("devices remove", removeCheck.error.issues[0]);
};

const checkRunFlowsFlags = (flags: CliFlags): CliRequestCheck => {
  const runCheck = runFlagsSchema.safeParse({
    flows: flags.flows,
    parallel: readNumberFlag(flags.parallel),
  });
  const isValidRunCheck = runCheck.success;
  if (isValidRunCheck) {
    return createReadyCheck({
      kind: "run-flows",
      flowsGlob: runCheck.data.flows,
      parallel: runCheck.data.parallel,
    });
  }
  return createBadUsage("run", runCheck.error.issues[0]);
};

const checkInstallSkillFlags = (
  flags: CliFlags,
  isConfirmed: boolean,
): CliRequestCheck => {
  const skillCheck = skillFlagsSchema.safeParse(flags);
  const isValidSkillCheck = skillCheck.success;
  if (isValidSkillCheck) {
    return createReadyCheck({
      kind: "install-skill",
      agent: skillCheck.data.agent,
      isConfirmed,
    });
  }
  return createBadUsage("skill install", skillCheck.error.issues[0]);
};

const checkRequestFlags = (
  commandName: CliCommandName,
  flags: CliFlags,
  isConfirmed: boolean,
): CliRequestCheck => {
  switch (commandName) {
    case "start":
      return checkStartFlags(flags);
    case "stop":
      return createReadyCheck({ kind: "stop" });
    case "status":
      return createReadyCheck({ kind: "status" });
    case "devices list":
      return createReadyCheck({ kind: "list-devices" });
    case "devices add":
      return checkAddDeviceFlags(flags);
    case "devices remove":
      return checkRemoveDeviceFlags(flags, isConfirmed);
    case "run":
      return checkRunFlowsFlags(flags);
    case "skill install":
      return checkInstallSkillFlags(flags, isConfirmed);
    case "open":
    case "tap":
    case "fill":
    case "scroll":
    case "check":
    case "shot":
    case "expect":
      return checkHubCommandFlags(commandName, flags);
  }
};

export const planCli = (
  commandWords: string[],
  flags: CliFlags,
  isTerminal: boolean,
): CliPlan => {
  const commandName = pickCommandName(commandWords);
  const isHelpWanted = flags.help === true;
  const isNothingTyped = commandWords.length === 0;
  const isCommandUnknown = commandName === null;
  const isRootHelpWanted = isNothingTyped || (isCommandUnknown && isHelpWanted);
  if (isRootHelpWanted) {
    return { kind: "show-help", helpPage: createHelpPage(null) };
  }
  if (isCommandUnknown) {
    const typedCommand = commandWords.join(" ");
    return {
      kind: "bad-usage",
      message: `bad usage · unknown command "${typedCommand}" · run everyscreen --help`,
    };
  }
  if (isHelpWanted) {
    return { kind: "show-help", helpPage: createHelpPage(commandName) };
  }
  const isConfirmed = flags.yes === true || isTerminal;
  const requestCheck = checkRequestFlags(commandName, flags, isConfirmed);
  const isUsageBad = requestCheck.kind === "bad-usage";
  if (isUsageBad) return requestCheck;
  return { kind: "run", cliRequest: requestCheck.cliRequest };
};
