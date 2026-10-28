import { existsSync, readFileSync } from "node:fs";
import type {
  PlaywrightTestOptions,
  PlaywrightWorkerOptions,
  Project,
} from "@playwright/test";
import { parse } from "yaml";
import { devicesFileSchema } from "@/devices/device-schema";
import { pickGridDevices } from "@/devices/devices-logic";
import { DEVICES_FILE_PATH, HUB_FILE_PATH } from "@/environment";
import { hubFileSchema } from "@/hub/hub-file";
import {
  createDeviceProject,
  pickProjectDevices,
} from "@/playwright/playwright-logic";

// A config file is plain sync code, so the files are read with readFileSync.
const readOptionalFile = (filePath: string): string | null => {
  const isFileMissing = !existsSync(filePath);
  if (isFileMissing) return null;
  return readFileSync(filePath, "utf8");
};

const readGridDevices = () => {
  const devicesYaml = readOptionalFile(DEVICES_FILE_PATH);
  const isDevicesFileMissing = devicesYaml === null;
  const devicesDocument = isDevicesFileMissing ? {} : parse(devicesYaml);
  const devicesFile = devicesFileSchema.parse(devicesDocument ?? {});
  return pickGridDevices(devicesFile);
};

const readHubDevices = () => {
  const serializedHubFile = readOptionalFile(HUB_FILE_PATH);
  const isHubFileMissing = serializedHubFile === null;
  if (isHubFileMissing) return {};
  return hubFileSchema.parse(JSON.parse(serializedHubFile)).devices;
};

export const listDevices = (
  deviceIds: string[] | null = null,
): Project<PlaywrightTestOptions, PlaywrightWorkerOptions>[] => {
  const gridDevices = readGridDevices();
  const hubDevices = readHubDevices();
  const projectDevices = pickProjectDevices(gridDevices, deviceIds);
  return projectDevices.map((projectDevice) =>
    createDeviceProject(projectDevice, hubDevices[projectDevice.id] ?? null),
  );
};
