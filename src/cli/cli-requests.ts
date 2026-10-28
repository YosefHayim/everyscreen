import {
  type CliRequest,
  createDeviceListLine,
  createHubDownReply,
  createNeedsYesReply,
  createReply,
  createRunningLine,
} from "@/cli/cli-logic";
import {
  callHub,
  readHubFile,
  readProblemReply,
  sendHubCommand,
} from "@/cli/hub-client";
import {
  startHubInBackground,
  startHubInForeground,
  stopHub,
} from "@/cli/hub-process";
import { type CommandReply, pickErrorMessage } from "@/commands/commands-logic";
import type { BeforeStep, SweepCommand } from "@/commands/commands-schema";
import type { CustomDevice } from "@/devices/device-schema";
import { listFlowPaths, readFlow, runFlows } from "@/flows/flow-runner";
import { listFlowCommands, summarizeFlows } from "@/flows/flows-logic";
import { readStoredFile } from "@/hub/stored-files";
import type { SkillAgent } from "@/skill/skill-agents";
import { installSkill, pickSkillFile } from "@/skill/skill-install";

const RESTART_HINT = "restart the hub to apply";

interface HubDevice {
  id: string;
}

const listHubDevices = (
  rootFolder: string,
  createDevicesReply: (hubDevices: HubDevice[], hubUrl: string) => CommandReply,
): Promise<CommandReply> =>
  callHub(rootFolder, async (hubClient, hubUrl) => {
    const devicesReply = await hubClient.api.devices.$get();
    const isDevicesRefused = !devicesReply.ok;
    if (isDevicesRefused) return readProblemReply(devicesReply);
    const hubDevices = await devicesReply.json();
    return createDevicesReply(hubDevices, hubUrl);
  });

const showHubStatus = (rootFolder: string): Promise<CommandReply> =>
  listHubDevices(rootFolder, (hubDevices, hubUrl) => {
    const runningLine = createRunningLine(hubUrl, hubDevices.length);
    return createReply("ok", runningLine);
  });

const listDevices = (rootFolder: string): Promise<CommandReply> =>
  listHubDevices(rootFolder, (hubDevices) => {
    const deviceIds = hubDevices.map(({ id }) => id);
    const deviceListLine = createDeviceListLine(deviceIds);
    return createReply("ok", deviceListLine);
  });

const addDevice = (
  rootFolder: string,
  customDevice: CustomDevice,
): Promise<CommandReply> =>
  callHub(rootFolder, async (hubClient) => {
    const addReply = await hubClient.api.devices.$post({
      json: customDevice,
    });
    const isAddRefused = !addReply.ok;
    if (isAddRefused) return readProblemReply(addReply);
    const devicePreset = await addReply.json();
    return createReply(
      "ok",
      `device added · ${devicePreset.id} · ${RESTART_HINT}`,
    );
  });

const removeDevice = async (
  rootFolder: string,
  deviceId: string,
  isConfirmed: boolean,
): Promise<CommandReply> => {
  const isRefused = !isConfirmed;
  if (isRefused) return createNeedsYesReply("devices remove");
  return callHub(rootFolder, async (hubClient) => {
    const removeReply = await hubClient.api.devices[":deviceId"].$delete({
      param: { deviceId },
    });
    const isRemoveRefused = !removeReply.ok;
    if (isRemoveRefused) return readProblemReply(removeReply);
    return createReply("ok", `device removed · ${deviceId} · ${RESTART_HINT}`);
  });
};

const runFlowFiles = async (
  rootFolder: string,
  flowsGlob: string,
  parallel: number,
): Promise<CommandReply> => {
  const hubFile = await readHubFile(rootFolder);
  const isHubFileMissing = hubFile === null;
  if (isHubFileMissing) return createHubDownReply();
  const flowPaths = await listFlowPaths(rootFolder, flowsGlob);
  const flowAnswers = await runFlows(rootFolder, flowPaths, parallel);
  return summarizeFlows(flowAnswers);
};

const readBeforeSteps = async (
  rootFolder: string,
  beforeFlowPath: string,
): Promise<BeforeStep[] | CommandReply> => {
  try {
    const beforeFlow = await readFlow(rootFolder, beforeFlowPath);
    return listFlowCommands(beforeFlow);
  } catch (error) {
    const errorLine = pickErrorMessage(error);
    return createReply("failed", `before flow: ${errorLine}`);
  }
};

const sweepApp = async (
  rootFolder: string,
  sweepCommand: SweepCommand,
  beforeFlowPath: string | null,
): Promise<CommandReply> => {
  const isThereNoBeforeFlow = beforeFlowPath === null;
  if (isThereNoBeforeFlow) return sendHubCommand(rootFolder, sweepCommand);
  const beforeStepsReply = await readBeforeSteps(rootFolder, beforeFlowPath);
  const isBeforeFlowUnreadable = !Array.isArray(beforeStepsReply);
  if (isBeforeFlowUnreadable) return beforeStepsReply;
  return sendHubCommand(rootFolder, {
    ...sweepCommand,
    beforeSteps: beforeStepsReply,
  });
};

const installAgentSkill = async (
  rootFolder: string,
  agent: SkillAgent,
  isConfirmed: boolean,
): Promise<CommandReply> => {
  const skillFile = pickSkillFile(agent, rootFolder);
  const oldSkill = await readStoredFile(skillFile);
  const isOverwrite = oldSkill !== null;
  const isRefused = isOverwrite && !isConfirmed;
  if (isRefused) return createNeedsYesReply("skill install");
  const installedFile = await installSkill(agent, rootFolder);
  return createReply("ok", `skill installed · ${installedFile}`);
};

export const runCliRequest = (
  cliRequest: CliRequest,
  rootFolder: string,
  writeStartedReply: (startedReply: CommandReply) => void,
): Promise<CommandReply> => {
  switch (cliRequest.kind) {
    case "send-command":
      return sendHubCommand(rootFolder, cliRequest.hubCommand);
    case "start": {
      const { port, isForeground } = cliRequest;
      if (isForeground)
        return startHubInForeground(rootFolder, port, writeStartedReply);
      return startHubInBackground(rootFolder, port);
    }
    case "stop":
      return stopHub(rootFolder);
    case "status":
      return showHubStatus(rootFolder);
    case "list-devices":
      return listDevices(rootFolder);
    case "add-device":
      return addDevice(rootFolder, cliRequest.customDevice);
    case "remove-device":
      return removeDevice(
        rootFolder,
        cliRequest.deviceId,
        cliRequest.isConfirmed,
      );
    case "run-flows":
      return runFlowFiles(
        rootFolder,
        cliRequest.flowsGlob,
        cliRequest.parallel,
      );
    case "run-sweep":
      return sweepApp(
        rootFolder,
        cliRequest.sweepCommand,
        cliRequest.beforeFlowPath,
      );
    case "install-skill":
      return installAgentSkill(
        rootFolder,
        cliRequest.agent,
        cliRequest.isConfirmed,
      );
  }
};
