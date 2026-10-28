import { existsSync, readFileSync } from "node:fs";
import type {
  PlaywrightTestOptions,
  PlaywrightWorkerOptions,
  Project,
} from "@playwright/test";
import { devicesFileSchema } from "@/devices/device-schema";
import { pickGridDevices } from "@/devices/devices-logic";
import { parseDevicesYaml } from "@/devices/devices-store";
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
  if (isDevicesFileMissing) return pickGridDevices(devicesFileSchema.parse({}));

  return pickGridDevices(parseDevicesYaml(devicesYaml));
};

const readHubDevices = () => {
  const serializedHubFile = readOptionalFile(HUB_FILE_PATH);
  const isHubFileMissing = serializedHubFile === null;
  if (isHubFileMissing) return null;

  const hubFileDocument: unknown = JSON.parse(serializedHubFile);
  return hubFileSchema.parse(hubFileDocument).devices;
};

export const listDevices = (
  deviceIds: string[] | null = null,
): Project<PlaywrightTestOptions, PlaywrightWorkerOptions>[] => {
  const gridDevices = readGridDevices();
  const hubDevices = readHubDevices();
  const projectDevices = pickProjectDevices(gridDevices, deviceIds);
  return projectDevices.map((projectDevice) => {
    const hubDevice = hubDevices?.[projectDevice.id] ?? null;
    return createDeviceProject(projectDevice, hubDevice);
  });
};
