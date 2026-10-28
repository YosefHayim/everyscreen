import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { runEventSchema } from "@/runs/run-event-schema";
import { mergeRunEvent, type Run } from "@/runs/runs-logic";
import { listRuns, readRun, writeRun } from "@/runs/runs-store";

export interface RunsEnvironment {
  Variables: { rootFolder: string };
}

const NOT_FOUND_STATUS = 404;

const runIdParamSchema = z.object({ runId: z.string().regex(/^run-\d+$/) });

const createEmptyRun = (runId: string): Run => ({
  runId,
  origin: "playwright",
  status: "running",
  startedAt: Date.now(),
  steps: [],
});

export const runsRoutes = new Hono<RunsEnvironment>()
  .get("/", async (c) => {
    const runs = await listRuns(c.var.rootFolder);
    return c.json(runs);
  })
  .get("/:runId", zValidator("param", runIdParamSchema), async (c) => {
    const { runId } = c.req.valid("param");
    const run = await readRun(c.var.rootFolder, runId);
    const isRunMissing = run === null;
    if (isRunMissing)
      throw new HTTPException(NOT_FOUND_STATUS, { message: `No run ${runId}` });
    return c.json(run);
  })
  .post(
    "/:runId/events",
    zValidator("param", runIdParamSchema),
    zValidator("json", runEventSchema),
    async (c) => {
      const { runId } = c.req.valid("param");
      const runEvent = c.req.valid("json");
      const savedRun = await readRun(c.var.rootFolder, runId);
      const isRunStart = runEvent.kind === "run-start";
      const isRunMissing = savedRun === null;
      const isEventOrphan = isRunMissing && !isRunStart;
      if (isEventOrphan)
        throw new HTTPException(NOT_FOUND_STATUS, {
          message: `No run ${runId}`,
        });
      const currentRun = savedRun ?? createEmptyRun(runId);
      const mergedRun = mergeRunEvent(currentRun, runEvent);
      await writeRun(c.var.rootFolder, mergedRun);
      return c.json(mergedRun);
    },
  );
