import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { CommandReply } from "@/commands/commands-logic";
import { hubApi } from "@/dashboard/hub-api";
import { useAppUrl } from "@/dashboard/use-app-url";

export interface RunSweep {
  appUrl: string | null;
  isRunning: boolean;
  hasFailedToStart: boolean;
  startSweep: () => void;
}

const sendSweepCommand = async (appUrl: string): Promise<CommandReply> => {
  const hubAnswer = await hubApi.api.commands.$post({
    json: { commandName: "sweep", url: appUrl, deviceIds: null },
  });
  const hasHubRefused = !hubAnswer.ok;
  if (hasHubRefused) {
    throw new Error(`The hub refused the sweep command: ${hubAnswer.status}`);
  }
  const sweepReply = await hubAnswer.json();
  const isRunMissing = sweepReply.runId === null;
  if (isRunMissing) throw new Error(sweepReply.line);
  return sweepReply;
};

export const useRunSweep = (): RunSweep => {
  const appUrl = useAppUrl();
  const navigate = useNavigate();
  const sweepMutation = useMutation({
    mutationFn: sendSweepCommand,
    onSuccess: async ({ runId }) => {
      const isRunKnown = runId !== null;
      if (isRunKnown) await navigate({ to: "/runs/$runId", params: { runId } });
    },
  });

  const startSweep = (): void => {
    const hasNoAppUrl = appUrl === null;
    if (hasNoAppUrl) return;
    sweepMutation.mutate(appUrl);
  };

  return {
    appUrl,
    isRunning: sweepMutation.isPending,
    hasFailedToStart: sweepMutation.isError,
    startSweep,
  };
};
