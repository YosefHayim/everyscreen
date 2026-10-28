import { z } from "zod";
import type { FrameShape } from "@/devices/devices-logic";

const FRAME_SHAPES = [
  "home-button",
  "dynamic-island",
  "punch-hole",
  "tablet",
  "laptop",
  "kiosk",
] as const satisfies readonly FrameShape[];

const DEVICE_ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MAX_DEVICE_ID_LENGTH = 40;
const MAX_DEVICE_NAME_LENGTH = 40;
const MIN_DEVICE_SIZE = 200;
const MAX_DEVICE_SIZE = 4000;
const MIN_PIXEL_RATIO = 1;
const MAX_PIXEL_RATIO = 4;

export const customDeviceSchema = z.object({
  id: z
    .string()
    .max(MAX_DEVICE_ID_LENGTH)
    .regex(DEVICE_ID_PATTERN, "Use a kebab-case id, like store-kiosk"),
  name: z.string().min(1).max(MAX_DEVICE_NAME_LENGTH),
  width: z.number().int().min(MIN_DEVICE_SIZE).max(MAX_DEVICE_SIZE),
  height: z.number().int().min(MIN_DEVICE_SIZE).max(MAX_DEVICE_SIZE),
  pixelRatio: z.number().min(MIN_PIXEL_RATIO).max(MAX_PIXEL_RATIO),
  hasTouch: z.boolean(),
  frameShape: z.enum(FRAME_SHAPES),
});

export const devicesFileSchema = z.object({
  devices: z.array(customDeviceSchema).default([]),
});

export type CustomDevice = z.infer<typeof customDeviceSchema>;
export type DevicesFile = z.infer<typeof devicesFileSchema>;
