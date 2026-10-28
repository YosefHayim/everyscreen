export const HUB_HOST = "127.0.0.1";
export const HUB_PORT = 4100;
export const HUB_URL = `http://${HUB_HOST}:${HUB_PORT}`;

export const LIVE_PATH = "/api/live";
export const LIVE_TESTS_PATH = "/api/live-tests";

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

// The one device zoomed in the dashboard streams at this larger size.
export const ZOOM_SCREENCAST = {
  quality: 90,
  everyNthFrame: 1,
  maxWidth: 3000,
  maxHeight: 3000,
} as const;

export const CPU_TIERS = {
  budgetPhone: 4,
  phone: 2,
  tablet: 1.5,
  desktop: 1,
} as const;

// Catalog devices off the grid that one sweep runs at the same time.
export const SWEEP_EXTRA_DEVICE_LIMIT = 4;
