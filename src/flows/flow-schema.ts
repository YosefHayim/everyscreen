import { z } from "zod";
import { hubCommandSchema } from "@/commands/commands-schema";

const commandSchemas = hubCommandSchema.options;
const openCommand = commandSchemas[0];
const tapCommand = commandSchemas[1];
const fillCommand = commandSchemas[2];
const scrollCommand = commandSchemas[3];
const expectCommand = commandSchemas[6];

const STEP_WITHOUT_COMMAND_FIELDS = {
  commandName: true,
  deviceIds: true,
} as const;

const flowStepSchema = z.union([
  z.strictObject({ open: openCommand.shape.url }),
  z.strictObject({
    tap: tapCommand.omit(STEP_WITHOUT_COMMAND_FIELDS).strict(),
  }),
  z.strictObject({
    fill: fillCommand.omit(STEP_WITHOUT_COMMAND_FIELDS).strict(),
  }),
  z.strictObject({
    scroll: scrollCommand.omit(STEP_WITHOUT_COMMAND_FIELDS).strict(),
  }),
  z.strictObject({
    expect: expectCommand.omit(STEP_WITHOUT_COMMAND_FIELDS).strict(),
  }),
  z.strictObject({ check: z.null() }),
  z.strictObject({ shot: z.null() }),
]);

export const flowSchema = z.strictObject({
  name: z.string(),
  devices: z.array(z.string()).nullable().default(null),
  steps: z.array(flowStepSchema),
});

export type Flow = z.infer<typeof flowSchema>;
