import { z } from "zod";

const runOriginSchema = z.enum(["cli", "flow", "playwright"]);

const deviceAnswerSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("ok"),
    deviceId: z.string(),
    durationMs: z.number(),
  }),
  z.object({
    status: z.literal("failed"),
    deviceId: z.string(),
    durationMs: z.number(),
    message: z.string(),
    shotPath: z.string().nullable(),
  }),
]);

const findingSchema = z.object({
  kind: z.enum([
    "overflow",
    "clipped-text",
    "safe-area",
    "tap-target",
    "console-error",
    "failed-request",
  ]),
  severity: z.enum(["fail", "warn"]),
  deviceId: z.string(),
  selector: z.string().nullable(),
  message: z.string(),
});

const stepProofSchema = z.object({
  shotPath: z.string().nullable(),
  errorMessage: z.string(),
  codeSnippet: z.string().nullable(),
  codeLocation: z.string().nullable(),
});

const runStepSchema = z.object({
  stepId: z.string(),
  title: z.string(),
  startedAt: z.number(),
  deviceAnswers: z.array(deviceAnswerSchema),
  findings: z.array(findingSchema),
  proof: stepProofSchema.nullable(),
});

export const runEventSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("run-start"), origin: runOriginSchema }),
  z.object({ kind: z.literal("step-end"), step: runStepSchema }),
  z.object({
    kind: z.literal("run-end"),
    status: z.enum(["passed", "failed"]),
  }),
]);
