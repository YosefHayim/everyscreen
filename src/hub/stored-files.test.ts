import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, onTestFinished, test } from "vitest";
import { readStoredFile, writeStoredFile } from "@/hub/stored-files";

const createTestFolder = async (): Promise<string> => {
  const testFolder = await mkdtemp(join(tmpdir(), "stored-files-"));
  onTestFinished(async () => {
    await rm(testFolder, { recursive: true, force: true });
  });
  return testFolder;
};

describe("readStoredFile", () => {
  test("returns null when the file does not exist", async () => {
    const testFolder = await createTestFolder();
    const filePath = join(testFolder, "missing.json");

    const serializedFile = await readStoredFile(filePath);

    expect(serializedFile).toBeNull();
  });

  test("throws when the path is a folder", async () => {
    const folderPath = await createTestFolder();

    const reading = readStoredFile(folderPath);

    await expect(reading).rejects.toThrow();
  });
});

describe("writeStoredFile", () => {
  test("creates the folder and leaves no draft behind", async () => {
    const testFolder = await createTestFolder();
    const filePath = join(testFolder, "runs", "run-0001.json");

    await writeStoredFile(filePath, '{"runId":"run-0001"}');

    const serializedFile = await readStoredFile(filePath);
    const fileNames = await readdir(join(testFolder, "runs"));
    expect(serializedFile).toBe('{"runId":"run-0001"}');
    expect(fileNames).toEqual(["run-0001.json"]);
  });
});
