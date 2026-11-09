import { once } from "node:events";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { createServer as createViteServer, type ViteDevServer } from "vite";
import { type RunningHub, startHub } from "@/hub/hub-server";

const FIXTURE_HOST = "127.0.0.1";
const OPEN_TIMEOUT_MS = 120_000;

const listenOnFreePort = async (server: Server): Promise<string> => {
  server.listen(0, FIXTURE_HOST);
  await once(server, "listening");
  const address = server.address();
  const isAddressMissing = address === null || typeof address === "string";
  if (isAddressMissing) throw new Error("The fixture site did not listen");
  return `http://${FIXTURE_HOST}:${address.port}/`;
};

const sendOpenCommand = (hubUrl: string, appUrl: string): Promise<Response> =>
  fetch(`${hubUrl}/api/commands`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      commandName: "open",
      url: appUrl,
      deviceIds: ["iphone-se", "pixel-10"],
    }),
  });

test.describe("app url bar", () => {
  test.describe.configure({ mode: "serial" });

  let rootFolder = "";
  let dashboardFolder = "";
  let fixtureSite: Server;
  let fixtureUrl = "";
  let runningHub: RunningHub;
  let viteServer: ViteDevServer;
  let dashboardUrl = "";

  test.beforeAll(async () => {
    const startupTimeoutMilliseconds = 180_000;
    test.setTimeout(startupTimeoutMilliseconds);
    rootFolder = await mkdtemp(join(tmpdir(), "everyscreen-url-bar-"));
    dashboardFolder = await mkdtemp(join(tmpdir(), "everyscreen-dashboard-"));
    await writeFile(
      join(dashboardFolder, "index.html"),
      "<!doctype html><h1>Everyscreen test dashboard</h1>",
    );
    fixtureSite = createServer((_fixtureRequest, fixtureReply) => {
      fixtureReply.setHeader("Content-Type", "text/html");
      fixtureReply.end(
        '<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1"><title>Fixture</title><h1>Fixture</h1>',
      );
    });
    fixtureUrl = await listenOnFreePort(fixtureSite);
    runningHub = await startHub({ rootFolder, port: 0, dashboardFolder });
    viteServer = await createViteServer({
      server: {
        host: FIXTURE_HOST,
        port: 0,
        proxy: { "/api": { target: runningHub.url, ws: true } },
      },
      logLevel: "silent",
    });
    await viteServer.listen();
    const dashboardAddress = viteServer.httpServer?.address() ?? null;
    const isDashboardAddressMissing =
      dashboardAddress === null || typeof dashboardAddress === "string";
    if (isDashboardAddressMissing) throw new Error("dashboard did not start");
    dashboardUrl = `http://${FIXTURE_HOST}:${dashboardAddress.port}`;
  });

  test.afterAll(async () => {
    await viteServer?.close();
    await runningHub?.stop();
    fixtureSite?.close();
    await rm(rootFolder, { recursive: true, force: true });
    await rm(dashboardFolder, { recursive: true, force: true });
  });

  test("is empty before an app is open, then shows the url the hub opened", async ({
    page,
  }) => {
    test.setTimeout(OPEN_TIMEOUT_MS);
    const urlBar = page.getByRole("textbox", { name: "App URL" });
    await page.goto(dashboardUrl);
    await expect(urlBar).toBeVisible();

    await expect(urlBar).toHaveValue("");
    const openReply = await sendOpenCommand(runningHub.url, fixtureUrl);

    expect(openReply.status).toBe(200);
    await expect(urlBar).toHaveValue(fixtureUrl, { timeout: OPEN_TIMEOUT_MS });
  });

  test("opens a typed url on the devices when Enter is pressed", async ({
    page,
  }) => {
    test.setTimeout(OPEN_TIMEOUT_MS);
    const typedUrl = `${fixtureUrl}typed`;
    const urlBar = page.getByRole("textbox", { name: "App URL" });
    await page.goto(dashboardUrl);
    await expect(urlBar).toHaveValue(fixtureUrl, { timeout: OPEN_TIMEOUT_MS });

    await urlBar.fill(typedUrl);
    await urlBar.press("Enter");

    await expect(urlBar).toHaveValue(fixtureUrl, { timeout: OPEN_TIMEOUT_MS });
    const appReply = await fetch(`${runningHub.url}/api/commands/app`);
    expect(await appReply.json()).toEqual({ appUrl: fixtureUrl });
  });
});
