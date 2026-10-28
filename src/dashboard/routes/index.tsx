import { createFileRoute } from "@tanstack/react-router";
import { GridScreen } from "@/dashboard/grid/grid-screen";

export const Route = createFileRoute("/")({ component: GridScreen });
