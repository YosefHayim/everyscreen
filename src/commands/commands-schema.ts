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
const MAX_SWEEP_ROUTES = 500;

// Each message reads after "bad usage · <command> ", so it names the flag and what to pass.
const URL_MESSAGE = "needs --url <web address, like https://example.com>";
const ROLE_MESSAGE = `needs --role <one of ${ARIA_ROLES.join(", ")}>`;
const NAME_MESSAGE = "needs --name <text>";
const MAX_ROUTES_MINIMUM_MESSAGE =
  "--max-routes must be a whole number of 1 or more";

// null means every device in the grid.
const deviceIdsSchema = z.array(z.string()).nullable();

export const openCommandSchema = z.object({
  commandName: z.literal("open"),
  url: z.url({ error: URL_MESSAGE }),
  deviceIds: deviceIdsSchema,
});

export const tapCommandSchema = z.object({
  commandName: z.literal("tap"),
  role: z.enum(ARIA_ROLES, { error: ROLE_MESSAGE }),
  name: z.string({ error: NAME_MESSAGE }),
  deviceIds: deviceIdsSchema,
});

export const fillCommandSchema = z.object({
  commandName: z.literal("fill"),
  role: z.enum(ARIA_ROLES, { error: ROLE_MESSAGE }),
  name: z.string({ error: NAME_MESSAGE }),
  with: z.string({ error: "needs --with <text>" }),
  deviceIds: deviceIdsSchema,
});

export const scrollCommandSchema = z.object({
  commandName: z.literal("scroll"),
  to: z.enum(["top", "bottom"], { error: "needs --to top or bottom" }),
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
  text: z.string({ error: "needs --text <text>" }),
  deviceIds: deviceIdsSchema,
});

const beforeStepSchema = z.discriminatedUnion("commandName", [
  openCommandSchema,
  tapCommandSchema,
  fillCommandSchema,
  scrollCommandSchema,
  checkCommandSchema,
  shotCommandSchema,
  expectCommandSchema,
]);

export const sweepCommandSchema = z.object({
  commandName: z.literal("sweep"),
  url: z.url({ error: URL_MESSAGE }),
  // null means every device in the grid; "all" adds the catalog devices that are not on the grid.
  deviceIds: z
    .union([z.literal("all"), z.array(z.string().min(1)).min(1)], {
      error:
        "--devices must be all or a list of device ids, like iphone-17,pixel-10",
    })
    .nullable()
    .default(null),
  maxRoutes: z
    .number({ error: MAX_ROUTES_MINIMUM_MESSAGE })
    .int({ error: MAX_ROUTES_MINIMUM_MESSAGE })
    .positive({ error: MAX_ROUTES_MINIMUM_MESSAGE })
    .max(MAX_SWEEP_ROUTES, {
      error: `--max-routes must be ${MAX_SWEEP_ROUTES} or less`,
    })
    .default(DEFAULT_MAX_ROUTES),
  // Steps that run once on each device before its routes, in the same browser context.
  beforeSteps: z.array(beforeStepSchema).nullable().default(null),
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
export type SweepCommand = z.infer<typeof sweepCommandSchema>;
export type BeforeStep = z.infer<typeof beforeStepSchema>;
