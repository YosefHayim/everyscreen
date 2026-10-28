import { execFile } from "node:child_process";
import { once } from "node:events";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import type { CommandReply } from "@/commands/commands-logic";
import { HUB_FILE_PATH } from "@/environment";
import { hubFileSchema } from "@/hub/hub-file";

const CLI_PATH = join(import.meta.dirname, "../src/cli/cli.ts");
const TSCONFIG_PATH = join(import.meta.dirname, "../tsconfig.json");
const HOLLIS_GOODS_PATH = join(import.meta.dirname, "hollis-goods.html");
const TSX_LOADER_URL = import.meta.resolve("tsx");
const STARTUP_TIMEOUT_MS = 240_000;
const DEVICE_COUNT = 9;
const FORM_PATH = "/form";
const FORM_HTML =
  '<!doctype html><meta name="viewport" content="width=device-width"><body><label>Email <input type="email" aria-label="Email"></label><p>Welcome back</p>';
const FLOW_PIXEL = `name: Form on a Pixel
devices: [pixel-8]
steps:
  - open: FORM_URL
  - expect: { text: Welcome back }
`;
const FLOW_IPHONE = `name: Form on an iPhone
devices: [iphone-se]
steps:
  - open: FORM_URL
  - fill: { role: textbox, name: Email, with: ada@example.com }
`;

interface CliRun {
  exitCode: number;
  stdout: string;
  commandReply: CommandReply | null;
}

let workFolder = "";
let shopServer: Server;
let shopUrl = "";
let formUrl = "";

const runCli = (cliArguments: string[]): Promise<CliRun> =>
  new Promise((finish) => {
    const nodeArguments = [
      "--import",
      TSX_LOADER_URL,
      CLI_PATH,
      ...cliArguments,
    ];
    execFile(
      process.execPath,
      nodeArguments,
      {
        cwd: workFolder,
        env: { ...process.env, TSX_TSCONFIG_PATH: TSCONFIG_PATH },
      },
      (error, stdout) => {
        const exitCode = typeof error?.code === "number" ? error.code : 0;
        const isJsonLine = stdout.trimStart().startsWith("{");
        const commandReply: CommandReply | null = isJsonLine
          ? JSON.parse(stdout)
          : null;
        finish({ exitCode, stdout, commandReply });
      },
    );
  });

const readHubFile = async () => {
  const serializedHubFile = await readFile(
    join(workFolder, HUB_FILE_PATH),
    "utf8",
  );
  return hubFileSchema.parse(JSON.parse(serializedHubFile));
};

const isProcessAlive = (processId: number): boolean => {
  try {
    process.kill(processId, 0);
    return true;
  } catch {
    return false;
  }
};

test.describe("the everyscreen command line", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    workFolder = await mkdtemp(join(tmpdir(), "everyscreen-cli-"));
    const shopHtml = await readFile(HOLLIS_GOODS_PATH);
    shopServer = createServer((shopRequest, shopReply) => {
      const isFormRequest = shopRequest.url === FORM_PATH;
      shopReply.setHeader("Content-Type", "text/html");
      shopReply.end(isFormRequest ? FORM_HTML : shopHtml);
    });
    shopServer.listen(0, "127.0.0.1");
    await once(shopServer, "listening");
    const shopAddress = shopServer.address();
    const isShopAddressMissing =
      shopAddress === null || typeof shopAddress === "string";
    if (isShopAddressMissing) throw new Error("The shop server did not listen");
    shopUrl = `http://127.0.0.1:${shopAddress.port}/`;
    formUrl = `http://127.0.0.1:${shopAddress.port}${FORM_PATH}`;

    await mkdir(join(workFolder, "flows"));
    await writeFile(
      join(workFolder, "flows/form-pixel.yaml"),
      FLOW_PIXEL.replace("FORM_URL", formUrl),
    );
    await writeFile(
      join(workFolder, "flows/form-iphone.yaml"),
      FLOW_IPHONE.replace("FORM_URL", formUrl),
    );
  });

  test.afterAll(async () => {
    const hasHubFile = existsSync(join(workFolder, HUB_FILE_PATH));
    if (hasHubFile) {
      const hubFile = await readHubFile();
      process.kill(hubFile.pid, "SIGTERM");
    }
    shopServer?.close();
    await rm(workFolder, { recursive: true, force: true });
  });

  test("prints the help of the root command and exits 0", async () => {
    const helpRun = await runCli(["--help"]);

    expect(helpRun.exitCode).toBe(0);
    expect(helpRun.stdout).toContain("Usage: everyscreen <command> [flags]");
    expect(helpRun.stdout).toContain("devices remove");
  });

  test("prints the help of one command and exits 0", async () => {
    const helpRun = await runCli(["tap", "--help"]);

    expect(helpRun.exitCode).toBe(0);
    expect(helpRun.stdout).toContain("Usage: everyscreen tap --role");
  });

  test("exits 2 for an unknown command, an unknown flag and a missing flag", async () => {
    const unknownCommandRun = await runCli(["nope"]);
    const unknownFlagRun = await runCli(["tap", "--nope", "x"]);
    const missingFlagRun = await runCli(["tap", "--role", "button"]);

    expect(unknownCommandRun.exitCode).toBe(2);
    expect(unknownFlagRun.exitCode).toBe(2);
    expect(missingFlagRun.exitCode).toBe(2);
    expect(missingFlagRun.commandReply?.line).toContain("tap --name");
  });

  test("says the hub is not running before it starts", async () => {
    const tapRun = await runCli(["tap", "--role", "button", "--name", "Close"]);
    const stopRun = await runCli(["stop"]);

    expect(tapRun.exitCode).toBe(1);
    expect(tapRun.commandReply?.line).toBe(
      "hub is not running · run npx everyscreen start",
    );
    expect(stopRun.exitCode).toBe(1);
  });

  test("starts the hub on port 0 and answers with one line", async () => {
    test.setTimeout(STARTUP_TIMEOUT_MS);

    const startRun = await runCli(["start", "--port", "0"]);

    expect(startRun.exitCode).toBe(0);
    const hubFile = await readHubFile();
    expect(startRun.commandReply?.line).toBe(
      `hub ready at http://127.0.0.1:${hubFile.port} · ${DEVICE_COUNT} devices`,
    );
    expect(isProcessAlive(hubFile.pid)).toBe(true);
  });

  test("shows the running hub with status", async () => {
    const statusRun = await runCli(["status"]);

    expect(statusRun.exitCode).toBe(0);
    expect(statusRun.commandReply?.line).toMatch(
      /^hub running at http:\/\/127\.0\.0\.1:\d+ · 9 devices$/,
    );
  });

  test("opens a url and taps on every device with one JSON object each", async () => {
    const openRun = await runCli(["open", "--url", shopUrl, "--json"]);
    const tapRun = await runCli([
      "tap",
      "--role",
      "button",
      "--name",
      "Close",
      "--device",
      "pixel-8",
      "--json",
    ]);

    expect(openRun.stdout.trimEnd().split("\n")).toHaveLength(1);
    expect(openRun.commandReply?.line).toMatch(
      /^9 devices · .*report run-0001$/,
    );
    expect(openRun.commandReply?.runId).toBe("run-0001");
    expect(tapRun.stdout.trimEnd().split("\n")).toHaveLength(1);
    expect(tapRun.commandReply?.line).toMatch(/^1 device · .*report run-0001$/);
  });

  test("exits 1 and lists the failure when a step fails on a device", async () => {
    const expectRun = await runCli([
      "expect",
      "--text",
      "This text is nowhere on the page",
      "--device",
      "pixel-8",
    ]);

    expect(expectRun.exitCode).toBe(1);
    expect(expectRun.commandReply?.status).toBe("failed");
    expect(expectRun.commandReply?.failures[0].deviceId).toBe("pixel-8");
  });

  test("runs two flows in parallel and counts both", async () => {
    const flowsRun = await runCli([
      "run",
      "--flows",
      "flows/*.yaml",
      "--parallel",
      "2",
    ]);

    expect(flowsRun.commandReply?.line).toMatch(
      /^2 flows · 2 ok · report run-\d+$/,
    );
    expect(flowsRun.exitCode).toBe(0);
  });

  test("adds, lists and removes a custom device", async () => {
    const addRun = await runCli([
      "devices",
      "add",
      "--name",
      "Tiny Phone",
      "--width",
      "300",
      "--height",
      "600",
    ]);
    const listRun = await runCli(["devices", "list"]);
    const removeRun = await runCli([
      "devices",
      "remove",
      "--device",
      "tiny-phone",
    ]);
    const removeAgainRun = await runCli([
      "devices",
      "remove",
      "--device",
      "tiny-phone",
    ]);

    expect(addRun.commandReply?.line).toContain("device added · tiny-phone");
    expect(listRun.commandReply?.line).toMatch(/^10 devices · .*tiny-phone$/);
    expect(removeRun.commandReply?.line).toContain(
      "device removed · tiny-phone",
    );
    expect(removeAgainRun.exitCode).toBe(1);
  });

  test("installs the skill for an agent", async () => {
    const skillRun = await runCli(["skill", "install", "--agent", "codex"]);

    expect(skillRun.exitCode).toBe(0);
    const skillMarkdown = await readFile(
      join(workFolder, ".agents/skills/everyscreen/SKILL.md"),
      "utf8",
    );
    expect(skillMarkdown).toContain("name: everyscreen");
  });

  test("stops the hub, removes the hub file and answers hub is not running", async () => {
    const hubFile = await readHubFile();

    const stopRun = await runCli(["stop"]);
    const tapRun = await runCli(["tap", "--role", "button", "--name", "Close"]);

    expect(stopRun.exitCode).toBe(0);
    expect(stopRun.commandReply?.line).toBe("hub stopped");
    expect(isProcessAlive(hubFile.pid)).toBe(false);
    expect(existsSync(join(workFolder, HUB_FILE_PATH))).toBe(false);
    expect(tapRun.exitCode).toBe(1);
    expect(tapRun.commandReply?.line).toBe(
      "hub is not running · run npx everyscreen start",
    );
  });
});
