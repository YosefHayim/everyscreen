import type { HubCommand } from "@/commands/commands-schema";
import type { Flow } from "@/flows/flow-schema";

type FlowStep = Flow["steps"][number];

const createCommandFromStep = (
  step: FlowStep,
  deviceIds: string[] | null,
): HubCommand => {
  const isOpenStep = "open" in step;
  const isTapStep = "tap" in step;
  const isFillStep = "fill" in step;
  const isScrollStep = "scroll" in step;
  const isExpectStep = "expect" in step;
  const isCheckStep = "check" in step;
  const isShotStep = "shot" in step;

  if (isOpenStep) return { commandName: "open", url: step.open, deviceIds };
  if (isTapStep) return { commandName: "tap", ...step.tap, deviceIds };
  if (isFillStep) return { commandName: "fill", ...step.fill, deviceIds };
  if (isScrollStep) return { commandName: "scroll", ...step.scroll, deviceIds };
  if (isExpectStep) return { commandName: "expect", ...step.expect, deviceIds };
  if (isCheckStep) return { commandName: "check", deviceIds };
  // The else branch never runs; the never below makes a new step kind fail to compile.
  /* v8 ignore next */
  if (isShotStep) return { commandName: "shot", deviceIds };

  const unknownStep: never = step;
  throw new Error("A flow step has no matching command", {
    cause: unknownStep,
  });
};

export const listFlowCommands = (flow: Flow): HubCommand[] =>
  flow.steps.map((step) => createCommandFromStep(step, flow.devices));

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
