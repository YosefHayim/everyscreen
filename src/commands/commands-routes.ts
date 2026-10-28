import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { runStepOnDevice, type StepTarget } from "@/commands/command-steps";
import {
  type CommandReply,
  createCommandRunStep,
  createStepTitle,
  pickChosenPages,
  pickOpenApp,
  summarizeCommand,
} from "@/commands/commands-logic";
import { type HubCommand, hubCommandSchema } from "@/commands/commands-schema";
import type { DevicePage } from "@/devices/device-browsers";
import { rejectInvalidRequest } from "@/hub/problem-reply";
import { runOneAtATime } from "@/hub/run-one-at-a-time";
import { broadcast } from "@/live/live-feed";
import { pickRunningRun, pickStepId, type Run } from "@/runs/runs-logic";
import { createRun, listRuns, saveRunEvent } from "@/runs/runs-store";
import { runSweep } from "@/sweep/sweep-run";

const readRunningRun = async (rootFolder: string): Promise<Run> => {
  const runs = await listRuns(rootFolder);
  const runningRun = pickRunningRun(runs);
  return runningRun ?? (await createRun(rootFolder, "cli", "steps"));
};

const runCommand = async (
  rootFolder: string,
  devicePages: DevicePage[],
  hubCommand: HubCommand,
): Promise<CommandReply> => {
  const isSweepCommand = hubCommand.commandName === "sweep";
  if (isSweepCommand) return runSweep(rootFolder, devicePages, hubCommand);

  const chosenPages = pickChosenPages(devicePages, hubCommand.deviceIds);

  const run = await readRunningRun(rootFolder);
  const stepTarget: StepTarget = {
    rootFolder,
    runId: run.runId,
    stepId: pickStepId(run.steps),
    hubCommand,
  };
  const startedAt = Date.now();
  const deviceSteps = await Promise.all(
    chosenPages.map((devicePage) => runStepOnDevice(devicePage, stepTarget)),
  );

  const runStep = createCommandRunStep({
    stepId: stepTarget.stepId,
    title: createStepTitle(hubCommand),
    startedAt,
    deviceSteps,
  });
  const { deviceAnswers, findings } = runStep;
  await saveRunEvent(rootFolder, run.runId, {
    kind: "step-end",
    step: runStep,
  });

  for (const finding of findings) broadcast({ kind: "finding", finding });
  broadcast({ kind: "run", runId: run.runId });
  return summarizeCommand(deviceAnswers, run.runId);
};

export const createCommandsRoutes = (
  rootFolder: string,
  devicePages: DevicePage[],
) =>
  new Hono()
    .get("/app", (c) => {
      const pageUrls = devicePages.map(({ page }) => page.url());
      return c.json(pickOpenApp(pageUrls));
    })
    .post(
      "/",
      zValidator("json", hubCommandSchema, rejectInvalidRequest),
      async (c) => {
        const hubCommand = c.req.valid("json");
        const commandReply = await runOneAtATime(`commands:${rootFolder}`, () =>
          runCommand(rootFolder, devicePages, hubCommand),
        );
        return c.json(commandReply);
      },
    );
