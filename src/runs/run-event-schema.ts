import { z } from "zod";
import { runOriginSchema, runStepSchema } from "@/runs/run-schema";
import type { RunEvent } from "@/runs/runs-logic";

export const runEventSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("run-start"), origin: runOriginSchema }),
  z.object({ kind: z.literal("step-end"), step: runStepSchema }),
  z.object({
    kind: z.literal("run-end"),
    status: z.enum(["passed", "failed"]),
  }),
]) satisfies z.ZodType<RunEvent>;
