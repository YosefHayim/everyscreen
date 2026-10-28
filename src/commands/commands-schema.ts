import { z } from "zod";

// Roles a flow or the CLI can target; each one is also a Playwright getByRole role.
const ARIA_ROLES = [
  "button",
  "checkbox",
  "combobox",
  "dialog",
  "heading",
  "img",
  "link",
  "listitem",
  "menuitem",
  "option",
  "radio",
  "searchbox",
  "slider",
  "spinbutton",
  "switch",
  "tab",
  "textbox",
] as const;

const DEFAULT_MAX_ROUTES = 50;

// null means every device in the grid.
const deviceIdsSchema = z.array(z.string()).nullable();

export const openCommandSchema = z.object({
  commandName: z.literal("open"),
  url: z.url(),
  deviceIds: deviceIdsSchema,
});

export const sweepCommandSchema = z.object({
  commandName: z.literal("sweep"),
  url: z.url(),
  deviceIds: deviceIdsSchema.default(null),
  maxRoutes: z.number().int().positive().default(DEFAULT_MAX_ROUTES),
});

export const tapCommandSchema = z.object({
  commandName: z.literal("tap"),
  role: z.enum(ARIA_ROLES),
  name: z.string(),
  deviceIds: deviceIdsSchema,
});

export const fillCommandSchema = z.object({
  commandName: z.literal("fill"),
  role: z.enum(ARIA_ROLES),
  name: z.string(),
  with: z.string(),
  deviceIds: deviceIdsSchema,
});

export const scrollCommandSchema = z.object({
  commandName: z.literal("scroll"),
  to: z.enum(["top", "bottom"]),
  deviceIds: deviceIdsSchema,
});

const checkCommandSchema = z.object({
  commandName: z.literal("check"),
  deviceIds: deviceIdsSchema,
});

const shotCommandSchema = z.object({
  commandName: z.literal("shot"),
  deviceIds: deviceIdsSchema,
});

export const expectCommandSchema = z.object({
  commandName: z.literal("expect"),
  text: z.string(),
  deviceIds: deviceIdsSchema,
});

export const hubCommandSchema = z.discriminatedUnion("commandName", [
  openCommandSchema,
  sweepCommandSchema,
  tapCommandSchema,
  fillCommandSchema,
  scrollCommandSchema,
  checkCommandSchema,
  shotCommandSchema,
  expectCommandSchema,
]);

export type HubCommand = z.infer<typeof hubCommandSchema>;
