import type { LiveMessage } from "@/live/live-feed";

const RECONNECT_DELAY_MS = 1000;

export interface ScreenImage {
  deviceId: string;
  imageUrl: string;
}

const screenImagesByDevice = new Map<string, ScreenImage>();
const listeners = new Set<() => void>();
let isConnectionStarted = false;

const connect = () => {
  const socket = new WebSocket(`ws://${location.host}/live`);
  socket.onmessage = (messageEvent) => {
    const liveMessage: LiveMessage = JSON.parse(messageEvent.data);
    const isOtherMessage = liveMessage.kind !== "screen";
    if (isOtherMessage) return;

    const imageUrl = `data:image/jpeg;base64,${liveMessage.imageBase64}`;
    const { deviceId } = liveMessage;
    screenImagesByDevice.set(deviceId, { deviceId, imageUrl });
    for (const listener of listeners) listener();
  };
  socket.onclose = () => setTimeout(connect, RECONNECT_DELAY_MS);
};

export const subscribe = (listener: () => void) => {
  const isFirstSubscription = !isConnectionStarted;
  if (isFirstSubscription) {
    isConnectionStarted = true;
    connect();
  }
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getScreenImage = (deviceId: string): ScreenImage | null =>
  screenImagesByDevice.get(deviceId) ?? null;
