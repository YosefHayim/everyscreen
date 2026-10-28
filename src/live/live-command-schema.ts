import { z } from "zod";

export const commandNoticeSchema = z.object({
  commandName: z.string().min(1),
  status: z.enum(["ok", "failed"]),
  line: z.string(),
  sentAt: z.number().int(),
});

export type CommandNotice = z.infer<typeof commandNoticeSchema>;
