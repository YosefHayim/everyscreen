import { runOneAtATime } from "@/hub/run-one-at-a-time";
import { isRunOpen, type Run } from "@/runs/runs-logic";
import { closeRun, createRun, readRun } from "@/runs/runs-store";

// The run this hub process writes its interactive commands to. Null until the first command.
const hubInteractiveRun: { runId: string | null } = { runId: null };

// Commands and the run close share this queue, so a close waits for the commands in flight.
export const createCommandQueueKey = (rootFolder: string): string =>
  `commands:${rootFolder}`;

const readHubInteractiveRun = async (
  rootFolder: string,
): Promise<Run | null> => {
  const heldRunId = hubInteractiveRun.runId;
  const isThereNoHeldRun = heldRunId === null;
  if (isThereNoHeldRun) return null;

  return readRun(rootFolder, heldRunId);
};

// Called inside the commands queue, so two commands never open two runs.
export const readInteractiveRun = async (rootFolder: string): Promise<Run> => {
  const heldRun = await readHubInteractiveRun(rootFolder);
  const isHeldRunOpen = isRunOpen(heldRun);
  if (isHeldRunOpen) return heldRun;

  const openedRun = await createRun(rootFolder, "cli", "steps");
  hubInteractiveRun.runId = openedRun.runId;
  return openedRun;
};

export const closeInteractiveRun = async (
  rootFolder: string,
): Promise<void> => {
  const commandQueueKey = createCommandQueueKey(rootFolder);
  await runOneAtATime(commandQueueKey, async () => {
    const heldRun = await readHubInteractiveRun(rootFolder);
    hubInteractiveRun.runId = null;

    const isHeldRunClosed = !isRunOpen(heldRun);
    if (isHeldRunClosed) return;

    await closeRun(rootFolder, heldRun.runId);
  });
};
