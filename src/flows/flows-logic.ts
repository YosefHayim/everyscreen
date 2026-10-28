import {
  type CommandReply,
  createReplyLine,
  type DeviceFailure,
} from "@/commands/commands-logic";
import type { HubCommand } from "@/commands/commands-schema";
import type { Flow } from "@/flows/flow-schema";

export const listFlowCommands = (flow: Flow): HubCommand[] =>
  flow.steps.map((step) => ({ ...step, deviceIds: flow.devices }));

export const listFlowBatches = (
  flowPaths: string[],
  flowsPerBatch: number,
): string[][] => {
  const batchCount = Math.ceil(flowPaths.length / flowsPerBatch);
  const batchIndexes = [...Array(batchCount).keys()];
  return batchIndexes.map((batchIndex) =>
    flowPaths.slice(
      batchIndex * flowsPerBatch,
      (batchIndex + 1) * flowsPerBatch,
    ),
  );
};

export interface FlowAnswer {
  flowPath: string;
  status: "ok" | "failed";
  runId: string | null;
  failures: DeviceFailure[];
}

// A failed step with no device failure (for example a device that is not running) still shows its line.
const createFlowFailures = (
  flowPath: string,
  failedReply: CommandReply,
): DeviceFailure[] => {
  const hasDeviceFailure = failedReply.failures.length > 0;
  if (hasDeviceFailure) return failedReply.failures;
  return [
    {
      status: "failed",
      deviceId: flowPath,
      durationMs: 0,
      message: failedReply.line,
      shotPath: null,
    },
  ];
};

export const createFlowAnswer = (
  flowPath: string,
  stepReplies: CommandReply[],
): FlowAnswer => {
  const runId = stepReplies.at(-1)?.runId ?? null;
  const failedReply = stepReplies.find(({ status }) => status === "failed");
  const isEveryStepOk = failedReply === undefined;
  if (isEveryStepOk) return { flowPath, status: "ok", runId, failures: [] };
  const failures = createFlowFailures(flowPath, failedReply);
  return { flowPath, status: "failed", runId, failures };
};

export const summarizeFlows = (flowAnswers: FlowAnswer[]): CommandReply => {
  const failedCount = flowAnswers.filter(
    ({ status }) => status === "failed",
  ).length;
  const okCount = flowAnswers.length - failedCount;
  const runId = flowAnswers.at(-1)?.runId ?? null;
  const isEveryFlowOk = failedCount === 0 && okCount > 0;
  const status = isEveryFlowOk ? "ok" : "failed";
  const line = createReplyLine({ unit: "flow", okCount, failedCount, runId });
  const failures = flowAnswers.flatMap((flowAnswer) => flowAnswer.failures);
  return { status, line, runId, failures };
};
