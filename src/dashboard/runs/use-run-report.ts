import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import type { DeviceView } from "@/dashboard/devices/device-view-logic";
import { useDeviceViews } from "@/dashboard/devices/use-device-views";
import { runQueries } from "@/dashboard/runs/runs-queries";
import type { Run } from "@/runs/runs-logic";

interface RunReportView {
  runQuery: UseQueryResult<Run>;
  deviceViews: DeviceView[];
}

export const useRunReport = (): RunReportView => {
  const { runId } = useParams({ from: "/runs/$runId" });
  const runQuery = useQuery(runQueries.detail(runId));
  const deviceViews = useDeviceViews().data ?? [];

  return { runQuery, deviceViews };
};
