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
