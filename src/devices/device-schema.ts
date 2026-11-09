import { z } from "zod";
import { DEFAULT_GRID_IDS } from "@/devices/default-grid-ids";
import type {
  BrowserName,
  FrameShape,
  ViewportMode,
} from "@/devices/devices-logic";

const BROWSER_NAMES = [
  "chromium",
  "webkit",
  "firefox",
] as const satisfies readonly BrowserName[];

const FRAME_SHAPES = [
  "home-button",
  "dynamic-island",
  "punch-hole",
  "tablet",
  "laptop",
  "kiosk",
] as const satisfies readonly FrameShape[];

const VIEWPORT_MODES = [
  "full-screen",
  "browser",
] as const satisfies readonly ViewportMode[];

// The device id is made from the name, so the name needs a letter or digit.
const DEVICE_NAME_PATTERN = /[\p{L}\p{N}]/u;
const MAX_DEVICE_NAME_LENGTH = 40;
const MIN_DEVICE_SIZE = 240;
const MAX_DEVICE_SIZE = 3840;
const MIN_PIXEL_RATIO = 1;
const MAX_PIXEL_RATIO = 4;
const DEFAULT_PIXEL_RATIO = 1;

// A route like //evil.com/x would point at another host.
const isOriginRelativeRoute = (route: string): boolean =>
  route.startsWith("/") && !route.startsWith("//");

// Each message reads after "bad usage · devices add ", so it names the flag and what to pass.
const createSizeSchema = (flagName: string) => {
  const sizeMessage = `--${flagName} must be a whole number from ${MIN_DEVICE_SIZE} to ${MAX_DEVICE_SIZE}`;
  return z
    .number({ error: sizeMessage })
    .int({ error: sizeMessage })
    .min(MIN_DEVICE_SIZE, { error: sizeMessage })
    .max(MAX_DEVICE_SIZE, { error: sizeMessage });
};

const PIXEL_RATIO_MESSAGE = `--pixel-ratio must be a number from ${MIN_PIXEL_RATIO} to ${MAX_PIXEL_RATIO}`;

export const customDeviceSchema = z.object({
  name: z
    .string({ error: "needs --name <device name>" })
    .max(MAX_DEVICE_NAME_LENGTH, {
      error: `--name must be ${MAX_DEVICE_NAME_LENGTH} characters or less`,
    })
    .regex(DEVICE_NAME_PATTERN, "--name needs a letter or digit"),
  width: createSizeSchema("width"),
  height: createSizeSchema("height"),
  pixelRatio: z
    .number({ error: PIXEL_RATIO_MESSAGE })
    .min(MIN_PIXEL_RATIO, { error: PIXEL_RATIO_MESSAGE })
    .max(MAX_PIXEL_RATIO, { error: PIXEL_RATIO_MESSAGE })
    .default(DEFAULT_PIXEL_RATIO),
  hasTouch: z.boolean().default(false),
  frameShape: z.enum(FRAME_SHAPES).default("kiosk"),
  browserName: z.enum(BROWSER_NAMES).default("chromium"),
});

export const devicesFileSchema = z.object({
  devices: z.array(customDeviceSchema).default([]),
  routes: z
    .array(
      z
        .string()
        .refine(
          isOriginRelativeRoute,
          "Use a path that starts with a single /",
        ),
    )
    .default([]),
  grid: z.array(z.string()).default(DEFAULT_GRID_IDS),
  viewportModes: z.record(z.string(), z.enum(VIEWPORT_MODES)).default({}),
});

export const gridUpdateSchema = z.object({
  deviceIds: z.array(z.string().min(1)),
});

export type CustomDevice = z.infer<typeof customDeviceSchema>;
export type DevicesFile = z.infer<typeof devicesFileSchema>;
