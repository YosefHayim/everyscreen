import { z } from "zod";
import {
  expectCommandSchema,
  fillCommandSchema,
  openCommandSchema,
  scrollCommandSchema,
  tapCommandSchema,
} from "@/commands/commands-schema";

const STEP_WITHOUT_COMMAND_FIELDS = {
  commandName: true,
  deviceIds: true,
} as const;

const flowStepSchema = z.union([
  z
    .strictObject({ open: openCommandSchema.shape.url })
    .transform(({ open }) => ({ commandName: "open" as const, url: open })),
  z
    .strictObject({
      tap: tapCommandSchema.omit(STEP_WITHOUT_COMMAND_FIELDS).strict(),
    })
    .transform(({ tap }) => ({ commandName: "tap" as const, ...tap })),
  z
    .strictObject({
      fill: fillCommandSchema.omit(STEP_WITHOUT_COMMAND_FIELDS).strict(),
    })
    .transform(({ fill }) => ({ commandName: "fill" as const, ...fill })),
  z
    .strictObject({
      scroll: scrollCommandSchema.omit(STEP_WITHOUT_COMMAND_FIELDS).strict(),
    })
    .transform(({ scroll }) => ({ commandName: "scroll" as const, ...scroll })),
  z
    .strictObject({
      expect: expectCommandSchema.omit(STEP_WITHOUT_COMMAND_FIELDS).strict(),
    })
    .transform(({ expect }) => ({ commandName: "expect" as const, ...expect })),
  z
    .strictObject({ check: z.null() })
    .transform(() => ({ commandName: "check" as const })),
  z
    .strictObject({ shot: z.null() })
    .transform(() => ({ commandName: "shot" as const })),
]);

export const flowSchema = z.strictObject({
  name: z.string(),
  // null means every device in the grid.
  devices: z.array(z.string()).min(1).nullable().default(null),
  steps: z.array(flowStepSchema),
});

export const flowsPerBatchSchema = z.number().int().min(1);

export type Flow = z.infer<typeof flowSchema>;
