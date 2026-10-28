import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { customDeviceSchema } from "@/devices/device-schema";
import { checkNewDevice, pickGridDevices } from "@/devices/devices-logic";
import { readDevicesFile, writeDevicesFile } from "@/devices/devices-store";

const NOT_FOUND_STATUS = 404;

export const createDevicesRoutes = (rootFolder: string) =>
  new Hono()
    .get("/", async (c) => {
      const devicesFile = await readDevicesFile(rootFolder);
      return c.json(pickGridDevices(devicesFile));
    })
    .post("/", zValidator("json", customDeviceSchema), async (c) => {
      const customDevice = c.req.valid("json");
      const devicesFile = await readDevicesFile(rootFolder);
      const gridDevices = pickGridDevices(devicesFile);
      const checkedDevice = checkNewDevice(customDevice, gridDevices);
      await writeDevicesFile(rootFolder, {
        devices: [...devicesFile.devices, checkedDevice],
      });
      return c.json(checkedDevice, 201);
    })
    .delete("/:deviceId", async (c) => {
      const deviceId = c.req.param("deviceId");
      const devicesFile = await readDevicesFile(rootFolder);
      const isCustomDevice = devicesFile.devices.some(
        (customDevice) => customDevice.id === deviceId,
      );
      if (!isCustomDevice) {
        throw new HTTPException(NOT_FOUND_STATUS, {
          message: `No custom device with id ${deviceId}`,
        });
      }
      const keptDevices = devicesFile.devices.filter(
        (customDevice) => customDevice.id !== deviceId,
      );
      await writeDevicesFile(rootFolder, { devices: keptDevices });
      return c.json({ deviceId });
    });
