import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { rejectInvalidRequest } from "@/hub/problem-reply";
import { broadcast } from "@/live/live-feed";
import { testEventSchema, testScreenSchema } from "@/live/live-test-schema";

const NO_CONTENT_STATUS = 204;

export const createLiveTestRoutes = () =>
  new Hono()
    .post(
      "/screens",
      zValidator("json", testScreenSchema, rejectInvalidRequest),
      (c) => {
        const { deviceId, imageBase64 } = c.req.valid("json");
        broadcast({ kind: "screen", deviceId, imageBase64 });
        return c.body(null, NO_CONTENT_STATUS);
      },
    )
    .post(
      "/events",
      zValidator("json", testEventSchema, rejectInvalidRequest),
      (c) => {
        const { deviceId, title, status } = c.req.valid("json");
        broadcast({ kind: "test", deviceId, title, status });
        return c.body(null, NO_CONTENT_STATUS);
      },
    );
