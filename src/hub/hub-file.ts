import { z } from "zod";

export const hubFileSchema = z.object({
  port: z.number(),
  devices: z.record(
    z.string(),
    z.object({
      wsEndpoint: z.string(),
      cdpUrl: z.string().nullable(),
    }),
  ),
});

export type HubFile = z.infer<typeof hubFileSchema>;
