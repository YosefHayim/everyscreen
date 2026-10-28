import { describe, expect, test } from "vitest";
import type { CliFlags } from "@/cli/cli-flags";
import {
  type CliPlan,
  createDeviceListLine,
  createHelpText,
  createHubDownReply,
  createReadyLine,
  createReply,
  createReplyText,
  createRunningLine,
  pickCommandName,
  planCli,
} from "@/cli/cli-logic";
import type { CommandReply } from "@/commands/commands-logic";

const planRequest = (commandWords: string[], flags: CliFlags): CliPlan =>
  planCli(commandWords, flags);

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

describe("createDeviceListLine", () => {
  test("lists every device id after the count", () => {
    const deviceListLine = createDeviceListLine(["iphone-se", "pixel-8"]);

    expect(deviceListLine).toBe("2 devices · iphone-se, pixel-8");
  });
});

describe("createReplyText", () => {
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
    const replyText = createReplyText(failedReply, false, true);

    expect(replyText).toBe(
      "2 devices · 1 ok · 1 failed\niphone-se  fail  cookie bar covers Add to cart  412 ms",
    );
  });

  test("writes one JSON object when --json is passed", () => {
    const replyText = createReplyText(failedReply, true, true);

    expect(JSON.parse(replyText)).toEqual(failedReply);
  });

  test("writes one JSON object when the output is not a terminal", () => {
    const replyText = createReplyText(failedReply, false, false);

    expect(JSON.parse(replyText)).toEqual(failedReply);
    expect(replyText).not.toContain("\n");
  });
});

describe("createHelpText", () => {
  test("lists every command on the root help", () => {
    const helpText = createHelpText(null);

    expect(helpText).toContain("Usage: everyscreen <command> [flags]");
    expect(helpText).toContain("devices remove");
    expect(helpText).toContain("skill install");
  });

  test("shows the usage and flags of one command", () => {
    const helpText = createHelpText("tap");

    expect(helpText).toContain(
      "Usage: everyscreen tap --role <role> --name <name> [--device <id>]",
    );
    expect(helpText).toContain("--json");
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
    const cliPlan = planRequest([], {});

    expect(cliPlan).toEqual({
      kind: "show-help",
      helpText: createHelpText(null),
    });
  });

  test("shows the root help for an unknown command with --help", () => {
    const cliPlan = planRequest(["nope"], { help: true });

    expect(cliPlan).toEqual({
      kind: "show-help",
      helpText: createHelpText(null),
    });
  });

  test("rejects an unknown command", () => {
    const cliPlan = planRequest(["nope"], {});

    expect(cliPlan).toEqual({
      kind: "bad-usage",
      message: 'bad usage · unknown command "nope" · run everyscreen --help',
    });
  });

  test("shows the help of one command", () => {
    const cliPlan = planRequest(["tap"], { help: true });

    expect(cliPlan).toEqual({
      kind: "show-help",
      helpText: createHelpText("tap"),
    });
  });

  test("plans open on every device", () => {
    const cliPlan = planRequest(["open"], { url: "http://localhost:5173" });

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
    const cliPlan = planRequest(["tap"], {
      role: "button",
      name: "Add to cart",
      device: "iphone-se",
    });

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

  test("plans fill, scroll, check, shot and expect as hub commands", () => {
    const filledPlan = planRequest(["fill"], {
      role: "textbox",
      name: "Coupon",
      with: "SPRING",
    });
    const scrolledPlan = planRequest(["scroll"], { to: "bottom" });
    const checkedPlan = planRequest(["check"], {});
    const shotPlan = planRequest(["shot"], {});
    const expectedPlan = planRequest(["expect"], { text: "Total $66" });

    const commandNames = [
      filledPlan,
      scrolledPlan,
      checkedPlan,
      shotPlan,
      expectedPlan,
    ].map((cliPlan) =>
      cliPlan.kind === "run" && cliPlan.cliRequest.kind === "send-command"
        ? cliPlan.cliRequest.hubCommand.commandName
        : null,
    );
    expect(commandNames).toEqual(["fill", "scroll", "check", "shot", "expect"]);
  });

  test("rejects tap without a role and names the flag", () => {
    const cliPlan = planRequest(["tap"], { name: "Add" });

    expect(cliPlan.kind).toBe("bad-usage");
    expect(cliPlan).toMatchObject({
      message: expect.stringContaining("bad usage · tap --role:"),
    });
  });

  test("rejects a hub command whose flags are all missing", () => {
    const cliPlan = planRequest(["open"], {});

    expect(cliPlan).toMatchObject({
      kind: "bad-usage",
      message: expect.stringContaining("run everyscreen open --help"),
    });
  });

  test("plans start with the default port in the background", () => {
    const cliPlan = planRequest(["start"], {});

    expect(cliPlan).toEqual({
      kind: "run",
      cliRequest: { kind: "start", port: 4100, isForeground: false },
    });
  });

  test("plans start on port 0 in the foreground", () => {
    const cliPlan = planRequest(["start"], { port: "0", foreground: true });

    expect(cliPlan).toEqual({
      kind: "run",
      cliRequest: { kind: "start", port: 0, isForeground: true },
    });
  });

  test("rejects a port that is not a number", () => {
    const cliPlan = planRequest(["start"], { port: "abc" });

    expect(cliPlan).toMatchObject({
      kind: "bad-usage",
      message: expect.stringContaining("start --port"),
    });
  });

  test("plans stop, status and devices list", () => {
    const stopPlan = planRequest(["stop"], {});
    const statusPlan = planRequest(["status"], {});
    const listPlan = planRequest(["devices", "list"], {});

    expect(stopPlan).toEqual({ kind: "run", cliRequest: { kind: "stop" } });
    expect(statusPlan).toEqual({ kind: "run", cliRequest: { kind: "status" } });
    expect(listPlan).toEqual({
      kind: "run",
      cliRequest: { kind: "list-devices" },
    });
  });

  test("plans devices add with the schema defaults", () => {
    const cliPlan = planRequest(["devices", "add"], {
      name: "Galaxy Fold",
      width: "280",
      height: "653",
      touch: true,
    });

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
    const cliPlan = planRequest(["devices", "add"], {
      name: "Retina",
      width: "800",
      height: "600",
      "pixel-ratio": "2",
    });

    expect(cliPlan).toMatchObject({
      cliRequest: { customDevice: { pixelRatio: 2, hasTouch: false } },
    });
  });

  test("rejects devices add without a size", () => {
    const cliPlan = planRequest(["devices", "add"], { name: "Tiny" });

    expect(cliPlan).toMatchObject({
      kind: "bad-usage",
      message: expect.stringContaining("devices add --width"),
    });
  });

  test("plans devices remove", () => {
    const cliPlan = planRequest(["devices", "remove"], { device: "tiny" });

    expect(cliPlan).toEqual({
      kind: "run",
      cliRequest: { kind: "remove-device", deviceId: "tiny" },
    });
  });

  test("rejects devices remove without a device", () => {
    const cliPlan = planRequest(["devices", "remove"], {});

    expect(cliPlan).toMatchObject({
      kind: "bad-usage",
      message: expect.stringContaining("devices remove --device"),
    });
  });

  test("plans run with the default flows glob and one flow at a time", () => {
    const cliPlan = planRequest(["run"], {});

    expect(cliPlan).toEqual({
      kind: "run",
      cliRequest: { kind: "run-flows", flowsGlob: "flows/*.yaml", parallel: 1 },
    });
  });

  test("plans run with a glob and parallel flows", () => {
    const cliPlan = planRequest(["run"], {
      flows: "e2e/*.yaml",
      parallel: "3",
    });

    expect(cliPlan).toEqual({
      kind: "run",
      cliRequest: { kind: "run-flows", flowsGlob: "e2e/*.yaml", parallel: 3 },
    });
  });

  test("rejects run with zero parallel flows", () => {
    const cliPlan = planRequest(["run"], { parallel: "0" });

    expect(cliPlan).toMatchObject({
      kind: "bad-usage",
      message: expect.stringContaining("run --parallel"),
    });
  });

  test("plans skill install for claude by default", () => {
    const cliPlan = planRequest(["skill", "install"], {});

    expect(cliPlan).toEqual({
      kind: "run",
      cliRequest: { kind: "install-skill", agent: "claude" },
    });
  });

  test("rejects an agent that is not supported", () => {
    const cliPlan = planRequest(["skill", "install"], { agent: "vim" });

    expect(cliPlan).toMatchObject({
      kind: "bad-usage",
      message: expect.stringContaining("skill install --agent"),
    });
  });
});
