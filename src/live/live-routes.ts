import { upgradeWebSocket } from "@hono/node-server";
import { Hono } from "hono";
import type { WSContext } from "hono/ws";
import { subscribe } from "@/live/live-feed";

const LIVE_PATH = "/api/live";
const SOCKET_OPEN = 1;

export const liveRoutes = new Hono().get(
  LIVE_PATH,
  upgradeWebSocket(() => {
    const unsubscribeBySocket = new Map<WSContext, () => void>();
    return {
      onOpen: (_openEvent, socket) => {
        const unsubscribe = subscribe((liveMessage) => {
          const isSocketOpen = socket.readyState === SOCKET_OPEN;
          if (isSocketOpen) socket.send(JSON.stringify(liveMessage));
        });
        unsubscribeBySocket.set(socket, unsubscribe);
      },
      onClose: (_closeEvent, socket) => {
        unsubscribeBySocket.get(socket)?.();
        unsubscribeBySocket.delete(socket);
      },
    };
  }),
);
