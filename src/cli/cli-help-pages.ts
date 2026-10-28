export const CLI_COMMAND_NAMES = [
  "start",
  "stop",
  "status",
  "open",
  "tap",
  "fill",
  "scroll",
  "check",
  "shot",
  "expect",
  "sweep",
  "devices list",
  "devices add",
  "devices remove",
  "run",
  "skill install",
] as const;

export type CliCommandName = (typeof CLI_COMMAND_NAMES)[number];

export interface FlagHelp {
  flag: string;
  description: string;
}

export interface CommandHelp {
  summary: string;
  usage: string;
  flagHelps: readonly FlagHelp[];
}

const DEVICE_FLAG_HELP: FlagHelp = {
  flag: "--device <id>",
  description: "Run on one device. Default: every device",
};

const YES_FLAG_HELP: FlagHelp = {
  flag: "--yes",
  description: "Go ahead without asking. Needed when there is no terminal",
};

export const COMMAND_HELPS = {
  start: {
    summary: "Start the hub and one browser per device, in the background",
    usage: "everyscreen start [--port <number>] [--foreground]",
    flagHelps: [
      {
        flag: "--port <number>",
        description: "Port for the hub. Default: 4100",
      },
      {
        flag: "--foreground",
        description: "Keep the hub in this terminal instead of the background",
      },
    ],
  },
  stop: {
    summary: "Stop the hub and close every device browser",
    usage: "everyscreen stop",
    flagHelps: [],
  },
  status: {
    summary: "Show whether the hub is running and how many devices it has",
    usage: "everyscreen status",
    flagHelps: [],
  },
  open: {
    summary: "Open a url on every device",
    usage: "everyscreen open --url <url> [--device <id>]",
    flagHelps: [
      { flag: "--url <url>", description: "The page to open" },
      DEVICE_FLAG_HELP,
    ],
  },
  tap: {
    summary: "Tap an element on every device",
    usage: "everyscreen tap --role <role> --name <name> [--device <id>]",
    flagHelps: [
      {
        flag: "--role <role>",
        description: "Aria role: button, link, textbox, checkbox, tab...",
      },
      { flag: "--name <name>", description: "Accessible name of the element" },
      DEVICE_FLAG_HELP,
    ],
  },
  fill: {
    summary: "Type into a field on every device",
    usage:
      "everyscreen fill --role <role> --name <name> --with <text> [--device <id>]",
    flagHelps: [
      {
        flag: "--role <role>",
        description: "Aria role of the field: textbox, searchbox, combobox...",
      },
      { flag: "--name <name>", description: "Accessible name of the field" },
      { flag: "--with <text>", description: "What to type" },
      DEVICE_FLAG_HELP,
    ],
  },
  scroll: {
    summary: "Scroll to the top or the bottom of the page",
    usage: "everyscreen scroll --to top|bottom [--device <id>]",
    flagHelps: [
      { flag: "--to top|bottom", description: "Where to scroll" },
      DEVICE_FLAG_HELP,
    ],
  },
  check: {
    summary: "Run the six layout checks on the current page",
    usage: "everyscreen check [--device <id>]",
    flagHelps: [DEVICE_FLAG_HELP],
  },
  shot: {
    summary: "Save a screenshot of every device",
    usage: "everyscreen shot [--device <id>]",
    flagHelps: [DEVICE_FLAG_HELP],
  },
  expect: {
    summary: "Check that some text shows on every device",
    usage: "everyscreen expect --text <text> [--device <id>]",
    flagHelps: [
      { flag: "--text <text>", description: "The text that must show" },
      DEVICE_FLAG_HELP,
    ],
  },
  sweep: {
    summary: "Visit every route of your app and save a shot on every device",
    usage:
      "everyscreen sweep --url <url> [--devices <id,id,...>|all] [--max-routes <number>] [--before <flow.yaml>]",
    flagHelps: [
      { flag: "--url <url>", description: "The start page of your app" },
      {
        flag: "--devices <id,id,...>|all",
        description:
          "Which devices to sweep. all adds every catalog device. Default: the grid",
      },
      {
        flag: "--max-routes <number>",
        description: "Most routes to visit, up to 500. Default: 50",
      },
      {
        flag: "--before <flow.yaml>",
        description:
          "Run this flow first on each device, for example a login. Default: none",
      },
    ],
  },
  "devices list": {
    summary: "List the devices in the grid",
    usage: "everyscreen devices list",
    flagHelps: [],
  },
  "devices add": {
    summary:
      "Add a custom device to everyscreen.yaml (restart the hub to show it)",
    usage:
      "everyscreen devices add --name <name> --width <px> --height <px> [--pixel-ratio <number>] [--touch]",
    flagHelps: [
      {
        flag: "--name <name>",
        description: "Device name. Its id is made from it",
      },
      { flag: "--width <px>", description: "Viewport width" },
      { flag: "--height <px>", description: "Viewport height" },
      {
        flag: "--pixel-ratio <number>",
        description: "Pixel ratio, 1 to 4. Default: 1",
      },
      { flag: "--touch", description: "The device has a touch screen" },
    ],
  },
  "devices remove": {
    summary:
      "Remove a custom device from everyscreen.yaml (restart the hub to apply)",
    usage: "everyscreen devices remove --device <id> [--yes]",
    flagHelps: [
      { flag: "--device <id>", description: "The custom device to remove" },
      YES_FLAG_HELP,
    ],
  },
  run: {
    summary: "Run YAML flows on the devices they name",
    usage: "everyscreen run [--flows <glob>] [--parallel <number>]",
    flagHelps: [
      {
        flag: "--flows <glob>",
        description: "Which flow files to run. Default: flows/*.yaml",
      },
      {
        flag: "--parallel <number>",
        description: "Flows to run at the same time. Default: 1",
      },
    ],
  },
  "skill install": {
    summary: "Install the Everyscreen skill for a coding agent",
    usage: "everyscreen skill install [--agent claude|codex|cursor] [--yes]",
    flagHelps: [
      {
        flag: "--agent <name>",
        description: "Which agent reads it. Default: claude",
      },
      YES_FLAG_HELP,
    ],
  },
} as const satisfies Record<CliCommandName, CommandHelp>;
