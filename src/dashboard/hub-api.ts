import { hc } from "hono/client";
import type { HubApp } from "@/hub/hub-app";

export const hubApi = hc<HubApp>(window.location.origin);
