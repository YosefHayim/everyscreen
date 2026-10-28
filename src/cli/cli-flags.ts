import { parseArgs } from "node:util";

const FLAG_TYPES = {
  json: { type: "boolean" },
  help: { type: "boolean" },
  foreground: { type: "boolean" },
  touch: { type: "boolean" },
  yes: { type: "boolean" },
  port: { type: "string" },
  device: { type: "string" },
  url: { type: "string" },
  role: { type: "string" },
  name: { type: "string" },
  with: { type: "string" },
  to: { type: "string" },
  text: { type: "string" },
  flows: { type: "string" },
  parallel: { type: "string" },
  agent: { type: "string" },
  width: { type: "string" },
  height: { type: "string" },
  "pixel-ratio": { type: "string" },
} as const;

const parseCommandLine = (commandLineWords: string[]) =>
  parseArgs({
    args: commandLineWords,
    options: FLAG_TYPES,
    allowPositionals: true,
    strict: true,
  });

type ParsedCommandLine = ReturnType<typeof parseCommandLine>;

export type CliFlags = ParsedCommandLine["values"];

export type CommandLineRead =
  | { kind: "read"; commandWords: string[]; flags: CliFlags }
  | { kind: "unreadable"; message: string };

// parseArgs throws on a flag that is not in FLAG_TYPES or a flag without its value.
export const readCommandLine = (
  commandLineWords: string[],
): CommandLineRead => {
  try {
    const parsedCommandLine = parseCommandLine(commandLineWords);
    const { positionals, values } = parsedCommandLine;
    return { kind: "read", commandWords: positionals, flags: values };
  } catch (error) {
    const isErrorKnown = error instanceof Error;
    const errorMessage = isErrorKnown ? error.message : "unreadable flags";
    const [reason] = errorMessage.split(". ");
    return {
      kind: "unreadable",
      message: `bad usage · ${reason} · run everyscreen --help`,
    };
  }
};
