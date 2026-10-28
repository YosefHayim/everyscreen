import { Hono } from "hono";
import { createCommandsRoutes } from "@/commands/commands-routes";
import type { DevicePage } from "@/devices/device-browsers";
import { createDevicesRoutes } from "@/devices/devices-routes";
import { writeProblem } from "@/hub/problem-reply";
import { createRunsRoutes } from "@/runs/runs-routes";

export const createHubApp = (
  rootFolder: string,
  devicePages: DevicePage[] = [],
) =>
  new Hono()
    .basePath("/api")
    .route("/devices", createDevicesRoutes(rootFolder))
    .route("/commands", createCommandsRoutes(rootFolder, devicePages))
    .route("/runs", createRunsRoutes(rootFolder))
    .onError(writeProblem);

export type HubApp = ReturnType<typeof createHubApp>;
