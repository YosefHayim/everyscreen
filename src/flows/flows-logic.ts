import type { CommandReply } from "@/commands/commands-logic";
import type { HubCommand } from "@/commands/commands-schema";
import type { Flow } from "@/flows/flow-schema";

export type FlowStatus = "pass" | "fail";

type FlowStep = Flow["steps"][number];

const createCommandFromStep = (
  step: FlowStep,
  deviceIds: string[] | null,
): HubCommand => {
  if ("open" in step) return { commandName: "open", url: step.open, deviceIds };
  if ("tap" in step) return { commandName: "tap", ...step.tap, deviceIds };
  if ("fill" in step) return { commandName: "fill", ...step.fill, deviceIds };
  if ("scroll" in step)
    return { commandName: "scroll", ...step.scroll, deviceIds };
  if ("expect" in step)
    return { commandName: "expect", ...step.expect, deviceIds };
  if ("check" in step) return { commandName: "check", deviceIds };
  return { commandName: "shot", deviceIds };
};

export const listFlowCommands = (flow: Flow): HubCommand[] =>
  flow.steps.map((step) => createCommandFromStep(step, flow.devices));

export const listFlowBatches = (
  flowPaths: string[],
  parallel: number,
): string[][] => {
  const batchCount = Math.ceil(flowPaths.length / parallel);
  return Array.from({ length: batchCount }, (_, batchIndex) =>
    flowPaths.slice(batchIndex * parallel, (batchIndex + 1) * parallel),
  );
};

export const summarizeFlows = (flowStatuses: FlowStatus[]): CommandReply => {
  const failedCount = flowStatuses.filter(
    (flowStatus) => flowStatus === "fail",
  ).length;
  const isEveryFlowPassing = failedCount === 0;
  const status = isEveryFlowPassing ? "ok" : "failed";
  const line = `${flowStatuses.length} flows, ${failedCount} failed`;
  return { status, line, runId: null, failures: [] };
};
