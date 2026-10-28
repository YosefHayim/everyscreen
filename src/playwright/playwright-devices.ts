import { devicesFileSchema } from "@/devices/device-schema";
import { pickGridDevices } from "@/devices/devices-logic";
import { parseDevicesYaml } from "@/devices/devices-store";
import { DEVICES_FILE_PATH } from "@/environment";
import {
  createDeviceProject,
  type DeviceProject,
  pickProjectDevices,
} from "@/playwright/playwright-logic";
import { readHubFile } from "@/playwright/read-hub-file";
import { readOptionalFile } from "@/playwright/read-optional-file";

const readGridDevices = () => {
  const devicesYaml = readOptionalFile(DEVICES_FILE_PATH);
  const isDevicesFileMissing = devicesYaml === null;
  const devicesFile = isDevicesFileMissing
    ? devicesFileSchema.parse({})
    : parseDevicesYaml(devicesYaml);
  return pickGridDevices(devicesFile);
};

export const listDevices = (
  deviceIds: string[] | null = null,
): DeviceProject[] => {
  const gridDevices = readGridDevices();
  const hubDevices = readHubFile()?.devices ?? null;
  const projectDevices = pickProjectDevices(gridDevices, deviceIds);
  return projectDevices.map((projectDevice) => {
    const hubDevice = hubDevices?.[projectDevice.id] ?? null;
    return createDeviceProject(projectDevice, hubDevice);
  });
};
