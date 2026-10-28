import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, onTestFinished, test } from "vitest";
import { runOneAtATime } from "@/hub/run-one-at-a-time";
import { readStoredFile, writeStoredFile } from "@/hub/stored-files";

const createTestFolder = async (): Promise<string> => {
  const testFolder = await mkdtemp(join(tmpdir(), "run-one-at-a-time-"));
  onTestFinished(async () => {
    await rm(testFolder, { recursive: true, force: true });
  });
  return testFolder;
};

describe("runOneAtATime", () => {
  test("keeps every write when three updates of one file run at once", async () => {
    const testFolder = await createTestFolder();
    const filePath = join(testFolder, "counter.txt");
    const addOne = () =>
      runOneAtATime(filePath, async () => {
        const savedCount = (await readStoredFile(filePath)) ?? "0";
        const nextCount = Number(savedCount) + 1;
        const serializedCount = String(nextCount);
        await writeStoredFile(filePath, serializedCount);
      });

    await Promise.all([addOne(), addOne(), addOne()]);

    const countAfterUpdates = await readStoredFile(filePath);
    expect(countAfterUpdates).toBe("3");
  });

  test("runs the next task after an earlier task fails", async () => {
    const failingTask = runOneAtATime("devices", async () => {
      throw new Error("bad devices file");
    });

    const nextTask = runOneAtATime("devices", async () => "saved");

    await expect(failingTask).rejects.toThrow("bad devices file");
    await expect(nextTask).resolves.toBe("saved");
  });
});
