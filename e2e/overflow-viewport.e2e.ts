import { pathToFileURL } from "node:url";
import {
  type BrowserType,
  chromium,
  expect,
  test,
  webkit,
} from "@playwright/test";
import { measurePage } from "@/checks/check-probes";
import { listFindings } from "@/checks/checks-logic";
import { pickCheckDevice } from "@/commands/commands-logic";
import { emulateDevice } from "@/devices/device-emulation";
import { DEVICE_PRESETS } from "@/devices/device-presets";
import { pickDeviceViewport } from "@/devices/devices-logic";

const WIDE_BLOCK_PATH = pathToFileURL("e2e/wide-block.html").href;
const OVERFLOW_PX = 84;
const OVERFLOW_MESSAGE = `div.wide-block:nth-of-type(1) is ${OVERFLOW_PX}px past the edge`;

interface OverflowEngine {
  deviceId: string;
  engine: BrowserType;
  isEmulatedByCdp: boolean;
}

const OVERFLOW_ENGINES: OverflowEngine[] = [
  { deviceId: "pixel-8", engine: chromium, isEmulatedByCdp: true },
  { deviceId: "iphone-15", engine: webkit, isEmulatedByCdp: false },
];

for (const { deviceId, engine, isEmulatedByCdp } of OVERFLOW_ENGINES) {
  test(`a block 84px wider than the ${deviceId} screen gives one overflow finding`, async () => {
    const devicePreset = DEVICE_PRESETS.find(
      (preset) => preset.id === deviceId,
    );
    const isPresetMissing = devicePreset === undefined;
    if (isPresetMissing) throw new Error(`No preset ${deviceId}`);
    const engineBrowser = await engine.launch();
    const contextOptions = isEmulatedByCdp ? {} : devicePreset.use;
    const browserContext = await engineBrowser.newContext(contextOptions);
    const page = await browserContext.newPage();
    if (isEmulatedByCdp) await emulateDevice(page, devicePreset);
    const deviceViewport = pickDeviceViewport(devicePreset);
    const blockWidth = deviceViewport.width + OVERFLOW_PX;
    await page.goto(`${WIDE_BLOCK_PATH}#${blockWidth}`);

    const measurements = await measurePage(page, deviceViewport);
    const checkDevice = pickCheckDevice(devicePreset);
    const checkFindings = listFindings(measurements, checkDevice);
    await engineBrowser.close();

    const overflowMessages = checkFindings
      .filter((finding) => finding.kind === "overflow")
      .map((finding) => finding.message);
    expect(overflowMessages).toEqual([OVERFLOW_MESSAGE]);
  });
}
