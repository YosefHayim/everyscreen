import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { DEVICE_CATALOG } from "@/devices/device-catalog";
import { customDeviceSchema } from "@/devices/device-schema";
import {
  checkDeviceRemoval,
  checkNewDevice,
  createPresetFromCustomDevice,
  listCatalogReplies,
  pickGridDevices,
} from "@/devices/devices-logic";
import { readDevicesFile, updateDevicesFile } from "@/devices/devices-store";
import { rejectInvalidRequest } from "@/hub/problem-reply";

const CREATED_STATUS = 201;

export const createDevicesRoutes = (rootFolder: string) =>
  new Hono()
    .get("/", async (c) => {
      const devicesFile = await readDevicesFile(rootFolder);
      return c.json(pickGridDevices(devicesFile));
    })
    .get("/catalog", async (c) => {
      const devicesFile = await readDevicesFile(rootFolder);
      return c.json(listCatalogReplies(devicesFile));
    })
    .post(
      "/",
      zValidator("json", customDeviceSchema, rejectInvalidRequest),
      async (c) => {
        const customDevice = c.req.valid("json");
        await updateDevicesFile(rootFolder, (devicesFile) => {
          const gridDevices = pickGridDevices(devicesFile);
          const takenDevices = [...DEVICE_CATALOG, ...gridDevices];
          const checkedDevice = checkNewDevice(customDevice, takenDevices);
          return {
            ...devicesFile,
            devices: [...devicesFile.devices, checkedDevice],
          };
        });
        const devicePreset = createPresetFromCustomDevice(customDevice);
        return c.json(devicePreset, CREATED_STATUS);
      },
    )
    .delete("/:deviceId", async (c) => {
      const deviceId = c.req.param("deviceId");
      await updateDevicesFile(rootFolder, (devicesFile) =>
        checkDeviceRemoval(devicesFile, deviceId),
      );
      return c.json({ deviceId });
    });
