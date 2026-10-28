import { createRootRoute } from "@tanstack/react-router";
import { AppShell } from "@/dashboard/shell/app-shell";

export const Route = createRootRoute({ component: AppShell });
