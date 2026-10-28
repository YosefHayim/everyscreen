import { createFileRoute } from "@tanstack/react-router";
import { FocusScreen } from "@/dashboard/focus/focus-screen";

export const Route = createFileRoute("/focus/$deviceId")({
  component: FocusScreen,
});
