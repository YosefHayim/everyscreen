import { HTTPException } from "hono/http-exception";
import type { DeviceStep } from "@/commands/command-steps";
import {
  type CommandReply,
  countUnits,
  createRunStep,
  type DeviceFailure,
} from "@/commands/commands-logic";
import { createStepId, type RunStep } from "@/runs/runs-logic";

export interface PageLink {
  href: string;
  rel: string;
  isDownload: boolean;
}

export interface RouteStep {
  startedAt: number;
  deviceStep: DeviceStep;
}

export interface SweepStep {
  route: string;
  runStep: RunStep;
}

const BAD_START_URL_STATUS = 422;
const WEB_PROTOCOLS = ["http:", "https:"];
const NOFOLLOW_PATTERN = /(^|\s)nofollow(\s|$)/i;
const DOWNLOAD_EXTENSIONS = [
  ".pdf",
  ".zip",
  ".gz",
  ".tar",
  ".dmg",
  ".exe",
  ".apk",
  ".csv",
  ".xml",
  ".json",
  ".txt",
  ".mp3",
  ".mp4",
  ".mov",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
  ".ico",
];
const SITEMAP_LOC_PATTERN = /<loc>([^<]*)<\/loc>/g;
const XML_ENTITY_PATTERN = /&(?:lt|gt|quot|apos|amp);/g;
const XML_ENTITIES: Record<string, string> = {
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&amp;": "&",
};

// The route is pathname plus search: the hash never changes which page loads.
export const createRoutePath = (
  href: string,
  baseUrl: string,
): string | null => {
  const isHrefMalformed = !URL.canParse(href, baseUrl);
  if (isHrefMalformed) return null;

  const linkUrl = new URL(href, baseUrl);
  const isNotWebPage = !WEB_PROTOCOLS.includes(linkUrl.protocol);
  const isOtherOrigin = linkUrl.origin !== new URL(baseUrl).origin;
  const pathname = linkUrl.pathname.toLowerCase();
  const isFileDownload = DOWNLOAD_EXTENSIONS.some((extension) =>
    pathname.endsWith(extension),
  );
  const isRouteSkipped = isNotWebPage || isOtherOrigin || isFileDownload;
  if (isRouteSkipped) return null;
  return `${linkUrl.pathname}${linkUrl.search}`;
};

export const pickRoutes = (hrefs: string[], baseUrl: string): string[] =>
  hrefs
    .map((href) => createRoutePath(href, baseUrl))
    .filter((route) => route !== null);

export const pickLinkRoutes = (
  pageLinks: PageLink[],
  startUrl: string,
): string[] => {
  const followedLinks = pageLinks.filter(
    ({ rel, isDownload }) => !isDownload && !NOFOLLOW_PATTERN.test(rel),
  );
  return pickRoutes(
    followedLinks.map(({ href }) => href),
    startUrl,
  );
};

export const parseSitemapLocs = (sitemapXml: string): string[] =>
  [...sitemapXml.matchAll(SITEMAP_LOC_PATTERN)].map(([, loc]) =>
    loc.trim().replace(XML_ENTITY_PATTERN, (entity) => XML_ENTITIES[entity]),
  );

export const mergeRoutes = (
  routeLists: string[][],
  maxRoutes: number,
): string[] => [...new Set(routeLists.flat())].slice(0, maxRoutes);

export const pickStartRoute = (startUrl: string): string => {
  const startRoute = createRoutePath(startUrl, startUrl);
  const isStartRouteMissing = startRoute === null;
  if (isStartRouteMissing) {
    throw new HTTPException(BAD_START_URL_STATUS, {
      message: "Sweep needs an http or https url",
    });
  }
  return startRoute;
};

export const createRouteUrl = (route: string, startUrl: string): string =>
  new URL(route, startUrl).href;

const createSweepStepTitle = (route: string): string => `sweep ${route}`;

// Each device lists its route steps in route order, so one route is the same index on every device.
export const createSweepSteps = (
  routes: string[],
  routeStepsByDevice: RouteStep[][],
): SweepStep[] =>
  routes.map((route, routeIndex) => {
    const routeSteps = routeStepsByDevice.map(
      (deviceRouteSteps) => deviceRouteSteps[routeIndex],
    );
    const startTimes = routeSteps.map(({ startedAt }) => startedAt);
    const runStep = createRunStep({
      stepId: createStepId(routeIndex + 1),
      title: createSweepStepTitle(route),
      startedAt: Math.min(...startTimes),
      deviceSteps: routeSteps.map(({ deviceStep }) => deviceStep),
    });
    return { route, runStep };
  });

export const summarizeSweep = (
  sweepSteps: SweepStep[],
  runId: string,
): CommandReply => {
  const failures: DeviceFailure[] = sweepSteps.flatMap(({ route, runStep }) =>
    runStep.deviceAnswers
      .filter((deviceAnswer) => deviceAnswer.status === "failed")
      .map((deviceAnswer) => ({
        ...deviceAnswer,
        message: `${route} ${deviceAnswer.message}`,
      })),
  );
  const deviceAnswers = sweepSteps.flatMap(
    ({ runStep }) => runStep.deviceAnswers,
  );
  const deviceIds = new Set(deviceAnswers.map(({ deviceId }) => deviceId));
  const shotCount = deviceAnswers.filter(
    ({ shotPath }) => shotPath !== null,
  ).length;
  const findingCount = sweepSteps.reduce(
    (total, { runStep }) => total + runStep.findings.length,
    0,
  );

  const hasFailure = failures.length > 0;
  const lineParts = [
    countUnits(sweepSteps.length, "route"),
    countUnits(deviceIds.size, "device"),
    countUnits(shotCount, "shot"),
    countUnits(findingCount, "finding"),
  ];
  if (hasFailure) lineParts.push(`${failures.length} failed`);
  lineParts.push(`report ${runId}`);
  const status = hasFailure ? "failed" : "ok";
  return { status, line: lineParts.join(" · "), runId, failures };
};
