import { once } from "node:events";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { chromium, webkit } from "playwright";
import { WebSocket } from "ws";
import type { CommandReply } from "@/commands/commands-logic";
import { hubFileSchema } from "@/hub/hub-file";
import { type RunningHub, startHub } from "@/hub/hub-server";
import type { LiveMessage } from "@/live/live-feed";
import type { Run } from "@/runs/runs-logic";

const HOLLIS_GOODS_PATH = join(import.meta.dirname, "hollis-goods.html");
const DASHBOARD_HTML = "<!doctype html><h1>Everyscreen test dashboard</h1>";
const DEVICE_IDS = ["pixel-10", "iphone-se"];
const STARTUP_TIMEOUT_MS = 180_000;
const FORM_PATH = "/form";
const FORM_HTML =
  '<!doctype html><meta name="viewport" content="width=device-width"><body><label>Email <input type="email" aria-label="Email"></label><p>Welcome back</p>';
const PROBLEM_CONTENT_TYPE = "application/problem+json";

const postCommand = (hubUrl: string, hubCommand: object): Promise<Response> =>
  fetch(`${hubUrl}/api/commands`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(hubCommand),
  });

test.describe("startHub", () => {
  test.describe.configure({ mode: "serial" });

  let rootFolder = "";
  let dashboardFolder = "";
  let shopServer: Server;
  let shopUrl = "";
  let runningHub: RunningHub;
  let liveSocket: WebSocket;
  const liveMessages: LiveMessage[] = [];
  let isHubStopped = false;

  test.beforeAll(async () => {
    test.setTimeout(STARTUP_TIMEOUT_MS);
    rootFolder = await mkdtemp(join(tmpdir(), "everyscreen-hub-server-"));
    dashboardFolder = await mkdtemp(join(tmpdir(), "everyscreen-dashboard-"));
    await writeFile(join(dashboardFolder, "index.html"), DASHBOARD_HTML);

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

    runningHub = await startHub({ rootFolder, port: 0, dashboardFolder });

    const liveUrl = `${runningHub.url.replace("http", "ws")}/api/live`;
    liveSocket = new WebSocket(liveUrl);
    liveSocket.on("message", (messageBytes) => {
      liveMessages.push(JSON.parse(messageBytes.toString()));
    });
    await once(liveSocket, "open");
  });

  test.afterAll(async () => {
    liveSocket?.terminate();
    const mustStopHub = runningHub !== undefined && !isHubStopped;
    if (mustStopHub) await runningHub.stop();
    shopServer?.close();
    await rm(rootFolder, { recursive: true, force: true });
    await rm(dashboardFolder, { recursive: true, force: true });
  });

  test("replies with one line for open and then tap", async () => {
    const openReply = await postCommand(runningHub.url, {
      commandName: "open",
      url: shopUrl,
      deviceIds: DEVICE_IDS,
    });
    const tapReply = await postCommand(runningHub.url, {
      commandName: "tap",
      role: "button",
      name: "Close",
      deviceIds: DEVICE_IDS,
    });

    expect(openReply.status).toBe(200);
    expect(tapReply.status).toBe(200);
    const openCommandReply: CommandReply = await openReply.json();
    const tapCommandReply: CommandReply = await tapReply.json();
    expect(openCommandReply.line).toMatch(/^2 devices · .*report run-0001$/);
    expect(tapCommandReply.line).toMatch(/^2 devices · .*report run-0001$/);
    expect(tapCommandReply.line).not.toContain("\n");
  });

  test("saves one run with both device answers and findings", async () => {
    const runReply = await fetch(`${runningHub.url}/api/runs/run-0001`);
    const run: Run = await runReply.json();

    expect(run.origin).toBe("cli");
    expect(run.steps.map(({ title }) => title)).toEqual([
      `open ${shopUrl}`,
      'tap button "Close"',
    ]);
    for (const step of run.steps) {
      const answeredIds = step.deviceAnswers.map(({ deviceId }) => deviceId);
      expect(answeredIds.toSorted()).toEqual(DEVICE_IDS.toSorted());
    }
    const [openStep] = run.steps;
    expect(openStep.findings.map(({ kind }) => kind)).toContain("overflow");
    const failedAnswers = openStep.deviceAnswers.filter(
      ({ status }) => status === "failed",
    );
    expect(failedAnswers.length).toBeGreaterThan(0);
    expect(openStep.proof?.shotPath).toMatch(/\.png$/);
  });

  test("sends screens for both devices and a run message on the live feed", async () => {
    await expect
      .poll(() => liveMessages.some((message) => message.kind === "run"))
      .toBe(true);

    const screenIds = liveMessages
      .filter((message) => message.kind === "screen")
      .map((message) => message.deviceId);
    expect(screenIds).toContain("pixel-10");
    expect(screenIds).toContain("iphone-se");
    const runMessage = liveMessages.find((message) => message.kind === "run");
    expect(runMessage?.runId).toBe("run-0001");
    expect(liveMessages.some((message) => message.kind === "finding")).toBe(
      true,
    );
  });

  test("runs fill, scroll, expect, check and shot on both devices", async () => {
    const formUrl = `${shopUrl}form`;
    const hubCommands = [
      { commandName: "open", url: formUrl, deviceIds: DEVICE_IDS },
      {
        commandName: "fill",
        role: "textbox",
        name: "Email",
        with: "a@b.test",
        deviceIds: DEVICE_IDS,
      },
      { commandName: "scroll", to: "bottom", deviceIds: DEVICE_IDS },
      { commandName: "expect", text: "Welcome back", deviceIds: DEVICE_IDS },
      { commandName: "check", deviceIds: DEVICE_IDS },
      { commandName: "shot", deviceIds: DEVICE_IDS },
    ];

    const commandReplies: CommandReply[] = [];
    for (const hubCommand of hubCommands) {
      const commandReply = await postCommand(runningHub.url, hubCommand);
      commandReplies.push(await commandReply.json());
    }

    expect(commandReplies.map(({ status }) => status)).toEqual(
      hubCommands.map(() => "ok"),
    );
    for (const deviceId of DEVICE_IDS) {
      const shotFile = `run-0001-step-8-${deviceId}.png`;
      const shotBytes = await readFile(
        join(rootFolder, ".everyscreen", "shots", shotFile),
      );
      expect(shotBytes.length).toBeGreaterThan(0);
    }
  });

  test("fails a device when the tapped button is missing", async () => {
    const missingReply = await postCommand(runningHub.url, {
      commandName: "tap",
      role: "button",
      name: "Teleport",
      deviceIds: ["pixel-10"],
    });

    const missingCommandReply: CommandReply = await missingReply.json();
    expect(missingCommandReply.status).toBe("failed");
    expect(missingCommandReply.failures[0].shotPath).toMatch(/\.png$/);
  });

  test("rejects a bad command body with a problem reply", async () => {
    const badReply = await postCommand(runningHub.url, {
      commandName: "dance",
    });

    expect(badReply.status).toBe(400);
    expect(badReply.headers.get("Content-Type")).toBe(PROBLEM_CONTENT_TYPE);
  });

  test("answers an unknown device with a 404 problem reply", async () => {
    const missingReply = await postCommand(runningHub.url, {
      commandName: "check",
      deviceIds: ["nokia-3310"],
    });

    expect(missingReply.status).toBe(404);
    expect(missingReply.headers.get("Content-Type")).toBe(PROBLEM_CONTENT_TYPE);
  });

  test("serves the dashboard on the root and on client routes", async () => {
    const rootReply = await fetch(`${runningHub.url}/`);
    const runPageReply = await fetch(`${runningHub.url}/runs/run-1`);
    const unknownApiReply = await fetch(`${runningHub.url}/api/nothing`);

    expect(await rootReply.text()).toBe(DASHBOARD_HTML);
    expect(await runPageReply.text()).toBe(DASHBOARD_HTML);
    expect(unknownApiReply.status).toBe(404);
  });

  test("writes the hub file while running and removes it on stop", async () => {
    const hubFilePath = join(rootFolder, ".everyscreen", "hub.json");
    const hubFile = hubFileSchema.parse(
      JSON.parse(await readFile(hubFilePath, "utf8")),
    );
    const pixelEndpoints = hubFile.devices["pixel-10"];
    const iphoneEndpoints = hubFile.devices["iphone-se"];
    expect(pixelEndpoints.cdpUrl).not.toBeNull();
    expect(iphoneEndpoints.cdpUrl).toBeNull();

    liveSocket.terminate();
    await runningHub.stop();
    isHubStopped = true;

    await expect(readFile(hubFilePath, "utf8")).rejects.toThrow("ENOENT");
    const cdpUrl = pixelEndpoints.cdpUrl ?? "";
    await expect(chromium.connectOverCDP(cdpUrl)).rejects.toThrow();
    await expect(webkit.connect(iphoneEndpoints.wsEndpoint)).rejects.toThrow();
  });
});
