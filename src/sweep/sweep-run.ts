import type { z } from "zod";
import {
  type DeviceStep,
  runStepOnDevice,
  type StepTarget,
} from "@/commands/command-steps";
import { type CommandReply, pickChosenPages } from "@/commands/commands-logic";
import type { sweepCommandSchema } from "@/commands/commands-schema";
import type { DevicePage } from "@/devices/device-browsers";
import { readDevicesFile } from "@/devices/devices-store";
import { broadcast } from "@/live/live-feed";
import { createStepId } from "@/runs/runs-logic";
import { createRun, saveRunEvent } from "@/runs/runs-store";
import {
  createCrashedStep,
  createLeftOriginStep,
  createRouteUrl,
  createSweepSteps,
  hasLeftOrigin,
  type RouteStep,
  type SweepStep,
  summarizeSweep,
} from "@/sweep/sweep-logic";
import { listSweepRoutes } from "@/sweep/sweep-routes";

type SweepCommand = z.infer<typeof sweepCommandSchema>;

interface DeviceSweep {
  devicePage: DevicePage;
  rootFolder: string;
  runId: string;
  routes: string[];
  sweepCommand: SweepCommand;
}

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

interface SweepRunFolder {
  rootFolder: string;
  runId: string;
}

const saveSweepRun = async (
  { rootFolder, runId }: SweepRunFolder,
  sweepSteps: SweepStep[],
  sweepReply: CommandReply,
): Promise<void> => {
  for (const { runStep } of sweepSteps) {
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
  const chosenPages = pickChosenPages(devicePages, sweepCommand.deviceIds);
  const devicesFile = await readDevicesFile(rootFolder);
  const [crawlPage] = chosenPages;
  const routes = await listSweepRoutes(crawlPage.page, {
    startUrl: sweepCommand.url,
    maxRoutes: sweepCommand.maxRoutes,
    configuredRoutes: devicesFile.routes,
  });

  const { runId } = await createRun(rootFolder, "cli", "sweep");
  try {
    const routeStepsByDevice = await Promise.all(
      chosenPages.map((devicePage) =>
        sweepDevice({ devicePage, rootFolder, runId, routes, sweepCommand }),
      ),
    );
    const sweepSteps = createSweepSteps(routes, routeStepsByDevice);
    const sweepReply = summarizeSweep(sweepSteps, runId);
    await saveSweepRun({ rootFolder, runId }, sweepSteps, sweepReply);
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
