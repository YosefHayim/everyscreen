import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const SITE_OUT_FOLDER = path.join(import.meta.dirname, "dist/site");
const SITE_DEV_PORT = 5180;

export default defineConfig({
  root: "src/site",
  resolve: { tsconfigPaths: true },
  plugins: [react(), tailwindcss()],
  build: {
    outDir: SITE_OUT_FOLDER,
    emptyOutDir: true,
  },
  server: { port: SITE_DEV_PORT },
});
