import { execFile } from "node:child_process";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { z } from "zod";
import { readRun } from "@/runs/runs-store";

const HOLLIS_PATH = fileURLToPath(
  new URL("hollis-goods.html", import.meta.url),
);
const SUITE_CONFIG_PATH = fileURLToPath(
  new URL("playwright-suite/playwright.config.ts", import.meta.url),
);
const PLAYWRIGHT_CLI_PATH = join(
  process.cwd(),
  "node_modules/@playwright/test/cli.js",
);
const SUITE_TIMEOUT_MS = 180_000;
const MAX_SUITE_OUTPUT_BYTES = 10_000_000;

const listingSchema = z.object({
  config: z.object({
    projects: z.array(z.object({ name: z.string() })),
  }),
});

interface SuiteRun {
  exitCode: number;
  stdout: string;
}

const runSuite = (
  rootFolder: string,
  hollisUrl: string,
  deviceIds: string,
  suiteFlags: string[],
): Promise<SuiteRun> =>
  new Promise((done) => {
    execFile(
      process.execPath,
      [
        PLAYWRIGHT_CLI_PATH,
        "test",
        "--config",
        SUITE_CONFIG_PATH,
        ...suiteFlags,
      ],
      {
        cwd: rootFolder,
        maxBuffer: MAX_SUITE_OUTPUT_BYTES,
        env: {
          ...process.env,
          HOLLIS_URL: hollisUrl,
          SUITE_DEVICE_IDS: deviceIds,
        },
      },
      (error, stdout) => {
        const exitCode = typeof error?.code === "number" ? error.code : 0;
        done({ exitCode, stdout });
      },
    );
  });

test.describe("playwright reporter", () => {
  test.setTimeout(SUITE_TIMEOUT_MS);

  let rootFolder = "";
  let hollisServer: Server;
  let hollisUrl = "";

  test.beforeAll(async () => {
    const hollisHtml = await readFile(HOLLIS_PATH, "utf8");
    hollisServer = createServer((_request, reply) => {
      reply.setHeader("Content-Type", "text/html");
      reply.end(hollisHtml);
    });
    await new Promise<void>((done) =>
      hollisServer.listen(0, "127.0.0.1", done),
    );
    const address = hollisServer.address();
    const port = address instanceof Object ? address.port : 0;
    hollisUrl = `http://127.0.0.1:${port}/`;
  });

  test.afterAll(async () => {
    await new Promise((done) => hollisServer.close(done));
  });

  test.beforeEach(async () => {
    rootFolder = await mkdtemp(join(tmpdir(), "everyscreen-suite-"));
  });

  test.afterEach(async () => {
    await rm(rootFolder, { recursive: true, force: true });
  });

  test("saves one step per test with an answer per device and the failure proof", async () => {
    const suiteRun = await runSuite(
      rootFolder,
      hollisUrl,
      "pixel-8,iphone-se",
      [],
    );

    const run = await readRun(rootFolder, "run-0001");
    expect(suiteRun.exitCode).toBe(1);
    expect(run?.origin).toBe("playwright");
    expect(run?.status).toBe("failed");
    expect(run?.steps).toHaveLength(2);
    const passedStep = run?.steps.find(({ title }) =>
      title.includes("shows the shop name"),
    );
    const failedStep = run?.steps.find(({ title }) =>
      title.includes("shows a wishlist button"),
    );
    if (passedStep === undefined || failedStep === undefined) {
      throw new Error("The run lacks the passed or the failed step");
    }
    expect(
      passedStep.deviceAnswers.map((answer) => answer.deviceId).sort(),
    ).toEqual(["iphone-se", "pixel-8"]);
    expect(
      passedStep.deviceAnswers.every((answer) => answer.status === "ok"),
    ).toBe(true);
    expect(passedStep.proof).toBeNull();
    expect(
      failedStep.deviceAnswers.every((answer) => answer.status === "failed"),
    ).toBe(true);
    expect(failedStep.proof?.errorMessage).not.toContain("\u001b");
    expect(failedStep.proof?.codeSnippet).toContain("Wishlist");
    expect(failedStep.proof?.codeLocation).toMatch(
      /hollis\.suite\.ts:\d+:\d+$/,
    );
    for (const answer of failedStep.deviceAnswers) {
      const shotPath = answer.status === "failed" ? answer.shotPath : null;
      if (shotPath === null) throw new Error("A failed answer has no shot");
      await access(join(rootFolder, shotPath));
    }
    expect(suiteRun.stdout).toContain(
      "2 devices · 0 ok · 2 failed · report run-0001",
    );
  });

  test("lists a custom device from everyscreen.yaml as a project", async () => {
    await writeFile(
      join(rootFolder, "everyscreen.yaml"),
      "devices:\n  - name: Tiny Webkit\n    width: 320\n    height: 568\n    browserName: webkit\n",
    );

    const listRun = await runSuite(
      rootFolder,
      hollisUrl,
      "pixel-8,tiny-webkit",
      ["--list", "--reporter=json"],
    );

    const listing = listingSchema.parse(JSON.parse(listRun.stdout));
    const projectNames = listing.config.projects.map(({ name }) => name);
    expect(projectNames).toEqual(["pixel-8", "tiny-webkit"]);
  });
});
