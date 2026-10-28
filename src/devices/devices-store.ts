import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parse, stringify } from "yaml";
import { type DevicesFile, devicesFileSchema } from "@/devices/device-schema";
import { DEVICES_FILE_PATH } from "@/environment";

export const readDevicesFile = async (
  rootFolder: string,
): Promise<DevicesFile> => {
  const devicesFilePath = join(rootFolder, DEVICES_FILE_PATH);
  const isDevicesFileMissing = !existsSync(devicesFilePath);
  if (isDevicesFileMissing) return devicesFileSchema.parse({});

  const devicesYaml = await readFile(devicesFilePath, "utf8");
  const parsedYaml: unknown = parse(devicesYaml);
  return devicesFileSchema.parse(parsedYaml ?? {});
};

export const writeDevicesFile = async (
  rootFolder: string,
  devicesFile: DevicesFile,
): Promise<void> => {
  const devicesFilePath = join(rootFolder, DEVICES_FILE_PATH);
  await writeFile(devicesFilePath, stringify(devicesFile));
};
