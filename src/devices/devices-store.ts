import { join } from "node:path";
import { HTTPException } from "hono/http-exception";
import { parse, stringify } from "yaml";
import { type DevicesFile, devicesFileSchema } from "@/devices/device-schema";
import { checkDeviceIds } from "@/devices/devices-logic";
import { DEVICES_FILE_PATH } from "@/environment";
import { runOneAtATime } from "@/hub/run-one-at-a-time";
import { readStoredFile, writeStoredFile } from "@/hub/stored-files";

const BAD_DEVICES_FILE_STATUS = 422;

const rejectDevicesFile = (reason: string, cause: unknown): never => {
  throw new HTTPException(BAD_DEVICES_FILE_STATUS, {
    message: `${DEVICES_FILE_PATH} is not valid: ${reason}`,
    cause,
  });
};

const parseYaml = (devicesYaml: string): unknown => {
  try {
    return parse(devicesYaml);
  } catch (error) {
    const yamlMessage = error instanceof Error ? error.message : "bad YAML";
    const [firstLine] = yamlMessage.split("\n");
    return rejectDevicesFile(firstLine, error);
  }
};

export const parseDevicesYaml = (devicesYaml: string): DevicesFile => {
  const parsedYaml = parseYaml(devicesYaml);
  const parsedFile = devicesFileSchema.safeParse(parsedYaml ?? {});
  if (parsedFile.success) return checkDeviceIds(parsedFile.data);

  const [firstIssue] = parsedFile.error.issues;
  const badField = firstIssue.path.join(".");
  return rejectDevicesFile(
    `${badField || "file"}: ${firstIssue.message}`,
    parsedFile.error,
  );
};

const readDevicesYaml = async (
  devicesFilePath: string,
): Promise<DevicesFile> => {
  const devicesYaml = await readStoredFile(devicesFilePath);
  const isDevicesFileMissing = devicesYaml === null;
  if (isDevicesFileMissing) return devicesFileSchema.parse({});
  return parseDevicesYaml(devicesYaml);
};

export const readDevicesFile = async (
  rootFolder: string,
): Promise<DevicesFile> => {
  const devicesFilePath = join(rootFolder, DEVICES_FILE_PATH);
  return readDevicesYaml(devicesFilePath);
};

export const updateDevicesFile = async (
  rootFolder: string,
  changeDevicesFile: (devicesFile: DevicesFile) => DevicesFile,
): Promise<DevicesFile> => {
  const devicesFilePath = join(rootFolder, DEVICES_FILE_PATH);
  return runOneAtATime(devicesFilePath, async () => {
    const devicesFile = await readDevicesYaml(devicesFilePath);
    const changedFile = changeDevicesFile(devicesFile);
    await writeStoredFile(devicesFilePath, stringify(changedFile));
    return changedFile;
  });
};
