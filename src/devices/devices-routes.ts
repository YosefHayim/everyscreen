import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { DEVICE_CATALOG } from "@/devices/device-catalog";
import {
  customDeviceSchema,
  type DevicesFile,
  gridUpdateSchema,
} from "@/devices/device-schema";
import {
  checkDeviceRemoval,
  checkNewDevice,
  createPresetFromCustomDevice,
  type GridSync,
  listCatalogReplies,
  pickGridDevices,
  replaceGrid,
} from "@/devices/devices-logic";
import { readDevicesFile, updateDevicesFile } from "@/devices/devices-store";
import { rejectInvalidRequest } from "@/hub/problem-reply";

const CREATED_STATUS = 201;

// A saved change starts or stops the running devices at once, so the hub matches the file.
const syncRunningDevices = async (
  syncGrid: GridSync | null,
  changedFile: DevicesFile,
): Promise<void> => {
  const isGridSyncWired = syncGrid !== null;
  if (isGridSyncWired) await syncGrid(pickGridDevices(changedFile));
};

export const createDevicesRoutes = (
  rootFolder: string,
  syncGrid: GridSync | null = null,
) =>
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
        const changedFile = await updateDevicesFile(
          rootFolder,
          (devicesFile) => {
            const gridDevices = pickGridDevices(devicesFile);
            const takenDevices = [...DEVICE_CATALOG, ...gridDevices];
            const checkedDevice = checkNewDevice(customDevice, takenDevices);
            return {
              ...devicesFile,
              devices: [...devicesFile.devices, checkedDevice],
            };
          },
        );
        await syncRunningDevices(syncGrid, changedFile);
        const devicePreset = createPresetFromCustomDevice(customDevice);
        return c.json(devicePreset, CREATED_STATUS);
      },
    )
    .put(
      "/grid",
      zValidator("json", gridUpdateSchema, rejectInvalidRequest),
      async (c) => {
        const { deviceIds } = c.req.valid("json");
        const changedFile = await updateDevicesFile(rootFolder, (devicesFile) =>
          replaceGrid(devicesFile, deviceIds),
        );
        await syncRunningDevices(syncGrid, changedFile);
        return c.json({ deviceIds: changedFile.grid });
      },
    )
    .delete("/:deviceId", async (c) => {
      const deviceId = c.req.param("deviceId");
      const changedFile = await updateDevicesFile(rootFolder, (devicesFile) =>
        checkDeviceRemoval(devicesFile, deviceId),
      );
      await syncRunningDevices(syncGrid, changedFile);
      return c.json({ deviceId });
    });
