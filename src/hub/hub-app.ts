import { Hono } from "hono";
import { createDevicesRoutes } from "@/devices/devices-routes";
import { writeProblem } from "@/hub/problem-reply";
import { createRunsRoutes } from "@/runs/runs-routes";

export const createHubApp = (rootFolder: string) =>
  new Hono()
    .basePath("/api")
    .route("/devices", createDevicesRoutes(rootFolder))
    .route("/runs", createRunsRoutes(rootFolder))
    .onError(writeProblem);

export type HubApp = ReturnType<typeof createHubApp>;
