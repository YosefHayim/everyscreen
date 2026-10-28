import { mkdtemp, readFile, rm, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  expect,
  type Page,
  type Request,
  test,
  type WebSocketRoute,
} from "@playwright/test";
import { Hono } from "hono";
import { createServer, type ViteDevServer } from "vite";
import { WebSocketServer } from "ws";
import { DEVICES_FILE_PATH, LIVE_PATH } from "@/environment";
import { createHubApp } from "@/hub/hub-app";
import { type ListeningServer, listen } from "@/hub/hub-server";
import { liveRoutes } from "@/live/live-routes";

const HOST = "127.0.0.1";
const DESKTOP_VIEWPORT = { width: 1440, height: 900 };
const PHONE_VIEWPORT = { width: 390, height: 844 };
const FIRST_SCREEN_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const SECOND_SCREEN_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAGgwJ/lK3Q6wAAAABJRU5ErkJggg==";
const TOP_BAR_WIDTHS = [390, 768, 1440];
const MIN_SEARCH_WIDTH = 200;
const MIN_URL_WIDTH = 120;
const SHOP_URL = "https://shop.example/cart";
const WINDOW_FAMILIES = ["window-macos", "window-windows", "window-linux"];
const GRID_VIEW_STORAGE_KEY = "everyscreen.gridView";
const FRAME_FAMILIES_BY_DEVICE = [
  { name: "iPhone SE", family: "phone-home-button" },
  { name: "iPhone 17", family: "phone-island" },
  { name: "iPad mini", family: "tablet" },
  { name: "MacBook Air 13", family: "window-macos" },
  { name: "Windows laptop 1366", family: "window-windows" },
  { name: "Linux monitor 1920", family: "window-linux" },
] as const;

interface GridDeviceReply {
  name: string;
  use: { viewport: { width: number; height: number } };
}

const isLiveSocketUrl = (socketUrl: URL): boolean =>
  socketUrl.pathname === LIVE_PATH;

const createScreenMessage = (deviceId: string, imageBase64: string): string =>
  JSON.stringify({ kind: "screen", deviceId, imageBase64 });

const readFrameWidth = (page: Page, deviceName: string): Promise<number> =>
  page
    .getByRole("article")
    .filter({
      has: page.getByRole("heading", { name: deviceName, exact: true }),
    })
    .locator("[data-frame-page]")
    .evaluate((pageElement) => pageElement.getBoundingClientRect().width);

test.describe("device grid", () => {
  let rootFolder = "";
  let hubServer: ListeningServer;
  let websocketServer: WebSocketServer;
  let viteServer: ViteDevServer;
  let dashboardUrl = "";
  let liveSocket: WebSocketRoute | null = null;

  test.beforeAll(async () => {
    rootFolder = await mkdtemp(join(tmpdir(), "everyscreen-grid-"));
    const hubApp = new Hono()
      .route("/", createHubApp(rootFolder))
      .route("/", liveRoutes);
    websocketServer = new WebSocketServer({ noServer: true });
    hubServer = await listen(hubApp, websocketServer, 0);
    const hubUrl = `http://${HOST}:${hubServer.port}`;
    viteServer = await createServer({
      server: {
        host: HOST,
        port: 0,
        proxy: { "/api": { target: hubUrl, ws: true } },
      },
      logLevel: "silent",
    });
    await viteServer.listen();
    const dashboardAddress = viteServer.httpServer?.address() ?? null;
    const isDashboardAddressMissing =
      dashboardAddress === null || typeof dashboardAddress === "string";
    if (isDashboardAddressMissing) throw new Error("dashboard did not start");
    dashboardUrl = `http://${HOST}:${dashboardAddress.port}`;
  });

  test.afterAll(async () => {
    await viteServer.close();
    for (const liveClient of websocketServer.clients) liveClient.terminate();
    hubServer.httpServer.close();
    await rm(rootFolder, { recursive: true });
  });

  test.beforeEach(async ({ page }) => {
    liveSocket = null;
    await page.routeWebSocket(isLiveSocketUrl, (route) => {
      liveSocket = route;
      route.send(createScreenMessage("iphone-se", FIRST_SCREEN_BASE64));
    });
    await page.setViewportSize(DESKTOP_VIEWPORT);
  });

  test("each frame family draws its page at the catalog viewport size", async ({
    page,
    request,
  }) => {
    await page.addInitScript((storageKey) => {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          sizeMode: "true-size",
          density: "compact",
          scalePercent: 100,
        }),
      );
    }, GRID_VIEW_STORAGE_KEY);
    const devicesReply = await request.get(`${dashboardUrl}/api/devices`);
    const gridDevices: GridDeviceReply[] = await devicesReply.json();

    await page.goto(dashboardUrl);

    for (const frameDevice of FRAME_FAMILIES_BY_DEVICE) {
      const gridDevice = gridDevices.find(
        (candidate) => candidate.name === frameDevice.name,
      );
      const tile = page.getByRole("article").filter({
        has: page.getByRole("heading", { name: frameDevice.name, exact: true }),
      });
      await expect(tile.locator("[data-frame-family]")).toHaveAttribute(
        "data-frame-family",
        frameDevice.family,
      );
      const pageWidth = await readFrameWidth(page, frameDevice.name);
      expect(pageWidth).toBeCloseTo(gridDevice?.use.viewport.width ?? -1, 0);
    }
  });

  test("Fit and True size and the density change the tile size and are remembered", async ({
    page,
  }) => {
    await page.goto(dashboardUrl);
    const firstTile = page.getByRole("article").first();
    await expect(firstTile).toBeVisible();
    const fitWidth = (await firstTile.boundingBox())?.width ?? 0;

    await page.getByRole("button", { name: "True size" }).click();
    const trueSizeWidth = (await firstTile.boundingBox())?.width ?? 0;
    await page.getByRole("button", { name: "Comfortable" }).click();
    await page.getByRole("button", { name: "Fit" }).click();
    const comfortableWidth = (await firstTile.boundingBox())?.width ?? 0;
    await page.reload();

    expect(trueSizeWidth).not.toBe(fitWidth);
    expect(comfortableWidth).toBeGreaterThan(fitWidth);
    await expect(
      page.getByRole("button", { name: "Comfortable" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("the scale buttons step the scale percent", async ({ page }) => {
    await page.goto(dashboardUrl);

    await page.getByRole("button", { name: "Larger" }).click();

    await expect(page.getByRole("status", { name: "Scale" })).toHaveText(
      "110%",
    );
  });

  test("search filters the tiles by name", async ({ page }) => {
    await page.goto(dashboardUrl);

    await page.getByRole("searchbox", { name: "Search devices" }).fill("pixel");

    await expect(page.getByRole("article")).toHaveCount(1);
    await expect(page.getByRole("heading", { name: "Pixel 10" })).toBeVisible();
  });

  test("the picker adds and removes a catalog device and rewrites the yaml file", async ({
    page,
  }) => {
    const devicesFilePath = join(rootFolder, DEVICES_FILE_PATH);
    await page.goto(dashboardUrl);

    await page.getByRole("button", { name: "Add device" }).click();
    const pixelNine = page.getByRole("button", {
      name: /^Pixel 9 (Add|In grid)$/,
    });
    await pixelNine.click();
    await expect(pixelNine).toHaveAttribute("aria-pressed", "true");
    const yamlWithPixel = await readFile(devicesFilePath, "utf8");
    await pixelNine.click();
    await expect(pixelNine).toHaveAttribute("aria-pressed", "false");
    const yamlWithoutPixel = await readFile(devicesFilePath, "utf8");
    await unlink(devicesFilePath);

    expect(yamlWithPixel).toContain("pixel-9");
    expect(yamlWithoutPixel).not.toContain("pixel-9");
  });

  test("the agent panel shows a command from the live feed", async ({
    page,
  }) => {
    await page.goto(dashboardUrl);
    await expect(
      page.getByRole("complementary", { name: "Agent activity" }),
    ).toBeVisible();

    liveSocket?.send(
      JSON.stringify({
        kind: "command",
        commandNotice: {
          commandName: "open",
          status: "ok",
          line: "opened http://localhost:5173 on 12 devices",
          sentAt: Date.now(),
        },
      }),
    );

    await expect(
      page.getByText("opened http://localhost:5173 on 12 devices"),
    ).toBeVisible();
  });

  test("the grid has no sideways scroll at 390 wide", async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await page.goto(dashboardUrl);
    await expect(page.getByRole("article").first()).toBeVisible();

    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );

    expect(scrollWidth).toBeLessThanOrEqual(PHONE_VIEWPORT.width);
  });

  test("hovering a tile shows the expand button", async ({ page }) => {
    await page.goto(dashboardUrl);
    const expandButton = page.getByRole("button", { name: "Expand iPhone SE" });
    await expect(expandButton).toHaveCSS("opacity", "0");

    await page.getByRole("article").first().hover();

    await expect(expandButton).toHaveCSS("opacity", "1");
  });

  for (const viewportWidth of TOP_BAR_WIDTHS) {
    test(`the top bar parts never overlap at ${viewportWidth} wide`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: viewportWidth, height: 900 });
      await page.goto(dashboardUrl);
      await expect(page.getByRole("article").first()).toBeVisible();

      const partBoxes = await page
        .locator("header > *")
        .evaluateAll((parts) =>
          parts.map((part) => part.getBoundingClientRect().toJSON()),
        );
      const urlWidth = (
        await page.getByRole("textbox", { name: "App URL" }).boundingBox()
      )?.width;

      for (const [firstIndex, firstBox] of partBoxes.entries()) {
        for (const secondBox of partBoxes.slice(firstIndex + 1)) {
          const isSideBySide =
            firstBox.right <= secondBox.left + 1 ||
            secondBox.right <= firstBox.left + 1;
          const isStacked =
            firstBox.bottom <= secondBox.top + 1 ||
            secondBox.bottom <= firstBox.top + 1;
          expect(isSideBySide || isStacked).toBe(true);
        }
      }
      expect(urlWidth).toBeGreaterThan(MIN_URL_WIDTH);
    });
  }

  test("Ctrl+K focuses the device search and the box shows the hint", async ({
    page,
  }) => {
    await page.goto(dashboardUrl);
    const searchBox = page.getByRole("searchbox", { name: "Search devices" });
    await expect(page.getByRole("article").first()).toBeVisible();

    await page.keyboard.press("ControlOrMeta+k");

    await expect(searchBox).toBeFocused();
    await expect(page.locator("kbd")).toHaveText(/^(⌘K|Ctrl K)$/);
  });

  test("the setup guide goes away once a run exists", async ({ page }) => {
    await page.goto(dashboardUrl);
    const setupGuide = page.getByRole("region", { name: /steps/i });
    await expect(setupGuide).toBeVisible();

    liveSocket?.send(
      JSON.stringify({
        kind: "run-totals",
        phase: "start",
        totalTests: 2,
        startedAt: Date.now(),
        endedAt: null,
        okCount: 0,
        failedCount: 0,
        outcome: null,
        endReason: null,
      }),
    );

    await expect(setupGuide).toHaveCount(0);
  });

  test("the hub pill is green when connected", async ({ page }) => {
    await page.goto(dashboardUrl);

    const hubDot = page.locator("header span:has-text('Connected') > span");

    await expect(hubDot).toHaveClass(/bg-ok/);
  });

  for (const width of TOP_BAR_WIDTHS) {
    test(`no tile header clips its name or its size line at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(dashboardUrl);
      await expect(page.getByRole("article").first()).toBeVisible();

      const clippedHeaders = await page
        .locator("article header")
        .evaluateAll((headers) =>
          headers
            .flatMap((header) => [
              header.querySelector("h3"),
              header.querySelector("p"),
            ])
            .filter(
              (element) =>
                element !== null && element.scrollWidth > element.clientWidth,
            )
            .map((element) => element?.textContent),
        );

      expect(clippedHeaders).toEqual([]);
    });
  }

  test("the search box and the url bar each get a full row at 390px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(dashboardUrl);

    const searchBox = await page
      .getByRole("searchbox", { name: "Search devices" })
      .boundingBox();

    expect(searchBox?.width).toBeGreaterThan(MIN_SEARCH_WIDTH);
  });

  test("the iPhone island is drawn on top of the page and the desktop window bars show the app URL", async ({
    page,
  }) => {
    await page.goto(dashboardUrl);
    const phoneCutout = page
      .locator('[data-frame-family="phone-island"] [data-frame-cutout]')
      .first();
    await expect(phoneCutout).toBeVisible();

    const isCutoutOnTop = await phoneCutout.evaluate((cutoutElement) => {
      const { left, top, width, height } =
        cutoutElement.getBoundingClientRect();
      const topElement = document.elementFromPoint(
        left + width / 2,
        top + height / 2,
      );
      return topElement === cutoutElement;
    });
    await page.getByRole("textbox", { name: "App URL" }).fill(SHOP_URL);

    expect(isCutoutOnTop).toBe(true);
    for (const windowFamily of WINDOW_FAMILIES) {
      await expect(
        page.locator(`[data-frame-family="${windowFamily}"]`).first(),
      ).toContainText(SHOP_URL);
    }
  });

  test.describe("zoom dialog", () => {
    test("opens from the expand button, shows the live image and closes with Esc", async ({
      page,
    }) => {
      await page.goto(dashboardUrl);
      const zoomDialog = page.getByRole("dialog", { name: "Device zoom" });
      const tileImage = page.getByRole("img", { name: "iPhone SE" }).first();
      await expect(tileImage).toBeVisible();

      await page.getByRole("article").first().hover();
      await page.getByRole("button", { name: "Expand iPhone SE" }).click();
      const dialogImage = zoomDialog.getByRole("img", { name: "iPhone SE" });
      await expect(dialogImage).toBeVisible();
      const firstSource = await dialogImage.getAttribute("src");
      liveSocket?.send(createScreenMessage("iphone-se", SECOND_SCREEN_BASE64));
      await expect(dialogImage).not.toHaveAttribute("src", firstSource ?? "");
      await page.keyboard.press("Escape");

      await expect(zoomDialog).toBeHidden();
    });

    test("opens from the keyboard with Enter and moves with the arrow keys", async ({
      page,
    }) => {
      await page.goto(dashboardUrl);
      const zoomDialog = page.getByRole("dialog", { name: "Device zoom" });
      const frameButton = page.getByRole("button", {
        name: "Zoom in on iPhone SE",
      });

      await frameButton.focus();
      await page.keyboard.press("Enter");
      await expect(
        zoomDialog.getByRole("heading", { name: "iPhone SE" }),
      ).toBeVisible();
      await page.keyboard.press("ArrowRight");
      await expect(
        zoomDialog.getByRole("heading", { name: "iPhone 17", exact: true }),
      ).toBeVisible();
      await page.keyboard.press("ArrowLeft");
      await expect(
        zoomDialog.getByRole("heading", { name: "iPhone SE" }),
      ).toBeVisible();
      await page.keyboard.press("Escape");

      await expect(zoomDialog).toBeHidden();
      await expect(frameButton).toBeFocused();
    });

    test("a backdrop click closes it and the size toggle works", async ({
      page,
    }) => {
      await page.goto(dashboardUrl);
      const zoomDialog = page.getByRole("dialog", { name: "Device zoom" });

      await page.getByRole("button", { name: "Zoom in on iPhone SE" }).click();
      await zoomDialog.getByRole("button", { name: "True size" }).click();
      await expect(
        zoomDialog.getByRole("button", { name: "True size" }),
      ).toHaveAttribute("aria-pressed", "true");
      await page.mouse.click(4, 4);

      await expect(zoomDialog).toBeHidden();
    });

    test("tells the hub which device is zoomed and drops it on close", async ({
      page,
    }) => {
      const zoomBodies: string[] = [];
      await page.route("**/api/zoom", async (route) => {
        const zoomRequest: Request = route.request();
        zoomBodies.push(zoomRequest.postData() ?? "");
        await route.fulfill({ status: 200, json: { deviceId: null } });
      });
      await page.goto(dashboardUrl);

      await page.getByRole("button", { name: "Zoom in on iPhone SE" }).click();
      await expect.poll(() => zoomBodies.length).toBe(1);
      await page.keyboard.press("Escape");
      await expect.poll(() => zoomBodies.length).toBe(2);

      expect(zoomBodies[0]).toContain("iphone-se");
      expect(zoomBodies[1]).toContain("null");
    });
  });
});
