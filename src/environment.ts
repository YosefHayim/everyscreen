export const HUB_HOST = "127.0.0.1";
export const HUB_PORT = 4100;
export const HUB_URL = `http://${HUB_HOST}:${HUB_PORT}`;

export const LIVE_PATH = "/api/live";

export const STORE_FOLDER = ".everyscreen";
export const HUB_FILE_PATH = `${STORE_FOLDER}/hub.json`;
export const DEVICES_FILE_PATH = "everyscreen.yaml";

export const SCREENCAST = {
  format: "jpeg",
  quality: 60,
  everyNthFrame: 2,
  maxWidth: 720,
  maxHeight: 1280,
} as const;

export const CPU_TIERS = {
  budgetPhone: 4,
  phone: 2,
  tablet: 1.5,
  desktop: 1,
} as const;
