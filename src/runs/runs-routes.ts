import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { rejectInvalidRequest } from "@/hub/problem-reply";
import { runEventSchema, runOriginSchema } from "@/runs/run-schema";
import { RUN_ID_PATTERN } from "@/runs/runs-logic";
import { createRun, listRuns, readRun, saveRunEvent } from "@/runs/runs-store";

const NOT_FOUND_STATUS = 404;
const CREATED_STATUS = 201;

const runIdParamSchema = z.object({ runId: z.string().regex(RUN_ID_PATTERN) });
const newRunSchema = z.object({ origin: runOriginSchema });

export const createRunsRoutes = (rootFolder: string) =>
  new Hono()
    .get("/", async (c) => {
      const runs = await listRuns(rootFolder);
      return c.json(runs);
    })
    .post(
      "/",
      zValidator("json", newRunSchema, rejectInvalidRequest),
      async (c) => {
        const { origin } = c.req.valid("json");
        const run = await createRun(rootFolder, origin);
        return c.json({ runId: run.runId }, CREATED_STATUS);
      },
    )
    .get(
      "/:runId",
      zValidator("param", runIdParamSchema, rejectInvalidRequest),
      async (c) => {
        const { runId } = c.req.valid("param");
        const run = await readRun(rootFolder, runId);
        const isRunMissing = run === null;
        if (isRunMissing) {
          throw new HTTPException(NOT_FOUND_STATUS, {
            message: `No run ${runId}`,
          });
        }
        return c.json(run);
      },
    )
    .post(
      "/:runId/events",
      zValidator("param", runIdParamSchema, rejectInvalidRequest),
      zValidator("json", runEventSchema, rejectInvalidRequest),
      async (c) => {
        const { runId } = c.req.valid("param");
        const runEvent = c.req.valid("json");
        const savedRun = await saveRunEvent(rootFolder, runId, runEvent);
        return c.json(savedRun);
      },
    );
