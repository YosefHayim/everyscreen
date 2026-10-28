import { once } from "node:events";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { chromium, type Page } from "playwright";
import { WebSocket } from "ws";
import { LIVE_PATH } from "@/environment";
import { type RunningHub, startHub } from "@/hub/hub-server";
import type { LiveMessage } from "@/live/live-feed";

const STARTUP_TIMEOUT_MS = 240_000;
const GRID_DEVICE_IDS = [
  "iphone-se",
  "iphone-17",
  "iphone-17-pro-max",
  "ipad-mini",
  "ipad-pro-11",
  "pixel-10",
  "galaxy-s25",
];
const RENDER_DELAY_MS = 1500;
interface ScreenColor {
  red: number;
  green: number;
  blue: number;
}

type ScreenMessage = Extract<LiveMessage, { kind: "screen" }>;

const GREEN_CHANNELS: ScreenColor = { red: 34, green: 170, blue: 102 };
const COLOR_TOLERANCE = 20;
// The page paints a green block after the load event, like a single-page app does.
const LATE_PAINT_HTML = `<!doctype html><meta name="viewport" content="width=device-width"><body style="margin:0"><div id="app"></div><script>setTimeout(() => { document.getElementById("app").innerHTML = '<div style="background:rgb(34,170,102);height:100vh"></div>'; }, ${RENDER_DELAY_MS});</script>`;

const isScreenMessage = (
  liveMessage: LiveMessage,
): liveMessage is ScreenMessage => liveMessage.kind === "screen";

const readCenterColor = (
  page: Page,
  imageBase64: string,
): Promise<ScreenColor> =>
  page.evaluate(async (jpegBase64) => {
    const image = new Image();
    image.src = `data:image/jpeg;base64,${jpegBase64}`;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const canvasContext = canvas.getContext("2d");
    if (canvasContext === null) throw new Error("No canvas context");
    canvasContext.drawImage(image, 0, 0);
    const [red, green, blue] = canvasContext.getImageData(
      Math.floor(image.width / 2),
      Math.floor(image.height / 2),
      1,
      1,
    ).data;
    return { red, green, blue };
  }, imageBase64);

test.describe("painted screens for every device", () => {
  test.describe.configure({ mode: "serial" });

  let rootFolder = "";
  let dashboardFolder = "";
  let appServer: Server;
  let appUrl = "";
  let runningHub: RunningHub;

  test.beforeAll(async () => {
    test.setTimeout(STARTUP_TIMEOUT_MS);
    rootFolder = await mkdtemp(join(tmpdir(), "everyscreen-step-screens-"));
    dashboardFolder = await mkdtemp(join(tmpdir(), "everyscreen-dashboard-"));
    await writeFile(join(dashboardFolder, "index.html"), "<!doctype html>");

    appServer = createServer((_appRequest, appReply) => {
      appReply.setHeader("Content-Type", "text/html");
      appReply.end(LATE_PAINT_HTML);
    });
    appServer.listen(0, "127.0.0.1");
    await once(appServer, "listening");
    const appAddress = appServer.address();
    const isAppAddressMissing =
      appAddress === null || typeof appAddress === "string";
    if (isAppAddressMissing) throw new Error("The app server did not listen");
    appUrl = `http://127.0.0.1:${appAddress.port}/`;

    runningHub = await startHub({ rootFolder, port: 0, dashboardFolder });
  });

  test.afterAll(async () => {
    await runningHub?.stop();
    appServer?.close();
    await rm(rootFolder, { recursive: true, force: true });
    await rm(dashboardFolder, { recursive: true, force: true });
  });

  test("a dashboard that connects after the step still gets every device a painted screen", async () => {
    test.setTimeout(STARTUP_TIMEOUT_MS);
    const openReply = await fetch(`${runningHub.url}/api/commands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commandName: "open",
        url: appUrl,
        deviceIds: GRID_DEVICE_IDS,
      }),
    });
    expect(openReply.status).toBe(200);

    const liveMessages: LiveMessage[] = [];
    const liveSocket = new WebSocket(
      `${runningHub.url.replace("http", "ws")}${LIVE_PATH}`,
    );
    liveSocket.on("message", (messageBytes) => {
      liveMessages.push(JSON.parse(messageBytes.toString()));
    });
    await once(liveSocket, "open");
    await expect
      .poll(() => {
        const screenDeviceIds = liveMessages
          .filter(isScreenMessage)
          .map(({ deviceId }) => deviceId);
        return GRID_DEVICE_IDS.every((deviceId) =>
          screenDeviceIds.includes(deviceId),
        );
      })
      .toBe(true);
    liveSocket.terminate();

    const screenMessages = liveMessages.filter(isScreenMessage);
    const browser = await chromium.launch();
    const decoderPage = await browser.newPage();
    try {
      for (const deviceId of GRID_DEVICE_IDS) {
        const screenMessage = screenMessages.find(
          (message) => message.deviceId === deviceId,
        );
        const isScreenMissing = screenMessage === undefined;
        if (isScreenMissing) throw new Error(`No screen image for ${deviceId}`);
        const centerColor = await readCenterColor(
          decoderPage,
          screenMessage.imageBase64,
        );
        expect(Math.abs(centerColor.red - GREEN_CHANNELS.red)).toBeLessThan(
          COLOR_TOLERANCE,
        );
        expect(Math.abs(centerColor.green - GREEN_CHANNELS.green)).toBeLessThan(
          COLOR_TOLERANCE,
        );
        expect(Math.abs(centerColor.blue - GREEN_CHANNELS.blue)).toBeLessThan(
          COLOR_TOLERANCE,
        );
      }
    } finally {
      await browser.close();
    }
  });
});
