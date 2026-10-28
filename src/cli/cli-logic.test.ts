import { describe, expect, test } from "vitest";
import {
  type CliRequest,
  canWriteFinalReply,
  createDeviceListLine,
  createHelpPage,
  createHubDownReply,
  createNeedsYesReply,
  createPortConflictReply,
  createPrintedReply,
  createReadyLine,
  createReply,
  createRunningLine,
  isPortConflict,
  pickCommandName,
  planCli,
} from "@/cli/cli-logic";
import type { CommandReply } from "@/commands/commands-logic";

describe("createReply", () => {
  test("makes a reply with no run and no failures", () => {
    const commandReply = createReply("ok", "done");

    expect(commandReply).toEqual({
      status: "ok",
      line: "done",
      runId: null,
      failures: [],
    });
  });
});

describe("createHubDownReply", () => {
  test("tells the agent to start the hub", () => {
    const commandReply = createHubDownReply();

    expect(commandReply.status).toBe("failed");
    expect(commandReply.line).toBe(
      "hub is not running · run npx everyscreen start",
    );
  });
});

describe("createReadyLine", () => {
  test("names the url and the device count", () => {
    const readyLine = createReadyLine("http://127.0.0.1:4100", 9);

    expect(readyLine).toBe("hub ready at http://127.0.0.1:4100 · 9 devices");
  });
});

describe("createRunningLine", () => {
  test("names the url and the device count", () => {
    const runningLine = createRunningLine("http://127.0.0.1:4100", 9);

    expect(runningLine).toBe(
      "hub running at http://127.0.0.1:4100 · 9 devices",
    );
  });
});

describe("createNeedsYesReply", () => {
  test("names the command and asks for --yes", () => {
    const commandReply = createNeedsYesReply("devices remove");

    expect(commandReply.status).toBe("failed");
    expect(commandReply.line).toContain("devices remove");
    expect(commandReply.line).toContain("--yes");
  });
});

describe("isPortConflict", () => {
  test("is false when no port was asked for", () => {
    expect(isPortConflict(null, 4100)).toBe(false);
  });

  test("is false when the asked port is the running port", () => {
    expect(isPortConflict(4100, 4100)).toBe(false);
  });

  test("is true when the asked port is another port", () => {
    expect(isPortConflict(5000, 4100)).toBe(true);
  });
});

describe("createPortConflictReply", () => {
  test("names the running hub and says to stop it", () => {
    const commandReply = createPortConflictReply("http://127.0.0.1:4100");

    expect(commandReply.status).toBe("failed");
    expect(commandReply.line).toBe(
      "hub already running at http://127.0.0.1:4100 · stop it first",
    );
  });
});

describe("createDeviceListLine", () => {
  test("lists every device id after the count", () => {
    const deviceListLine = createDeviceListLine(["iphone-se", "pixel-8"]);

    expect(deviceListLine).toBe("2 devices · iphone-se, pixel-8");
  });
});

describe("canWriteFinalReply", () => {
  const foregroundStart: CliRequest = {
    kind: "start",
    port: null,
    isForeground: true,
  };
  const backgroundStart: CliRequest = {
    kind: "start",
    port: null,
    isForeground: false,
  };

  test("skips the stopped reply of a foreground start with --json", () => {
    expect(canWriteFinalReply(foregroundStart, true, true)).toBe(false);
  });

  test("skips the stopped reply of a foreground start without a terminal", () => {
    expect(canWriteFinalReply(foregroundStart, false, false)).toBe(false);
  });

  test("writes the stopped reply of a foreground start in a terminal", () => {
    expect(canWriteFinalReply(foregroundStart, false, true)).toBe(true);
  });

  test("writes the reply of a background start with --json", () => {
    expect(canWriteFinalReply(backgroundStart, true, true)).toBe(true);
  });

  test("writes the reply of another command with --json", () => {
    expect(canWriteFinalReply({ kind: "stop" }, true, true)).toBe(true);
  });
});

describe("createPrintedReply", () => {
  const failedReply: CommandReply = {
    status: "failed",
    line: "2 devices · 1 ok · 1 failed",
    runId: null,
    failures: [
      {
        status: "failed",
        deviceId: "iphone-se",
        durationMs: 412,
        message: "cookie bar covers Add to cart",
        shotPath: null,
      },
    ],
  };

  test("writes the line and one line per failure in a terminal", () => {
    const printedReply = createPrintedReply(failedReply, false, true);

    expect(printedReply).toBe(
      "2 devices · 1 ok · 1 failed\niphone-se  failed  cookie bar covers Add to cart  412 ms",
    );
  });

  test("writes one JSON object when --json is passed", () => {
    const printedReply = createPrintedReply(failedReply, true, true);

    expect(JSON.parse(printedReply)).toEqual(failedReply);
  });

  test("writes one JSON object when the output is not a terminal", () => {
    const printedReply = createPrintedReply(failedReply, false, false);

    expect(JSON.parse(printedReply)).toEqual(failedReply);
    expect(printedReply).not.toContain("\n");
  });
});

describe("createHelpPage", () => {
  test("lists every command on the root help", () => {
    const helpPage = createHelpPage(null);

    expect(helpPage).toContain("Usage: everyscreen <command> [flags]");
    expect(helpPage).toContain("devices remove");
    expect(helpPage).toContain("skill install");
  });

  test("shows the usage and flags of one command", () => {
    const helpPage = createHelpPage("tap");

    expect(helpPage).toContain(
      "Usage: everyscreen tap --role <role> --name <name> [--device <id>]",
    );
    expect(helpPage).toContain("--json");
  });

  test("starts every flag description in the same column", () => {
    const helpPage = createHelpPage("start");

    expect(helpPage).toContain(
      "  --port <number>  Port for the hub. Default: 4100",
    );
    expect(helpPage).toContain(
      "  --foreground     Keep the hub in this terminal instead of the background",
    );
    expect(helpPage).toContain("  --json           Print one JSON object");
    expect(helpPage).toContain("  --help           Show this help");
  });
});

describe("pickCommandName", () => {
  test("joins two words into one command", () => {
    expect(pickCommandName(["devices", "list"])).toBe("devices list");
  });

  test("finds a one word command", () => {
    expect(pickCommandName(["tap"])).toBe("tap");
  });

  test("returns null for a word that is not a command", () => {
    expect(pickCommandName(["devices"])).toBeNull();
  });

  test("returns null when no word is typed", () => {
    expect(pickCommandName([])).toBeNull();
  });
});

describe("planCli", () => {
  test("shows the root help when nothing is typed", () => {
    const cliPlan = planCli([], {}, true);

    expect(cliPlan).toEqual({
      kind: "show-help",
      helpPage: createHelpPage(null),
    });
  });

  test("shows the root help for an unknown command with --help", () => {
    const cliPlan = planCli(["nope"], { help: true }, true);

    expect(cliPlan).toEqual({
      kind: "show-help",
      helpPage: createHelpPage(null),
    });
  });

  test("rejects an unknown command", () => {
    const cliPlan = planCli(["nope"], {}, true);

    expect(cliPlan).toEqual({
      kind: "bad-usage",
      message: 'bad usage · unknown command "nope" · run everyscreen --help',
    });
  });

  test("shows the help of one command", () => {
    const cliPlan = planCli(["tap"], { help: true }, true);

    expect(cliPlan).toEqual({
      kind: "show-help",
      helpPage: createHelpPage("tap"),
    });
  });

  test("plans open on every device", () => {
    const cliPlan = planCli(["open"], { url: "http://localhost:5173" }, true);

    expect(cliPlan).toEqual({
      kind: "run",
      cliRequest: {
        kind: "send-command",
        hubCommand: {
          commandName: "open",
          url: "http://localhost:5173",
          deviceIds: null,
        },
      },
    });
  });

  test("plans tap on one device", () => {
    const cliPlan = planCli(
      ["tap"],
      {
        role: "button",
        name: "Add to cart",
        device: "iphone-se",
      },
      true,
    );

    expect(cliPlan).toEqual({
      kind: "run",
      cliRequest: {
        kind: "send-command",
        hubCommand: {
          commandName: "tap",
          role: "button",
          name: "Add to cart",
          deviceIds: ["iphone-se"],
        },
      },
    });
  });

  test("plans fill as a hub command", () => {
    const cliPlan = planCli(
      ["fill"],
      { role: "textbox", name: "Coupon", with: "SPRING" },
      true,
    );

    expect(cliPlan).toEqual({
      kind: "run",
      cliRequest: {
        kind: "send-command",
        hubCommand: {
          commandName: "fill",
          role: "textbox",
          name: "Coupon",
          with: "SPRING",
          deviceIds: null,
        },
      },
    });
  });

  test("plans scroll as a hub command", () => {
    const cliPlan = planCli(["scroll"], { to: "bottom" }, true);

    expect(cliPlan).toEqual({
      kind: "run",
      cliRequest: {
        kind: "send-command",
        hubCommand: { commandName: "scroll", to: "bottom", deviceIds: null },
      },
    });
  });

  test("plans check as a hub command", () => {
    const cliPlan = planCli(["check"], {}, true);

    expect(cliPlan).toEqual({
      kind: "run",
      cliRequest: {
        kind: "send-command",
        hubCommand: { commandName: "check", deviceIds: null },
      },
    });
  });

  test("plans shot as a hub command", () => {
    const cliPlan = planCli(["shot"], {}, true);

    expect(cliPlan).toEqual({
      kind: "run",
      cliRequest: {
        kind: "send-command",
        hubCommand: { commandName: "shot", deviceIds: null },
      },
    });
  });

  test("plans expect as a hub command", () => {
    const cliPlan = planCli(["expect"], { text: "Total $66" }, true);

    expect(cliPlan).toEqual({
      kind: "run",
      cliRequest: {
        kind: "send-command",
        hubCommand: {
          commandName: "expect",
          text: "Total $66",
          deviceIds: null,
        },
      },
    });
  });

  test("rejects tap without a role and names the flag", () => {
    const cliPlan = planCli(["tap"], { name: "Add" }, true);

    expect(cliPlan.kind).toBe("bad-usage");
    expect(cliPlan).toMatchObject({
      message: expect.stringContaining("bad usage · tap --role:"),
    });
  });

  test("rejects a hub command whose flags are all missing", () => {
    const cliPlan = planCli(["open"], {}, true);

    expect(cliPlan).toMatchObject({
      kind: "bad-usage",
      message: expect.stringContaining("run everyscreen open --help"),
    });
  });

  test("plans start with no port in the background", () => {
    const cliPlan = planCli(["start"], {}, true);

    expect(cliPlan).toEqual({
      kind: "run",
      cliRequest: { kind: "start", port: null, isForeground: false },
    });
  });

  test("plans start on port 0 in the foreground", () => {
    const cliPlan = planCli(["start"], { port: "0", foreground: true }, true);

    expect(cliPlan).toEqual({
      kind: "run",
      cliRequest: { kind: "start", port: 0, isForeground: true },
    });
  });

  test("rejects a port that is not a number", () => {
    const cliPlan = planCli(["start"], { port: "abc" }, true);

    expect(cliPlan).toMatchObject({
      kind: "bad-usage",
      message: expect.stringContaining("start --port"),
    });
  });

  test("rejects an empty port", () => {
    const cliPlan = planCli(["start"], { port: "" }, true);

    expect(cliPlan).toMatchObject({
      kind: "bad-usage",
      message: expect.stringContaining("start --port"),
    });
  });

  test("plans stop, status and devices list", () => {
    const stopPlan = planCli(["stop"], {}, true);
    const statusPlan = planCli(["status"], {}, true);
    const listPlan = planCli(["devices", "list"], {}, true);

    expect(stopPlan).toEqual({ kind: "run", cliRequest: { kind: "stop" } });
    expect(statusPlan).toEqual({ kind: "run", cliRequest: { kind: "status" } });
    expect(listPlan).toEqual({
      kind: "run",
      cliRequest: { kind: "list-devices" },
    });
  });

  test("plans devices add with the schema defaults", () => {
    const cliPlan = planCli(
      ["devices", "add"],
      {
        name: "Galaxy Fold",
        width: "280",
        height: "653",
        touch: true,
      },
      true,
    );

    expect(cliPlan).toMatchObject({
      kind: "run",
      cliRequest: {
        kind: "add-device",
        customDevice: {
          name: "Galaxy Fold",
          width: 280,
          height: 653,
          pixelRatio: 1,
          hasTouch: true,
        },
      },
    });
  });

  test("plans devices add with a pixel ratio", () => {
    const cliPlan = planCli(
      ["devices", "add"],
      {
        name: "Retina",
        width: "800",
        height: "600",
        "pixel-ratio": "2",
      },
      true,
    );

    expect(cliPlan).toMatchObject({
      cliRequest: { customDevice: { pixelRatio: 2, hasTouch: false } },
    });
  });

  test("rejects devices add without a size", () => {
    const cliPlan = planCli(["devices", "add"], { name: "Tiny" }, true);

    expect(cliPlan).toMatchObject({
      kind: "bad-usage",
      message: expect.stringContaining("devices add --width"),
    });
  });

  test("plans devices remove", () => {
    const cliPlan = planCli(["devices", "remove"], { device: "tiny" }, true);

    expect(cliPlan).toEqual({
      kind: "run",
      cliRequest: {
        kind: "remove-device",
        deviceId: "tiny",
        isConfirmed: true,
      },
    });
  });

  test("does not confirm devices remove without a terminal or --yes", () => {
    const cliPlan = planCli(["devices", "remove"], { device: "tiny" }, false);

    expect(cliPlan).toMatchObject({
      cliRequest: { kind: "remove-device", isConfirmed: false },
    });
  });

  test("confirms devices remove without a terminal when --yes is passed", () => {
    const cliPlan = planCli(
      ["devices", "remove"],
      { device: "tiny", yes: true },
      false,
    );

    expect(cliPlan).toMatchObject({
      cliRequest: { kind: "remove-device", isConfirmed: true },
    });
  });

  test("rejects devices remove without a device", () => {
    const cliPlan = planCli(["devices", "remove"], {}, true);

    expect(cliPlan).toMatchObject({
      kind: "bad-usage",
      message: expect.stringContaining("devices remove --device"),
    });
  });

  test("plans run with the default flows glob and one flow at a time", () => {
    const cliPlan = planCli(["run"], {}, true);

    expect(cliPlan).toEqual({
      kind: "run",
      cliRequest: { kind: "run-flows", flowsGlob: "flows/*.yaml", parallel: 1 },
    });
  });

  test("plans run with a glob and parallel flows", () => {
    const cliPlan = planCli(
      ["run"],
      {
        flows: "e2e/*.yaml",
        parallel: "3",
      },
      true,
    );

    expect(cliPlan).toEqual({
      kind: "run",
      cliRequest: { kind: "run-flows", flowsGlob: "e2e/*.yaml", parallel: 3 },
    });
  });

  test("rejects run with zero parallel flows", () => {
    const cliPlan = planCli(["run"], { parallel: "0" }, true);

    expect(cliPlan).toMatchObject({
      kind: "bad-usage",
      message: expect.stringContaining("run --parallel"),
    });
  });

  test("plans skill install for claude by default", () => {
    const cliPlan = planCli(["skill", "install"], {}, true);

    expect(cliPlan).toEqual({
      kind: "run",
      cliRequest: {
        kind: "install-skill",
        agent: "claude",
        isConfirmed: true,
      },
    });
  });

  test("does not confirm skill install without a terminal or --yes", () => {
    const cliPlan = planCli(["skill", "install"], {}, false);

    expect(cliPlan).toEqual({
      kind: "run",
      cliRequest: {
        kind: "install-skill",
        agent: "claude",
        isConfirmed: false,
      },
    });
  });

  test("rejects an agent that is not supported", () => {
    const cliPlan = planCli(["skill", "install"], { agent: "vim" }, true);

    expect(cliPlan).toMatchObject({
      kind: "bad-usage",
      message: expect.stringContaining("skill install --agent"),
    });
  });

  test("plans sweep with the grid, fifty routes and no before flow by default", () => {
    const cliPlan = planCli(["sweep"], { url: "http://127.0.0.1:3000/" }, true);

    expect(cliPlan).toEqual({
      kind: "run",
      cliRequest: {
        kind: "run-sweep",
        sweepCommand: {
          commandName: "sweep",
          url: "http://127.0.0.1:3000/",
          deviceIds: null,
          maxRoutes: 50,
          beforeSteps: null,
        },
        beforeFlowPath: null,
      },
    });
  });

  test("plans sweep with a device list, a route limit and a before flow", () => {
    const cliPlan = planCli(
      ["sweep"],
      {
        url: "http://127.0.0.1:3000/",
        devices: "pixel-10, iphone-se",
        "max-routes": "7",
        before: "flows/login.yaml",
      },
      true,
    );

    expect(cliPlan).toEqual({
      kind: "run",
      cliRequest: {
        kind: "run-sweep",
        sweepCommand: {
          commandName: "sweep",
          url: "http://127.0.0.1:3000/",
          deviceIds: ["pixel-10", "iphone-se"],
          maxRoutes: 7,
          beforeSteps: null,
        },
        beforeFlowPath: "flows/login.yaml",
      },
    });
  });

  test("plans sweep on every catalog device for --devices all", () => {
    const cliPlan = planCli(
      ["sweep"],
      { url: "http://127.0.0.1:3000/", devices: "all" },
      true,
    );

    expect(cliPlan).toMatchObject({
      cliRequest: { sweepCommand: { deviceIds: "all" } },
    });
  });

  test.each([
    ["a missing url", {}, "sweep --url"],
    ["a url that is not a url", { url: "shop" }, "sweep --url"],
    [
      "an empty device name",
      { url: "http://a.test/", devices: "pixel-10,,iphone-se" },
      "sweep --devices",
    ],
    [
      "an empty device list",
      { url: "http://a.test/", devices: "" },
      "sweep --devices",
    ],
    [
      "zero routes",
      { url: "http://a.test/", "max-routes": "0" },
      "sweep --max-routes",
    ],
    [
      "too many routes",
      { url: "http://a.test/", "max-routes": "501" },
      "sweep --max-routes",
    ],
    [
      "a route limit that is not a number",
      { url: "http://a.test/", "max-routes": "many" },
      "sweep --max-routes",
    ],
    [
      "an empty route limit",
      { url: "http://a.test/", "max-routes": "" },
      "sweep --max-routes",
    ],
    [
      "an empty before flow path",
      { url: "http://a.test/", before: "" },
      "sweep --before",
    ],
  ])("rejects sweep with %s", (_name, flags, expectedPart) => {
    const cliPlan = planCli(["sweep"], flags, true);

    expect(cliPlan).toMatchObject({
      kind: "bad-usage",
      message: expect.stringContaining(expectedPart),
    });
  });

  test("shows the sweep help page with every flag", () => {
    const cliPlan = planCli(["sweep"], { help: true }, true);

    expect(cliPlan).toMatchObject({
      kind: "show-help",
      helpPage: expect.stringContaining("--before <flow.yaml>"),
    });
  });
});
