import type { Finding } from "@/checks/checks-logic";
import { LIVE_PATH } from "@/environment";
import type { DeviceLoad } from "@/estimates/estimates-logic";
import type { LiveMessage } from "@/live/live-feed";

export type ConnectionStatus = "connecting" | "open" | "closed";

const FIRST_RETRY_DELAY_MS = 1000;
const LAST_RETRY_DELAY_MS = 30000;
const MAX_FINDINGS = 20;
const IS_PAGE_SECURE = location.protocol === "https:";
const LIVE_SCHEME = IS_PAGE_SECURE ? "wss:" : "ws:";
const LIVE_URL = `${LIVE_SCHEME}//${location.host}${LIVE_PATH}`;

interface Connection {
  status: ConnectionStatus;
  socket: WebSocket | null;
  retryTimer: ReturnType<typeof setTimeout> | null;
  retryDelayMs: number;
}

interface LiveFeed {
  screenImageUrls: ReadonlyMap<string, string>;
  deviceLoads: ReadonlyMap<string, DeviceLoad>;
  findings: Finding[];
}

const connection: Connection = {
  status: "closed",
  socket: null,
  retryTimer: null,
  retryDelayMs: FIRST_RETRY_DELAY_MS,
};

const liveFeed: LiveFeed = {
  screenImageUrls: new Map(),
  deviceLoads: new Map(),
  findings: [],
};

const listeners = new Set<() => void>();

const notifyListeners = (): void => {
  for (const listener of listeners) listener();
};

const readLiveMessage = (messageLine: string): LiveMessage | null => {
  try {
    return JSON.parse(messageLine) as LiveMessage;
  } catch (error) {
    console.error({ error });
    return null;
  }
};

const applyLiveMessage = (liveMessage: LiveMessage): void => {
  switch (liveMessage.kind) {
    case "screen": {
      const imageUrl = `data:image/jpeg;base64,${liveMessage.imageBase64}`;
      liveFeed.screenImageUrls = new Map(liveFeed.screenImageUrls).set(
        liveMessage.deviceId,
        imageUrl,
      );
      return;
    }
    case "estimate":
      liveFeed.deviceLoads = new Map(liveFeed.deviceLoads).set(
        liveMessage.deviceId,
        liveMessage.deviceLoad,
      );
      return;
    case "finding":
      liveFeed.findings = [liveMessage.finding, ...liveFeed.findings].slice(
        0,
        MAX_FINDINGS,
      );
      return;
    case "run":
      return;
  }
};

const markConnectionClosed = (): void => {
  connection.status = "closed";
  connection.socket = null;
  liveFeed.screenImageUrls = new Map();
  liveFeed.deviceLoads = new Map();
  notifyListeners();
};

const connect = (): void => {
  const socket = new WebSocket(LIVE_URL);
  connection.socket = socket;
  connection.status = "connecting";
  notifyListeners();

  socket.onopen = () => {
    connection.status = "open";
    connection.retryDelayMs = FIRST_RETRY_DELAY_MS;
    notifyListeners();
  };
  socket.onmessage = (messageEvent) => {
    const liveMessage = readLiveMessage(messageEvent.data);
    const isMessageUnreadable = liveMessage === null;
    if (isMessageUnreadable) return;
    applyLiveMessage(liveMessage);
    notifyListeners();
  };
  socket.onclose = () => {
    markConnectionClosed();
    connection.retryTimer = setTimeout(connect, connection.retryDelayMs);
    connection.retryDelayMs = Math.min(
      connection.retryDelayMs * 2,
      LAST_RETRY_DELAY_MS,
    );
  };
};

const disconnect = (): void => {
  const { socket, retryTimer } = connection;
  const isRetryWaiting = retryTimer !== null;
  if (isRetryWaiting) clearTimeout(retryTimer);
  connection.retryTimer = null;
  connection.retryDelayMs = FIRST_RETRY_DELAY_MS;
  const hasSocket = socket !== null;
  if (hasSocket) {
    socket.onclose = null;
    socket.close();
  }
  markConnectionClosed();
};

export const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  const isFirstListener = listeners.size === 1;
  if (isFirstListener) connect();

  return () => {
    listeners.delete(listener);
    const isLastListenerGone = listeners.size === 0;
    if (isLastListenerGone) disconnect();
  };
};

export const getConnectionStatus = (): ConnectionStatus => connection.status;

export const getScreenImageUrl = (deviceId: string): string | null =>
  liveFeed.screenImageUrls.get(deviceId) ?? null;

export const getDeviceLoad = (deviceId: string): DeviceLoad | null =>
  liveFeed.deviceLoads.get(deviceId) ?? null;

export const getFindings = (): Finding[] => liveFeed.findings;

export const hasAnyScreenImage = (): boolean =>
  liveFeed.screenImageUrls.size > 0;
