import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { Hono } from "hono";
import { writeProblem } from "@/hub/problem-reply";
import { type RunsEnvironment, runsRoutes } from "@/runs/runs-routes";

const PROBLEM_CONTENT_TYPE = "application/problem+json";

const startTestApp = async () => {
  const rootFolder = await mkdtemp(join(tmpdir(), "everyscreen-runs-"));
  const app = new Hono<RunsEnvironment>();
  app.use(async (c, next) => {
    c.set("rootFolder", rootFolder);
    await next();
  });
  app.route("/api/runs", runsRoutes);
  app.onError(writeProblem);
  return { app, rootFolder };
};

const postEvent = (
  app: Hono<RunsEnvironment>,
  runId: string,
  runEvent: unknown,
) =>
  app.request(`/api/runs/${runId}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(runEvent),
  });

const STEP = {
  stepId: "step-1",
  title: "tap Checkout",
  startedAt: 5,
  deviceAnswers: [
    { status: "ok", deviceId: "pixel-8", durationMs: 90 },
    {
      status: "failed",
      deviceId: "iphone-se",
      durationMs: 400,
      message: "covered",
      shotPath: null,
    },
  ],
  findings: [],
  proof: null,
};

test.describe("runs routes", () => {
  test("saves run start, step end and run end, then reads the run back", async () => {
    const { app, rootFolder } = await startTestApp();

    const startReply = await postEvent(app, "run-0001", {
      kind: "run-start",
      origin: "cli",
    });
    const stepReply = await postEvent(app, "run-0001", {
      kind: "step-end",
      step: STEP,
    });
    const endReply = await postEvent(app, "run-0001", {
      kind: "run-end",
      status: "failed",
    });
    const runReply = await app.request("/api/runs/run-0001");
    const listReply = await app.request("/api/runs");

    expect([startReply.status, stepReply.status, endReply.status]).toEqual([
      200, 200, 200,
    ]);
    const run = await runReply.json();
    expect(run.origin).toBe("cli");
    expect(run.status).toBe("failed");
    expect(run.steps).toEqual([STEP]);
    const runs = await listReply.json();
    expect(runs.map((listedRun: { runId: string }) => listedRun.runId)).toEqual(
      ["run-0001"],
    );
    await rm(rootFolder, { recursive: true });
  });

  test("lists no runs in an empty folder", async () => {
    const { app, rootFolder } = await startTestApp();

    const listReply = await app.request("/api/runs");

    expect(await listReply.json()).toEqual([]);
    await rm(rootFolder, { recursive: true });
  });

  test("returns problem json 404 for a missing run", async () => {
    const { app, rootFolder } = await startTestApp();

    const missingReply = await app.request("/api/runs/run-0099");
    const orphanReply = await postEvent(app, "run-0099", {
      kind: "run-end",
      status: "passed",
    });

    expect(missingReply.status).toBe(404);
    expect(missingReply.headers.get("Content-Type")).toBe(PROBLEM_CONTENT_TYPE);
    expect(await missingReply.json()).toMatchObject({
      status: 404,
      title: "Not Found",
    });
    expect(orphanReply.status).toBe(404);
    await rm(rootFolder, { recursive: true });
  });

  test("rejects a bad run event and a bad run id", async () => {
    const { app, rootFolder } = await startTestApp();

    const badEventReply = await postEvent(app, "run-0001", {
      kind: "run-pause",
    });
    const badIdReply = await app.request("/api/runs/..%2Fsecret");

    expect(badEventReply.status).toBe(400);
    expect(badIdReply.status).toBe(400);
    await rm(rootFolder, { recursive: true });
  });

  test("returns problem json 500 without details for an unknown error", async () => {
    const app = new Hono();
    app.get("/boom", () => {
      throw new Error("secret token abc");
    });
    app.onError(writeProblem);

    const boomReply = await app.request("/boom");

    expect(boomReply.status).toBe(500);
    expect(boomReply.headers.get("Content-Type")).toBe(PROBLEM_CONTENT_TYPE);
    expect(await boomReply.json()).toMatchObject({
      detail: "Unexpected error",
    });
  });
});
