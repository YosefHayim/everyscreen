import {
  type DeviceStep,
  runStepOnDevice,
  type StepTarget,
} from "@/commands/command-steps";
import type { CommandReply, DeviceFailure } from "@/commands/commands-logic";
import type { SweepCommand } from "@/commands/commands-schema";
import type { DevicePage } from "@/devices/device-browsers";
import { DEVICE_CATALOG } from "@/devices/device-catalog";
import { type DevicePreset, findCatalogPreset } from "@/devices/devices-logic";
import { readDevicesFile } from "@/devices/devices-store";
import { SWEEP_EXTRA_DEVICE_LIMIT } from "@/environment";
import { listFlowBatches } from "@/flows/flows-logic";
import { broadcast } from "@/live/live-feed";
import { createStepId, type RunStep } from "@/runs/runs-logic";
import { createRun, saveRunEvent } from "@/runs/runs-store";
import {
  type ExtraBrowsers,
  withExtraBrowsers,
  withExtraDevicePage,
} from "@/sweep/sweep-extra-devices";
import {
  type BeforeFailedDevice,
  createBeforeFailure,
  createCrashedStep,
  createLeftOriginStep,
  createRouteUrl,
  createSweepSteps,
  type DeviceVisit,
  hasLeftOrigin,
  listBeforeRunSteps,
  pickBeforeFailures,
  pickSweepDevices,
  pickVisitedRouteSteps,
  type RouteStep,
  type SweepStep,
  summarizeSweep,
} from "@/sweep/sweep-logic";
import { listSweepRoutes } from "@/sweep/sweep-routes";

interface SweepRunStart {
  rootFolder: string;
  runId: string;
  sweepCommand: SweepCommand;
  configuredRoutes: string[];
}

interface SweepRoutes {
  sweepRunStart: SweepRunStart;
  routes: string[];
}

interface DeviceSweep extends SweepRunStart {
  devicePage: DevicePage;
  routes: string[];
}

type PreparedPage =
  | { kind: "ready"; devicePage: DevicePage }
  | BeforeFailedDevice;

interface CrawlPages {
  startUrl: string;
  maxRoutes: number;
  configuredRoutes: string[];
}

interface CrawlingVisit {
  routes: string[] | null;
  deviceVisit: DeviceVisit;
}

interface SweepVisits {
  routes: string[];
  deviceVisits: DeviceVisit[];
}

const runStepOrCrash = async (
  devicePage: DevicePage,
  stepTarget: StepTarget,
): Promise<DeviceStep> => {
  const startedAt = Date.now();
  try {
    return await runStepOnDevice(devicePage, stepTarget);
  } catch (error) {
    console.error({ deviceId: devicePage.device.id, error });
    const durationMs = Date.now() - startedAt;
    return createCrashedStep(devicePage.device.id, durationMs, error);
  }
};

const runRouteOnDevice = async (
  devicePage: DevicePage,
  stepStart: StepTarget,
  routeUrl: string,
): Promise<DeviceStep> => {
  const startedAt = Date.now();
  try {
    const deviceStep = await runStepOnDevice(devicePage, stepStart);
    const pageUrl = devicePage.page.url();
    const hasLeftApp = hasLeftOrigin(pageUrl, routeUrl);
    return hasLeftApp ? createLeftOriginStep(deviceStep) : deviceStep;
  } catch (error) {
    console.error({ deviceId: devicePage.device.id, error });
    const durationMs = Date.now() - startedAt;
    return createCrashedStep(devicePage.device.id, durationMs, error);
  }
};

const sweepDevice = async (deviceSweep: DeviceSweep): Promise<RouteStep[]> => {
  const { devicePage, rootFolder, runId, routes, sweepCommand } = deviceSweep;
  const routeSteps: RouteStep[] = [];
  for (const [routeIndex, route] of routes.entries()) {
    const startedAt = Date.now();
    const routeUrl = createRouteUrl(route, sweepCommand.url);
    const stepTarget = {
      rootFolder,
      runId,
      stepId: createStepId(routeIndex + 1),
      hubCommand: { ...sweepCommand, url: routeUrl },
    };
    const deviceStep = await runRouteOnDevice(devicePage, stepTarget, routeUrl);
    routeSteps.push({ startedAt, deviceStep });
  }
  return routeSteps;
};

const runBeforeSteps = async (
  sweepRunStart: SweepRunStart,
  devicePage: DevicePage,
): Promise<DeviceFailure | null> => {
  const { rootFolder, runId, sweepCommand } = sweepRunStart;
  const { beforeSteps } = sweepCommand;
  const isThereNoBeforeFlow = beforeSteps === null;
  if (isThereNoBeforeFlow) return null;

  for (const [stepIndex, hubCommand] of beforeSteps.entries()) {
    const stepTarget = {
      rootFolder,
      runId,
      stepId: `before-${stepIndex + 1}`,
      hubCommand,
    };
    const deviceStep = await runStepOrCrash(devicePage, stepTarget);
    const { deviceAnswer } = deviceStep;
    const isStepFailed = deviceAnswer.status === "failed";
    if (isStepFailed) return createBeforeFailure(deviceAnswer);
  }
  return null;
};

const prepareGridPage = async (
  sweepRunStart: SweepRunStart,
  devicePage: DevicePage,
): Promise<PreparedPage> => {
  const beforeFailure = await runBeforeSteps(sweepRunStart, devicePage);
  const hasBeforeFailed = beforeFailure !== null;
  if (hasBeforeFailed) return { kind: "before-failed", beforeFailure };
  return { kind: "ready", devicePage };
};

const visitReadyPage = async (
  deviceSweep: DeviceSweep,
): Promise<DeviceVisit> => {
  const routeSteps = await sweepDevice(deviceSweep);
  return { kind: "visited", routeSteps };
};

const createCrawlPages = (sweepRunStart: SweepRunStart): CrawlPages => {
  const { sweepCommand, configuredRoutes } = sweepRunStart;
  return {
    startUrl: sweepCommand.url,
    maxRoutes: sweepCommand.maxRoutes,
    configuredRoutes,
  };
};

const visitExtraDevice = (
  extraBrowsers: ExtraBrowsers,
  extraPreset: DevicePreset,
  sweepRoutes: SweepRoutes,
): Promise<DeviceVisit> =>
  withExtraDevicePage(extraBrowsers, extraPreset, async (devicePage) => {
    const { sweepRunStart, routes } = sweepRoutes;
    const beforeFailure = await runBeforeSteps(sweepRunStart, devicePage);
    const hasBeforeFailed = beforeFailure !== null;
    if (hasBeforeFailed) return { kind: "before-failed", beforeFailure };
    return visitReadyPage({ ...sweepRunStart, devicePage, routes });
  });

// With no ready grid page, the first extra device that gets past the before flow crawls and sweeps in one visit.
const visitCrawlingExtraDevice = (
  extraBrowsers: ExtraBrowsers,
  extraPreset: DevicePreset,
  sweepRunStart: SweepRunStart,
): Promise<CrawlingVisit> =>
  withExtraDevicePage(extraBrowsers, extraPreset, async (devicePage) => {
    const beforeFailure = await runBeforeSteps(sweepRunStart, devicePage);
    const hasBeforeFailed = beforeFailure !== null;
    if (hasBeforeFailed) {
      return {
        routes: null,
        deviceVisit: { kind: "before-failed", beforeFailure },
      };
    }
    const crawlPages = createCrawlPages(sweepRunStart);
    const routes = await listSweepRoutes(devicePage.page, crawlPages);
    const deviceVisit = await visitReadyPage({
      ...sweepRunStart,
      devicePage,
      routes,
    });
    return { routes, deviceVisit };
  });

const visitExtraDevices = async (
  extraBrowsers: ExtraBrowsers,
  extraPresets: DevicePreset[],
  sweepRoutes: SweepRoutes,
): Promise<DeviceVisit[]> => {
  const extraIds = extraPresets.map(({ id }) => id);
  const deviceVisits: DeviceVisit[] = [];
  for (const batchIds of listFlowBatches(extraIds, SWEEP_EXTRA_DEVICE_LIMIT)) {
    const batchPresets = extraPresets.filter(({ id }) => batchIds.includes(id));
    const batchVisits = await Promise.all(
      batchPresets.map((extraPreset) =>
        visitExtraDevice(extraBrowsers, extraPreset, sweepRoutes),
      ),
    );
    deviceVisits.push(...batchVisits);
  }
  return deviceVisits;
};

const visitExtraDevicesWithoutGrid = async (
  sweepRunStart: SweepRunStart,
  extraBrowsers: ExtraBrowsers,
  extraPresets: DevicePreset[],
): Promise<SweepVisits> => {
  const deviceVisits: DeviceVisit[] = [];
  for (const [presetIndex, extraPreset] of extraPresets.entries()) {
    const crawlingVisit = await visitCrawlingExtraDevice(
      extraBrowsers,
      extraPreset,
      sweepRunStart,
    );
    deviceVisits.push(crawlingVisit.deviceVisit);
    const { routes } = crawlingVisit;
    const isCrawlDone = routes !== null;
    if (isCrawlDone) {
      const restPresets = extraPresets.slice(presetIndex + 1);
      const sweepRoutes = { sweepRunStart, routes };
      const restVisits = await visitExtraDevices(
        extraBrowsers,
        restPresets,
        sweepRoutes,
      );
      return { routes, deviceVisits: [...deviceVisits, ...restVisits] };
    }
  }
  return { routes: [], deviceVisits };
};

const visitDevices = async (
  sweepRunStart: SweepRunStart,
  gridPages: DevicePage[],
  extraPresets: DevicePreset[],
): Promise<SweepVisits> => {
  const preparedPages = await Promise.all(
    gridPages.map((gridPage) => prepareGridPage(sweepRunStart, gridPage)),
  );
  const readyGridPages = preparedPages
    .filter((preparedPage) => preparedPage.kind === "ready")
    .map(({ devicePage }) => devicePage);
  const gridFailureVisits = preparedPages.filter(
    (preparedPage) => preparedPage.kind === "before-failed",
  );

  return withExtraBrowsers(extraPresets, async (extraBrowsers) => {
    const [crawlGridPage] = readyGridPages;
    const isGridPageReady = crawlGridPage !== undefined;
    if (!isGridPageReady) {
      const extraVisits = await visitExtraDevicesWithoutGrid(
        sweepRunStart,
        extraBrowsers,
        extraPresets,
      );
      const deviceVisits = [...gridFailureVisits, ...extraVisits.deviceVisits];
      return { routes: extraVisits.routes, deviceVisits };
    }

    const crawlPages = createCrawlPages(sweepRunStart);
    const routes = await listSweepRoutes(crawlGridPage.page, crawlPages);
    const sweepRoutes = { sweepRunStart, routes };
    const [gridVisits, extraVisits] = await Promise.all([
      Promise.all(
        readyGridPages.map((devicePage) =>
          visitReadyPage({ ...sweepRunStart, devicePage, routes }),
        ),
      ),
      visitExtraDevices(extraBrowsers, extraPresets, sweepRoutes),
    ]);
    const deviceVisits = [...gridFailureVisits, ...gridVisits, ...extraVisits];
    return { routes, deviceVisits };
  });
};

const saveSweepRun = async (
  { rootFolder, runId }: SweepRunStart,
  runSteps: RunStep[],
  sweepReply: CommandReply,
): Promise<void> => {
  for (const runStep of runSteps) {
    await saveRunEvent(rootFolder, runId, { kind: "step-end", step: runStep });
  }
  const isSweepOk = sweepReply.status === "ok";
  const runStatus = isSweepOk ? "ok" : "failed";
  await saveRunEvent(rootFolder, runId, { kind: "run-end", status: runStatus });
};

const broadcastSweepRun = (runId: string, sweepSteps: SweepStep[]): void => {
  const findings = sweepSteps.flatMap(({ runStep }) => runStep.findings);
  for (const finding of findings) broadcast({ kind: "finding", finding });
  broadcast({ kind: "run", runId });
};

export const runSweep = async (
  rootFolder: string,
  devicePages: DevicePage[],
  sweepCommand: SweepCommand,
): Promise<CommandReply> => {
  const devicesFile = await readDevicesFile(rootFolder);
  const runningIds = devicePages.map(({ device }) => device.id);
  const catalogIds = DEVICE_CATALOG.map(({ id }) => id);
  const { gridIds, extraIds } = pickSweepDevices(
    sweepCommand.deviceIds,
    runningIds,
    catalogIds,
  );
  const gridPages = devicePages.filter(({ device }) =>
    gridIds.includes(device.id),
  );
  const extraPresets = extraIds.map((extraId) =>
    findCatalogPreset(
      extraId,
      devicesFile.viewportModes[extraId] ?? "full-screen",
    ),
  );

  const { runId } = await createRun(rootFolder, "cli", "sweep");
  const configuredRoutes = devicesFile.routes;
  const sweepRunStart = { rootFolder, runId, sweepCommand, configuredRoutes };
  try {
    const startedAt = Date.now();
    const { routes, deviceVisits } = await visitDevices(
      sweepRunStart,
      gridPages,
      extraPresets,
    );
    const routeStepsByDevice = pickVisitedRouteSteps(deviceVisits);
    const beforeFailures = pickBeforeFailures(deviceVisits);
    const sweepSteps = createSweepSteps(routes, routeStepsByDevice);
    const sweepReply = summarizeSweep(sweepSteps, runId, beforeFailures);
    const beforeRunSteps = listBeforeRunSteps(
      beforeFailures,
      sweepSteps.length,
      startedAt,
    );
    const routeRunSteps = sweepSteps.map(({ runStep }) => runStep);
    const runSteps = [...routeRunSteps, ...beforeRunSteps];
    await saveSweepRun(sweepRunStart, runSteps, sweepReply);
    broadcastSweepRun(runId, sweepSteps);
    return sweepReply;
  } catch (error) {
    try {
      await saveRunEvent(rootFolder, runId, {
        kind: "run-end",
        status: "failed",
      });
    } catch (saveError) {
      console.error({ runId, saveError });
      throw new Error("Sweep failed and its run end was not saved", {
        cause: error,
      });
    }
    throw error;
  }
};
