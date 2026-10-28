import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { rejectInvalidRequest } from "@/hub/problem-reply";
import { changeZoomedDevice } from "@/live/zoom-store";

const zoomSchema = z.object({
  deviceId: z.string().min(1).nullable(),
  clientId: z.string().min(1),
});

export const createZoomRoutes = () =>
  new Hono().put(
    "/",
    zValidator("json", zoomSchema, rejectInvalidRequest),
    async (c) => {
      const { deviceId, clientId } = c.req.valid("json");
      await changeZoomedDevice(deviceId, clientId);
      return c.json({ deviceId });
    },
  );
