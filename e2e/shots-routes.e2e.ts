import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { Hono } from "hono";
import { STORE_FOLDER } from "@/environment";
import { writeProblem } from "@/hub/problem-reply";
import { createShotsRoutes } from "@/runs/shots-routes";

const PROBLEM_CONTENT_TYPE = "application/problem+json";
const SHOT_FILE_NAME = "run-0001-step-1-iphone-se.png";
const SHOT_BYTES = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

test.describe("shots routes", () => {
  let rootFolder = "";
  let app = new Hono();

  test.beforeEach(async () => {
    rootFolder = await mkdtemp(join(tmpdir(), "everyscreen-shots-"));
    const shotsFolder = join(rootFolder, STORE_FOLDER, "shots");
    await mkdir(shotsFolder, { recursive: true });
    await writeFile(join(shotsFolder, SHOT_FILE_NAME), SHOT_BYTES);
    app = new Hono();
    app.route("/api/shots", createShotsRoutes(rootFolder));
    app.onError(writeProblem);
  });

  test.afterEach(async () => {
    await rm(rootFolder, { recursive: true });
  });

  test("returns the saved shot as a png", async () => {
    const shotReply = await app.request(`/api/shots/${SHOT_FILE_NAME}`);
    const shotBytes = Buffer.from(await shotReply.arrayBuffer());

    expect(shotReply.status).toBe(200);
    expect(shotReply.headers.get("Content-Type")).toBe("image/png");
    expect(shotBytes.equals(SHOT_BYTES)).toBe(true);
  });

  test("returns problem json 404 for a shot that was never saved", async () => {
    const missingReply = await app.request("/api/shots/run-0009-nothing.png");
    const problem = await missingReply.json();

    expect(missingReply.status).toBe(404);
    expect(missingReply.headers.get("Content-Type")).toBe(PROBLEM_CONTENT_TYPE);
    expect(problem.detail).toBe("No shot run-0009-nothing.png");
  });

  for (const badFileName of [
    "..%2F..%2Fhub.json",
    "%2e%2e.png",
    "a%2Fb.png",
    "shot.jpg",
    "shot.png.txt",
    "my%20shot.png",
  ]) {
    test(`returns problem json 400 for the file name ${badFileName}`, async () => {
      const badReply = await app.request(`/api/shots/${badFileName}`);

      expect(badReply.status).toBe(400);
      expect(badReply.headers.get("Content-Type")).toBe(PROBLEM_CONTENT_TYPE);
    });
  }
});
