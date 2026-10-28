import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { runStepOnDevice, type StepTarget } from "@/commands/command-steps";
import {
  type CommandReply,
  createStepTitle,
  pickDeviceIds,
  pickStepProof,
  summarizeCommand,
} from "@/commands/commands-logic";
import { type HubCommand, hubCommandSchema } from "@/commands/commands-schema";
import type { DevicePage } from "@/devices/device-browsers";
import { rejectInvalidRequest } from "@/hub/problem-reply";
import { runOneAtATime } from "@/hub/run-one-at-a-time";
import { broadcast } from "@/live/live-feed";
import {
  pickRunningRun,
  pickStepId,
  type Run,
  type RunStep,
} from "@/runs/runs-logic";
import { createRun, listRuns, saveRunEvent } from "@/runs/runs-store";

const readRunningRun = async (rootFolder: string): Promise<Run> => {
  const runs = await listRuns(rootFolder);
  const runningRun = pickRunningRun(runs);
  return runningRun ?? (await createRun(rootFolder, "cli"));
};

const runCommand = async (
  rootFolder: string,
  devicePages: DevicePage[],
  hubCommand: HubCommand,
): Promise<CommandReply> => {
  const runningDeviceIds = devicePages.map(({ device }) => device.id);
  const chosenIds = pickDeviceIds(runningDeviceIds, hubCommand.deviceIds);
  const chosenPages = devicePages.filter(({ device }) =>
    chosenIds.includes(device.id),
  );

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

  const deviceAnswers = deviceSteps.map(({ deviceAnswer }) => deviceAnswer);
  const findings = deviceSteps.flatMap((deviceStep) => deviceStep.findings);
  const runStep: RunStep = {
    stepId: stepTarget.stepId,
    title: createStepTitle(hubCommand),
    startedAt,
    deviceAnswers,
    findings,
    proof: pickStepProof(deviceAnswers),
  };
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
  new Hono().post(
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
