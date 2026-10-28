import { once } from "node:events";
import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import type { CommandReply } from "@/commands/commands-logic";
import { type RunningHub, startHub } from "@/hub/hub-server";
import type { Run } from "@/runs/runs-logic";

const DASHBOARD_HTML = "<!doctype html><h1>Everyscreen test dashboard</h1>";
const DEVICE_IDS = ["iphone-se", "pixel-10"];
const STARTUP_TIMEOUT_MS = 180_000;
const SWEEP_TIMEOUT_MS = 120_000;
const EXPECTED_ROUTES = [
  "/",
  "/about",
  "/pricing",
  "/wide",
  "/sitemap-only",
  "/orders/123",
];
const WIDE_ROUTE = "/wide";

const createPage = (title: string, bodyHtml: string): string =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title}</title><style>body{margin:0;font:16px sans-serif}a{display:block;min-height:48px;padding:12px}</style></head><body><h1>${title}</h1>${bodyHtml}`;

const HOME_LINKS = `
  <a href="/about#team">About</a>
  <a href="/pricing">Pricing</a>
  <a href="/wide">Wide</a>
  <a href="https://example.com/">Elsewhere</a>
  <a href="mailto:hi@example.com">Mail us</a>`;

const FIXTURE_PAGES: Record<string, string> = {
  "/": createPage("Home", HOME_LINKS),
  "/about": createPage("About", '<a href="/">Home</a>'),
  "/pricing": createPage("Pricing", '<a href="/">Home</a>'),
  "/wide": createPage(
    "Wide",
    '<div style="width:900px;height:40px;background:#0f766e"></div>',
  ),
  "/sitemap-only": createPage("Sitemap only", "<p>Found by the sitemap</p>"),
  "/orders/123": createPage("Order 123", "<p>Listed in everyscreen.yaml</p>"),
};

const createSitemap = (siteUrl: string): string =>
  `<?xml version="1.0"?><urlset><url><loc>${siteUrl}about</loc></url><url><loc>${siteUrl}sitemap-only</loc></url></urlset>`;

const listenOnFreePort = async (server: Server): Promise<string> => {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  const isAddressMissing = address === null || typeof address === "string";
  if (isAddressMissing) throw new Error("The fixture site did not listen");
  return `http://127.0.0.1:${address.port}/`;
};

test.describe("sweep command", () => {
  test.describe.configure({ mode: "serial" });

  let rootFolder = "";
  let dashboardFolder = "";
  let fixtureSite: Server;
  let siteUrl = "";
  let runningHub: RunningHub;
  let sweepReply: CommandReply;

  test.beforeAll(async () => {
    test.setTimeout(STARTUP_TIMEOUT_MS);
    rootFolder = await mkdtemp(join(tmpdir(), "everyscreen-sweep-"));
    dashboardFolder = await mkdtemp(join(tmpdir(), "everyscreen-dashboard-"));
    await writeFile(join(dashboardFolder, "index.html"), DASHBOARD_HTML);
    await writeFile(
      join(rootFolder, "everyscreen.yaml"),
      "routes:\n  - /orders/123\n",
    );

    fixtureSite = createServer((siteRequest, siteReply) => {
      const { pathname } = new URL(siteRequest.url ?? "/", "http://fixture");
      const isSitemapRequest = pathname === "/sitemap.xml";
      const pageHtml = FIXTURE_PAGES[pathname];
      const isPageMissing = !isSitemapRequest && pageHtml === undefined;
      if (isPageMissing) {
        siteReply.statusCode = 404;
        siteReply.end();
        return;
      }
      const contentType = isSitemapRequest ? "application/xml" : "text/html";
      siteReply.setHeader("Content-Type", contentType);
      siteReply.end(isSitemapRequest ? createSitemap(siteUrl) : pageHtml);
    });
    siteUrl = await listenOnFreePort(fixtureSite);

    runningHub = await startHub({ rootFolder, port: 0, dashboardFolder });
  });

  test.afterAll(async () => {
    await runningHub?.stop();
    fixtureSite?.close();
    await rm(rootFolder, { recursive: true, force: true });
    await rm(dashboardFolder, { recursive: true, force: true });
  });

  test("replies with one line and one failure line for the wide page", async () => {
    test.setTimeout(SWEEP_TIMEOUT_MS);

    const hubReply = await fetch(`${runningHub.url}/api/commands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commandName: "sweep",
        url: siteUrl,
        deviceIds: DEVICE_IDS,
      }),
    });

    expect(hubReply.status).toBe(200);
    sweepReply = await hubReply.json();
    expect(sweepReply.line).toMatch(
      /^6 routes · 2 devices · 12 shots · \d+ findings · 2 failed · report run-0001$/,
    );
    expect(sweepReply.status).toBe("failed");
    expect(sweepReply.failures.map(({ deviceId }) => deviceId).sort()).toEqual(
      DEVICE_IDS.toSorted(),
    );
    for (const failure of sweepReply.failures) {
      expect(failure.message).toContain(`${WIDE_ROUTE} `);
    }
  });

  test("saves one run with a step per route found from links, sitemap and everyscreen.yaml", async () => {
    const runReply = await fetch(`${runningHub.url}/api/runs/run-0001`);
    const run: Run = await runReply.json();

    expect(run.status).toBe("failed");
    expect(run.steps.map(({ title }) => title)).toEqual(
      EXPECTED_ROUTES.map((route) => `sweep ${route}`),
    );
    for (const step of run.steps) {
      const answeredIds = step.deviceAnswers.map(({ deviceId }) => deviceId);
      expect(answeredIds.toSorted()).toEqual(DEVICE_IDS.toSorted());
    }
  });

  test("keeps one shot on disk for every route and device", async () => {
    const runReply = await fetch(`${runningHub.url}/api/runs/run-0001`);
    const run: Run = await runReply.json();

    const shotPaths = run.steps.flatMap(({ deviceAnswers }) =>
      deviceAnswers.map(({ shotPath }) => shotPath),
    );

    expect(shotPaths).toHaveLength(EXPECTED_ROUTES.length * DEVICE_IDS.length);
    for (const shotPath of shotPaths) {
      const isShotPathMissing = shotPath === null;
      if (isShotPathMissing) throw new Error("A sweep answer has no shot path");
      const shotFile = join(rootFolder, shotPath);
      await access(shotFile);
    }
  });

  test("finds the overflow only on the wide page, on both devices", async () => {
    const runReply = await fetch(`${runningHub.url}/api/runs/run-0001`);
    const run: Run = await runReply.json();

    const overflowSteps = run.steps.filter(({ findings }) =>
      findings.some(({ kind }) => kind === "overflow"),
    );

    expect(overflowSteps.map(({ title }) => title)).toEqual([
      `sweep ${WIDE_ROUTE}`,
    ]);
    const overflowDeviceIds = overflowSteps[0].findings
      .filter(({ kind }) => kind === "overflow")
      .map(({ deviceId }) => deviceId);
    expect(overflowDeviceIds.toSorted()).toEqual(DEVICE_IDS.toSorted());
  });
});
