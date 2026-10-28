import { createFileRoute } from "@tanstack/react-router";
import { DevicesScreen } from "@/dashboard/devices/devices-screen";

export const Route = createFileRoute("/devices")({ component: DevicesScreen });
