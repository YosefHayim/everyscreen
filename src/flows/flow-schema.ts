import { z } from "zod";
import { pickCommandSchema } from "@/flows/pick-command-schema";

const openCommand = pickCommandSchema("open");
const tapCommand = pickCommandSchema("tap");
const fillCommand = pickCommandSchema("fill");
const scrollCommand = pickCommandSchema("scroll");
const expectCommand = pickCommandSchema("expect");

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
  // null means every device in the grid.
  devices: z.array(z.string()).min(1).nullable().default(null),
  steps: z.array(flowStepSchema),
});

export const flowsPerBatchSchema = z.number().int().min(1);

export type Flow = z.infer<typeof flowSchema>;
