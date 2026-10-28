import { HTTPException } from "hono/http-exception";
import { describe, expect, test } from "vitest";
import type { DeviceAnswer } from "@/commands/commands-logic";
import type { RunStep } from "@/runs/runs-logic";
import {
  createCrashedStep,
  createLeftOriginStep,
  createRouteUrl,
  createSweepSteps,
  hasLeftOrigin,
  mergeRoutes,
  type PageLink,
  parseSitemapLocs,
  pickLinkRoutes,
  pickRoutes,
  pickStartRoute,
  summarizeSweep,
} from "@/sweep/sweep-logic";

const START_URL = "http://127.0.0.1:3000/";

const createLink = (href: string, overrides: Partial<PageLink> = {}) => ({
  href,
  rel: "",
  isDownload: false,
  ...overrides,
});

const pickFirstRoute = (href: string, startUrl: string): string | null => {
  const [firstRoute = null] = pickRoutes([href], startUrl);
  return firstRoute;
};

describe("pickRoutes for one href", () => {
  test("keeps the pathname and search and drops the hash", () => {
    const route = pickFirstRoute("/shop?page=2#reviews", START_URL);

    expect(route).toBe("/shop?page=2");
  });

  test("reads a full same-origin url", () => {
    const route = pickFirstRoute("http://127.0.0.1:3000/about", START_URL);

    expect(route).toBe("/about");
  });

  test.each([
    ["another origin", "https://example.com/"],
    ["another port", "http://127.0.0.1:4000/"],
    ["mailto", "mailto:hi@example.com"],
    ["tel", "tel:+15551234"],
    ["javascript", "javascript:void(0)"],
    ["a pdf download", "/menu.PDF"],
    ["a zip download", "/files/site.zip?v=2"],
    [
      "a path that starts with two slashes",
      "http://127.0.0.1:3000//evil.com/x",
    ],
  ])("skips %s", (_name, href) => {
    expect(pickFirstRoute(href, START_URL)).toBeNull();
  });

  test("skips a link that is not a valid url", () => {
    expect(pickFirstRoute("http://", START_URL)).toBeNull();
  });
});

describe("pickRoutes", () => {
  test("keeps the routes of valid same-origin hrefs in order", () => {
    const routes = pickRoutes(["/b", "mailto:a@b.test", "/a#top"], START_URL);

    expect(routes).toEqual(["/b", "/a"]);
  });

  test("returns an empty list for no hrefs", () => {
    expect(pickRoutes([], START_URL)).toEqual([]);
  });
});

describe("pickLinkRoutes", () => {
  test("skips nofollow and download links and other origins", () => {
    const pageLinks = [
      createLink("http://127.0.0.1:3000/about"),
      createLink("http://127.0.0.1:3000/private", { rel: "noopener Nofollow" }),
      createLink("http://127.0.0.1:3000/invoice", { isDownload: true }),
      createLink("https://example.com/"),
      createLink("mailto:hi@example.com"),
      createLink("http://127.0.0.1:3000/pricing", { rel: "noopener" }),
    ];

    const routes = pickLinkRoutes(pageLinks, START_URL);

    expect(routes).toEqual(["/about", "/pricing"]);
  });
});

describe("parseSitemapLocs", () => {
  test("reads every loc, trims it and decodes XML entities", () => {
    const sitemapXml = `<?xml version="1.0"?>
<urlset>
  <url><loc> http://127.0.0.1:3000/a?x=1&amp;y=2 </loc></url>
  <url><loc>http://127.0.0.1:3000/&lt;b&gt;&quot;&apos;</loc></url>
  <url><loc>http://127.0.0.1:3000/plain</loc></url>
</urlset>`;

    const locs = parseSitemapLocs(sitemapXml);

    expect(locs).toEqual([
      "http://127.0.0.1:3000/a?x=1&y=2",
      `http://127.0.0.1:3000/<b>"'`,
      "http://127.0.0.1:3000/plain",
    ]);
  });

  test("returns an empty list when the text has no loc", () => {
    expect(parseSitemapLocs("<html>not a sitemap</html>")).toEqual([]);
  });
});

describe("mergeRoutes", () => {
  test("joins the lists in order and drops duplicates", () => {
    const routes = mergeRoutes(
      [
        ["/", "/a"],
        ["/a", "/b"],
        ["/c", "/"],
      ],
      50,
    );

    expect(routes).toEqual(["/", "/a", "/b", "/c"]);
  });

  test("stops at the route limit", () => {
    const routes = mergeRoutes(
      [
        ["/", "/a"],
        ["/b", "/c"],
      ],
      3,
    );

    expect(routes).toEqual(["/", "/a", "/b"]);
  });
});

describe("pickStartRoute", () => {
  test("returns the path and search of the start url", () => {
    expect(pickStartRoute("http://127.0.0.1:3000/app?tab=1#x")).toBe(
      "/app?tab=1",
    );
  });

  test("rejects a start url that is not an http page with 422", () => {
    let status = 0;
    try {
      pickStartRoute("ftp://127.0.0.1/files");
    } catch (error) {
      if (error instanceof HTTPException) status = error.status;
    }

    expect(status).toBe(422);
  });
});

describe("createRouteUrl", () => {
  test("keeps the start origin for a route made of one slash", () => {
    expect(createRouteUrl("/x", "http://127.0.0.1:3000/")).toBe(
      "http://127.0.0.1:3000/x",
    );
  });

  test("joins a route to the start url origin", () => {
    expect(createRouteUrl("/a?b=1", "http://127.0.0.1:3000/start")).toBe(
      "http://127.0.0.1:3000/a?b=1",
    );
  });
});

const createOkAnswer = (deviceId: string, shotPath: string): DeviceAnswer => ({
  status: "ok",
  deviceId,
  durationMs: 10,
  shotPath,
});

const createFailedAnswer = (deviceId: string): DeviceAnswer => ({
  status: "failed",
  deviceId,
  durationMs: 10,
  message: "div.wide is 500px past the edge",
  shotPath: `shots/${deviceId}.png`,
});

const createStep = (
  stepId: string,
  deviceAnswers: DeviceAnswer[],
  findingCount: number,
): RunStep => ({
  stepId,
  title: `sweep ${stepId}`,
  startedAt: 1,
  deviceAnswers,
  findings: Array.from({ length: findingCount }, () => ({
    kind: "overflow" as const,
    severity: "failed" as const,
    deviceId: "pixel-8",
    selector: "div.wide",
    message: "div.wide is 500px past the edge",
  })),
  proof: null,
});

describe("createSweepSteps", () => {
  test("makes one run step per route with the answers of every device", () => {
    const routeStepsByDevice = ["pixel-8", "iphone-se"].map((deviceId, index) =>
      ["/", "/about"].map((route, routeIndex) => ({
        startedAt: 100 * (index + 1) + routeIndex,
        deviceStep: {
          deviceAnswer: createOkAnswer(deviceId, `${deviceId}${route}.png`),
          findings: [],
        },
      })),
    );

    const sweepSteps = createSweepSteps(["/", "/about"], routeStepsByDevice);

    expect(sweepSteps.map(({ route }) => route)).toEqual(["/", "/about"]);
    expect(sweepSteps.map(({ runStep }) => runStep.stepId)).toEqual([
      "step-1",
      "step-2",
    ]);
    expect(sweepSteps.map(({ runStep }) => runStep.title)).toEqual([
      "sweep /",
      "sweep /about",
    ]);
    expect(sweepSteps.map(({ runStep }) => runStep.startedAt)).toEqual([
      100, 101,
    ]);
    const [, aboutStep] = sweepSteps;
    expect(
      aboutStep.runStep.deviceAnswers.map(({ deviceId }) => deviceId),
    ).toEqual(["pixel-8", "iphone-se"]);
  });
});

describe("summarizeSweep", () => {
  test("counts routes, devices, shots and findings on one line when every route is ok", () => {
    const sweepSteps = [
      {
        route: "/",
        runStep: createStep(
          "step-1",
          [
            createOkAnswer("pixel-8", "a.png"),
            createOkAnswer("iphone-se", "b.png"),
          ],
          1,
        ),
      },
      {
        route: "/about",
        runStep: createStep(
          "step-2",
          [
            createOkAnswer("pixel-8", "c.png"),
            createOkAnswer("iphone-se", "d.png"),
          ],
          0,
        ),
      },
    ];

    const reply = summarizeSweep(sweepSteps, "run-0007");

    expect(reply.line).toBe(
      "2 routes · 2 devices · 4 shots · 1 finding · report run-0007",
    );
    expect(reply.status).toBe("ok");
    expect(reply.failures).toEqual([]);
    expect(reply.runId).toBe("run-0007");
  });

  test("adds the failed count and one failure per failed route and device", () => {
    const sweepSteps = [
      {
        route: "/wide",
        runStep: createStep(
          "step-1",
          [createFailedAnswer("pixel-8"), createOkAnswer("iphone-se", "b.png")],
          1,
        ),
      },
    ];

    const reply = summarizeSweep(sweepSteps, "run-0008");

    expect(reply.line).toBe(
      "1 route · 2 devices · 2 shots · 1 finding · 1 failed · report run-0008",
    );
    expect(reply.status).toBe("failed");
    expect(reply.failures).toHaveLength(1);
    expect(reply.failures[0].message).toBe(
      "/wide div.wide is 500px past the edge",
    );
    expect(reply.failures[0].deviceId).toBe("pixel-8");
  });

  test("counts only answers that saved a shot", () => {
    const answerWithoutShot: DeviceAnswer = {
      status: "ok",
      deviceId: "pixel-8",
      durationMs: 1,
      shotPath: null,
    };
    const sweepSteps = [
      { route: "/", runStep: createStep("step-1", [answerWithoutShot], 0) },
    ];

    const reply = summarizeSweep(sweepSteps, "run-0009");

    expect(reply.line).toContain("0 shots");
  });
});

describe("hasLeftOrigin", () => {
  test("is false on the start origin", () => {
    expect(hasLeftOrigin("http://127.0.0.1:3000/a", START_URL)).toBe(false);
  });

  test("is true on another origin", () => {
    expect(hasLeftOrigin("https://example.com/a", START_URL)).toBe(true);
  });
});

describe("createLeftOriginStep", () => {
  test("turns an ok answer into a failed one and keeps the findings", () => {
    const deviceStep = {
      deviceAnswer: createOkAnswer("pixel-8", "shots/a.png"),
      findings: [],
    };

    const leftStep = createLeftOriginStep(deviceStep);

    expect(leftStep.deviceAnswer).toEqual({
      status: "failed",
      deviceId: "pixel-8",
      durationMs: 10,
      message: "left the app origin",
      shotPath: "shots/a.png",
    });
    expect(leftStep.findings).toEqual([]);
  });
});

describe("createCrashedStep", () => {
  test("makes a failed answer with the error message", () => {
    const crashedStep = createCrashedStep("pixel-8", 5, new Error("boom"));

    expect(crashedStep.deviceAnswer).toMatchObject({
      status: "failed",
      deviceId: "pixel-8",
      durationMs: 5,
      shotPath: null,
    });
    expect(crashedStep.findings).toEqual([]);
  });
});
