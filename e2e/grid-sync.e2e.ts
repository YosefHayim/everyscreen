import { once } from "node:events";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { WebSocket } from "ws";
import { DEVICES_FILE_PATH, HUB_FILE_PATH } from "@/environment";
import { hubFileSchema } from "@/hub/hub-file";
import { type RunningHub, startHub } from "@/hub/hub-server";
import type { LiveMessage } from "@/live/live-feed";

const STARTUP_TIMEOUT_MS = 180_000;
const DASHBOARD_FOLDER_NAME = "dashboard";

const putGrid = (hubUrl: string, deviceIds: string[]): Promise<Response> =>
  fetch(`${hubUrl}/api/devices/grid`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceIds }),
  });

const readHubDeviceIds = async (rootFolder: string): Promise<string[]> => {
  const hubFileText = await readFile(join(rootFolder, HUB_FILE_PATH), "utf8");
  const hubFile = hubFileSchema.parse(JSON.parse(hubFileText));
  return Object.keys(hubFile.devices);
};

test.describe("grid changes on a running hub", () => {
  let rootFolder = "";
  let runningHub: RunningHub;
  let liveSocket: WebSocket;
  const liveMessages: LiveMessage[] = [];

  test.beforeAll(async () => {
    test.setTimeout(STARTUP_TIMEOUT_MS);
    rootFolder = await mkdtemp(join(tmpdir(), "everyscreen-grid-sync-"));
    await writeFile(
      join(rootFolder, DEVICES_FILE_PATH),
      "grid:\n  - pixel-10\n",
    );
    runningHub = await startHub({
      rootFolder,
      port: 0,
      dashboardFolder: join(rootFolder, DASHBOARD_FOLDER_NAME),
    });
    liveSocket = new WebSocket(
      `${runningHub.url.replace("http", "ws")}/api/live`,
    );
    liveSocket.on("message", (messageBytes) => {
      liveMessages.push(JSON.parse(messageBytes.toString()));
    });
    await once(liveSocket, "open");
  });

  test.afterAll(async () => {
    liveSocket?.terminate();
    await runningHub?.stop();
    await rm(rootFolder, { recursive: true, force: true });
  });

  test("a device added to the grid starts its page and sends a screen image, and a removed device stops", async () => {
    const addReply = await putGrid(runningHub.url, ["pixel-10", "pixel-9"]);

    expect(addReply.status).toBe(200);
    await expect
      .poll(() =>
        liveMessages.some(
          (liveMessage) =>
            liveMessage.kind === "screen" && liveMessage.deviceId === "pixel-9",
        ),
      )
      .toBe(true);
    expect(await readHubDeviceIds(rootFolder)).toEqual(["pixel-10", "pixel-9"]);

    const removeReply = await putGrid(runningHub.url, ["pixel-10"]);

    expect(removeReply.status).toBe(200);
    expect(await readHubDeviceIds(rootFolder)).toEqual(["pixel-10"]);
  });
});
