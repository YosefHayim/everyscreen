import { z } from "zod";

const liveTestStatusSchema = z.enum(["running", "ok", "failed"]);

export const testScreenSchema = z.object({
  deviceId: z.string().min(1),
  imageBase64: z.string().min(1),
});

export const testEventSchema = z.object({
  deviceId: z.string().min(1),
  title: z.string(),
  status: liveTestStatusSchema,
});

export type LiveTestStatus = z.infer<typeof liveTestStatusSchema>;
export type TestEvent = z.infer<typeof testEventSchema>;
