import { join } from "node:path";
import { measurePage } from "@/checks/check-probes";
import type { Finding } from "@/checks/checks-logic";
import { listFindings } from "@/checks/checks-logic";
import {
  createShotPath,
  type DeviceAnswer,
  pickCheckDevice,
  pickErrorMessage,
  pickFailureMessage,
} from "@/commands/commands-logic";
import type { HubCommand } from "@/commands/commands-schema";
import type { DevicePage } from "@/devices/device-browsers";
import { pickDeviceViewport } from "@/devices/devices-logic";
import { writeStoredFile } from "@/hub/stored-files";
import { sendStepScreen } from "@/live/screencast";

const ACTION_TIMEOUT_MS = 10_000;

export interface StepTarget {
  rootFolder: string;
  runId: string;
  stepId: string;
  hubCommand: HubCommand;
}

export interface DeviceStep {
  deviceAnswer: DeviceAnswer;
  findings: Finding[];
}

const performCommand = async (
  devicePage: DevicePage,
  hubCommand: HubCommand,
): Promise<void> => {
  const { page, device } = devicePage;
  const actionTimeout = { timeout: ACTION_TIMEOUT_MS };
  switch (hubCommand.commandName) {
    case "open":
      await page.goto(hubCommand.url, actionTimeout);
      return;
    case "tap": {
      const target = page.getByRole(hubCommand.role, { name: hubCommand.name });
      const canTouch = device.use.hasTouch === true;
      if (canTouch) {
        await target.tap(actionTimeout);
        return;
      }
      await target.click(actionTimeout);
      return;
    }
    case "fill": {
      const target = page.getByRole(hubCommand.role, { name: hubCommand.name });
      await target.fill(hubCommand.with, actionTimeout);
      return;
    }
    case "scroll": {
      const isScrollToTop = hubCommand.to === "top";
      await page.evaluate((isTop) => {
        const bottomOffset = document.documentElement.scrollHeight;
        window.scrollTo(0, isTop ? 0 : bottomOffset);
      }, isScrollToTop);
      return;
    }
    case "expect": {
      const target = page.getByText(hubCommand.text).first();
      await target.waitFor({ state: "visible", ...actionTimeout });
      return;
    }
    case "check":
    case "shot":
      return;
  }
};

const tryCommand = async (
  devicePage: DevicePage,
  hubCommand: HubCommand,
): Promise<string | null> => {
  try {
    await performCommand(devicePage, hubCommand);
    return null;
  } catch (error) {
    return pickErrorMessage(error);
  }
};

const saveShot = async (
  devicePage: DevicePage,
  stepTarget: StepTarget,
): Promise<string> => {
  const { rootFolder, runId, stepId } = stepTarget;
  const shotPath = createShotPath(runId, stepId, devicePage.device.id);
  const shotBytes = await devicePage.page.screenshot({ type: "png" });
  await writeStoredFile(join(rootFolder, shotPath), shotBytes);
  return shotPath;
};

export const runStepOnDevice = async (
  devicePage: DevicePage,
  stepTarget: StepTarget,
): Promise<DeviceStep> => {
  const { page, device, hasLiveScreen } = devicePage;
  const { hubCommand } = stepTarget;
  const startedAt = Date.now();

  const actionErrorMessage = await tryCommand(devicePage, hubCommand);
  const measurements = await measurePage(page, pickDeviceViewport(device));
  const checkDevice = pickCheckDevice(device);
  const findings = listFindings(measurements, checkDevice);
  const durationMs = Date.now() - startedAt;

  const failureMessage = pickFailureMessage(actionErrorMessage, findings);
  const isStepFailed = failureMessage !== null;
  const isShotCommand = hubCommand.commandName === "shot";
  const shouldSaveShot = isStepFailed || isShotCommand;
  const shotPath = shouldSaveShot
    ? await saveShot(devicePage, stepTarget)
    : null;
  const isThereNoLiveScreen = !hasLiveScreen;
  if (isThereNoLiveScreen) await sendStepScreen(page, device.id);

  if (isStepFailed) {
    const deviceAnswer: DeviceAnswer = {
      status: "failed",
      deviceId: device.id,
      durationMs,
      message: failureMessage,
      shotPath,
    };
    return { deviceAnswer, findings };
  }
  const deviceAnswer: DeviceAnswer = {
    status: "ok",
    deviceId: device.id,
    durationMs,
  };
  return { deviceAnswer, findings };
};
