import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { DEVICE_CATALOG } from "@/devices/device-catalog";
import { createDevicesRoutes } from "@/devices/devices-routes";
import { DEVICES_FILE_PATH } from "@/environment";

const SHOP_KIOSK = {
  name: "Shop kiosk",
  width: 800,
  height: 1280,
  pixelRatio: 2,
  hasTouch: true,
  frameShape: "kiosk",
};

const postDevice = (device: unknown) => ({
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(device),
});

test.describe("devices routes", () => {
  let rootFolder = "";

  test.beforeEach(async () => {
    rootFolder = await mkdtemp(join(tmpdir(), "everyscreen-devices-"));
  });

  test.afterEach(async () => {
    await rm(rootFolder, { recursive: true });
  });

  test("lists the twelve default devices when there is no devices file", async () => {
    const devicesRoutes = createDevicesRoutes(rootFolder);

    const listReply = await devicesRoutes.request("/");
    const gridDevices = await listReply.json();

    expect(listReply.status).toBe(200);
    expect(gridDevices).toHaveLength(12);
    expect(existsSync(join(rootFolder, DEVICES_FILE_PATH))).toBe(false);
  });

  test("lists the whole catalog on the catalog route", async () => {
    const devicesRoutes = createDevicesRoutes(rootFolder);

    const catalogReply = await devicesRoutes.request("/catalog");
    const catalogDevices = await catalogReply.json();

    expect(catalogReply.status).toBe(200);
    expect(catalogDevices).toHaveLength(DEVICE_CATALOG.length);
  });

  test("adds a custom device, saves it to the yaml file and lists it last", async () => {
    const devicesRoutes = createDevicesRoutes(rootFolder);

    const addReply = await devicesRoutes.request("/", postDevice(SHOP_KIOSK));
    const listReply = await devicesRoutes.request("/");
    const gridDevices = await listReply.json();
    const devicesYaml = await readFile(
      join(rootFolder, DEVICES_FILE_PATH),
      "utf8",
    );

    expect(addReply.status).toBe(201);
    expect(gridDevices).toHaveLength(13);
    expect(gridDevices.at(-1).id).toBe("shop-kiosk");
    expect(devicesYaml).toContain("name: Shop kiosk");
  });

  test("rejects a second add with the same id with 409", async () => {
    const devicesRoutes = createDevicesRoutes(rootFolder);
    await devicesRoutes.request("/", postDevice(SHOP_KIOSK));

    const secondReply = await devicesRoutes.request(
      "/",
      postDevice(SHOP_KIOSK),
    );
    const listReply = await devicesRoutes.request("/");
    const gridDevices = await listReply.json();

    expect(secondReply.status).toBe(409);
    expect(gridDevices).toHaveLength(13);
  });

  test("lets one of two simultaneous adds with the same id through", async () => {
    const devicesRoutes = createDevicesRoutes(rootFolder);

    const [firstReply, secondReply] = await Promise.all([
      devicesRoutes.request("/", postDevice(SHOP_KIOSK)),
      devicesRoutes.request("/", postDevice(SHOP_KIOSK)),
    ]);
    const listReply = await devicesRoutes.request("/");
    const gridDevices = await listReply.json();

    expect([firstReply.status, secondReply.status].sort()).toEqual([201, 409]);
    expect(gridDevices).toHaveLength(13);
  });

  test("answers 422 and names the file and field for a bad shape", async () => {
    const devicesRoutes = createDevicesRoutes(rootFolder);
    await writeFile(
      join(rootFolder, DEVICES_FILE_PATH),
      "devices:\n  - id: secret-device-name\n    name: 12\n",
    );

    const listReply = await devicesRoutes.request("/");
    const problemMessage = await listReply.text();

    expect(listReply.status).toBe(422);
    expect(problemMessage).toContain(DEVICES_FILE_PATH);
    expect(problemMessage).toContain("devices.0.name");
    expect(problemMessage).not.toContain("secret-device-name");
  });

  test("answers 422 without the file contents for bad YAML", async () => {
    const devicesRoutes = createDevicesRoutes(rootFolder);
    await writeFile(
      join(rootFolder, DEVICES_FILE_PATH),
      "devices: [secret-device-name\n  : : :\n",
    );

    const listReply = await devicesRoutes.request("/");
    const problemMessage = await listReply.text();

    expect(listReply.status).toBe(422);
    expect(problemMessage).toContain(DEVICES_FILE_PATH);
    expect(problemMessage).not.toContain("secret-device-name");
  });

  test("puts a catalog device outside the default twelve on the grid from the yaml file", async () => {
    const devicesRoutes = createDevicesRoutes(rootFolder);
    await writeFile(
      join(rootFolder, DEVICES_FILE_PATH),
      "grid:\n  - iphone-se\n  - pixel-9\nviewportModes:\n  pixel-9: browser\n",
    );

    const listReply = await devicesRoutes.request("/");
    const gridDevices = await listReply.json();

    expect(listReply.status).toBe(200);
    expect(
      gridDevices.map((gridDevice: { id: string }) => gridDevice.id),
    ).toEqual(["iphone-se", "pixel-9"]);
    expect(gridDevices[1].viewportMode).toBe("browser");
  });

  test("answers 422 and names an unknown grid id", async () => {
    const devicesRoutes = createDevicesRoutes(rootFolder);
    await writeFile(
      join(rootFolder, DEVICES_FILE_PATH),
      "grid:\n  - iphone-se\n  - nokia-3310\n",
    );

    const listReply = await devicesRoutes.request("/");
    const problemMessage = await listReply.text();

    expect(listReply.status).toBe(422);
    expect(problemMessage).toContain("nokia-3310");
  });

  test("loads a custom device with a catalog id, lets it win and marks the catalog device hidden", async () => {
    const devicesRoutes = createDevicesRoutes(rootFolder);
    await writeFile(
      join(rootFolder, DEVICES_FILE_PATH),
      "devices:\n  - name: iPhone SE\n    width: 800\n    height: 1280\n",
    );

    const listReply = await devicesRoutes.request("/");
    const gridDevices = await listReply.json();
    const catalogReply = await devicesRoutes.request("/catalog");
    const catalogDevices = await catalogReply.json();

    const sameIdDevices = gridDevices.filter(
      (gridDevice: { id: string }) => gridDevice.id === "iphone-se",
    );
    const hiddenIds = catalogDevices
      .filter(
        (catalogDevice: { isHiddenByCustomDevice: boolean }) =>
          catalogDevice.isHiddenByCustomDevice,
      )
      .map((catalogDevice: { id: string }) => catalogDevice.id);
    expect(listReply.status).toBe(200);
    expect(sameIdDevices).toHaveLength(1);
    expect(sameIdDevices[0].isCustom).toBe(true);
    expect(hiddenIds).toEqual(["iphone-se"]);
  });

  test("rejects a preset id with 409", async () => {
    const devicesRoutes = createDevicesRoutes(rootFolder);

    const addReply = await devicesRoutes.request(
      "/",
      postDevice({ ...SHOP_KIOSK, name: "Pixel 8" }),
    );

    expect(addReply.status).toBe(409);
  });

  test("rejects a device that breaks the schema with 400", async () => {
    const devicesRoutes = createDevicesRoutes(rootFolder);

    const addReply = await devicesRoutes.request(
      "/",
      postDevice({ ...SHOP_KIOSK, width: 50 }),
    );

    expect(addReply.status).toBe(400);
  });

  test("removes a custom device and returns 404 for an unknown or preset id", async () => {
    const devicesRoutes = createDevicesRoutes(rootFolder);
    await devicesRoutes.request("/", postDevice(SHOP_KIOSK));

    const removeReply = await devicesRoutes.request("/shop-kiosk", {
      method: "DELETE",
    });
    const removeAgainReply = await devicesRoutes.request("/shop-kiosk", {
      method: "DELETE",
    });
    const removePresetReply = await devicesRoutes.request("/iphone-se", {
      method: "DELETE",
    });
    const listReply = await devicesRoutes.request("/");
    const gridDevices = await listReply.json();

    expect(removeReply.status).toBe(200);
    expect(removeAgainReply.status).toBe(404);
    expect(removePresetReply.status).toBe(404);
    expect(gridDevices).toHaveLength(12);
  });

  test("lists saved custom devices in file order for a fresh route set", async () => {
    const devicesRoutes = createDevicesRoutes(rootFolder);
    await devicesRoutes.request("/", postDevice(SHOP_KIOSK));
    await devicesRoutes.request(
      "/",
      postDevice({ ...SHOP_KIOSK, name: "Wall screen", hasTouch: false }),
    );

    const freshRoutes = createDevicesRoutes(rootFolder);
    const listReply = await freshRoutes.request("/");
    const gridDevices = await listReply.json();

    expect(
      gridDevices.slice(-2).map((gridDevice: { id: string }) => gridDevice.id),
    ).toEqual(["shop-kiosk", "wall-screen"]);
  });
});
