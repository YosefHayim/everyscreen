import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import type { DeviceView } from "@/dashboard/devices/device-view-logic";
import { useDeviceViews } from "@/dashboard/devices/use-device-views";
import {
  type FailureProof,
  listFailureProofs,
} from "@/dashboard/runs/run-report-logic";
import { runQueries } from "@/dashboard/runs/runs-queries";
import type { ScreenStatus } from "@/dashboard/ui/screen-boundary";
import { pickScreenStatus } from "@/dashboard/ui/screen-status-logic";
import type { Run } from "@/runs/runs-logic";

interface RunReportView {
  run: Run | null;
  runStatus: ScreenStatus;
  failureProofs: FailureProof[];
  deviceViews: DeviceView[];
}

export const useRunReport = (): RunReportView => {
  const { runId } = useParams({ from: "/runs/$runId" });
  const runQuery = useQuery(runQueries.detail(runId));
  const deviceViews = useDeviceViews().data ?? [];
  const run = runQuery.data ?? null;
  const isRunLoaded = run !== null;
  const failureProofs = isRunLoaded ? listFailureProofs(run) : [];

  return {
    run,
    runStatus: pickScreenStatus(runQuery.status, false),
    failureProofs,
    deviceViews,
  };
};
