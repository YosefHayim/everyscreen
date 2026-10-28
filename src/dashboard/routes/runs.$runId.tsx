import { createFileRoute } from "@tanstack/react-router";
import { RunReportScreen } from "@/dashboard/runs/run-report-screen";

export const Route = createFileRoute("/runs/$runId")({
  component: RunReportScreen,
});
