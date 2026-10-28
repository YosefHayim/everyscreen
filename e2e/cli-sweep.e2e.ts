import { execFile } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { expect, test } from "@playwright/test";
import type { CommandReply } from "@/commands/commands-logic";
import { createShotPath } from "@/commands/commands-logic";
import { type RunningHub, startHub } from "@/hub/hub-server";
import { readCenterColor, type ScreenColor } from "./screen-color";

const CLI_PATH = join(import.meta.dirname, "../src/cli/cli.ts");
const TSCONFIG_PATH = join(import.meta.dirname, "../tsconfig.json");
const TSX_LOADER_URL = import.meta.resolve("tsx");
const STARTUP_TIMEOUT_MS = 180_000;
const SWEEP_TIMEOUT_MS = 120_000;
const ALL_DEVICES_TIMEOUT_MS = 480_000;
const PROCESS_EXIT_TIMEOUT_MS = 15_000;
const PROCESS_POLL_MS = 200;
const CATALOG_DEVICE_COUNT = 59;
const GRID_DEVICE_IDS = ["pixel-10", "iphone-se"];
const SESSION_COOKIE = "session=ok";
const PROTECTED_PATHS = ["/dashboard", "/orders"];
const PROTECTED_STEP_IDS = ["step-2", "step-3"];

const createColorPage = (title: string, color: string, extra = ""): string =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title}</title><style>body{margin:0;min-height:100vh;background:${color};font:16px sans-serif}h1{margin:0;padding:12px}a,button{display:block;min-height:48px;min-width:48px;padding:12px}</style></head><body><h1>${title}</h1>${extra}</body></html>`;

const HOME_PAGE = createColorPage(
  "Home",
  "rgb(0, 0, 255)",
  '<a href="/dashboard">Dashboard</a><a href="/orders">Orders</a>',
);
const LOGIN_PAGE = createColorPage(
  "Login",
  "rgb(255, 0, 0)",
  '<a href="/session">Sign in</a>',
);
const PROTECTED_PAGE = createColorPage("Protected", "rgb(0, 200, 0)");

const LOGIN_FLOW = `name: Login
steps:
  - open: LOGIN_URL
  - tap: { role: link, name: Sign in }
  - expect: { text: Home }
`;
const BROKEN_FLOW = `name: Broken login
steps:
  - open: LOGIN_URL
  - expect: { text: This text is not on the page }
`;

const execFileAsync = promisify(execFile);

interface ExecFailure {
  code: number;
  stdout: string;
}

interface CliRun {
  exitCode: number;
  commandReply: CommandReply;
}

const isExecFailure = (error: unknown): error is ExecFailure =>
  error instanceof Error &&
  "code" in error &&
  typeof error.code === "number" &&
  "stdout" in error &&
  typeof error.stdout === "string";

const createCliRun = (exitCode: number, stdout: string): CliRun => ({
  exitCode,
  commandReply: JSON.parse(stdout),
});

const runCli = async (
  workFolder: string,
  cliArguments: string[],
): Promise<CliRun> => {
  const nodeArguments = ["--import", TSX_LOADER_URL, CLI_PATH, ...cliArguments];
  try {
    const { stdout } = await execFileAsync(process.execPath, nodeArguments, {
      cwd: workFolder,
      env: { ...process.env, TSX_TSCONFIG_PATH: TSCONFIG_PATH },
    });
    return createCliRun(0, stdout);
  } catch (error) {
    const isExecFailureUnknown = !isExecFailure(error);
    if (isExecFailureUnknown) throw error;
    return createCliRun(error.code, error.stdout);
  }
};

const listDescendantPids = async (): Promise<number[]> => {
  const listing = execFileAsync("ps", ["-axo", "pid=,ppid=,stat="]);
  const listingPid = listing.child.pid;
  const { stdout } = await listing;
  const processLines = stdout
    .split("\n")
    .map((processLine) => processLine.trim().split(/\s+/))
    .filter(([pid]) => pid !== "")
    .map(([pid, parentPid, status]) => ({
      pid: Number(pid),
      parentPid: Number(parentPid),
      isZombie: status.startsWith("Z"),
    }));
  const descendantPids = new Set<number>([process.pid]);
  let isGrowing = true;
  while (isGrowing) {
    const knownCount = descendantPids.size;
    for (const { pid, parentPid, isZombie } of processLines) {
      const isChildKnown = descendantPids.has(parentPid) && !isZombie;
      if (isChildKnown) descendantPids.add(pid);
    }
    isGrowing = descendantPids.size > knownCount;
  }
  descendantPids.delete(listingPid ?? 0);
  return [...descendantPids];
};

const listNewPids = async (knownPids: number[]): Promise<number[]> => {
  const deadline = Date.now() + PROCESS_EXIT_TIMEOUT_MS;
  let newPids = (await listDescendantPids()).filter(
    (pid) => !knownPids.includes(pid),
  );
  while (newPids.length > 0 && Date.now() < deadline) {
    await new Promise((done) => setTimeout(done, PROCESS_POLL_MS));
    const livePids = await listDescendantPids();
    newPids = livePids.filter((pid) => !knownPids.includes(pid));
  }
  return newPids;
};

const listenOnFreePort = async (server: Server): Promise<string> => {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  const isAddressMissing = address === null || typeof address === "string";
  if (isAddressMissing) throw new Error("The test app did not listen");
  return `http://127.0.0.1:${address.port}`;
};

const loginRequestPaths: string[] = [];

const answerAppRequest = (
  appRequest: { url?: string; headers: { cookie?: string } },
  appReply: {
    statusCode: number;
    setHeader: (name: string, value: string) => void;
    end: (body?: string) => void;
  },
): void => {
  const { pathname } = new URL(appRequest.url ?? "/", "http://app");
  const hasSession = (appRequest.headers.cookie ?? "").includes(SESSION_COOKIE);
  const isProtectedPath = PROTECTED_PATHS.includes(pathname);
  appReply.setHeader("Content-Type", "text/html");
  if (isProtectedPath && !hasSession) {
    appReply.statusCode = 302;
    appReply.setHeader("Location", "/login");
    appReply.end();
    return;
  }
  if (isProtectedPath) {
    appReply.end(PROTECTED_PAGE);
    return;
  }
  if (pathname === "/session") {
    appReply.statusCode = 302;
    appReply.setHeader("Set-Cookie", `${SESSION_COOKIE}; Path=/`);
    appReply.setHeader("Location", "/");
    appReply.end();
    return;
  }
  if (pathname === "/login") {
    loginRequestPaths.push(pathname);
    appReply.end(LOGIN_PAGE);
    return;
  }
  if (pathname === "/") {
    appReply.end(HOME_PAGE);
    return;
  }
  appReply.statusCode = 404;
  appReply.end();
};

const isColorNear = (color: ScreenColor, expected: ScreenColor): boolean =>
  Math.abs(color.red - expected.red) < 12 &&
  Math.abs(color.green - expected.green) < 12 &&
  Math.abs(color.blue - expected.blue) < 12;

const RED: ScreenColor = { red: 255, green: 0, blue: 0 };
const GREEN: ScreenColor = { red: 0, green: 200, blue: 0 };

test.describe("sweep command line", () => {
  test.describe.configure({ mode: "serial" });

  let rootFolder = "";
  let dashboardFolder = "";
  let appServer: Server;
  let appUrl = "";
  let runningHub: RunningHub;

  const readShotColor = async (
    page: Parameters<typeof readCenterColor>[0],
    sweepReply: CommandReply,
    stepId: string,
    deviceId: string,
  ): Promise<ScreenColor> => {
    const runId = sweepReply.runId ?? "";
    const shotPath = join(rootFolder, createShotPath(runId, stepId, deviceId));
    const shotBytes = await readFile(shotPath);
    return readCenterColor(page, shotBytes.toString("base64"));
  };

  test.beforeAll(async () => {
    test.setTimeout(STARTUP_TIMEOUT_MS);
    rootFolder = await mkdtemp(join(tmpdir(), "everyscreen-cli-sweep-"));
    dashboardFolder = await mkdtemp(join(tmpdir(), "everyscreen-dash-"));
    await writeFile(join(dashboardFolder, "index.html"), "<h1>dashboard</h1>");
    await writeFile(
      join(rootFolder, "everyscreen.yaml"),
      `grid:\n  - ${GRID_DEVICE_IDS.join("\n  - ")}\n`,
    );
    appServer = createServer(answerAppRequest);
    appUrl = await listenOnFreePort(appServer);
    await writeFile(
      join(rootFolder, "login.yaml"),
      LOGIN_FLOW.replace("LOGIN_URL", `${appUrl}/login`),
    );
    await writeFile(
      join(rootFolder, "broken.yaml"),
      BROKEN_FLOW.replace("LOGIN_URL", `${appUrl}/login`),
    );
    runningHub = await startHub({ rootFolder, port: 0, dashboardFolder });
  });

  test.afterAll(async () => {
    await runningHub?.stop();
    appServer?.closeAllConnections();
    appServer?.close();
    await rm(rootFolder, { recursive: true, force: true });
    await rm(dashboardFolder, { recursive: true, force: true });
  });

  // The grid keeps its cookies between sweeps, so the run without --before must come first.
  test("shows the login page on the protected routes without --before", async ({
    page,
  }) => {
    test.setTimeout(SWEEP_TIMEOUT_MS);

    const sweepRun = await runCli(rootFolder, [
      "sweep",
      "--url",
      `${appUrl}/`,
      "--max-routes",
      "3",
    ]);

    expect(sweepRun.commandReply.failures).toEqual([]);
    expect(sweepRun.exitCode).toBe(0);
    for (const stepId of PROTECTED_STEP_IDS) {
      const shotColor = await readShotColor(
        page,
        sweepRun.commandReply,
        stepId,
        "pixel-10",
      );
      expect(isColorNear(shotColor, RED)).toBe(true);
    }
  });

  test("shows the protected pages when --before logs in first", async ({
    page,
  }) => {
    test.setTimeout(SWEEP_TIMEOUT_MS);

    const sweepRun = await runCli(rootFolder, [
      "sweep",
      "--url",
      `${appUrl}/`,
      "--max-routes",
      "3",
      "--before",
      "login.yaml",
    ]);

    expect(sweepRun.commandReply.failures).toEqual([]);
    expect(sweepRun.exitCode).toBe(0);
    expect(sweepRun.commandReply.line).toMatch(
      /^3 routes · 2 devices · 6 shots · \d+ findings? · report run-\d+$/,
    );
    for (const stepId of PROTECTED_STEP_IDS) {
      for (const deviceId of GRID_DEVICE_IDS) {
        const shotColor = await readShotColor(
          page,
          sweepRun.commandReply,
          stepId,
          deviceId,
        );
        expect(isColorNear(shotColor, GREEN)).toBe(true);
      }
    }
  });

  test("fails each device and visits no route when the before flow fails", async () => {
    test.setTimeout(SWEEP_TIMEOUT_MS);

    const sweepRun = await runCli(rootFolder, [
      "sweep",
      "--url",
      `${appUrl}/`,
      "--before",
      "broken.yaml",
    ]);

    expect(sweepRun.exitCode).toBe(1);
    expect(sweepRun.commandReply.line).toMatch(
      /^0 routes · 2 devices · 0 shots · 0 findings · 2 failed · report run-\d+$/,
    );
    const failureMessages = sweepRun.commandReply.failures.map(
      ({ message }) => message,
    );
    expect(failureMessages).toHaveLength(2);
    for (const failureMessage of failureMessages) {
      expect(failureMessage).toMatch(/^before flow failed: /);
    }
  });

  test("exits 1 with a failed line for an unknown device and 2 for bad usage", async () => {
    test.setTimeout(SWEEP_TIMEOUT_MS);

    const unknownDeviceRun = await runCli(rootFolder, [
      "sweep",
      "--url",
      `${appUrl}/`,
      "--devices",
      "nokia-3310",
    ]);
    const missingFlowRun = await runCli(rootFolder, [
      "sweep",
      "--url",
      `${appUrl}/`,
      "--before",
      "missing.yaml",
    ]);
    const badUsageRun = await runCli(rootFolder, ["sweep"]);

    expect(unknownDeviceRun.exitCode).toBe(1);
    expect(unknownDeviceRun.commandReply.line).toBe("No device nokia-3310");
    expect(missingFlowRun.exitCode).toBe(1);
    expect(missingFlowRun.commandReply.line).toContain("before flow:");
    expect(badUsageRun.exitCode).toBe(2);
  });

  test("sweeps every catalog device with --devices all and leaves no browser open", async () => {
    test.setTimeout(ALL_DEVICES_TIMEOUT_MS);

    const pidsBeforeSweep = await listDescendantPids();
    const sweepRun = await runCli(rootFolder, [
      "sweep",
      "--url",
      `${appUrl}/`,
      "--devices",
      "all",
      "--max-routes",
      "1",
      "--before",
      "login.yaml",
    ]);

    expect(sweepRun.commandReply.line).toMatch(
      new RegExp(
        `^1 route · ${CATALOG_DEVICE_COUNT} devices · ${CATALOG_DEVICE_COUNT} shots`,
      ),
    );
    const leftoverPids = await listNewPids(pidsBeforeSweep);
    expect(leftoverPids).toEqual([]);
  });

  test("runs the before flow once per device when no grid device is swept", async () => {
    test.setTimeout(ALL_DEVICES_TIMEOUT_MS);

    loginRequestPaths.length = 0;
    const sweepRun = await runCli(rootFolder, [
      "sweep",
      "--url",
      `${appUrl}/`,
      "--devices",
      "galaxy-s25,ipad-mini",
      "--max-routes",
      "1",
      "--before",
      "login.yaml",
    ]);

    expect(sweepRun.commandReply.failures).toEqual([]);
    expect(sweepRun.commandReply.line).toMatch(
      /^1 route · 2 devices · 2 shots/,
    );
    expect(loginRequestPaths).toHaveLength(2);
  });
});
