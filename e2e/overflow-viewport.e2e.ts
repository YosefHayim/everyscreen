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
import { findCatalogPreset, pickDeviceViewport } from "@/devices/devices-logic";

const WIDE_BLOCK_PATH = pathToFileURL("e2e/wide-block.html").href;
const OVERFLOW_CASES_PATH = pathToFileURL("e2e/overflow-cases.html").href;
const OVERFLOW_PX = 84;
const MARQUEE_TRACK_PX = 4000;
const FITTING_BLOCK_PX = 100;
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
    const devicePreset = findCatalogPreset(deviceId, "full-screen");
    const engineBrowser = await engine.launch();
    const devicePlaywrightUse = isEmulatedByCdp ? {} : devicePreset.use;
    const browserContext = await engineBrowser.newContext(devicePlaywrightUse);
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

interface OverflowCase {
  name: string;
  caseName: string;
  blockWidth: number;
  expectedMessages: string[];
}

const PHONE_VIEWPORT_WIDTH = 412;

const OVERFLOW_CASES: OverflowCase[] = [
  {
    name: "a track inside an overflow hidden box gives no overflow finding",
    caseName: "marquee-hidden",
    blockWidth: MARQUEE_TRACK_PX,
    expectedMessages: [],
  },
  {
    name: "a track inside an overflow clip box gives no overflow finding",
    caseName: "marquee-clip",
    blockWidth: MARQUEE_TRACK_PX,
    expectedMessages: [],
  },
  {
    name: "a wide block under body overflow-x hidden still gives an overflow finding",
    caseName: "body-hidden",
    blockWidth: MARQUEE_TRACK_PX,
    expectedMessages: [
      `div.wide-block:nth-of-type(1) is ${MARQUEE_TRACK_PX - PHONE_VIEWPORT_WIDTH}px past the edge`,
    ],
  },
  {
    name: "a right-to-left block past the left edge gives an overflow finding",
    caseName: "rtl",
    blockWidth: PHONE_VIEWPORT_WIDTH + OVERFLOW_PX,
    expectedMessages: [OVERFLOW_MESSAGE],
  },
  {
    name: "a right-to-left block that fits gives no overflow finding",
    caseName: "rtl",
    blockWidth: FITTING_BLOCK_PX,
    expectedMessages: [],
  },
];

for (const { name, caseName, blockWidth, expectedMessages } of OVERFLOW_CASES) {
  test(`on pixel-8, ${name}`, async () => {
    const devicePreset = findCatalogPreset("pixel-8", "full-screen");
    const engineBrowser = await chromium.launch();
    const browserContext = await engineBrowser.newContext();
    const page = await browserContext.newPage();
    await emulateDevice(page, devicePreset);
    const deviceViewport = pickDeviceViewport(devicePreset);
    await page.goto(`${OVERFLOW_CASES_PATH}#${caseName}/${blockWidth}`);

    const measurements = await measurePage(page, deviceViewport);
    const checkDevice = pickCheckDevice(devicePreset);
    const checkFindings = listFindings(measurements, checkDevice);
    await engineBrowser.close();

    const overflowMessages = checkFindings
      .filter((finding) => finding.kind === "overflow")
      .map((finding) => finding.message);
    expect(deviceViewport.width).toBe(PHONE_VIEWPORT_WIDTH);
    expect(overflowMessages).toEqual(expectedMessages);
  });
}
