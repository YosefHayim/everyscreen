import { defineConfig } from "tsdown";

// The "@/" alias comes from tsconfig paths, which tsdown reads.
export default defineConfig({
  entry: {
    cli: "src/cli/cli.ts",
    playwright: "src/playwright/playwright-devices.ts",
    reporter: "src/playwright/playwright-reporter.ts",
  },
  format: "esm",
  platform: "node",
  target: "node22",
  dts: true,
  clean: true,
});
