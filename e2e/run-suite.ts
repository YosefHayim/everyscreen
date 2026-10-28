import { execFile } from "node:child_process";
import { join } from "node:path";

const PLAYWRIGHT_CLI_PATH = join(
  process.cwd(),
  "node_modules/@playwright/test/cli.js",
);
const MAX_SUITE_OUTPUT_BYTES = 10_000_000;

export interface SuiteRun {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export const runSuite = (
  configPath: string,
  workingFolder: string,
): Promise<SuiteRun> =>
  new Promise((onSuiteDone) => {
    execFile(
      process.execPath,
      [PLAYWRIGHT_CLI_PATH, "test", "--config", configPath],
      { cwd: workingFolder, maxBuffer: MAX_SUITE_OUTPUT_BYTES },
      (error, stdout, stderr) => {
        const exitCode = typeof error?.code === "number" ? error.code : 0;
        onSuiteDone({ exitCode, stdout, stderr });
      },
    );
  });
