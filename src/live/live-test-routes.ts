import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { rejectInvalidRequest } from "@/hub/problem-reply";
import { broadcast, forgetTests } from "@/live/live-feed";
import {
  runTotalsSchema,
  stepEventSchema,
  testEventSchema,
  testScreenSchema,
  testsClearSchema,
} from "@/live/live-test-schema";
import { watchRun } from "@/live/run-watchdog";

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
        const testEvent = c.req.valid("json");
        broadcast({ kind: "test", ...testEvent });
        return c.body(null, NO_CONTENT_STATUS);
      },
    )
    .post(
      "/steps",
      zValidator("json", stepEventSchema, rejectInvalidRequest),
      (c) => {
        const stepEvent = c.req.valid("json");
        broadcast({ kind: "step", ...stepEvent });
        return c.body(null, NO_CONTENT_STATUS);
      },
    )
    .post(
      "/run",
      zValidator("json", runTotalsSchema, rejectInvalidRequest),
      (c) => {
        const runTotals = c.req.valid("json");
        broadcast({ kind: "run-totals", ...runTotals });
        watchRun(runTotals);
        return c.body(null, NO_CONTENT_STATUS);
      },
    )
    .post(
      "/clear",
      zValidator("json", testsClearSchema, rejectInvalidRequest),
      (c) => {
        const { deviceIds } = c.req.valid("json");
        forgetTests(deviceIds);
        return c.body(null, NO_CONTENT_STATUS);
      },
    );
