import { z } from "zod";

const liveTestStatusSchema = z.enum(["running", "ok", "failed"]);
const runOutcomeSchema = z.enum(["ok", "failed"]);

export const testScreenSchema = z.object({
  deviceId: z.string().min(1),
  imageBase64: z.string().min(1),
});

export const testEventSchema = z.object({
  deviceId: z.string().min(1),
  title: z.string(),
  specFile: z.string(),
  status: liveTestStatusSchema,
  errorLine: z.string().nullable(),
});

export const stepEventSchema = z.object({
  deviceId: z.string().min(1),
  stepIndex: z.number().int().min(1),
  stepTitle: z.string(),
  status: liveTestStatusSchema,
  errorLine: z.string().nullable(),
});

export const runTotalsSchema = z.object({
  phase: z.enum(["start", "update"]),
  totalTests: z.number().int().min(0),
  startedAt: z.number().int().min(0),
  endedAt: z.number().int().min(0).nullable(),
  okCount: z.number().int().min(0),
  failedCount: z.number().int().min(0),
  outcome: runOutcomeSchema.nullable(),
});

export const testsClearSchema = z.object({
  deviceIds: z.array(z.string().min(1)),
});

export type LiveTestStatus = z.infer<typeof liveTestStatusSchema>;
export type TestEvent = z.infer<typeof testEventSchema>;
export type StepEvent = z.infer<typeof stepEventSchema>;
export type RunTotals = z.infer<typeof runTotalsSchema>;
export type TestsClear = z.infer<typeof testsClearSchema>;
export type TestScreen = z.infer<typeof testScreenSchema>;
