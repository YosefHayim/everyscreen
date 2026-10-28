import { upgradeWebSocket } from "@hono/node-server";
import { Hono } from "hono";
import type { WSContext } from "hono/ws";
import { LIVE_PATH } from "@/environment";
import { subscribe } from "@/live/live-feed";
import { releaseClientZoom } from "@/live/zoom-store";

const SOCKET_OPEN = 1;
const CLIENT_ID_QUERY = "clientId";

export const liveRoutes = new Hono().get(
  LIVE_PATH,
  upgradeWebSocket((c) => {
    const clientId = c.req.query(CLIENT_ID_QUERY) ?? null;
    const unsubscribeBySocket = new Map<WSContext, () => void>();
    return {
      onOpen: (_openEvent, socket) => {
        const unsubscribe = subscribe((liveMessage) => {
          const isSocketOpen = socket.readyState === SOCKET_OPEN;
          if (isSocketOpen) socket.send(JSON.stringify(liveMessage));
        });
        unsubscribeBySocket.set(socket, unsubscribe);
      },
      onClose: async (_closeEvent, socket) => {
        unsubscribeBySocket.get(socket)?.();
        unsubscribeBySocket.delete(socket);
        const isClientKnown = clientId !== null;
        if (!isClientKnown) return;
        try {
          await releaseClientZoom(clientId);
        } catch (error) {
          console.error({ clientId, error });
        }
      },
    };
  }),
);
