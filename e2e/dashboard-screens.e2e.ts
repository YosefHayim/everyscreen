import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { serve } from "@hono/node-server";
import { expect, type Page, test } from "@playwright/test";
import { createServer, type ViteDevServer } from "vite";
import { DEVICES_FILE_PATH, STORE_FOLDER } from "@/environment";
import { createHubApp } from "@/hub/hub-app";

const HOST = "127.0.0.1";
const DESKTOP_VIEWPORT = { width: 1440, height: 900 };
const PHONE_VIEWPORT = { width: 390, height: 844 };
const SHOT_NAME = "run-0001-iphone-se.png";
const SHOTS_FOLDER = join(STORE_FOLDER, "shots");
// A one-pixel PNG, enough for the proof image to load.
const SHOT_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);
const SHOT_PATH = join(SHOTS_FOLDER, SHOT_NAME);
const SCREENS = [
  { screenName: "grid", path: "/" },
  { screenName: "focus", path: "/focus/shop-kiosk" },
  { screenName: "runs", path: "/runs" },
  { screenName: "run-report", path: "/runs/run-0001" },
  { screenName: "devices", path: "/devices" },
] as const;

const SHOT_FOLDER_FOR_PICTURES = process.env.DASHBOARD_SHOTS_FOLDER ?? null;

const SAVED_RUN = {
  runId: "run-0001",
  origin: "flow",
  status: "failed",
  startedAt: new Date(2026, 9, 28, 14, 7).getTime(),
  steps: [
    {
      stepId: "step-1",
      title: "open /shop/linen-shirt",
      startedAt: 1,
      deviceAnswers: [
        { status: "ok", deviceId: "pixel-8", durationMs: 1400 },
        { status: "ok", deviceId: "iphone-se", durationMs: 1200 },
      ],
      findings: [
        {
          kind: "overflow",
          severity: "warn",
          deviceId: "iphone-se",
          selector: "div.coupon-row",
          message: "div.coupon-row runs 24px past the right edge.",
        },
      ],
      proof: null,
    },
    {
      stepId: "step-2",
      title: "tap Add to cart",
      startedAt: 2,
      deviceAnswers: [
        { status: "ok", deviceId: "pixel-8", durationMs: 300 },
        {
          status: "failed",
          deviceId: "iphone-se",
          durationMs: 5000,
          message: "div.cookie-bar intercepts pointer events",
          shotPath: SHOT_PATH,
        },
      ],
      findings: [],
      proof: {
        shotPath: SHOT_PATH,
        errorMessage: "locator.click: Timeout 5000ms exceeded.",
        codeSnippet:
          'await page.getByRole("button", { name: "Add to cart" }).click();',
        codeLocation: "tests/add-to-cart.spec.ts:4",
      },
    },
  ],
};

const DEVICES_YAML = `devices:
  - name: Shop kiosk
    width: 800
    height: 1280
    pixelRatio: 2
    hasTouch: true
    frameShape: kiosk
`;

const createFixtureFolder = async (): Promise<string> => {
  const rootFolder = await mkdtemp(join(tmpdir(), "everyscreen-dashboard-"));
  await writeFile(join(rootFolder, DEVICES_FILE_PATH), DEVICES_YAML);
  await mkdir(join(rootFolder, SHOTS_FOLDER), { recursive: true });
  await writeFile(join(rootFolder, SHOTS_FOLDER, SHOT_NAME), SHOT_PNG);
  const runsFolder = join(rootFolder, STORE_FOLDER, "runs");
  await mkdir(runsFolder, { recursive: true });
  await writeFile(join(runsFolder, "run-0001.json"), JSON.stringify(SAVED_RUN));
  return rootFolder;
};

const readPageWidths = (page: Page): Promise<number[]> =>
  page.evaluate(() => [
    document.documentElement.scrollWidth,
    window.innerWidth,
    document.querySelector("main")?.scrollWidth ?? 0,
  ]);

test.describe("dashboard screens", () => {
  let rootFolder = "";
  let hubServer: ReturnType<typeof serve>;
  let viteServer: ViteDevServer;
  let dashboardUrl = "";

  test.beforeAll(async () => {
    rootFolder = await createFixtureFolder();
    const hubApp = createHubApp(rootFolder);
    const hubPort = await new Promise<number>((done) => {
      hubServer = serve(
        { fetch: hubApp.fetch, port: 0, hostname: HOST },
        (address: AddressInfo) => done(address.port),
      );
    });
    const hubUrl = `http://${HOST}:${hubPort}`;
    viteServer = await createServer({
      server: {
        host: HOST,
        port: 0,
        proxy: { "/api": hubUrl },
      },
      logLevel: "silent",
    });
    await viteServer.listen();
    const dashboardAddress = viteServer.httpServer?.address() ?? null;
    const isDashboardAddressMissing =
      dashboardAddress === null || typeof dashboardAddress === "string";
    if (isDashboardAddressMissing) throw new Error("dashboard did not start");
    const dashboardPort = dashboardAddress.port;
    dashboardUrl = `http://${HOST}:${dashboardPort}`;
  });

  test.afterAll(async () => {
    await viteServer.close();
    hubServer.close();
    await rm(rootFolder, { recursive: true });
  });

  test("the grid lists the presets and the custom device from the hub", async ({
    page,
  }) => {
    await page.goto(dashboardUrl);

    await expect(
      page.getByRole("heading", { name: "iPhone SE" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Shop kiosk" }),
    ).toBeVisible();
  });

  test("the focus screen shows one device and the others", async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto(`${dashboardUrl}/focus/shop-kiosk`);

    await expect(
      page.getByRole("heading", { name: "Shop kiosk", level: 1 }),
    ).toBeVisible();
    await expect(page.getByText("No findings on this device")).toBeVisible();
    await expect(page.getByRole("link", { name: /iPhone SE/ })).toBeVisible();
  });

  test("the runs list shows the saved run and filters by status", async ({
    page,
  }) => {
    await page.goto(`${dashboardUrl}/runs`);

    await expect(page.getByText("run-0001")).toBeVisible();
    await expect(page.getByText("Failed on iphone-se")).toBeVisible();
    await page.getByRole("button", { name: /^Passed/ }).click();
    await expect(page.getByText("No runs match these filters")).toBeVisible();
    await page.getByRole("button", { name: /^Failed/ }).click();
    await expect(page.getByText("run-0001")).toBeVisible();
  });

  test("the run report shows the matrix, the finding and the failure proof", async ({
    page,
  }) => {
    await page.goto(`${dashboardUrl}/runs/run-0001`);

    await expect(
      page.getByRole("heading", { name: "Run run-0001" }),
    ).toBeVisible();
    await expect(page.getByText("tests/add-to-cart.spec.ts:4")).toBeVisible();
    await expect(page.getByText(/Add to cart" }\)\.click/)).toBeVisible();
    await expect(
      page.getByText("locator.click: Timeout 5000ms exceeded."),
    ).toBeVisible();
    await expect(page.getByRole("img", { name: /Shot of/ })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Past the screen edge" }),
    ).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "2" })).toBeVisible();
  });

  test("the devices screen adds a device, rejects a bad one and removes it", async ({
    page,
  }) => {
    await page.goto(`${dashboardUrl}/devices`);
    await page.getByRole("button", { name: "Add a device" }).click();

    await page.getByLabel("Name").fill("Desk monitor");
    await page.getByLabel("Width (px)").fill("100");
    await page.getByLabel("Height (px)").fill("900");
    await page.getByRole("button", { name: "Add to grid" }).click();
    await expect(page.getByRole("alert").first()).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Desk monitor" }),
    ).toHaveCount(0);

    await page.getByLabel("Width (px)").fill("1600");
    await page.getByRole("button", { name: "Add to grid" }).click();
    await expect(
      page.getByRole("heading", { name: "Desk monitor" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Remove Desk monitor" }).click();
    await expect(
      page.getByRole("heading", { name: "Desk monitor" }),
    ).toHaveCount(0);
  });

  test("every screen fits a 390 wide phone without sideways scroll", async ({
    page,
  }) => {
    await page.setViewportSize(PHONE_VIEWPORT);

    for (const screen of SCREENS) {
      await page.goto(`${dashboardUrl}${screen.path}`);
      await page.getByRole("main").waitFor();
      await page.waitForLoadState("networkidle");
      const [pageWidth, windowWidth, mainWidth] = await readPageWidths(page);

      expect(pageWidth, screen.screenName).toBeLessThanOrEqual(windowWidth);
      expect(mainWidth, screen.screenName).toBeLessThanOrEqual(windowWidth);
    }
  });

  test("pictures of every screen at 1440 and 390", async ({ page }) => {
    test.skip(SHOT_FOLDER_FOR_PICTURES === null, "set DASHBOARD_SHOTS_FOLDER");
    const viewports = [
      { viewportName: "1440", viewport: DESKTOP_VIEWPORT },
      { viewportName: "390", viewport: PHONE_VIEWPORT },
    ];

    for (const { viewportName, viewport } of viewports) {
      await page.setViewportSize(viewport);
      for (const screen of SCREENS) {
        await page.goto(`${dashboardUrl}${screen.path}`);
        await page.waitForLoadState("networkidle");
        await page.screenshot({
          path: `${SHOT_FOLDER_FOR_PICTURES}/${screen.screenName}-${viewportName}.png`,
          fullPage: true,
        });
      }
    }
  });
});
