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
  "devices list",
  "devices add",
  "devices remove",
  "run",
  "skill install",
] as const;

export type CliCommandName = (typeof CLI_COMMAND_NAMES)[number];

export interface CommandHelp {
  summary: string;
  usage: string;
  flagLines: readonly string[];
}

const DEVICE_FLAG_LINE =
  "--device <id>    Run on one device. Default: every device";

export const COMMAND_HELPS = {
  start: {
    summary: "Start the hub and one browser per device, in the background",
    usage: "everyscreen start [--port <number>] [--foreground]",
    flagLines: [
      "--port <number>   Port for the hub. Default: 4100",
      "--foreground      Keep the hub in this terminal instead of the background",
    ],
  },
  stop: {
    summary: "Stop the hub and close every device browser",
    usage: "everyscreen stop",
    flagLines: [],
  },
  status: {
    summary: "Show whether the hub is running and how many devices it has",
    usage: "everyscreen status",
    flagLines: [],
  },
  open: {
    summary: "Open a url on every device",
    usage: "everyscreen open --url <url> [--device <id>]",
    flagLines: ["--url <url>      The page to open", DEVICE_FLAG_LINE],
  },
  tap: {
    summary: "Tap an element on every device",
    usage: "everyscreen tap --role <role> --name <name> [--device <id>]",
    flagLines: [
      "--role <role>    Aria role: button, link, textbox, checkbox, tab...",
      "--name <name>    Accessible name of the element",
      DEVICE_FLAG_LINE,
    ],
  },
  fill: {
    summary: "Type into a field on every device",
    usage:
      "everyscreen fill --role <role> --name <name> --with <text> [--device <id>]",
    flagLines: [
      "--role <role>    Aria role of the field: textbox, searchbox, combobox...",
      "--name <name>    Accessible name of the field",
      "--with <text>    What to type",
      DEVICE_FLAG_LINE,
    ],
  },
  scroll: {
    summary: "Scroll to the top or the bottom of the page",
    usage: "everyscreen scroll --to top|bottom [--device <id>]",
    flagLines: ["--to top|bottom   Where to scroll", DEVICE_FLAG_LINE],
  },
  check: {
    summary: "Run the six layout checks on the current page",
    usage: "everyscreen check [--device <id>]",
    flagLines: [DEVICE_FLAG_LINE],
  },
  shot: {
    summary: "Save a screenshot of every device",
    usage: "everyscreen shot [--device <id>]",
    flagLines: [DEVICE_FLAG_LINE],
  },
  expect: {
    summary: "Check that some text shows on every device",
    usage: "everyscreen expect --text <text> [--device <id>]",
    flagLines: ["--text <text>    The text that must show", DEVICE_FLAG_LINE],
  },
  "devices list": {
    summary: "List the devices in the grid",
    usage: "everyscreen devices list",
    flagLines: [],
  },
  "devices add": {
    summary:
      "Add a custom device to everyscreen.yaml (restart the hub to show it)",
    usage:
      "everyscreen devices add --name <name> --width <px> --height <px> [--pixel-ratio <number>] [--touch]",
    flagLines: [
      "--name <name>           Device name. Its id is made from it",
      "--width <px>            Viewport width",
      "--height <px>           Viewport height",
      "--pixel-ratio <number>  Pixel ratio, 1 to 4. Default: 1",
      "--touch                 The device has a touch screen",
    ],
  },
  "devices remove": {
    summary:
      "Remove a custom device from everyscreen.yaml (restart the hub to apply)",
    usage: "everyscreen devices remove --device <id>",
    flagLines: ["--device <id>   The custom device to remove"],
  },
  run: {
    summary: "Run YAML flows on the devices they name",
    usage: "everyscreen run [--flows <glob>] [--parallel <number>]",
    flagLines: [
      "--flows <glob>       Which flow files to run. Default: flows/*.yaml",
      "--parallel <number>  Flows to run at the same time. Default: 1",
    ],
  },
  "skill install": {
    summary: "Install the Everyscreen skill for a coding agent",
    usage: "everyscreen skill install [--agent claude|codex|cursor]",
    flagLines: ["--agent <name>   Which agent reads it. Default: claude"],
  },
} as const satisfies Record<CliCommandName, CommandHelp>;
