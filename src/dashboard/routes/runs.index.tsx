import { createFileRoute } from "@tanstack/react-router";
import { RunsScreen } from "@/dashboard/runs/runs-screen";

export const Route = createFileRoute("/runs/")({ component: RunsScreen });
