import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { HUB_URL } from "./src/environment";

const DASHBOARD_OUT_FOLDER = path.join(import.meta.dirname, "dist/dashboard");

export default defineConfig({
  root: "src/dashboard",
  resolve: { tsconfigPaths: true },
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      routesDirectory: "./routes",
      generatedRouteTree: "./route-tree.gen.ts",
    }),
    react(),
    tailwindcss(),
  ],
  build: {
    outDir: DASHBOARD_OUT_FOLDER,
    emptyOutDir: true,
  },
  server: {
    proxy: {
      "/api": { target: HUB_URL, ws: true },
    },
  },
});
