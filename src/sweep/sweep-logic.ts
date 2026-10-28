import { HTTPException } from "hono/http-exception";
import type { DeviceStep } from "@/commands/command-steps";
import {
  type CommandReply,
  countUnits,
  createCommandRunStep,
  type DeviceFailure,
  pickDeviceIds,
  pickErrorMessage,
} from "@/commands/commands-logic";
import type { SweepCommand } from "@/commands/commands-schema";
import { listFlowBatches } from "@/flows/flows-logic";
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

export interface SweepDevices {
  gridIds: string[];
  extraIds: string[];
}

interface VisitedDevice {
  kind: "visited";
  routeSteps: RouteStep[];
}

export interface BeforeFailedDevice {
  kind: "before-failed";
  beforeFailure: DeviceFailure;
}

export type DeviceVisit = VisitedDevice | BeforeFailedDevice;

export interface SweepStep {
  route: string;
  runStep: RunStep;
}

const BAD_START_URL_STATUS = 422;
const BEFORE_FAILED_PREFIX = "before flow failed: ";
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
const createRoutePath = (href: string, baseUrl: string): string | null => {
  const isHrefMalformed = !URL.canParse(href, baseUrl);
  if (isHrefMalformed) return null;

  const linkUrl = new URL(href, baseUrl);
  const isNotWebPage = !WEB_PROTOCOLS.includes(linkUrl.protocol);
  const isOtherOrigin = linkUrl.origin !== new URL(baseUrl).origin;
  const pathname = linkUrl.pathname.toLowerCase();
  const isFileDownload = DOWNLOAD_EXTENSIONS.some((extension) =>
    pathname.endsWith(extension),
  );
  // //host/path would point at another host once joined to the origin.
  const isHostPath = linkUrl.pathname.startsWith("//");
  const isRouteSkipped =
    isNotWebPage || isOtherOrigin || isFileDownload || isHostPath;
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
  const followedHrefs = followedLinks.map(({ href }) => href);
  return pickRoutes(followedHrefs, startUrl);
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

export const createRouteUrl = (route: string, startUrl: string): string => {
  const startOrigin = new URL(startUrl).origin;
  return `${startOrigin}${route}`;
};

export const hasLeftOrigin = (pageUrl: string, startUrl: string): boolean => {
  const pageOrigin = new URL(pageUrl).origin;
  const startOrigin = new URL(startUrl).origin;
  return pageOrigin !== startOrigin;
};

export const createLeftOriginStep = (deviceStep: DeviceStep): DeviceStep => {
  const { deviceId, durationMs, shotPath } = deviceStep.deviceAnswer;
  const deviceAnswer: DeviceFailure = {
    status: "failed",
    deviceId,
    durationMs,
    message: "left the app origin",
    shotPath,
  };
  return { deviceAnswer, findings: deviceStep.findings };
};

export const createCrashedStep = (
  deviceId: string,
  durationMs: number,
  error: unknown,
): DeviceStep => ({
  deviceAnswer: {
    status: "failed",
    deviceId,
    durationMs,
    message: pickErrorMessage(error),
    shotPath: null,
  },
  findings: [],
});

const splitDeviceIds = (
  chosenIds: string[],
  runningIds: string[],
): SweepDevices => ({
  gridIds: chosenIds.filter((deviceId) => runningIds.includes(deviceId)),
  extraIds: chosenIds.filter((deviceId) => !runningIds.includes(deviceId)),
});

// Grid devices keep their running browsers; any other known device gets a short-lived context.
export const pickSweepDevices = (
  deviceIds: SweepCommand["deviceIds"],
  runningIds: string[],
  catalogIds: string[],
): SweepDevices => {
  const knownIds = [...new Set([...runningIds, ...catalogIds])];
  const isEveryDeviceChosen = deviceIds === "all";
  if (isEveryDeviceChosen) return splitDeviceIds(knownIds, runningIds);

  const isGridChosen = deviceIds === null;
  const askedIds = isGridChosen ? runningIds : knownIds;
  const chosenIds = pickDeviceIds(askedIds, deviceIds);
  return splitDeviceIds(chosenIds, runningIds);
};

export const listExtraDeviceBatches = (
  extraIds: string[],
  batchLimit: number,
): string[][] => listFlowBatches(extraIds, batchLimit);

export const createBeforeFailure = (
  deviceFailure: DeviceFailure,
): DeviceFailure => {
  const [firstLine] = deviceFailure.message.split("\n");
  return {
    ...deviceFailure,
    message: `${BEFORE_FAILED_PREFIX}${firstLine}`,
  };
};

const isDeviceVisited = (
  deviceVisit: DeviceVisit,
): deviceVisit is VisitedDevice => deviceVisit.kind === "visited";

const isBeforeFailed = (
  deviceVisit: DeviceVisit,
): deviceVisit is BeforeFailedDevice => deviceVisit.kind === "before-failed";

export const pickVisitedRouteSteps = (
  deviceVisits: DeviceVisit[],
): RouteStep[][] =>
  deviceVisits.filter(isDeviceVisited).map(({ routeSteps }) => routeSteps);

export const pickBeforeFailures = (
  deviceVisits: DeviceVisit[],
): DeviceFailure[] =>
  deviceVisits.filter(isBeforeFailed).map(({ beforeFailure }) => beforeFailure);

export const listBeforeRunSteps = (
  beforeFailures: DeviceFailure[],
  routeCount: number,
  startedAt: number,
): RunStep[] => {
  const isNoBeforeFailure = beforeFailures.length === 0;
  if (isNoBeforeFailure) return [];
  const beforeRunStep = createCommandRunStep({
    stepId: createStepId(routeCount + 1),
    title: "before flow",
    startedAt,
    deviceSteps: beforeFailures.map((deviceAnswer) => ({
      deviceAnswer,
      findings: [],
    })),
  });
  return [beforeRunStep];
};

// Each device lists its route steps in route order, so one route is the same index on every device that was visited.
export const createSweepSteps = (
  routes: string[],
  routeStepsByDevice: RouteStep[][],
): SweepStep[] => {
  const isNoDeviceVisited = routeStepsByDevice.length === 0;
  if (isNoDeviceVisited) return [];
  return routes.map((route, routeIndex) => {
    const routeSteps = routeStepsByDevice.map(
      (deviceRouteSteps) => deviceRouteSteps[routeIndex],
    );
    const startTimes = routeSteps.map(({ startedAt }) => startedAt);
    const runStep = createCommandRunStep({
      stepId: createStepId(routeIndex + 1),
      title: `sweep ${route}`,
      startedAt: Math.min(...startTimes),
      deviceSteps: routeSteps.map(({ deviceStep }) => deviceStep),
    });
    return { route, runStep };
  });
};

export const summarizeSweep = (
  sweepSteps: SweepStep[],
  runId: string,
  beforeFailures: DeviceFailure[],
): CommandReply => {
  const routeFailures: DeviceFailure[] = sweepSteps.flatMap(
    ({ route, runStep }) =>
      runStep.deviceAnswers
        .filter((deviceAnswer) => deviceAnswer.status === "failed")
        .map((deviceAnswer) => ({
          ...deviceAnswer,
          message: `${route} ${deviceAnswer.message}`,
        })),
  );
  const failures = [...beforeFailures, ...routeFailures];
  const deviceAnswers = sweepSteps.flatMap(
    ({ runStep }) => runStep.deviceAnswers,
  );
  const answeredIds = deviceAnswers.map(({ deviceId }) => deviceId);
  const beforeFailedIds = beforeFailures.map(({ deviceId }) => deviceId);
  const deviceIds = new Set([...answeredIds, ...beforeFailedIds]);
  const shotCount = deviceAnswers.filter(
    ({ shotPath }) => shotPath !== null,
  ).length;
  const findingCount = sweepSteps.reduce(
    (total, { runStep }) => total + runStep.findings.length,
    0,
  );

  const hasFailure = failures.length > 0;
  const failedParts = hasFailure ? [`${failures.length} failed`] : [];
  const lineParts = [
    countUnits(sweepSteps.length, "route"),
    countUnits(deviceIds.size, "device"),
    countUnits(shotCount, "shot"),
    countUnits(findingCount, "finding"),
    ...failedParts,
    `report ${runId}`,
  ];
  const status = hasFailure ? "failed" : "ok";
  return { status, line: lineParts.join(" · "), runId, failures };
};
