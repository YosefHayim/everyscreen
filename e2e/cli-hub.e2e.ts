import { execFile } from "node:child_process";
import { once } from "node:events";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { test as base, expect } from "@playwright/test";
import { HUB_DOWN_LINE } from "@/cli/cli-logic";
import { isProcessAlive } from "@/cli/hub-process";
import type { CommandReply } from "@/commands/commands-logic";
import { HUB_FILE_PATH } from "@/environment";
import { type HubFile, hubFileSchema } from "@/hub/hub-file";

const CLI_PATH = join(import.meta.dirname, "../src/cli/cli.ts");
const TSCONFIG_PATH = join(import.meta.dirname, "../tsconfig.json");
const HOLLIS_GOODS_PATH = join(import.meta.dirname, "hollis-goods.html");
const TSX_LOADER_URL = import.meta.resolve("tsx");
const STARTUP_TIMEOUT_MS = 240_000;
const EXIT_TIMEOUT_MS = 15_000;
const EXIT_POLL_MS = 100;
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
  commandReply: CommandReply;
}

interface ExecFailure {
  code: number;
  stdout: string;
}

interface CliWorld {
  workFolder: string;
  shopUrl: string;
  runCli: (cliArguments: string[]) => Promise<CliRun>;
  readHubFile: () => Promise<HubFile>;
}

const execFileAsync = promisify(execFile);

const isExecFailure = (error: unknown): error is ExecFailure =>
  error instanceof Error &&
  "code" in error &&
  typeof error.code === "number" &&
  "stdout" in error &&
  typeof error.stdout === "string";

const waitForExit = async (processId: number): Promise<void> => {
  const deadline = Date.now() + EXIT_TIMEOUT_MS;
  while (isProcessAlive(processId) && Date.now() < deadline) {
    await new Promise((done) => setTimeout(done, EXIT_POLL_MS));
  }
};

const createCliRun = (exitCode: number, stdout: string): CliRun => {
  const commandReply: CommandReply = JSON.parse(stdout);
  return { exitCode, stdout, commandReply };
};

const createRunCli =
  (workFolder: string) =>
  async (cliArguments: string[]): Promise<CliRun> => {
    const nodeArguments = [
      "--import",
      TSX_LOADER_URL,
      CLI_PATH,
      ...cliArguments,
    ];
    try {
      const { stdout } = await execFileAsync(process.execPath, nodeArguments, {
        cwd: workFolder,
        env: { ...process.env, TSX_TSCONFIG_PATH: TSCONFIG_PATH },
      });
      return createCliRun(0, stdout);
    } catch (error) {
      // A non-zero exit rejects with the exit code and what the CLI printed.
      const isExecFailureUnknown = !isExecFailure(error);
      if (isExecFailureUnknown) throw error;
      return createCliRun(error.code, error.stdout);
    }
  };

const createReadHubFile =
  (workFolder: string) => async (): Promise<HubFile> => {
    const serializedHubFile = await readFile(
      join(workFolder, HUB_FILE_PATH),
      "utf8",
    );
    return hubFileSchema.parse(JSON.parse(serializedHubFile));
  };

const test = base.extend<object, { cliWorld: CliWorld }>({
  cliWorld: [
    // biome-ignore lint/correctness/noEmptyPattern: Playwright reads the fixture dependencies from this pattern.
    async ({}, use) => {
      const workFolder = await mkdtemp(join(tmpdir(), "everyscreen-cli-"));
      const shopHtml = await readFile(HOLLIS_GOODS_PATH);
      const shopServer = createServer((shopRequest, shopReply) => {
        const isFormRequest = shopRequest.url === FORM_PATH;
        shopReply.setHeader("Content-Type", "text/html");
        shopReply.end(isFormRequest ? FORM_HTML : shopHtml);
      });
      shopServer.listen(0, "127.0.0.1");
      await once(shopServer, "listening");
      const shopAddress = shopServer.address();
      const isShopAddressMissing =
        shopAddress === null || typeof shopAddress === "string";
      if (isShopAddressMissing) {
        throw new Error("The shop server did not listen");
      }
      const shopUrl = `http://127.0.0.1:${shopAddress.port}/`;
      const formUrl = `http://127.0.0.1:${shopAddress.port}${FORM_PATH}`;
      await mkdir(join(workFolder, "flows"));
      await writeFile(
        join(workFolder, "flows/form-pixel.yaml"),
        FLOW_PIXEL.replace("FORM_URL", formUrl),
      );
      await writeFile(
        join(workFolder, "flows/form-iphone.yaml"),
        FLOW_IPHONE.replace("FORM_URL", formUrl),
      );
      const readHubFile = createReadHubFile(workFolder);
      const runCli = createRunCli(workFolder);

      await use({
        workFolder,
        shopUrl,
        runCli,
        readHubFile,
      });

      const hasHubFile = existsSync(join(workFolder, HUB_FILE_PATH));
      if (hasHubFile) {
        const hubFile = await readHubFile();
        await runCli(["stop"]);
        await waitForExit(hubFile.pid);
      }
      shopServer.closeAllConnections();
      shopServer.close();
      await once(shopServer, "close");
      await rm(workFolder, { recursive: true, force: true });
    },
    { scope: "worker" },
  ],
});

test.describe("the everyscreen command line", () => {
  test.describe.configure({ mode: "serial" });

  test("prints the help of the root command as one JSON object and exits 0", async ({
    cliWorld,
  }) => {
    const helpRun = await cliWorld.runCli(["--help"]);
    const jsonHelpRun = await cliWorld.runCli(["--help", "--json"]);

    expect(helpRun.exitCode).toBe(0);
    expect(helpRun.commandReply.status).toBe("ok");
    expect(helpRun.commandReply.line).toContain(
      "Usage: everyscreen <command> [flags]",
    );
    expect(helpRun.commandReply.line).toContain("devices remove");
    expect(jsonHelpRun.commandReply).toEqual(helpRun.commandReply);
  });

  test("prints the help of one command and exits 0", async ({ cliWorld }) => {
    const helpRun = await cliWorld.runCli(["tap", "--help"]);

    expect(helpRun.exitCode).toBe(0);
    expect(helpRun.commandReply.line).toContain(
      "Usage: everyscreen tap --role",
    );
  });

  test("exits 2 for an unknown command, an unknown flag and a missing flag", async ({
    cliWorld,
  }) => {
    const unknownCommandRun = await cliWorld.runCli(["nope"]);
    const unknownFlagRun = await cliWorld.runCli(["tap", "--nope", "x"]);
    const missingFlagRun = await cliWorld.runCli(["tap", "--role", "button"]);

    expect(unknownCommandRun.exitCode).toBe(2);
    expect(unknownFlagRun.exitCode).toBe(2);
    expect(missingFlagRun.exitCode).toBe(2);
    expect(missingFlagRun.commandReply.line).toContain("tap --name");
  });

  test("says the hub is not running before it starts", async ({ cliWorld }) => {
    const tapRun = await cliWorld.runCli([
      "tap",
      "--role",
      "button",
      "--name",
      "Close",
    ]);
    const stopRun = await cliWorld.runCli(["stop"]);

    expect(tapRun.exitCode).toBe(1);
    expect(tapRun.commandReply.line).toBe(HUB_DOWN_LINE);
    expect(stopRun.exitCode).toBe(1);
  });

  test("starts the hub on port 0 and answers with one line", async ({
    cliWorld,
  }) => {
    test.setTimeout(STARTUP_TIMEOUT_MS);

    const startRun = await cliWorld.runCli(["start", "--port", "0"]);
    const hubFile = await cliWorld.readHubFile();
    const isHubAlive = isProcessAlive(hubFile.pid);

    expect(startRun.exitCode).toBe(0);
    expect(startRun.commandReply.line).toBe(
      `hub ready at http://127.0.0.1:${hubFile.port} · ${DEVICE_COUNT} devices`,
    );
    expect(isHubAlive).toBe(true);
  });

  test("shows the running hub with status", async ({ cliWorld }) => {
    const statusRun = await cliWorld.runCli(["status"]);

    expect(statusRun.exitCode).toBe(0);
    expect(statusRun.commandReply.line).toMatch(
      /^hub running at http:\/\/127\.0\.0\.1:\d+ · 9 devices$/,
    );
  });

  test("says the hub runs already when start is called again", async ({
    cliWorld,
  }) => {
    const startAgainRun = await cliWorld.runCli(["start"]);

    expect(startAgainRun.exitCode).toBe(0);
    expect(startAgainRun.commandReply.line).toMatch(/^hub running at /);
  });

  test("refuses start on another port while the hub runs", async ({
    cliWorld,
  }) => {
    const hubFile = await cliWorld.readHubFile();
    const otherPort = String(hubFile.port + 1);

    const startOtherRun = await cliWorld.runCli(["start", "--port", otherPort]);

    expect(startOtherRun.exitCode).toBe(1);
    expect(startOtherRun.commandReply.line).toBe(
      `hub already running at http://127.0.0.1:${hubFile.port} · stop it first`,
    );
  });

  test("opens a url and taps on every device with one JSON object each", async ({
    cliWorld,
  }) => {
    const openRun = await cliWorld.runCli([
      "open",
      "--url",
      cliWorld.shopUrl,
      "--json",
    ]);
    const tapRun = await cliWorld.runCli([
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
    expect(openRun.commandReply.line).toMatch(
      /^9 devices · .*report run-0001$/,
    );
    expect(openRun.commandReply.runId).toBe("run-0001");
    expect(tapRun.stdout.trimEnd().split("\n")).toHaveLength(1);
    expect(tapRun.commandReply.line).toMatch(/^1 device · .*report run-0001$/);
  });

  test("exits 1 and lists the failure when a step fails on a device", async ({
    cliWorld,
  }) => {
    const expectRun = await cliWorld.runCli([
      "expect",
      "--text",
      "This text is nowhere on the page",
      "--device",
      "pixel-8",
    ]);

    expect(expectRun.exitCode).toBe(1);
    expect(expectRun.commandReply.status).toBe("failed");
    expect(expectRun.commandReply.failures[0].deviceId).toBe("pixel-8");
  });

  test("runs two flows in parallel and counts both", async ({ cliWorld }) => {
    const flowsRun = await cliWorld.runCli([
      "run",
      "--flows",
      "flows/*.yaml",
      "--parallel",
      "2",
    ]);

    expect(flowsRun.commandReply.line).toMatch(
      /^2 flows · 2 ok · report run-\d+$/,
    );
    expect(flowsRun.exitCode).toBe(0);
  });

  test("fails one flow that cannot be read and still counts the others", async ({
    cliWorld,
  }) => {
    const brokenFlowPath = join(cliWorld.workFolder, "flows/broken.yaml");
    await writeFile(brokenFlowPath, "steps: 1");

    const flowsRun = await cliWorld.runCli([
      "run",
      "--flows",
      "flows/*.yaml",
      "--parallel",
      "3",
    ]);
    await rm(brokenFlowPath);

    expect(flowsRun.exitCode).toBe(1);
    expect(flowsRun.commandReply.line).toContain("3 flows · 2 ok · 1 failed");
    expect(flowsRun.commandReply.line).toContain("flows/broken.yaml");
  });

  test("adds, lists and removes a custom device", async ({ cliWorld }) => {
    const addRun = await cliWorld.runCli([
      "devices",
      "add",
      "--name",
      "Tiny Phone",
      "--width",
      "300",
      "--height",
      "600",
    ]);
    const listRun = await cliWorld.runCli(["devices", "list"]);
    const removeWithoutYesRun = await cliWorld.runCli([
      "devices",
      "remove",
      "--device",
      "tiny-phone",
    ]);
    const removeRun = await cliWorld.runCli([
      "devices",
      "remove",
      "--device",
      "tiny-phone",
      "--yes",
    ]);
    const removeAgainRun = await cliWorld.runCli([
      "devices",
      "remove",
      "--device",
      "tiny-phone",
      "--yes",
    ]);

    expect(addRun.commandReply.line).toContain("device added · tiny-phone");
    expect(listRun.commandReply.line).toMatch(/^10 devices · .*tiny-phone$/);
    expect(removeWithoutYesRun.exitCode).toBe(1);
    expect(removeWithoutYesRun.commandReply.line).toContain("--yes");
    expect(removeRun.commandReply.line).toContain(
      "device removed · tiny-phone",
    );
    expect(removeAgainRun.exitCode).toBe(1);
  });

  test("installs the skill and asks for --yes before it overwrites it", async ({
    cliWorld,
  }) => {
    const skillFile = join(
      cliWorld.workFolder,
      ".agents/skills/everyscreen/SKILL.md",
    );

    const skillRun = await cliWorld.runCli([
      "skill",
      "install",
      "--agent",
      "codex",
    ]);
    const skillMarkdown = await readFile(skillFile, "utf8");
    const overwriteRun = await cliWorld.runCli([
      "skill",
      "install",
      "--agent",
      "codex",
    ]);
    const confirmedRun = await cliWorld.runCli([
      "skill",
      "install",
      "--agent",
      "codex",
      "--yes",
    ]);

    expect(skillRun.exitCode).toBe(0);
    expect(skillMarkdown).toContain("name: everyscreen");
    expect(overwriteRun.exitCode).toBe(1);
    expect(overwriteRun.commandReply.line).toContain("--yes");
    expect(confirmedRun.exitCode).toBe(0);
  });

  test("stops the hub, removes the hub file and answers hub is not running", async ({
    cliWorld,
  }) => {
    const hubFile = await cliWorld.readHubFile();

    const stopRun = await cliWorld.runCli(["stop"]);
    const tapRun = await cliWorld.runCli([
      "tap",
      "--role",
      "button",
      "--name",
      "Close",
    ]);
    const isHubAlive = isProcessAlive(hubFile.pid);
    const hasHubFile = existsSync(join(cliWorld.workFolder, HUB_FILE_PATH));

    expect(stopRun.exitCode).toBe(0);
    expect(stopRun.commandReply.line).toBe("hub stopped");
    expect(isHubAlive).toBe(false);
    expect(hasHubFile).toBe(false);
    expect(tapRun.exitCode).toBe(1);
    expect(tapRun.commandReply.line).toBe(HUB_DOWN_LINE);
  });
});
