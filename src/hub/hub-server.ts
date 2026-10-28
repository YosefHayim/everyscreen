import { rm } from "node:fs/promises";
import { join } from "node:path";
import { type ServerType, serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { WebSocketServer } from "ws";
import {
  type DeviceBrowser,
  type DevicePage,
  startDeviceBrowser,
} from "@/devices/device-browsers";
import { type DevicePreset, pickGridDevices } from "@/devices/devices-logic";
import { readDevicesFile } from "@/devices/devices-store";
import { HUB_FILE_PATH, HUB_HOST } from "@/environment";
import { createHubApp } from "@/hub/hub-app";
import type { HubFile } from "@/hub/hub-file";
import { writeProblem } from "@/hub/problem-reply";
import { writeStoredFile } from "@/hub/stored-files";
import { liveRoutes } from "@/live/live-routes";

const HUB_FILE_MODE = 0o600;
const NOT_FOUND_STATUS = 404;
const API_PATH = "/api/*";
const CLIENT_ROUTE_PATH = "*";
const INDEX_FILE = "index.html";

export interface HubStart {
  rootFolder: string;
  port: number;
  dashboardFolder: string;
}

export interface RunningHub {
  url: string;
  stop: () => Promise<void>;
}

export interface ListeningServer {
  httpServer: ServerType;
  port: number;
}

interface GridDevice {
  device: DevicePreset;
  deviceBrowser: DeviceBrowser;
  devicePage: DevicePage;
}

const startGridDevice = async (device: DevicePreset): Promise<GridDevice> => {
  const deviceBrowser = await startDeviceBrowser(device);
  try {
    const page = await deviceBrowser.openPage();
    const hasLiveScreen = deviceBrowser.cdpUrl !== null;
    const devicePage: DevicePage = { device, page, hasLiveScreen };
    return { device, deviceBrowser, devicePage };
  } catch (error) {
    await deviceBrowser.stop();
    throw error;
  }
};

const stopGridDevices = async (gridDevices: GridDevice[]): Promise<void> => {
  const stopReplies = await Promise.allSettled(
    gridDevices.map(({ deviceBrowser }) => deviceBrowser.stop()),
  );
  for (const stopReply of stopReplies) {
    const hasStopFailed = stopReply.status === "rejected";
    if (hasStopFailed) console.error({ error: stopReply.reason });
  }
};

const startGridDevices = async (
  devices: DevicePreset[],
): Promise<GridDevice[]> => {
  const startReplies = await Promise.allSettled(devices.map(startGridDevice));
  const startedDevices = startReplies
    .filter((startReply) => startReply.status === "fulfilled")
    .map((startReply) => startReply.value);
  const failedStart = startReplies.find(
    (startReply) => startReply.status === "rejected",
  );
  const hasStartFailed = failedStart !== undefined;
  if (hasStartFailed) {
    await stopGridDevices(startedDevices);
    throw new Error("A device browser failed to start", {
      cause: failedStart.reason,
    });
  }
  return startedDevices;
};

const createHubFile = (port: number, gridDevices: GridDevice[]): HubFile => ({
  pid: process.pid,
  port,
  devices: Object.fromEntries(
    gridDevices.map(({ device, deviceBrowser }) => [
      device.id,
      {
        wsEndpoint: deviceBrowser.wsEndpoint,
        cdpUrl: deviceBrowser.cdpUrl,
      },
    ]),
  ),
});

const writeHubFile = async (
  hubFilePath: string,
  hubFile: HubFile,
): Promise<void> => {
  const serializedHubFile = JSON.stringify(hubFile, null, 2);
  await writeStoredFile(hubFilePath, serializedHubFile, HUB_FILE_MODE);
};

const createHubServerApp = (hubStart: HubStart, devicePages: DevicePage[]) => {
  const { rootFolder, dashboardFolder } = hubStart;
  return new Hono()
    .route("/", createHubApp(rootFolder, devicePages))
    .route("/", liveRoutes)
    .all(API_PATH, () => {
      throw new HTTPException(NOT_FOUND_STATUS, { message: "No such route" });
    })
    .use(CLIENT_ROUTE_PATH, serveStatic({ root: dashboardFolder }))
    .get(
      CLIENT_ROUTE_PATH,
      serveStatic({ root: dashboardFolder, path: INDEX_FILE }),
    )
    .onError(writeProblem);
};

export const listen = (
  hubServerApp: Hono,
  websocketServer: WebSocketServer,
  port: number,
): Promise<ListeningServer> =>
  new Promise((onListening, onListenFailed) => {
    const httpServer = serve(
      {
        fetch: hubServerApp.fetch,
        port,
        hostname: HUB_HOST,
        websocket: { server: websocketServer },
      },
      (addressInfo) => onListening({ httpServer, port: addressInfo.port }),
    );
    httpServer.once("error", onListenFailed);
  });

const closeServer = (httpServer: ServerType): Promise<void> =>
  new Promise((onClosed, onCloseFailed) => {
    httpServer.close((error) => {
      const hasCloseFailed = error !== undefined;
      if (hasCloseFailed) onCloseFailed(error);
      else onClosed();
    });
    const canCloseConnections = "closeAllConnections" in httpServer;
    if (canCloseConnections) httpServer.closeAllConnections();
  });

export const startHub = async (hubStart: HubStart): Promise<RunningHub> => {
  const { rootFolder, port } = hubStart;
  const devicesFile = await readDevicesFile(rootFolder);
  const gridDevices = await startGridDevices(pickGridDevices(devicesFile));
  const devicePages = gridDevices.map(({ devicePage }) => devicePage);
  const hubFilePath = join(rootFolder, HUB_FILE_PATH);

  const websocketServer = new WebSocketServer({ noServer: true });
  const hubServerApp = createHubServerApp(hubStart, devicePages);
  try {
    const listeningServer = await listen(hubServerApp, websocketServer, port);
    const hubFile = createHubFile(listeningServer.port, gridDevices);
    await writeHubFile(hubFilePath, hubFile);

    const stop = async (): Promise<void> => {
      await rm(hubFilePath, { force: true });
      for (const liveClient of websocketServer.clients) liveClient.terminate();
      await closeServer(listeningServer.httpServer);
      await stopGridDevices(gridDevices);
    };
    return { url: `http://${HUB_HOST}:${listeningServer.port}`, stop };
  } catch (error) {
    await stopGridDevices(gridDevices);
    throw error;
  }
};
