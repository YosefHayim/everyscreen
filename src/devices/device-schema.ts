import { z } from "zod";
import type { BrowserName, FrameShape, ViewportMode } from "@/devices/devices-logic";

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

export const customDeviceSchema = z.object({
  name: z
    .string()
    .max(MAX_DEVICE_NAME_LENGTH)
    .regex(DEVICE_NAME_PATTERN, "Use a letter or digit in the name"),
  width: z.number().int().min(MIN_DEVICE_SIZE).max(MAX_DEVICE_SIZE),
  height: z.number().int().min(MIN_DEVICE_SIZE).max(MAX_DEVICE_SIZE),
  pixelRatio: z
    .number()
    .min(MIN_PIXEL_RATIO)
    .max(MAX_PIXEL_RATIO)
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
  viewportModes: z.record(z.string(), z.enum(VIEWPORT_MODES)).default({}),
});

export type CustomDevice = z.infer<typeof customDeviceSchema>;
export type DevicesFile = z.infer<typeof devicesFileSchema>;
