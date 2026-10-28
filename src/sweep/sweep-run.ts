import { runStepOnDevice } from "@/commands/command-steps";
import { type CommandReply, pickChosenPages } from "@/commands/commands-logic";
import type { HubCommand } from "@/commands/commands-schema";
import type { DevicePage } from "@/devices/device-browsers";
import { readDevicesFile } from "@/devices/devices-store";
import { broadcast } from "@/live/live-feed";
import { createStepId } from "@/runs/runs-logic";
import { createRun, saveRunEvent } from "@/runs/runs-store";
import {
  createRouteUrl,
  createSweepSteps,
  type RouteStep,
  type SweepStep,
  summarizeSweep,
} from "@/sweep/sweep-logic";
import { listSweepRoutes } from "@/sweep/sweep-routes";

type SweepCommand = Extract<HubCommand, { commandName: "sweep" }>;

interface DeviceSweep {
  devicePage: DevicePage;
  rootFolder: string;
  runId: string;
  routes: string[];
  sweepCommand: SweepCommand;
}

const sweepDevice = async (deviceSweep: DeviceSweep): Promise<RouteStep[]> => {
  const { devicePage, rootFolder, runId, routes, sweepCommand } = deviceSweep;
  const routeSteps: RouteStep[] = [];
  for (const [routeIndex, route] of routes.entries()) {
    const startedAt = Date.now();
    const routeUrl = createRouteUrl(route, sweepCommand.url);
    const deviceStep = await runStepOnDevice(devicePage, {
      rootFolder,
      runId,
      stepId: createStepId(routeIndex + 1),
      hubCommand: { ...sweepCommand, url: routeUrl },
    });
    routeSteps.push({ startedAt, deviceStep });
  }
  return routeSteps;
};

const saveSweepRun = async (
  rootFolder: string,
  runId: string,
  sweepSteps: SweepStep[],
  sweepReply: CommandReply,
): Promise<void> => {
  for (const { runStep } of sweepSteps) {
    await saveRunEvent(rootFolder, runId, { kind: "step-end", step: runStep });
  }
  const isSweepOk = sweepReply.status === "ok";
  const runStatus = isSweepOk ? "passed" : "failed";
  await saveRunEvent(rootFolder, runId, { kind: "run-end", status: runStatus });

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

  const { runId } = await createRun(rootFolder, "cli");
  try {
    const routeStepsByDevice = await Promise.all(
      chosenPages.map((devicePage) =>
        sweepDevice({ devicePage, rootFolder, runId, routes, sweepCommand }),
      ),
    );
    const sweepSteps = createSweepSteps(routes, routeStepsByDevice);
    const sweepReply = summarizeSweep(sweepSteps, runId);
    await saveSweepRun(rootFolder, runId, sweepSteps, sweepReply);
    return sweepReply;
  } catch (error) {
    await saveRunEvent(rootFolder, runId, {
      kind: "run-end",
      status: "failed",
    });
    throw error;
  }
};
