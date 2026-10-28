import { once } from "node:events";
import { expect, test } from "@playwright/test";
import { Hono } from "hono";
import { WebSocket, WebSocketServer } from "ws";
import { type ListeningServer, listen } from "@/hub/hub-server";
import { liveRoutes } from "@/live/live-routes";
import { createZoomRoutes } from "@/live/zoom-routes";
import { registerZoomControl } from "@/live/zoom-store";

const ZOOM_WAIT_MS = 5000;

const putZoom = (zoomBody: unknown) => ({
  method: "PUT",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(zoomBody),
});

test.describe("zoom routes", () => {
  test("accepts null to drop back to the normal stream", async () => {
    const zoomRoutes = createZoomRoutes();

    const zoomReply = await zoomRoutes.request(
      "/",
      putZoom({ deviceId: null, clientId: "tab-1" }),
    );

    expect(zoomReply.status).toBe(200);
    expect(await zoomReply.json()).toEqual({ deviceId: null });
  });

  test("answers 422 for a device that has no live browser", async () => {
    const zoomRoutes = createZoomRoutes();

    const zoomReply = await zoomRoutes.request(
      "/",
      putZoom({ deviceId: "nokia-3310", clientId: "tab-1" }),
    );

    expect(zoomReply.status).toBe(422);
    expect(await zoomReply.text()).toContain("nokia-3310");
  });

  test("answers 400 for an empty device id", async () => {
    const zoomRoutes = createZoomRoutes();

    const zoomReply = await zoomRoutes.request(
      "/",
      putZoom({ deviceId: "", clientId: "tab-1" }),
    );

    expect(zoomReply.status).toBe(400);
  });

  test("answers 400 when the client id is missing", async () => {
    const zoomRoutes = createZoomRoutes();

    const zoomReply = await zoomRoutes.request(
      "/",
      putZoom({ deviceId: null }),
    );

    expect(zoomReply.status).toBe(400);
  });
});

test.describe("zoom when a dashboard tab closes", () => {
  let websocketServer: WebSocketServer;
  let hubServer: ListeningServer;

  test.beforeAll(async () => {
    websocketServer = new WebSocketServer({ noServer: true });
    const hubApp = new Hono()
      .route("/api/zoom", createZoomRoutes())
      .route("/", liveRoutes);
    hubServer = await listen(hubApp, websocketServer, 0);
  });

  test.afterAll(() => {
    for (const liveClient of websocketServer.clients) liveClient.terminate();
    hubServer.httpServer.close();
  });

  test("puts the device back to the normal stream", async () => {
    const zoomCalls: boolean[] = [];
    const unregister = registerZoomControl(
      "tab-test-phone",
      async (isZoomed) => {
        zoomCalls.push(isZoomed);
      },
    );
    const hubUrl = `127.0.0.1:${hubServer.port}`;
    const liveSocket = new WebSocket(`ws://${hubUrl}/api/live?clientId=tab-1`);
    await once(liveSocket, "open");
    await fetch(`http://${hubUrl}/api/zoom`, {
      ...putZoom({ deviceId: "tab-test-phone", clientId: "tab-1" }),
    });
    expect(zoomCalls).toEqual([true]);

    liveSocket.close();

    await expect
      .poll(() => zoomCalls, { timeout: ZOOM_WAIT_MS })
      .toEqual([true, false]);
    unregister();
  });

  test("keeps the zoom when another tab closes", async () => {
    const zoomCalls: boolean[] = [];
    const unregister = registerZoomControl(
      "tab-test-laptop",
      async (isZoomed) => {
        zoomCalls.push(isZoomed);
      },
    );
    const hubUrl = `127.0.0.1:${hubServer.port}`;
    const zoomingSocket = new WebSocket(
      `ws://${hubUrl}/api/live?clientId=tab-2`,
    );
    const otherSocket = new WebSocket(`ws://${hubUrl}/api/live?clientId=tab-3`);
    await Promise.all([once(zoomingSocket, "open"), once(otherSocket, "open")]);
    await fetch(`http://${hubUrl}/api/zoom`, {
      ...putZoom({ deviceId: "tab-test-laptop", clientId: "tab-2" }),
    });

    otherSocket.close();
    await once(otherSocket, "close");

    expect(zoomCalls).toEqual([true]);
    zoomingSocket.close();
    unregister();
  });
});
