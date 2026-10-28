import { glob, readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";
import { sendHubCommand } from "@/cli/hub-client";
import type { CommandReply } from "@/commands/commands-logic";
import { type Flow, flowSchema } from "@/flows/flow-schema";
import {
  createFailedFlowAnswer,
  createFlowAnswer,
  type FlowAnswer,
  listFlowBatches,
  listFlowCommands,
} from "@/flows/flows-logic";

export const listFlowPaths = async (
  rootFolder: string,
  flowsGlob: string,
): Promise<string[]> => {
  const flowPaths: string[] = [];
  for await (const flowPath of glob(flowsGlob, { cwd: rootFolder })) {
    flowPaths.push(flowPath);
  }
  return flowPaths.toSorted();
};

export const readFlow = async (
  rootFolder: string,
  flowPath: string,
): Promise<Flow> => {
  const flowYaml = await readFile(join(rootFolder, flowPath), "utf8");
  const flowDocument: unknown = parse(flowYaml);
  const flowCheck = flowSchema.safeParse(flowDocument);
  const isFlowValid = flowCheck.success;
  if (isFlowValid) return flowCheck.data;
  const [firstIssue] = flowCheck.error.issues;
  const badField = firstIssue.path.join(".");
  const isFieldNamed = badField !== "";
  const badPlace = isFieldNamed ? badField : "file";
  throw new Error(
    `${flowPath} is not a valid flow: ${badPlace}: ${firstIssue.message}`,
    { cause: flowCheck.error },
  );
};

const runFlow = async (
  rootFolder: string,
  flowPath: string,
): Promise<FlowAnswer> => {
  const flow = await readFlow(rootFolder, flowPath);
  const stepReplies: CommandReply[] = [];
  for (const hubCommand of listFlowCommands(flow)) {
    const stepReply = await sendHubCommand(rootFolder, hubCommand);
    stepReplies.push(stepReply);
    const isStepFailed = stepReply.status === "failed";
    if (isStepFailed) break;
  }
  return createFlowAnswer(flowPath, stepReplies);
};

// One unreadable flow must not reject its batch while the other flows still run.
const runFlowOrFail = async (
  rootFolder: string,
  flowPath: string,
): Promise<FlowAnswer> => {
  try {
    return await runFlow(rootFolder, flowPath);
  } catch (error) {
    const isErrorKnown = error instanceof Error;
    const problemLine = isErrorKnown ? error.message : "the flow did not run";
    return createFailedFlowAnswer(flowPath, problemLine);
  }
};

export const runFlows = async (
  rootFolder: string,
  flowPaths: string[],
  parallel: number,
): Promise<FlowAnswer[]> => {
  const flowAnswers: FlowAnswer[] = [];
  for (const flowBatch of listFlowBatches(flowPaths, parallel)) {
    const batchAnswers = await Promise.all(
      flowBatch.map((flowPath) => runFlowOrFail(rootFolder, flowPath)),
    );
    flowAnswers.push(...batchAnswers);
  }
  return flowAnswers;
};
