import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { Hono } from "hono";
import { writeProblem } from "@/hub/problem-reply";
import { createRunsRoutes } from "@/runs/runs-routes";

const PROBLEM_CONTENT_TYPE = "application/problem+json";
const PARALLEL_STEP_COUNT = 12;

const createStep = (stepId: string) => ({
  stepId,
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
});

const postJson = (runEvent: unknown) => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(runEvent),
});

test.describe("runs routes", () => {
  let rootFolder = "";
  let app = new Hono();

  test.beforeEach(async () => {
    rootFolder = await mkdtemp(join(tmpdir(), "everyscreen-runs-"));
    app = new Hono();
    app.route("/api/runs", createRunsRoutes(rootFolder));
    app.onError(writeProblem);
  });

  test.afterEach(async () => {
    await rm(rootFolder, { recursive: true });
  });

  const startRun = async (origin: string): Promise<string> => {
    const startReply = await app.request("/api/runs", postJson({ origin }));
    const { runId } = await startReply.json();
    return runId;
  };

  test("creates numbered runs, saves events and reads the run back", async () => {
    const firstRunId = await startRun("cli");
    const secondRunId = await startRun("flow");

    const stepReply = await app.request(
      `/api/runs/${firstRunId}/events`,
      postJson({ kind: "step-end", step: createStep("step-1") }),
    );
    const endReply = await app.request(
      `/api/runs/${firstRunId}/events`,
      postJson({ kind: "run-end", status: "passed" }),
    );
    const runReply = await app.request(`/api/runs/${firstRunId}`);
    const listReply = await app.request("/api/runs");

    expect([firstRunId, secondRunId]).toEqual(["run-0001", "run-0002"]);
    expect([stepReply.status, endReply.status]).toEqual([200, 200]);
    const run = await runReply.json();
    expect(run.origin).toBe("cli");
    expect(run.status).toBe("failed");
    expect(run.steps).toEqual([createStep("step-1")]);
    const runs = await listReply.json();
    expect(runs.map((listedRun: { runId: string }) => listedRun.runId)).toEqual(
      ["run-0001", "run-0002"],
    );
  });

  test("answers 201 with only the new run id", async () => {
    const startReply = await app.request(
      "/api/runs",
      postJson({ origin: "playwright" }),
    );

    expect(startReply.status).toBe(201);
    expect(await startReply.json()).toEqual({ runId: "run-0001" });
  });

  test("gives every parallel start its own run id", async () => {
    const startReplies = await Promise.all(
      Array.from({ length: PARALLEL_STEP_COUNT }, () =>
        app.request("/api/runs", postJson({ origin: "playwright" })),
      ),
    );

    const startedRuns = await Promise.all(
      startReplies.map((reply) => reply.json()),
    );
    const runIds = new Set(startedRuns.map((startedRun) => startedRun.runId));
    expect(runIds.size).toBe(PARALLEL_STEP_COUNT);
  });

  test("keeps every step when workers post step ends at the same time", async () => {
    const runId = await startRun("playwright");
    const stepIds = Array.from(
      { length: PARALLEL_STEP_COUNT },
      (_, index) => `step-${index}`,
    );

    await Promise.all(
      stepIds.map((stepId) =>
        app.request(
          `/api/runs/${runId}/events`,
          postJson({ kind: "step-end", step: createStep(stepId) }),
        ),
      ),
    );

    const runReply = await app.request(`/api/runs/${runId}`);
    const run = await runReply.json();
    const savedStepIds = run.steps.map(
      (step: { stepId: string }) => step.stepId,
    );
    expect(savedStepIds.sort()).toEqual([...stepIds].sort());
  });

  test("lists no runs when the runs folder does not exist", async () => {
    const listReply = await app.request("/api/runs");

    expect(await listReply.json()).toEqual([]);
  });

  test("skips a run file that does not parse", async () => {
    const goodRunId = await startRun("cli");
    const runsFolder = join(rootFolder, ".everyscreen", "runs");
    await mkdir(runsFolder, { recursive: true });
    await writeFile(join(runsFolder, "run-0099.json"), "{ not json");

    const listReply = await app.request("/api/runs");

    const runs = await listReply.json();
    expect(runs.map((listedRun: { runId: string }) => listedRun.runId)).toEqual(
      [goodRunId],
    );
  });

  test("returns problem json 404 for a missing run", async () => {
    const missingReply = await app.request("/api/runs/run-0099");
    const orphanReply = await app.request(
      "/api/runs/run-0099/events",
      postJson({ kind: "run-end", status: "passed" }),
    );

    expect(missingReply.status).toBe(404);
    expect(missingReply.headers.get("Content-Type")).toBe(PROBLEM_CONTENT_TYPE);
    expect(await missingReply.json()).toMatchObject({
      status: 404,
      title: "Not Found",
    });
    expect(orphanReply.status).toBe(404);
  });

  test("returns problem json 409 for a step after the run ended", async () => {
    const runId = await startRun("cli");
    await app.request(
      `/api/runs/${runId}/events`,
      postJson({ kind: "run-end", status: "passed" }),
    );

    const lateReply = await app.request(
      `/api/runs/${runId}/events`,
      postJson({ kind: "step-end", step: createStep("late") }),
    );

    expect(lateReply.status).toBe(409);
    expect(lateReply.headers.get("Content-Type")).toBe(PROBLEM_CONTENT_TYPE);
  });

  test("rejects a bad run event, a bad origin and a bad run id with problem json", async () => {
    const runId = await startRun("cli");

    const badEventReply = await app.request(
      `/api/runs/${runId}/events`,
      postJson({ kind: "run-pause" }),
    );
    const badOriginReply = await app.request(
      "/api/runs",
      postJson({ origin: "robot" }),
    );
    const badIdReply = await app.request("/api/runs/..%2Fsecret");

    expect([
      badEventReply.status,
      badOriginReply.status,
      badIdReply.status,
    ]).toEqual([400, 400, 400]);
    expect(badIdReply.headers.get("Content-Type")).toBe(PROBLEM_CONTENT_TYPE);
  });

  test("returns problem json 500 without details for an unknown error", async () => {
    const failingApp = new Hono();
    failingApp.get("/boom", () => {
      throw new Error("secret token abc");
    });
    failingApp.onError(writeProblem);

    const boomReply = await failingApp.request("/boom");

    expect(boomReply.status).toBe(500);
    expect(boomReply.headers.get("Content-Type")).toBe(PROBLEM_CONTENT_TYPE);
    expect(await boomReply.json()).toMatchObject({
      detail: "Unexpected error",
    });
  });
});
