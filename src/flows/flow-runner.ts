import { glob, readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";
import { sendHubCommand } from "@/cli/hub-client";
import type { CommandReply } from "@/commands/commands-logic";
import { type Flow, flowSchema } from "@/flows/flow-schema";
import {
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

const readFlow = async (
  rootFolder: string,
  flowPath: string,
): Promise<Flow> => {
  const flowYaml = await readFile(join(rootFolder, flowPath), "utf8");
  const flowDocument: unknown = parse(flowYaml);
  const flowCheck = flowSchema.safeParse(flowDocument);
  if (flowCheck.success) return flowCheck.data;
  const [firstIssue] = flowCheck.error.issues;
  const badField = firstIssue.path.join(".");
  throw new Error(
    `${flowPath} is not a valid flow: ${badField || "file"}: ${firstIssue.message}`,
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

export const runFlows = async (
  rootFolder: string,
  flowPaths: string[],
  parallel: number,
): Promise<FlowAnswer[]> => {
  const flowAnswers: FlowAnswer[] = [];
  for (const flowBatch of listFlowBatches(flowPaths, parallel)) {
    const batchAnswers = await Promise.all(
      flowBatch.map((flowPath) => runFlow(rootFolder, flowPath)),
    );
    flowAnswers.push(...batchAnswers);
  }
  return flowAnswers;
};
