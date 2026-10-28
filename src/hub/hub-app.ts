import { Hono } from "hono";
import { createCommandsRoutes } from "@/commands/commands-routes";
import type { DevicePage } from "@/devices/device-browsers";
import { createDevicesRoutes } from "@/devices/devices-routes";
import { writeProblem } from "@/hub/problem-reply";
import { createLiveTestRoutes } from "@/live/live-test-routes";
import { createZoomRoutes } from "@/live/zoom-routes";
import { createRunsRoutes } from "@/runs/runs-routes";
import { createShotsRoutes } from "@/runs/shots-routes";

export const createHubApp = (
  rootFolder: string,
  devicePages: DevicePage[] = [],
) =>
  new Hono()
    .basePath("/api")
    .route("/devices", createDevicesRoutes(rootFolder))
    .route("/commands", createCommandsRoutes(rootFolder, devicePages))
    .route("/live-tests", createLiveTestRoutes())
    .route("/zoom", createZoomRoutes())
    .route("/runs", createRunsRoutes(rootFolder))
    .route("/shots", createShotsRoutes(rootFolder))
    .onError(writeProblem);

export type HubApp = ReturnType<typeof createHubApp>;
